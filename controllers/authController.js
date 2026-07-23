const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura';

// 1. Registrar Empresa y Administrador Principal
const registrarEmpresaYAdmin = async (req, res) => {
    const { nombre_empresa, nombre_usuario, correo, password, subdominio } = req.body;
    
    try {
        const usuarioExistente = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
        if (usuarioExistente.rows.length > 0) {
            return res.status(400).json({ error: "El correo ya está registrado." });
        }

        const empresaQuery = 'INSERT INTO tenants (nombre_empresa, subdominio) VALUES ($1, $2) RETURNING id';
        const empresaRes = await pool.query(empresaQuery, [nombre_empresa, subdominio || null]);
        const tenant_id = empresaRes.rows[0].id;

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const usuarioQuery = `
            INSERT INTO usuarios (tenant_id, nombre, correo, password_hash, rol_sistema)
            VALUES ($1, $2, $3, $4, 'admin_empresa')
            RETURNING id, tenant_id, nombre, correo, rol_sistema;
        `;
        const usuarioRes = await pool.query(usuarioQuery, [tenant_id, nombre_usuario, correo, passwordHash]);

        res.status(201).json({
            mensaje: "¡Empresa y administrador registrados exitosamente!",
            usuario: usuarioRes.rows[0]
        });
    } catch (error) {
        console.error("Error al registrar empresa:", error);
        res.status(500).json({ error: "Error en el servidor." });
    }
};

// 2. Login de Usuario
const loginUsuario = async (req, res) => {
    const { correo, password } = req.body;

    try {
        const resultado = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
        if (resultado.rows.length === 0) {
            return res.status(400).json({ error: "Correo o contraseña incorrectos." });
        }

        const usuario = resultado.rows[0];

        const passwordValido = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordValido) {
            return res.status(400).json({ error: "Correo o contraseña incorrectos." });
        }

        const tokenPayload = {
            id: usuario.id,
            tenant_id: usuario.tenant_id,
            correo: usuario.correo,
            rol_sistema: usuario.rol_sistema
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });

        res.status(200).json({
            mensaje: "¡Inicio de sesión exitoso!",
            token,
            usuario: {
                id: usuario.id,
                tenant_id: usuario.tenant_id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol_sistema: usuario.rol_sistema
            }
        });
    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).json({ error: "Error en el servidor." });
    }
};

// 3. Registrar Empleado/Usuario bajo el mismo tenant_id del Admin
const registrarUsuario = async (req, res) => {
    //console.log("BODY RECIBIDO:", req.body);
    //console.log("USUARIO DEL TOKEN:", req.usuario);
    
    const { nombre, correo, password, rol_sistema, tenant_id: tenantBody } = req.body;
    
    // Si es superadmin, permite usar el tenant_id que manda en el body; si no, usa el de su propio token
    const tenant_id = (req.usuario.rol_sistema === 'superadmin' || req.usuario.rol_sistema === 'super_admin') 
    ? tenantBody 
    : req.usuario.tenant_id;

    //console.log("TENANT_ID FINAL A GUARDAR:", tenant_id);

    try {
        const usuarioExistente = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
        if (usuarioExistente.rows.length > 0) {
            return res.status(400).json({ error: "El correo ya está registrado en el sistema." });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const query = `
            INSERT INTO usuarios (tenant_id, nombre, correo, password_hash, rol_sistema)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, tenant_id, nombre, correo, rol_sistema;
        `;
        const values = [tenant_id, nombre, correo, passwordHash, rol_sistema || 'empleado'];
        const resultado = await pool.query(query, values);

        res.status(201).json({
            mensaje: "¡Usuario registrado exitosamente en la empresa!",
            usuario: resultado.rows[0]
        });

    } catch (error) {
        console.error("Error al registrar usuario:", error);
        res.status(500).json({ error: "Error en el servidor al registrar el usuario." });
    }
};

// 4. Actualizar Perfil Propio (con opción de actualizar contraseña)
const actualizarPerfilPropio = async (req, res) => {
    const usuarioId = req.usuario.id; 
    const { nombre, correo, contrasena } = req.body; 

    try {
        if (correo) {
            const correoCheck = await pool.query(
                'SELECT * FROM usuarios WHERE correo = $1 AND id != $2', 
                [correo, usuarioId]
            );
            if (correoCheck.rows.length > 0) {
                return res.status(400).json({ error: "El correo electrónico ya está en uso por otro usuario." });
            }
        }

        let hashedPassword = null;
        if (contrasena) {
            const saltRounds = 10;
            hashedPassword = await bcrypt.hash(contrasena, saltRounds);
        }

        const resultado = await pool.query(
            `UPDATE usuarios 
             SET nombre = COALESCE($1, nombre), 
                 correo = COALESCE($2, correo),
                 password_hash = COALESCE($3, password_hash)
             WHERE id = $4 
             RETURNING id, nombre, correo, rol_sistema, tenant_id`,
            [nombre, correo, hashedPassword, usuarioId]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado." });
        }

        res.json({
            mensaje: "Perfil y/o contraseña actualizados exitosamente",
            usuario: resultado.rows[0]
        });

    } catch (error) {
        console.error("Error al actualizar el perfil:", error);
        res.status(500).json({ error: "Error interno del servidor al actualizar el perfil." });
    }
};

const actualizarUsuarioPorAdmin = async (req, res) => {
    try {
        const { id } = req.params; // ID del usuario que queremos modificar (ej. el de José Felipe)
        const { nombre, correo, password, rol_sistema } = req.body;
        
        // Datos del usuario que está haciendo la petición (extraídos de su token JWT)
        const usuarioLogueado = req.usuario; // { id, rol_sistema, tenant_id }

       // 1. Buscar al usuario que se quiere modificar
        const usuarioQuery = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
        if (usuarioQuery.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" }); // Corregido
        }
        const usuarioAEditar = usuarioQuery.rows[0];

        // 2. Validar jerarquía y permisos por empresa (Tenant)
        if (usuarioLogueado.rol_sistema !== 'super_admin') {
            // Si es Gerente, solo puede editar a gente de su mismo tenant
            if (usuarioLogueado.rol_sistema === 'admin_empresa') {
                if (usuarioAEditar.tenant_id !== usuarioLogueado.tenant_id) {
                    return res.status(403).json({ error: "No tienes permiso para modificar usuarios de otra empresa." }); // Corregido
                }
            } else {
                return res.status(403).json({ error: "Acceso denegado." }); // Corregido
            }
        }

        // 3. Si mandó una nueva contraseña, la encriptamos
        let passwordHashFinal = usuarioAEditar.password_hash;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            passwordHashFinal = await bcrypt.hash(password, salt);
        }

        // 4. Actualizar en la base de datos
        const updateQuery = `
            UPDATE usuarios 
            SET nombre = COALESCE($1, nombre), 
                correo = COALESCE($2, correo),
                password_hash = COALESCE($3, password_hash),
                rol_sistema = COALESCE($4, rol_sistema)
            WHERE id = $5
            RETURNING id, nombre, correo, rol_sistema, tenant_id
        `;
        
        const resultado = await pool.query(updateQuery, [
            nombre || null, 
            correo || null, 
            password ? passwordHashFinal : null, 
            rol_sistema || null, 
            id
        ]);

        res.json({
            mensaje: "Usuario actualizado exitosamente por el administrador",
            usuario: resultado.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en el servidor al actualizar el usuario" });
    }
};

const listarUsuariosPorRol = async (req, res) => {
    try {
        // 1. Capturar parámetros de paginación (por defecto página 1, 10 por página)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        let query;
        let params = [];
        let countQuery;
        let countParams = [];

        // 2. Configurar la consulta principal y la de conteo según el rol
        if (req.usuario.rol_sistema === 'super_admin') {
            // El superadmin no filtra por tenant, así que LIMIT y OFFSET son $1 y $2
            query = `SELECT id, nombre, correo, password_hash, rol_sistema, tenant_id FROM usuarios ORDER BY id ASC LIMIT $1 OFFSET $2`;
            params = [limit, offset];
            
            countQuery = `SELECT COUNT(*) FROM usuarios`;
            countParams = [];
        } 
        else if (req.usuario.rol_sistema === 'admin_empresa') {
            // El admin de empresa filtra por tenant ($1), así que LIMIT y OFFSET son $2 y $3
            query = `SELECT id, nombre, correo, password_hash, rol_sistema, tenant_id FROM usuarios WHERE tenant_id = $1 ORDER BY id ASC LIMIT $2 OFFSET $3`;
            params = [req.usuario.tenant_id, limit, offset];
            
            countQuery = `SELECT COUNT(*) FROM usuarios WHERE tenant_id = $1`;
            countParams = [req.usuario.tenant_id];
        } else {
            return res.status(403).json({ error: "Acceso denegado." });
        }

        // 3. Ejecutar las consultas
        const resultado = await pool.query(query, params);
        const countResult = await pool.query(countQuery, countParams);
        const totalRegistros = parseInt(countResult.rows[0].count);

        // 4. Devolver la respuesta con los metadatos de paginación
        return res.status(200).json({
            pagina_actual: page,
            por_pagina: limit,
            total_usuarios_encontrados: totalRegistros,
            total_paginas: Math.ceil(totalRegistros / limit),
            usuarios: resultado.rows
        });

    } catch (error) {
        console.error("Error al listar usuarios por rol:", error);
        return res.status(500).json({ error: "Hubo un error interno al listar los usuarios." });
    }
};
module.exports = {
    registrarEmpresaYAdmin,
    loginUsuario,
    registrarUsuario,
    listarUsuariosPorRol,
    actualizarUsuarioPorAdmin,
    actualizarPerfilPropio
};
    