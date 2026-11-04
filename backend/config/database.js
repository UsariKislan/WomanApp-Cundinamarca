const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'ruta_segura_db'
};

if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error('DB_PORT debe ser un puerto valido entre 1 y 65535.');
}

if (!/^[A-Za-z0-9_]+$/.test(config.database)) {
    throw new Error('DB_NAME solo puede contener letras, numeros y guion bajo.');
}

function createPool() {
    return mysql.createPool({
        ...config,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
}

async function ensureDatabase() {
    const connection = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password
    });

    try {
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
    } finally {
        await connection.end();
    }
}

module.exports = { createPool, ensureDatabase };
