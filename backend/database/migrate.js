const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { ensureDatabase } = require('../config/database');

const migrationsDirectory = path.join(__dirname, 'migrations');
const migrationLock = 'ruta_segura_schema_migrations';

async function ejecutarMigraciones() {
    await ensureDatabase();

    const connection = await db.getConnection();
    let lockAdquirido = false;

    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id VARCHAR(255) PRIMARY KEY,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB
        `);

        const [lockRows] = await connection.query(
            'SELECT GET_LOCK(?, 30) AS adquirido',
            [migrationLock]
        );

        if (lockRows[0].adquirido !== 1) {
            throw new Error('No se pudo obtener el bloqueo para ejecutar las migraciones.');
        }
        lockAdquirido = true;

        const [appliedRows] = await connection.query('SELECT id FROM schema_migrations');
        const appliedMigrations = new Set(appliedRows.map((row) => row.id));
        const files = fs.readdirSync(migrationsDirectory)
            .filter((file) => /^\d+_.+\.js$/.test(file))
            .sort();

        for (const file of files) {
            const migration = require(path.join(migrationsDirectory, file));

            if (!migration.id || typeof migration.up !== 'function') {
                throw new Error(`La migracion ${file} no exporta un id y una funcion up validos.`);
            }

            if (appliedMigrations.has(migration.id)) {
                continue;
            }

            console.log(`Aplicando migracion ${migration.id}...`);
            await migration.up(connection);
            await connection.execute(
                'INSERT INTO schema_migrations (id) VALUES (?)',
                [migration.id]
            );
            console.log(`Migracion ${migration.id} aplicada.`);
        }
    } finally {
        if (lockAdquirido) {
            await connection.query('SELECT RELEASE_LOCK(?)', [migrationLock]);
        }
        connection.release();
    }
}

if (require.main === module) {
    ejecutarMigraciones()
        .then(() => {
            console.log('Migraciones al dia.');
        })
        .catch((error) => {
            console.error('Error al ejecutar las migraciones:', error);
            process.exitCode = 1;
        })
        .finally(() => db.end());
}

module.exports = ejecutarMigraciones;
