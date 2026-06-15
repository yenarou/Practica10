const mysql = require('mysql2');
require('dotenv').config();

const database = process.env.DB_NAME || 'task_manager';
const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
});

connection.connect((error) => {
    if (error) {
        console.error('Error de conexión a MySQL:', error);
        return;
    }

    connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``, (error) => {
        if (error) {
            console.error('Error creando la base de datos:', error);
            return;
        }

        connection.changeUser({ database }, (error) => {
            if (error) {
                console.error('Error seleccionando la base de datos:', error);
                return;
            }

            console.log(`Conectado a MySQL y usando la base de datos ${database}`);

            const usersTable = `CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                correo VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL
            )`;

            const tasksTable = `CREATE TABLE IF NOT EXISTS tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(255) NOT NULL,
                id_usuario INT NOT NULL,
                FOREIGN KEY (id_usuario) REFERENCES users(id) ON DELETE CASCADE
            )`;

            connection.query(usersTable, (error) => {
                if (error) {
                    console.error('Error creando tabla users:', error);
                    return;
                }

                connection.query(tasksTable, (error) => {
                    if (error) {
                        console.error('Error creando tabla tasks:', error);
                        return;
                    }

                    console.log('Tablas listas: users, tasks');
                });
            });
        });
    });
});

module.exports = connection;
