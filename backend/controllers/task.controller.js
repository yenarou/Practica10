const db = require('../config/db');

exports.getTasks = (req, res) => {
    const sql = 'SELECT id, titulo FROM tasks WHERE id_usuario = ?';

    db.query(sql, [req.userId], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error al obtener las tareas' });
        }

        res.status(200).json(results);
    });
};

exports.createTask = (req, res) => {
    const { titulo } = req.body;

    if (!titulo) {
        return res.status(400).json({ message: 'Debe enviar el título de la tarea' });
    }

    const sql = 'INSERT INTO tasks(titulo, id_usuario) VALUES(?, ?)';

    db.query(sql, [titulo, req.userId], (error, result) => {
        if (error) {
            return res.status(500).json({ message: 'Error al crear la tarea' });
        }

        res.status(201).json({
            message: 'Tarea creada correctamente',
            taskId: result.insertId
        });
    });
};

exports.updateTask = (req, res) => {
    const { id } = req.params;
    const { titulo } = req.body;

    if (!titulo) {
        return res.status(400).json({ message: 'Debe enviar el título de la tarea' });
    }

    const sql = 'UPDATE tasks SET titulo = ? WHERE id = ? AND id_usuario = ?';

    db.query(sql, [titulo, id, req.userId], (error, result) => {
        if (error) {
            return res.status(500).json({ message: 'Error al actualizar la tarea' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Tarea no encontrada' });
        }

        res.status(200).json({ message: 'Tarea actualizada correctamente' });
    });
};

exports.deleteTask = (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM tasks WHERE id = ? AND id_usuario = ?';

    db.query(sql, [id, req.userId], (error, result) => {
        if (error) {
            return res.status(500).json({ message: 'Error al eliminar la tarea' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Tarea no encontrada' });
        }

        res.status(200).json({ message: 'Tarea eliminada correctamente' });
    });
};
