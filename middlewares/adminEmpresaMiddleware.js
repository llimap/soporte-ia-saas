const verificarAdminEmpresa = (req, res, next) => {
    // Verificamos que el usuario sea Super Admin O Administrador de Empresa
    if (req.usuario && (req.usuario.rol_sistema === 'super_admin' || req.usuario.rol_sistema === 'admin_empresa')) {
        return next();
    }
    return res.status(403).json({ error: "Acceso denegado. Se requiere rol autorizado." });
};

module.exports = verificarAdminEmpresa;