const API_URL = 'http://localhost:3000/api';

// Funciones auxiliares para consumir el backend y manejar el JWT en localStorage
const api = {
    obtenerToken() {
        return localStorage.getItem('jwt_WomanApp');
    },

    guardarSesion(token, usuario) {
        localStorage.setItem('jwt_WomanApp', token);
        localStorage.setItem('usuaria_datos', JSON.stringify(usuario));
    },

    cerrarSesion() {
        localStorage.removeItem('jwt_WomanApp');
        localStorage.removeItem('usuaria_datos');
    },

    async iniciarSesion(email, password) {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return res.json();
    },

    async registrarUsuaria(nombre, email, password) {
        const res = await fetch(`${API_URL}/auth/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password })
        });
        return res.json();
    },

    async listarReportes(categoria = 'todos', lat = null, lon = null) {
        let endpoint = `${API_URL}/reportes?categoria=${categoria}`;
        if (lat !== null && lon !== null) {
            endpoint += `&refLat=${lat}&refLon=${lon}`;
        }
        const res = await fetch(endpoint);
        return res.json();
    },

    async enviarReporte(datos) {
        const token = this.obtenerToken();
        const res = await fetch(`${API_URL}/reportes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(datos)
        });
        return res.json();
    }
};
