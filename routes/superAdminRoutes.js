const express = require('express');
const router = express.Router();
const { 
    crearEmpresaYAdminGlobal, 
    listarEmpresasGlobal, 
    eliminarEmpresaGlobal,
    obtenerReporteConsumoTenants,
    obtenerReporteConsumoPorUsuarios
} = require('../controllers/superAdminController');
const { verificarToken } = require('../middlewares/authMiddleware');
const verificarSuperAdmin = require('../middlewares/superAdminMiddleware');

// Todas estas rutas exigirán token Y rol de super_admin
router.post('/empresas', verificarToken, verificarSuperAdmin, crearEmpresaYAdminGlobal);
router.get('/empresas', verificarToken, verificarSuperAdmin, listarEmpresasGlobal);
router.delete('/empresas/:id', verificarToken, verificarSuperAdmin, eliminarEmpresaGlobal);

// 2. Agrega la nueva ruta para el reporte de consumo de IA por tenant
router.get('/consumo-ia', verificarToken, verificarSuperAdmin, obtenerReporteConsumoTenants);
router.get('/consumo-ia-usuarios', verificarToken, verificarSuperAdmin, obtenerReporteConsumoPorUsuarios);

module.exports = router;