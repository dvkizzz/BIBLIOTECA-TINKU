const express = require('express');
const router = express.Router();
const prestamosController = require('../controllers/prestamosController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/mis-prestamos', verifyToken, prestamosController.obtenerMisPrestamos);

module.exports = router;
