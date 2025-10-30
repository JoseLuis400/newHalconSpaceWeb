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
        
        // Latencia variable más realista: ±1-3ms del valor base
        const baseLatency = data.general.average_latency_ms;
        const variacion = (Math.random() * 12 - 6).toFixed(1); // Rango de -3.0 a +3.0 ms con decimales
        const latenciaVariable = (parseFloat(baseLatency) + parseFloat(variacion)).toFixed(0);
        document.getElementById('latencia').textContent = latenciaVariable + ' ms';
        
        document.getElementById('estado-general').textContent = data.general.overall_status;
        
        // Mostrar solo la fecha actual en UTC con formato DD/MM/AAAA
        const ahora = new Date();
        const dia = String(ahora.getUTCDate()).padStart(2, '0');
        const mes = String(ahora.getUTCMonth() + 1).padStart(2, '0');
        const anio = ahora.getUTCFullYear();
        const fechaUTC = `${dia}/${mes}/${anio}`;
        document.getElementById('ultimo-ping').textContent = fechaUTC;

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

// Actualizar latencia cada 2 segundos
setInterval(loadRealtimeStatus, 2000);