const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura';

const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ error: "Acceso denegado. No se proporcionó un token." });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Token malformado." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded; 
        next(); 
    } catch (error) {
        return res.status(403).json({ error: "Token inválido o expirado." });
    }
};

module.exports = { verificarToken };