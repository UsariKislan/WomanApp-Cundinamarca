-- Script de base de datos para el sistema de rutas seguras
-- Motor: MySQL / MariaDB (XAMPP)

CREATE DATABASE IF NOT EXISTS ruta_segura_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ruta_segura_db;

-- Tabla de usuarias registradas
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla principal de reportes geolocalizados
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
    CONSTRAINT fk_reporte_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Indices para agilizar el filtrado por tipo de riesgo y municipio
CREATE INDEX idx_categoria ON reportes(categoria);
CREATE INDEX idx_municipio ON reportes(municipio);

-- Datos semilla de prueba para Cundinamarca
INSERT INTO usuarios (nombre, email, password) VALUES 
('Laura Gomez', 'laura@correo.com', '$2a$10$wT.f5k5eB1C2W/X.8G.9OuJ/O1vY1xJ8Z0mK0pL3rV5yN6tQ2bW1a');

INSERT INTO reportes (usuario_id, municipio, referencia, categoria, descripcion, latitud, longitud) VALUES
(1, 'Soacha', 'Estacion Leon XIII calle 48', 'iluminacion_deficiente', 'Luminarias apagadas en el costado norte del puente peatonal.', 4.59472200, -74.20527800),
(1, 'Fusagasuga', 'Avenida Las Palmas cerca a la universidad', 'zona_desolada', 'Poco flujo peatonal despues de las 8pm.', 4.33646000, -74.36378000),
(1, 'Facatativa', 'Parque Principal Santander', 'acoso', 'Grupo de personas intimidando a transeuntes en la esquina sur.', 4.80910000, -74.35470000);
