const API_URL = 'http://localhost:3000/api';
const TOKEN_KEY = 'task_manager_token';
const USER_KEY = 'task_manager_user';

const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const welcomeText = document.getElementById('welcomeText');
const tasksContainer = document.getElementById('tasksContainer');
const messageBox = document.getElementById('messageBox');

window.addEventListener('DOMContentLoaded', init);

function init() {
    const token = getToken();

    if (token) {
        showDashboard();
    } else {
        showAuth();
    }
}

function showAuth() {
    authSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    clearMessage();
}

function showDashboard() {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    const user = getUser();
    welcomeText.textContent = user ? `Bienvenido ${user.correo}` : 'Bienvenido';
    loadTasks();
}

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

function getUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
}

function setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function showMessage(text, type = 'success') {
    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
    messageBox.classList.remove('hidden');
}

function clearMessage() {
    messageBox.textContent = '';
    messageBox.className = 'message hidden';
}

async function register() {
    clearMessage();
    const correo = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value.trim();

    if (!correo || !password) {
        showMessage('Por favor completa correo y contraseña.', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message || 'Error en el registro.', 'error');
            return;
        }

        showMessage(data.message || 'Usuario registrado correctamente.', 'success');
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPassword').value = '';
    } catch (error) {
        showMessage('No se pudo conectar con el servidor.', 'error');
    }
}

async function login() {
    clearMessage();
    const correo = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!correo || !password) {
        showMessage('Por favor completa correo y contraseña.', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message || 'Error en el inicio de sesión.', 'error');
            return;
        }

        setToken(data.token);
        setUser(data.user);
        showDashboard();
        showMessage(data.message || 'Inicio de sesión correcto.', 'success');
    } catch (error) {
        showMessage('No se pudo conectar con el servidor.', 'error');
    }
}

async function loadTasks() {
    tasksContainer.innerHTML = '<p class="empty-state">Cargando tareas...</p>';
    const token = getToken();

    if (!token) {
        logout();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/tasks`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 401 || response.status === 403) {
            logout();
            return;
        }

        const tasks = await response.json();

        if (!Array.isArray(tasks) || tasks.length === 0) {
            tasksContainer.innerHTML = '<p class="empty-state">No tienes tareas aún. Agrega tu primera tarea.</p>';
            return;
        }

        tasksContainer.innerHTML = tasks
            .map(task => {
                return `
                    <div class="task-item">
                        <span>${escapeHtml(task.titulo)}</span>
                        <div class="task-actions">
                            <button class="button-danger" onclick="deleteTask(${task.id})">Eliminar</button>
                        </div>
                    </div>
                `;
            })
            .join('');
    } catch (error) {
        tasksContainer.innerHTML = '<p class="empty-state">Error al cargar las tareas.</p>';
    }
}

async function addTask() {
    clearMessage();
    const titulo = document.getElementById('taskTitle').value.trim();

    if (!titulo) {
        showMessage('Ingresa un título de tarea.', 'error');
        return;
    }

    const token = getToken();

    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ titulo })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message || 'Error al crear la tarea.', 'error');
            return;
        }

        document.getElementById('taskTitle').value = '';
        showMessage(data.message || 'Tarea creada correctamente.', 'success');
        loadTasks();
    } catch (error) {
        showMessage('No se pudo conectar con el servidor.', 'error');
    }
}

function editTask(id, currentTitle) {
    const nuevoTitulo = prompt('Actualiza el título de la tarea:', currentTitle);
    if (nuevoTitulo === null) return;
    if (!nuevoTitulo.trim()) {
        showMessage('El título no puede quedar vacío.', 'error');
        return;
    }
    updateTask(id, nuevoTitulo.trim());
}

async function updateTask(id, titulo) {
    clearMessage();
    const token = getToken();

    try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ titulo })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message || 'Error al actualizar la tarea.', 'error');
            return;
        }

        showMessage(data.message || 'Tarea actualizada correctamente.', 'success');
        loadTasks();
    } catch (error) {
        showMessage('No se pudo conectar con el servidor.', 'error');
    }
}

async function deleteTask(id) {
    clearMessage();
    if (!confirm('¿Eliminar esta tarea?')) return;
    const token = getToken();

    try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message || 'Error al eliminar la tarea.', 'error');
            return;
        }

        showMessage(data.message || 'Tarea eliminada correctamente.', 'success');
        loadTasks();
    } catch (error) {
        showMessage('No se pudo conectar con el servidor.', 'error');
    }
}

function logout() {
    removeToken();
    showAuth();
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeJs(value) {
    return String(value)
        .replace(/'/g, "\\'")
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ');
}
