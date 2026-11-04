async function up(connection) {
    await connection.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            email VARCHAR(120) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    `);

    await connection.query(`
        CREATE TABLE IF NOT EXISTS reportes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            municipio VARCHAR(80) NOT NULL,
            referencia VARCHAR(255) NOT NULL,
            categoria ENUM('acoso', 'iluminacion_deficiente', 'zona_desolada', 'otro') NOT NULL,
            descripcion TEXT NULL,
            latitud DECIMAL(10, 8) NOT NULL,
            longitud DECIMAL(11, 8) NOT NULL,
            creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_categoria (categoria),
            INDEX idx_municipio (municipio),
            CONSTRAINT fk_reporte_usuario
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        ) ENGINE=InnoDB
    `);
}

module.exports = {
    id: '001_initial_schema',
    up
};
