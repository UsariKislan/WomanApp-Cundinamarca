const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const verificarToken = require('../middleware/auth');

// Ruta publica para ver y filtrar el mapa
router.get('/', reportController.obtenerReportes);

// Ruta protegida con JWT para subir un nuevo reporte
router.post('/', verificarToken, reportController.crearReporte);

module.exports = router;
