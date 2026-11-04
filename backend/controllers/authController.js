const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Registro de nuevas usuarias con encriptacion de contrasena
exports.register = async (req, res) => {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Faltan campos obligatorios en el formulario.' });
    }

    try {
        const [existe] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existe.length > 0) {
            return res.status(409).json({ error: 'Ese correo ya se encuentra registrado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const [result] = await db.query(
            'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
            [nombre.trim(), email.trim(), hash]
        );

        return res.status(201).json({ mensaje: 'Registro completado', id: result.insertId });
    } catch (err) {
        console.error('Error en registro:', err);
        return res.status(500).json({ error: 'Fallo al guardar el usuario en la base de datos.' });
    }
};

// Inicio de sesion y generacion del JWT
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Debes ingresar el correo y la contrasena.' });
    }

    try {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email.trim()]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Correo o contrasena incorrectos.' });
        }

        const usuario = rows[0];
        const coincide = await bcrypt.compare(password, usuario.password);

        if (!coincide) {
            return res.status(401).json({ error: 'Correo o contrasena incorrectos.' });
        }

        const token = jwt.sign(
            { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
            process.env.JWT_SECRET,
            { expiresIn: '6h' }
        );

        return res.json({
            token,
            usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email }
        });
    } catch (err) {
        console.error('Error en login:', err);
        return res.status(500).json({ error: 'Error interno al verificar credenciales.' });
    }
};
