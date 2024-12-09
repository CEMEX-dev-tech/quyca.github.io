// Datos de los tres silos con latitud, longitud, costo, rentabilidad y capacidad específicos
const silosData = [
    {
       Silo_ID: 161,
       Latitude: 4.2163384845500405,      // Latitud del primer silo
       Longitude: -73.81690961604514,    // Longitud del primer silo
       Cost_TRANSPORTE: 9,                // Costo de TRANSPORTE
       Cost_MONTAJE:25,      
       Profitability: 0.26,              // Rentabilidad (0 a 1)
       Capacity: 60                    // Capacidad en toneladas
    },
    {
        Silo_ID: 161,
        Latitude: 4.216595944961155,       // Latitud del segundo silo
        Longitude: -73.81642344551655,    // Longitud del segundo silo
        Cost_TRANSPORTE: 18.75,     // Costo de TRANSPORTE
        Cost_MONTAJE:9,        // Costo de montaje   
        Profitability: 0.0,   // Rentabilidad (0 a 1)
        Capacity: 60           // Capacidad en toneladas
    },
    {
        Silo_ID: 3,
        Latitude: 8.426,       // Latitud del tercer silo
        Longitude: -74.789,    // Longitud del tercer silo
        Cost_TRANSPORTE: 20.00,     // Costo de TRANSPORTE
        Cost_MONTAJE:9,        // Costo de montaje
        Profitability: 0.90,   // Rentabilidad (0 a 1)
        Capacity: 100          // Capacidad en toneladas
    }
];

// Función para calcular la distancia Haversine entre dos puntos geográficos
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

let map;
let mapContainer = document.getElementById("map-container");
let mapInitialized = false;

function initializeMap() {
    if (!mapInitialized) {
        map = L.map('map').setView([0, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '© OpenStreetMap'
        }).addTo(map);
        mapInitialized = true;
    }
}

function mostrarInformacionSilo(silo) {
    const infoBox = document.createElement('div');  
    infoBox.className = 'info-box';
    infoBox.innerHTML = `
        <h2>Silo Adecuado:</h2>
        <p><strong>ID del Silo:</strong> ${silo.Silo_ID}</p>
        <p><strong>Distancia:</strong> ${silo.Distance.toFixed(2)} KM</p>
        <p><strong>Costo de transporte (ESTIMADO):$</strong> ${silo.Cost_TRANSPORTE.toFixed(0)} M</p>
        <p><strong>Costo de montaje (ESTIMADO) :$</strong> ${silo.Cost_MONTAJE.toFixed(0)} M</p>
        <p><strong>Rentabilidad:</strong> ${(silo.Profitability * 100).toFixed(0)}%</p>
        <p><strong>Capacidad:</strong> ${silo.Capacity} TN</p>
        <p><strong>Relación (CDES / CDIS):</strong> ${(silo.Ratio * 100).toFixed(0)}%</p>
        <p><strong>CEMEX</strong></p>
        <p>Construyendo un mejor futuro 👷🛢️🚚</p>
    `;
    document.body.appendChild(infoBox);
    infoBox.style.position = "absolute";
    infoBox.style.left = "500px";
    infoBox.style.top = "500px";
}

function buscarSiloAdecuado() {
    const targetLat = parseFloat(document.getElementById('latitude').value);
    const targetLon = parseFloat(document.getElementById('longitude').value);
    const targetCapacity = parseInt(document.getElementById('capacity').value);
    const resultadoDiv = document.getElementById('resultado');

    resultadoDiv.innerHTML = '';
    resultadoDiv.style.display = 'none';

    // Calcular distancia para cada silo con respecto al destino
    silosData.forEach(silo => {
        silo.Distance = haversine(targetLat, targetLon, silo.Latitude, silo.Longitude);
    });

    // Filtrar los silos y calcular el ratio
    silosData.forEach(silo => {
        silo.Ratio = Math.min(targetCapacity, silo.Capacity) / Math.max(targetCapacity, silo.Capacity);
    });

    // Buscar un silo con ratio igual a 1
    const perfectMatch = silosData.find(silo => silo.Ratio === 1);

    let siloSeleccionado;
    if (perfectMatch) {
        // Si existe un silo con ratio igual a 1, seleccionarlo
        siloSeleccionado = perfectMatch;
    } else {
        // Filtrar los silos con ratio >= 0.80
        const filteredSilos = silosData.filter(silo => silo.Ratio >= 0.80);

        if (filteredSilos.length > 0) {
            // Seleccionar el mejor silo basado en mayor rentabilidad, menor costo y menor distancia
            siloSeleccionado = filteredSilos.sort((a, b) =>
                b.Profitability - a.Profitability || a.Cost_ENVIO + a.Cost_MONTAJE - (b.Cost_ENVIO + b.Cost_MONTAJE) || a.Distance - b.Distance
            )[0];
        } else {
            // Si no hay silos con ratio >= 0.80, no seleccionar ningún silo
            siloSeleccionado = null;
        }
    }

    if (siloSeleccionado) {
        mapContainer.classList.add("active");
        initializeMap();

        const midLat = (targetLat + siloSeleccionado.Latitude) / 2;
        const midLon = (targetLon + siloSeleccionado.Longitude) / 2;
        map.setView([midLat, midLon], 5);

        // Limpiar marcadores y líneas anteriores del mapa
        map.eachLayer(layer => {
            if (layer instanceof L.Marker || layer instanceof L.Polyline) {
                map.removeLayer(layer);
            }
        });

        // Añadir marcador para el destino y el silo seleccionado
        L.marker([targetLat, targetLon], { icon: L.icon({ iconUrl: 'Icon_Light Bulb_Blue.png', iconSize: [50, 41], iconAnchor: [12, 41] }) })
            .bindPopup("Destino")
            .addTo(map);
        L.marker([siloSeleccionado.Latitude, siloSeleccionado.Longitude], { icon: L.icon({ iconUrl: 'Icon_Light Bulb_red.png', iconSize: [50, 41], iconAnchor: [12, 41] }) })
            .bindPopup(`Silo ID: ${siloSeleccionado.Silo_ID}<br>Distancia: ${siloSeleccionado.Distance.toFixed(2)} KM`)
            .addTo(map);
        
        // Añadir línea entre el destino y el silo
        L.polyline([[targetLat, targetLon], [siloSeleccionado.Latitude, siloSeleccionado.Longitude]], { color: 'green' }).addTo(map);

        // Mostrar la información del silo adecuado en la interfaz
        mostrarInformacionSilo(siloSeleccionado);
    } else {
        mapContainer.classList.remove("active");
        resultadoDiv.innerHTML = `
            <h2>No se encontraron silos con la capacidad especificada.</h2>
            <p><strong>CEMEX</strong></p>
            <p>Construyendo un mejor futuro 🛢️🚚</p>
        `;
        resultadoDiv.style.display = 'block';
    }
}
