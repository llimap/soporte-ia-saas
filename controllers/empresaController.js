const pool = require('../db'); // O tu cliente de conexión

const eliminarUsuarioDeEmpresa = async (req, res) => {
    const { id } = req.params; // ID del usuario que se desea eliminar
    const adminTenantId = req.usuario.tenant_id; // El tenant del gerente autenticado

    try {
        // 1. Buscar al usuario que se quiere eliminar
        const usuarioCheck = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
        
        if (usuarioCheck.rows.length === 0) {
            return res.status(404).json({ error: "El usuario a eliminar no existe." });
        }

        const usuarioAEliminar = usuarioCheck.rows[0];

        // 2. Validación de seguridad 1: No puede eliminar a un Super Admin (o usuarios sin tenant si aplica)
        if (usuarioAEliminar.rol_sistema === 'super_admin') {
            return res.status(403).json({ error: "Acceso denegado. No se puede eliminar a un Super Administrador." });
        }

        // 3. Validación de seguridad 2: El usuario debe pertenecer obligatoriamente al mismo tenant del gerente
        if (usuarioAEliminar.tenant_id !== adminTenantId) {
            return res.status(403).json({ error: "Acceso denegado. No puedes eliminar usuarios de otra empresa o tenant." });
        }

        // 4. Ejecutar la eliminación
        await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);

        return res.json({ 
            mensaje: `Usuario con ID ${id} eliminado exitosamente de tu empresa.` 
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error interno al intentar eliminar al usuario." });
    }
};


module.exports = {
    eliminarUsuarioDeEmpresa
};