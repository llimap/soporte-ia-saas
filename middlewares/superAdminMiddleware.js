const verificarSuperAdmin = (req, res, next) => {
    // req.usuario viene del middleware general de autenticación (authMiddleware)
    if (!req.usuario || req.usuario.rol_sistema !== 'super_admin') {
        return res.status(403).json({ error: "Acceso denegado. Se requieren privilegios de Super Administrador." });
    }
    next();
};

module.exports = verificarSuperAdmin;