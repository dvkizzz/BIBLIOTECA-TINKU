const express = require('express');
const router = express.Router();
const librosController = require('../controllers/librosController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// Rutas públicas o para usuarios (lectura)
// Asumiendo que cualquiera puede ver el catálogo sin estar logueado
router.get('/', librosController.getAll);
router.get('/:id', librosController.getById);

// Rutas protegidas para administradores (escritura)
router.post('/', verifyToken, requireAdmin, librosController.create);
router.put('/:id', verifyToken, requireAdmin, librosController.update);
router.delete('/:id', verifyToken, requireAdmin, librosController.delete);

module.exports = router;
