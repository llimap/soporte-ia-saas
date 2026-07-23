const express = require('express');
const router = express.Router();
const { crearTicket, listarTicketsEmpresa, actualizarEstadoTicket,obtenerTicketPorId,analizarTicketConIA} = require('../controllers/ticketController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Ambas rutas exigen token JWT válido, asegurando el contexto multi-tenant
router.post('/', verificarToken, crearTicket);
router.get('/', verificarToken, listarTicketsEmpresa);
// ... tus otras rutas ...
router.put('/:id/estado', verificarToken, actualizarEstadoTicket);
router.get('/:id', verificarToken, obtenerTicketPorId);
router.post('/:id/analizar-ia', verificarToken, analizarTicketConIA);

module.exports = router;