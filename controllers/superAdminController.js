const bcrypt = require('bcrypt');
const pool = require('../db');

// 1. Crear una nueva Empresa (Tenant) y su Administrador Principal desde el panel global
const crearEmpresaYAdminGlobal = async (req, res) => {
    const { nombre_empresa, subdominio, nombre_admin, correo_admin, password_admin } = req.body;
    
    try {
        // Verificar si el correo ya existe
        const usuarioExistente = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo_admin]);
        if (usuarioExistente.rows.length > 0) {
            return res.status(400).json({ error: "El correo del administrador ya está registrado." });
        }

        // 1. Crear la empresa en la tabla tenants
        const empresaQuery = 'INSERT INTO tenants (nombre_empresa, subdominio) VALUES ($1, $2) RETURNING id';
        const empresaRes = await pool.query(empresaQuery, [nombre_empresa, subdominio || null]);
        const tenant_id = empresaRes.rows[0].id;

        // 2. Cifrar contraseña del admin de la empresa
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password_admin, salt);

        // 3. Crear el usuario admin_empresa vinculado a ese tenant_id
        const usuarioQuery = `
            INSERT INTO usuarios (tenant_id, nombre, correo, password_hash, rol_sistema)
            VALUES ($1, $2, $3, $4, 'admin_empresa')
            RETURNING id, tenant_id, nombre, correo, rol_sistema;
        `;
        const usuarioRes = await pool.query(usuarioQuery, [tenant_id, nombre_admin, correo_admin, passwordHash]);

        res.status(201).json({
            mensaje: "¡Empresa y administrador principal creados exitosamente por el Super Admin!",
            empresa_id: tenant_id,
            administrador: usuarioRes.rows[0]
        });

    } catch (error) {
        console.error("Error al crear empresa global:", error);
        res.status(500).json({ error: "Error en el servidor al registrar la empresa." });
    }
};

// 2. Listar todas las empresas registradas en el sistema
const listarEmpresasGlobal = async (req, res) => {
    try {
        // Capturamos los parámetros de la URL (si no se envían, por defecto es página 1 y 10 por página)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Consulta con LIMIT y OFFSET
        const query = 'SELECT * FROM tenants ORDER BY fecha_registro DESC LIMIT $1 OFFSET $2';
        const resultado = await pool.query(query, [limit, offset]);

        // Obtenemos el total real de empresas para calcular las páginas totales
        const totalQuery = await pool.query('SELECT COUNT(*) FROM tenants;');
        const totalRegistros = parseInt(totalQuery.rows[0].count);

        res.status(200).json({
            pagina_actual: page,
            por_pagina: limit,
            total_empresas: totalRegistros,
            total_paginas: Math.ceil(totalRegistros / limit),
            empresas: resultado.rows
        });
    } catch (error) {
        console.error("Error al listar empresas:", error);
        res.status(500).json({ error: "Error en el servidor al obtener las empresas." });
    }
};

const eliminarEmpresaGlobal = async (req, res) => {
    const { id } = req.params;

    try {
        const tenantCheck = await pool.query('SELECT * FROM tenants WHERE id = $1', [id]);
        if (tenantCheck.rows.length === 0) {
            return res.status(404).json({ error: "La empresa (tenant) no existe." });
        }

        await pool.query('DELETE FROM tenants WHERE id = $1', [id]);

        return res.json({ 
            mensaje: `Empresa con ID ${id} y todos sus datos asociados fueron eliminados exitosamente por el Super Admin.` 
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error interno al intentar eliminar la empresa." });
    }
};

// Obtener reporte global de consumo de IA, total de usuarios y total de tickets por Tenant con Paginación (Solo Superadmin)
const obtenerReporteConsumoTenants = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const query = `
            SELECT 
                ten.id AS tenant_id,
                ten.nombre_empresa,
                ten.subdominio,
                ten.fecha_registro,
                COUNT(DISTINCT u.id) AS total_usuarios,
                COUNT(DISTINCT tic.id) AS total_tickets,
                COUNT(d.id) AS total_analisis_ia,
                COALESCE(SUM(d.tokens_utilizados), 0) AS tokens_totales,
                (COALESCE(SUM(d.tokens_utilizados), 0) / 1000000.0) * 0.07 AS costo_estimado_usd
            FROM tenants ten
            LEFT JOIN usuarios u ON ten.id = u.tenant_id
            LEFT JOIN tickets tic ON ten.id = tic.tenant_id
            LEFT JOIN diagnosticos_ia d ON tic.id = d.ticket_id
            GROUP BY ten.id, ten.nombre_empresa, ten.subdominio, ten.fecha_registro
            ORDER BY tokens_totales DESC
            LIMIT $1 OFFSET $2;
        `;

        const resultado = await pool.query(query, [limit, offset]);

        const totalQuery = await pool.query('SELECT COUNT(*) FROM tenants;');
        const totalRegistros = parseInt(totalQuery.rows[0].count);

        res.status(200).json({
            mensaje: "Reporte global por tenants obtenido exitosamente",
            pagina_actual: page,
            por_pagina: limit,
            total_tenants: totalRegistros,
            total_paginas: Math.ceil(totalRegistros / limit),
            reporte: resultado.rows
        });

    } catch (error) {
        console.error("Error al obtener el reporte de consumo por tenants:", error);
        res.status(500).json({ error: "Hubo un error al generar las estadísticas de consumo global." });
    }
};

// Obtener reporte detallado de consumo de IA por usuario y tenant con Paginación (Solo Superadmin)
const obtenerReporteConsumoPorUsuarios = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const query = `
            SELECT 
                ten.id AS tenant_id,
                ten.nombre_empresa,
                u.id AS usuario_id,
                u.nombre AS nombre_usuario,
                u.correo AS correo_usuario,
                COUNT(d.id) AS total_analisis_ia,
                COALESCE(SUM(d.tokens_utilizados), 0) AS tokens_totales,
                (COALESCE(SUM(d.tokens_utilizados), 0) / 1000000.0) * 0.07 AS costo_estimado_usd
            FROM tenants ten
            JOIN usuarios u ON ten.id = u.tenant_id
            LEFT JOIN tickets tic ON u.id = tic.usuario_id
            LEFT JOIN diagnosticos_ia d ON tic.id = d.ticket_id
            GROUP BY ten.id, ten.nombre_empresa, u.id, u.nombre, u.correo
            ORDER BY tokens_totales DESC
            LIMIT $1 OFFSET $2;
        `;

        const resultado = await pool.query(query, [limit, offset]);

        const totalQuery = await pool.query('SELECT COUNT(*) FROM usuarios;');
        const totalRegistros = parseInt(totalQuery.rows[0].count);

        res.status(200).json({
            mensaje: "Reporte de consumo por usuario obtenido exitosamente",
            pagina_actual: page,
            por_pagina: limit,
            total_usuarios: totalRegistros,
            total_paginas: Math.ceil(totalRegistros / limit),
            reporte: resultado.rows
        });

    } catch (error) {
        console.error("Error al obtener el reporte por usuarios:", error);
        res.status(500).json({ error: "Hubo un error al generar las estadísticas por usuario." });
    }
};

module.exports = {
    crearEmpresaYAdminGlobal,
    listarEmpresasGlobal,
    eliminarEmpresaGlobal,
    obtenerReporteConsumoTenants,
    obtenerReporteConsumoPorUsuarios
};