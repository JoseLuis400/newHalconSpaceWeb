// -------------------- Realtime Status --------------------
// -------------------- Realtime Status --------------------
async function loadRealtimeStatus() {
    try {
        const response = await fetch('json/icom.json');
        if (!response.ok) throw new Error('No se pudo cargar el JSON');

        const data = await response.json();

        // Calcular total de satélites lanzados sumando cada misión
        const totalSatLanzados = data.missions.reduce((sum, mission) => {
            return sum + (mission.satellites_launched || 0);
        }, 0);

        const totalMisiones = data.missions.length;

        // Datos generales
        document.getElementById('misiones-lanzadas').textContent = totalMisiones + " / 40";
        document.getElementById('sat-lanzados').textContent = totalSatLanzados + " / 960";
        document.getElementById('sat-orbita').textContent = data.general.total_satellites_orbit;
        document.getElementById('sat-operativos').textContent = data.general.total_satellites_operative;
        document.getElementById('latencia').textContent = data.general.average_latency_ms + ' ms';
        document.getElementById('estado-general').textContent = data.general.overall_status;
        document.getElementById('ultimo-ping').textContent = data.general.last_update;

    } catch (error) {
        console.error('Error cargando datos en tiempo real:', error);
    }
}


// -------------------- Misiones --------------------
async function loadMissions() {
    try {
        const response = await fetch('json/icom.json');
        if (!response.ok) throw new Error('No se pudo cargar el JSON de misiones');

        const data = await response.json();
        const missionsContainer = document.getElementById('missions-list');
        missionsContainer.innerHTML = "";

        data.missions.forEach(mission => {
            // Crear enlace solo si existe
            const articuloURL = mission.article_url && mission.article_url.trim() !== ""
                ? `<a href="${mission.article_url}" target="_blank" rel="noopener noreferrer">ICOM Launch ${mission.mission_id}</a>`
                : `ICOM Launch ${mission.mission_id}`;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${articuloURL}</td>
                <td>${mission.satellites_launched}</td>
                <td>${mission.vehiculo}</td>
                <td>${mission.launch_date}</td>
                <td class="proveedor">${mission.proveedor}</td>
            `;
            missionsContainer.appendChild(row);
        });

    } catch (error) {
        console.error('Error cargando las misiones:', error);
    }
}

// -------------------- Ejecutar al cargar --------------------
loadRealtimeStatus();
loadMissions();
