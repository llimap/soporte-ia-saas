const pool = require('../db');

//crear ticket
const crearTicket = async (req, res) => {
    const { titulo, descripcion_problema, prioridad, estado } = req.body;
    
    const tenant_id = req.usuario.tenant_id;
    const usuario_id = req.usuario.id;

    // Valores por defecto si no se envían en el body
    const prioridadFinal = prioridad || 'normal';
    const estadoFinal = estado || 'Pendiente'; // <-- Aquí lo manejas

    try {
        const query = `
            INSERT INTO tickets (tenant_id, usuario_id, titulo, descripcion_problema, prioridad, estado)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [tenant_id, usuario_id, titulo, descripcion_problema, prioridadFinal, estadoFinal];
        const resultado = await pool.query(query, values);

        res.status(201).json({
            mensaje: "¡Ticket creado exitosamente!",
            ticket: resultado.rows[0]
        });
    } catch (error) {
        console.error("Error al crear ticket:", error);
        res.status(500).json({ error: "Hubo un error al crear el ticket en el servidor." });
    }
};

// 2. Listar únicamente los tickets de la empresa actual con soporte de filtros opcionales y paginación
const listarTicketsEmpresa = async (req, res) => {
    const tenant_id = req.usuario.tenant_id; // Filtrado obligatorio por la empresa del token
    const { estado, prioridad } = req.query; // Capturamos los filtros opcionales de la URL

    // 1. Capturar parámetros de paginación (por defecto página 1, 10 por página)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        // Base común para la consulta principal y la de conteo
        let baseConditions = `FROM tickets t JOIN usuarios u ON t.usuario_id = u.id WHERE t.tenant_id = $1`;
        let values = [tenant_id];
        let countValues = [tenant_id];

        // Construcción dinámica de filtros
        if (estado) {
            values.push(estado.toLowerCase());
            countValues.push(estado.toLowerCase());
            baseConditions += ` AND LOWER(t.estado) = LOWER($${values.length})`;
        }

        if (prioridad) {
            values.push(prioridad.toLowerCase());
            countValues.push(prioridad.toLowerCase());
            baseConditions += ` AND LOWER(t.prioridad) = LOWER($${values.length})`;
        }

        // 2. Consulta principal con LIMIT y OFFSET al final
        let query = `
            SELECT t.id, t.titulo, t.descripcion_problema, t.estado, t.prioridad, t.fecha_creacion,
                   u.nombre AS creado_por, u.correo AS correo_creador,
                   d.id AS diagnostico_id, d.sugerencia_generada, d.tokens_utilizados, d.fecha_creacion AS fecha_diagnostico
            ${baseConditions}
            LEFT JOIN diagnosticos_ia d ON t.id = d.ticket_id
            ORDER BY t.fecha_creacion DESC
            LIMIT $${values.length + 1} OFFSET $${values.length + 2};
        `;
        
        // Agregamos el limit y offset al array de valores de la consulta principal
        values.push(limit, offset);

        // 3. Consulta de conteo total (respetando los mismos filtros aplicados)
        let countQuery = `SELECT COUNT(*) ${baseConditions};`;

        // 4. Ejecutar ambas consultas en paralelo o secuencial
        const resultado = await pool.query(query, values);
        const countResult = await pool.query(countQuery, countValues);
        const totalRegistros = parseInt(countResult.rows[0].count);

        // 5. Responder con la estructura limpia de paginación
        res.status(200).json({
            pagina_actual: page,
            por_pagina: limit,
            total_tickets_filtrados: totalRegistros,
            total_paginas: Math.ceil(totalRegistros / limit),
            tickets: resultado.rows
        });

    } catch (error) {
        console.error("Error al listar tickets:", error);
        res.status(500).json({ error: "Hubo un error al obtener los tickets de la empresa." });
    }
};

// 3. Actualizar el estado y/o la prioridad de un ticket (Multi-tenant seguro)
const actualizarEstadoTicket = async (req, res) => {
    const { id } = req.params;
    const { estado, prioridad } = req.body;
    const tenant_id = req.usuario.tenant_id;

    // Validaciones opcionales si mandan los campos
    const estadosValidos = ['Abierto', 'En proceso', 'Resuelto', 'Cerrado'];
    if (estado && !estadosValidos.includes(estado)) {
        return res.status(400).json({ error: "Estado no válido. Use: Abierto, En proceso, Resuelto o Cerrado." });
    }

    const prioridadesValidas = ['baja', 'normal', 'alta', 'urgente'];
    if (prioridad && !prioridadesValidas.includes(prioridad.toLowerCase())) {
        return res.status(400).json({ error: "Prioridad no válida. Use: baja, normal, alta, urgente." });
    }

    if (!estado && !prioridad) {
        return res.status(400).json({ error: "Debes enviar al menos un campo ('estado' o 'prioridad') para actualizar." });
    }

    try {
        // Construimos la consulta de forma dinámica según lo que el usuario decida cambiar
        let camposQuery = [];
        let values = [];
        let contador = 1;

        if (estado) {
            camposQuery.push(`estado = $${contador++}`);
            values.push(estado);
        }

        if (prioridad) {
            camposQuery.push(`prioridad = $${contador++}`);
            values.push(prioridad);
        }

        values.push(id);
        values.push(tenant_id);

        const query = `
            UPDATE tickets 
            SET ${camposQuery.join(', ')} 
            WHERE id = $${contador++} AND tenant_id = $${contador} 
            RETURNING *;
        `;

        const resultado = await pool.query(query, values);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: "Ticket no encontrado o no pertenece a tu empresa." });
        }

        res.status(200).json({
            mensaje: "¡Ticket actualizado exitosamente!",
            ticket: resultado.rows[0]
        });
    } catch (error) {
        console.error("Error al actualizar el ticket:", error);
        res.status(500).json({ error: "Hubo un error al actualizar el ticket." });
    }
};

// 4. Ver el detalle de un solo ticket por ID (incluyendo diagnóstico de IA si existe)
const obtenerTicketPorId = async (req, res) => {
    const { id } = req.params;
    const tenant_id = req.usuario.tenant_id;

    try {
        const query = `
            SELECT t.id, t.titulo, t.descripcion_problema, t.estado, t.prioridad, t.fecha_creacion,
                   u.nombre AS creado_por, u.correo AS correo_creador,
                   d.id AS diagnostico_id, d.sugerencia_generada, d.tokens_utilizados, d.fecha_creacion AS fecha_diagnostico
            FROM tickets t
            JOIN usuarios u ON t.usuario_id = u.id
            LEFT JOIN diagnosticos_ia d ON t.id = d.ticket_id
            WHERE t.id = $1 AND t.tenant_id = $2;
        `;
        const resultado = await pool.query(query, [id, tenant_id]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: "Ticket no encontrado o no pertenece a tu empresa." });
        }

        res.status(200).json({
            ticket: resultado.rows[0]
        });
    } catch (error) {
        console.error("Error al obtener el ticket:", error);
        res.status(500).json({ error: "Hubo un error al obtener el ticket." });
    }
};

const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const analizarTicketConIA = async (req, res) => {
    const { id } = req.params;
    const tenant_id = req.usuario.tenant_id;

    try {
        // 1. Buscar el ticket asegurando que sea de la empresa (Multi-tenant)
        const ticketResult = await pool.query(
            `SELECT * FROM tickets WHERE id = $1 AND tenant_id = $2`,
            [id, tenant_id]
        );

        if (ticketResult.rows.length === 0) {
            return res.status(404).json({ error: "Ticket no encontrado o no pertenece a tu empresa." });
        }

        const ticket = ticketResult.rows[0];

        // 2. Construir el prompt para la IA
        const prompt = `
            Actúa como un experto en soporte técnico de TI para un software SaaS. 
            Analiza el siguiente ticket de soporte reportado por un cliente:
            
            Título: ${ticket.titulo}
            Descripción del problema: ${ticket.descripcion_problema}
            
            Por favor, genera un diagnóstico técnico breve, pasos recomendados para solucionarlo y sugiere una prioridad (baja, normal, alta, urgente). Responde de forma clara y profesional en español.
        `;

        // 3. Llamar a la API real de Gemini (usando el modelo flash recomendado)
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const sugerenciaGenerada = response.text;
        const tokensUtilizados = response.usageMetadata ? response.usageMetadata.totalTokenCount : 150; 

        // 4. Guardar el resultado real en la tabla 'diagnosticos_ia'
        const diagnosticoResult = await pool.query(
            `INSERT INTO diagnosticos_ia (ticket_id, sugerencia_generada, tokens_utilizados) 
             VALUES ($1, $2, $3) RETURNING *`,
            [id, sugerenciaGenerada, tokensUtilizados]
        );

        // 5. Actualizar automáticamente el estado del ticket a "En proceso" tras el análisis
        await pool.query(
            `UPDATE tickets SET estado = 'En proceso' WHERE id = $1`,
            [id]
        );

        res.status(201).json({
            mensaje: "¡Ticket analizado con éxito por la IA real de Gemini!",
            diagnostico: diagnosticoResult.rows[0]
        });

    } catch (error) {
        console.error("Error al conectar con la IA de Gemini:", error);
        res.status(500).json({ error: "Hubo un error al procesar el análisis con inteligencia artificial." });
    }
};

module.exports = {
    crearTicket,
    listarTicketsEmpresa,
    actualizarEstadoTicket,
    obtenerTicketPorId,
    analizarTicketConIA
};