const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const ejecutarMigraciones = require('./database/migrate');
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/reportes', reportRoutes);

async function iniciarServidor() {
    await ejecutarMigraciones();

    app.listen(PORT, () => {
        console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
    });
}

iniciarServidor().catch(async (error) => {
    console.error('No se pudo iniciar el servidor:', error);
    await db.end();
    process.exitCode = 1;
});
