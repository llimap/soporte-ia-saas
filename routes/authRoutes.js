const express = require('express');
const router = express.Router();

const { 
    registrarEmpresaYAdmin, 
    loginUsuario, 
    registrarUsuario, 
    actualizarPerfilPropio,
    actualizarUsuarioPorAdmin,
    listarUsuariosPorRol // <-- 1. Agrégala aquí junto con las demás funciones de authController
} = require('../controllers/authController');

const { eliminarUsuarioDeEmpresa } = require('../controllers/empresaController');
const { verificarToken } = require('../middlewares/authMiddleware');
const verificarAdminEmpresa = require('../middlewares/adminEmpresaMiddleware');

console.log("verificarToken es:", typeof verificarToken);
console.log("actualizarPerfilPropio es:", typeof actualizarPerfilPropio);

// Rutas
router.post('/registro-empresa', registrarEmpresaYAdmin);
router.post('/login', loginUsuario);
router.post('/registro-usuario', verificarToken, registrarUsuario);
router.delete('/usuarios/:id', verificarToken, verificarAdminEmpresa, eliminarUsuarioDeEmpresa);
router.put('/perfil', verificarToken, actualizarPerfilPropio);
router.put('/usuarios/:id', verificarToken, verificarAdminEmpresa, actualizarUsuarioPorAdmin);

// 2. Agrega la nueva ruta GET para ver la lista de usuarios y contraseñas según el rol
router.get('/usuarios', verificarToken, verificarAdminEmpresa, listarUsuariosPorRol);

module.exports = router;