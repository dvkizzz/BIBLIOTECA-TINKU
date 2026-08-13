const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// Todas las rutas de admin requieren token y rol admin
router.use(verifyToken, requireAdmin);

router.get('/stats', adminController.getStats);

// Reservas
router.get('/reservas', adminController.getAllReservas);
router.put('/reservas/:id', adminController.updateReservaEstado);

// Préstamos
router.get('/prestamos', adminController.getAllPrestamos);
router.put('/prestamos/:id/devolver', adminController.returnPrestamo);
router.post('/prestamos/calcular-multas', adminController.calcularMultas);

// Usuarios
router.get('/usuarios', adminController.getAllUsuarios);
router.put('/usuarios/:id', adminController.updateUsuario);

module.exports = router;
