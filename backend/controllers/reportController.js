const axios = require('axios');
const db = require('../config/db');

// Tabla local de referencia por si el punto exacto no aparece en OpenStreetMap
const COORDENADAS_MUNICIPIOS = {
    'soacha': { lat: 4.5794, lon: -74.2168 },
    'fusagasuga': { lat: 4.3365, lon: -74.3638 },
    'chia': { lat: 4.8616, lon: -74.0325 },
    'facatativa': { lat: 4.8137, lon: -74.3545 },
    'zipaquira': { lat: 5.0221, lon: -74.0048 },
    'girardot': { lat: 4.3008, lon: -74.8034 },
    'madrid': { lat: 4.7324, lon: -74.2642 },
    'mosquera': { lat: 4.7059, lon: -74.2302 },
    'funza': { lat: 4.7164, lon: -74.2119 },
    'cajica': { lat: 4.9186, lon: -74.0280 }
};

// Consulta la API publica de Nominatim para obtener latitud y longitud del texto
async function obtenerCoordenadas(municipio, referencia) {
    const munLimpio = municipio.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    try {
        const busqueda = encodeURIComponent(`${referencia}, ${municipio}, Cundinamarca, Colombia`);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${busqueda}&limit=1`;

        const resp = await axios.get(url, {
            headers: { 'User-Agent': 'WomanApp/1.0' },
            timeout: 4500
        });

        if (resp.data && resp.data.length > 0) {
            return {
                lat: parseFloat(resp.data[0].lat),
                lon: parseFloat(resp.data[0].lon)
            };
        }
    } catch (error) {
        console.warn('Nominatim no respondio a tiempo, usando tabla local de municipios.');
    }

    // Si Nominatim no encuentra la calle especifica, ubicamos el marcador en el municipio correspondiente
    if (COORDENADAS_MUNICIPIOS[munLimpio]) {
        return COORDENADAS_MUNICIPIOS[munLimpio];
    }

    // Punto por defecto en Sabana de Bogota / Soacha
    return { lat: 4.5850, lon: -74.2100 };
}

// Calcula la distancia en linea recta (km) entre dos coordenadas usando Haversine
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const rad = (grados) => (grados * Math.PI) / 180;
    const radioTierra = 6371;

    const dLat = rad(lat2 - lat1);
    const dLon = rad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(rad(lat1)) * Math.cos(rad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((radioTierra * c).toFixed(2));
}

// Guarda un nuevo reporte asociado a la usuaria autenticada
exports.crearReporte = async (req, res) => {
    const { municipio, referencia, categoria, descripcion } = req.body;
    const usuarioId = req.user.id;

    if (!municipio || !referencia || !categoria) {
        return res.status(400).json({ error: 'El municipio, el punto de referencia y la categoria son requeridos.' });
    }

    try {
        const coords = await obtenerCoordenadas(municipio, referencia);

        const [resultado] = await db.query(
            'INSERT INTO reportes (usuario_id, municipio, referencia, categoria, descripcion, latitud, longitud) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [usuarioId, municipio.trim(), referencia.trim(), categoria, descripcion || '', coords.lat, coords.lon]
        );

        return res.status(201).json({
            mensaje: 'Reporte guardado correctamente',
            reporte: {
                id: resultado.insertId,
                municipio,
                referencia,
                categoria,
                latitud: coords.lat,
                longitud: coords.lon
            }
        });
    } catch (err) {
        console.error('Error al insertar reporte:', err);
        return res.status(500).json({ error: 'No se pudo registrar el reporte.' });
    }
};

// Lista los reportes filtrados por riesgo y ordenados por cercania
exports.obtenerReportes = async (req, res) => {
    const { categoria, refLat, refLon } = req.query;

    try {
        let consulta = `
            SELECT r.id, r.municipio, r.referencia, r.categoria, r.descripcion,
                   r.latitud, r.longitud, r.creado_en, u.nombre AS autora
            FROM reportes r
            INNER JOIN usuarios u ON r.usuario_id = u.id
        `;
        const parametros = [];

        if (categoria && categoria !== 'todos') {
            consulta += ' WHERE r.categoria = ?';
            parametros.push(categoria);
        }

        consulta += ' ORDER BY r.creado_en DESC';

        const [filas] = await db.query(consulta, parametros);

        // Si el cliente envia coordenadas de referencia, se ordena del mas cercano al mas lejano
        if (refLat && refLon) {
            const latBase = parseFloat(refLat);
            const lonBase = parseFloat(refLon);

            const listaOrdenada = filas.map(item => ({
                ...item,
                distancia_km: calcularDistancia(latBase, lonBase, parseFloat(item.latitud), parseFloat(item.longitud))
            }));

            listaOrdenada.sort((a, b) => a.distancia_km - b.distancia_km);
            return res.json(listaOrdenada);
        }

        return res.json(filas);
    } catch (err) {
        console.error('Error al obtener reportes:', err);
        return res.status(500).json({ error: 'Fallo al consultar la lista de reportes.' });
    }
};
