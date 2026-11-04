// Coordenadas base por defecto (Soacha) si el navegador no da permisos de GPS
let ubicacionActual = { lat: 4.5850, lon: -74.2120 };

document.addEventListener('DOMContentLoaded', () => {
    iniciarMapa();
    detectarUbicacion();
    actualizarInterfazSesion();
    inicializarEventos();
});

function detectarUbicacion() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                ubicacionActual = {
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude
                };
                cargarDatos();
            },
            () => {
                cargarDatos();
            },
            { timeout: 5000 }
        );
    } else {
        cargarDatos();
    }
}

function actualizarInterfazSesion() {
    const token = api.obtenerToken();
    const datosRaw = localStorage.getItem('usuaria_datos');

    const formReporte = document.getElementById('form-reporte');
    const avisoLogin = document.getElementById('aviso-login');
    const btnAbrirLogin = document.getElementById('btn-abrir-login');
    const btnSalir = document.getElementById('btn-salir');
    const lblUsuaria = document.getElementById('nombre-usuaria');

    if (token && datosRaw) {
        const usuaria = JSON.parse(datosRaw);
        formReporte.style.display = 'block';
        avisoLogin.style.display = 'none';
        btnAbrirLogin.style.display = 'none';
        btnSalir.style.display = 'inline-block';
        lblUsuaria.textContent = `Hola, ${usuaria.nombre}`;
    } else {
        formReporte.style.display = 'none';
        avisoLogin.style.display = 'block';
        btnAbrirLogin.style.display = 'inline-block';
        btnSalir.style.display = 'none';
        lblUsuaria.textContent = '';
    }
}

async function cargarDatos() {
    const filtro = document.getElementById('filtro-riesgo').value;
    try {
        const reportes = await api.listarReportes(filtro, ubicacionActual.lat, ubicacionActual.lon);
        pintarMarcadores(reportes);
        mostrarListadoDOM(reportes);
    } catch (error) {
        console.error('No se pudo conectar con el backend:', error);
    }
}

function mostrarListadoDOM(reportes) {
    const caja = document.getElementById('contenedor-reportes');
    caja.innerHTML = '';

    if (!Array.isArray(reportes) || reportes.length === 0) {
        caja.innerHTML = '<p class="texto-ayuda">No hay reportes para mostrar en esta categoria.</p>';
        return;
    }

    reportes.forEach(r => {
        const div = document.createElement('div');
        div.className = 'tarjeta-reporte';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <strong>${r.municipio}</strong>
                <span class="etiqueta tag-${r.categoria}">${r.categoria.replace('_', ' ')}</span>
            </div>
            <div style="font-size:0.9rem; margin-bottom:3px;">${r.referencia}</div>
            ${r.descripcion ? `<div style="font-size:0.8rem; color:#4b5563;">${r.descripcion}</div>` : ''}
            ${r.distancia_km !== undefined ? `<small style="color:#7e22ce; font-weight:600;">A ${r.distancia_km} km de distancia</small>` : ''}
        `;

        div.addEventListener('click', () => {
            moverMapaA(parseFloat(r.latitud), parseFloat(r.longitud));
        });

        caja.appendChild(div);
    });
}

function inicializarEventos() {
    const modal = document.getElementById('modal-acceso');
    const btnAbrir = document.getElementById('btn-abrir-login');
    const btnCerrar = document.querySelector('.cerrar-modal');
    const btnSalir = document.getElementById('btn-salir');

    const tabIngresar = document.getElementById('tab-ingresar');
    const tabRegistro = document.getElementById('tab-registro');
    const formLogin = document.getElementById('form-login');
    const formRegistro = document.getElementById('form-registro');

    btnAbrir.addEventListener('click', () => modal.style.display = 'flex');
    btnCerrar.addEventListener('click', () => modal.style.display = 'none');

    tabIngresar.addEventListener('click', () => {
        tabIngresar.classList.add('activo');
        tabRegistro.classList.remove('activo');
        formLogin.style.display = 'block';
        formRegistro.style.display = 'none';
    });

    tabRegistro.addEventListener('click', () => {
        tabRegistro.classList.add('activo');
        tabIngresar.classList.remove('activo');
        formRegistro.style.display = 'block';
        formLogin.style.display = 'none';
    });

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const correo = document.getElementById('login-correo').value;
        const clave = document.getElementById('login-clave').value;

        const resp = await api.iniciarSesion(correo, clave);
        if (resp.token) {
            api.guardarSesion(resp.token, resp.usuario);
            modal.style.display = 'none';
            formLogin.reset();
            actualizarInterfazSesion();
        } else {
            alert(resp.error || 'Datos incorrectos');
        }
    });

    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('reg-nombre').value;
        const correo = document.getElementById('reg-correo').value;
        const clave = document.getElementById('reg-clave').value;

        const resp = await api.registrarUsuaria(nombre, correo, clave);
        if (resp.id) {
            alert('Cuenta creada con exito. Ahora puedes iniciar sesion.');
            formRegistro.reset();
            tabIngresar.click();
        } else {
            alert(resp.error || 'No se pudo completar el registro');
        }
    });

    btnSalir.addEventListener('click', () => {
        api.cerrarSesion();
        actualizarInterfazSesion();
    });

    document.getElementById('form-reporte').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nuevo = {
            municipio: document.getElementById('municipio').value,
            referencia: document.getElementById('referencia').value,
            categoria: document.getElementById('categoria').value,
            descripcion: document.getElementById('descripcion').value
        };

        const resp = await api.enviarReporte(nuevo);
        if (resp.reporte) {
            e.target.reset();
            cargarDatos();
            moverMapaA(resp.reporte.latitud, resp.reporte.longitud);
        } else {
            alert(resp.error || 'Error al guardar el reporte');
        }
    });

    document.getElementById('filtro-riesgo').addEventListener('change', cargarDatos);
}
