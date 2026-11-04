let instanciaMapa = null;
let grupoMarcadores = null;

// Inicia el mapa de OpenStreetMap enfocado inicialmente en Soacha / Sabana Sur
function iniciarMapa() {
    instanciaMapa = L.map('map').setView([4.5850, -74.2120], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(instanciaMapa);

    grupoMarcadores = L.layerGroup().addTo(instanciaMapa);
}

// Dibuja los puntos recibidos desde la base de datos con colores por tipo de riesgo
function pintarMarcadores(lista) {
    if (!grupoMarcadores) return;
    grupoMarcadores.clearLayers();

    lista.forEach(item => {
        const lat = parseFloat(item.latitud);
        const lon = parseFloat(item.longitud);

        let colorPunto = '#4b5563';
        if (item.categoria === 'acoso') colorPunto = '#dc2626';
        if (item.categoria === 'iluminacion_deficiente') colorPunto = '#d97706';
        if (item.categoria === 'zona_desolada') colorPunto = '#4338ca';

        const circulo = L.circleMarker([lat, lon], {
            radius: 9,
            fillColor: colorPunto,
            color: '#ffffff',
            weight: 2,
            fillOpacity: 0.9
        });

        const textoPopup = `
            <strong>${item.municipio} - ${item.referencia}</strong><br>
            <span>Riesgo: ${item.categoria.replace('_', ' ')}</span><br>
            <small>${item.descripcion || 'Sin descripcion adicional'}</small>
        `;

        circulo.bindPopup(textoPopup);
        grupoMarcadores.addLayer(circulo);
    });
}

function moverMapaA(lat, lon) {
    if (instanciaMapa) {
        instanciaMapa.setView([lat, lon], 16);
    }
}
