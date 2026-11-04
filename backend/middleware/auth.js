const jwt = require('jsonwebtoken');

// Middleware que valida el token enviado en la cabecera Authorization
module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No se encontro el token de sesion.' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'La sesion ha expirado o el token es invalido.' });
    }
};
