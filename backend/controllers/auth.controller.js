const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { correo, email, username, password } = req.body;
    const userEmail = correo || email || username;

    if (!userEmail || !password) {
        return res.status(400).json({ message: 'Debe capturar correo/usuario y contraseña' });
    }

    const sqlSearch = 'SELECT * FROM users WHERE correo = ?';

    db.query(sqlSearch, [userEmail], async (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error del servidor' });
        }

        if (results.length > 0) {
            return res.status(409).json({ message: 'El usuario ya existe' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const sqlInsert = 'INSERT INTO users(correo, password) VALUES(?, ?)';

        db.query(sqlInsert, [userEmail, hashedPassword], (error) => {
            if (error) {
                return res.status(500).json({ message: 'No se pudo registrar el usuario' });
            }

            res.status(201).json({ message: 'Usuario registrado correctamente' });
        });
    });
};

exports.login = (req, res) => {
    const { correo, email, username, password } = req.body;
    const userEmail = correo || email || username;

    if (!userEmail || !password) {
        return res.status(400).json({ message: 'Debe capturar correo/usuario y contraseña' });
    }

    const sql = 'SELECT * FROM users WHERE correo = ?';

    db.query(sql, [userEmail], async (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error del servidor' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'El usuario no existe' });
        }

        const user = results[0];
        const coincide = await bcrypt.compare(password, user.password);

        if (!coincide) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: 'JWT_SECRET no está configurado en el servidor' });
        }

        const token = jwt.sign(
            { userId: user.id, correo: user.correo },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.status(200).json({
            message: `Bienvenido ${user.correo}`,
            token,
            user: {
                id: user.id,
                correo: user.correo
            }
        });
    });
};
