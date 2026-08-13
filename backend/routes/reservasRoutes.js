const express = require('express');
const router = express.Router();
const reservasController = require('../controllers/reservasController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, reservasController.crearReserva);
router.get('/mis-reservas', verifyToken, reservasController.obtenerMisReservas);

module.exports = router;
