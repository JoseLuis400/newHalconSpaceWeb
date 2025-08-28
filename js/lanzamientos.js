document.addEventListener("DOMContentLoaded", () => {

    // ===== Función para parsear fechas DD/MM/YYYY =====
    function parseFecha(fechaStr) {
      const [dia, mes, anio] = fechaStr.split("/").map(Number);
      return new Date(anio, mes - 1, dia);
    }
  
    // ===== Función para normalizar URLs =====
    function normalizeURL(url) {
      if (!url) return "";
      url = url.trim();
  
      if (url.startsWith("http://") || url.startsWith("https://")) return url;
      if (!url.startsWith("/")) url = "/" + url;
  
      return `https://halconspace.site${url}`;
    }
  
    // ===== Contenedores y filtros =====
    const contenedor = document.getElementById("launchesContainer");
    const statusFilter = document.getElementById("filter-status");
    const vehicleFilter = document.getElementById("filter-vehicle");
    const platformFilter = document.getElementById("filter-plataforma");
    const searchInput = document.getElementById("search-name");
    const noResults = document.getElementById("no-results");
  
    // ===== Cargar lanzamientos =====
    fetch("https://halconspace.site/json/lanzamientos.json")
      .then(res => res.json())
      .then(lanzamientos => {
  
        // Ordenar por fecha (más reciente primero)
        lanzamientos.sort((a,b) => parseFecha(b.fecha) - parseFecha(a.fecha));
  
        // Crear tarjetas
        lanzamientos.forEach(l => {
          const card = document.createElement("div");
          card.className = "card-lanzamiento";
          card.setAttribute("data-estado", (l.estado ?? "desconocido").toLowerCase());
          card.setAttribute("data-vehiculo", (l.vehiculo ?? "desconocido").toLowerCase());
          card.setAttribute("data-plataforma", (l.plataforma ?? "desconocido").toLowerCase());
  
          card.innerHTML = `
            <div class="img-wrapper">
              <img src="${normalizeURL(l.imagen)}" alt="${l.alt ?? ""}">
              <span class="estado ${(l.estado ?? "desconocido").toLowerCase()}">${(l.estado ?? "Desconocido").toUpperCase()}</span>
            </div>
            <div class="info">
              <h3>${l.nombre}</h3>
              <p><strong>Fecha:</strong> ${l.fecha}</p>
              <p><strong>Vehículo:</strong> ${l.vehiculo ?? "Desconocido"}</p>
              <p><strong>Plataforma:</strong> ${l.plataforma ?? "Desconocido"}</p>
              <div class="links">
                ${l.detalleUrl ? `<a href="${normalizeURL(l.detalleUrl)}" class="btn">Detalles</a>` : ""}
                ${l.stream ? `<a href="${normalizeURL(l.stream)}" target="_blank" class="btn live">Ver transmisión</a>` : ""}
              </div>
            </div>
          `;
          contenedor.appendChild(card);
        });
  
        // Aplicar filtros iniciales
        aplicarFiltros();
  
      })
      .catch(err => console.error("Error cargando lanzamientos:", err));
  
    // ===== Función de filtros y búsqueda =====
    function aplicarFiltros() {
        const statusValue = statusFilter.value.toLowerCase();
        const vehicleValue = vehicleFilter.value.toLowerCase();
        const platformValue = platformFilter.value.toLowerCase();
        const searchValue = searchInput.value.toLowerCase();
        const cards = document.querySelectorAll("#launchesContainer .card-lanzamiento");
        let anyVisible = false;
      
        cards.forEach(card => {
          const estado = card.getAttribute("data-estado");
          const vehiculo = card.getAttribute("data-vehiculo");
          const plataforma = card.getAttribute("data-plataforma");
          const nombre = card.querySelector("h3").textContent.toLowerCase();
      
          const matchStatus = (statusValue === "all" || estado === statusValue);
          const matchVehicle = (vehicleValue === "all" || vehiculo.includes(vehicleValue));
          const matchPlatform = (platformValue === "all" || plataforma === platformValue);
          const matchSearch = (searchValue === "" || nombre.includes(searchValue));
      
          if (matchStatus && matchVehicle && matchPlatform && matchSearch) {
            // Mostrar tarjeta con animación
            card.classList.remove("fade");
            card.style.display = "block";
            setTimeout(() => card.classList.add("show"), 10); // pequeño retraso para animación
            anyVisible = true;
          } else {
            // Ocultar tarjeta con animación
            card.classList.remove("show");
            card.classList.add("fade");
            setTimeout(() => { card.style.display = "none"; }, 300); // espera a que termine la transición
          }
        });
      
        noResults.style.display = anyVisible ? "none" : "block";
      }
      
    // ===== Listeners de filtros y búsqueda =====
    statusFilter.addEventListener("change", aplicarFiltros);
    vehicleFilter.addEventListener("change", aplicarFiltros);
    platformFilter.addEventListener("change", aplicarFiltros);
    searchInput.addEventListener("input", aplicarFiltros);
  
    // ===== ESTADISTICAS =====
    fetch("https://halconspace.site/json/estadisticas.json")
      .then(res => res.json())
      .then(stats => {
  
        // Pie chart de lanzamientos
        new Chart(document.getElementById("launchesChart"), {
          type: "pie",
          data: {
            labels: ["Exitosos", "Fallidos"],
            datasets: [{
              data: [stats.lanzamientos.exitosos, stats.lanzamientos.fallidos],
              backgroundColor: ["#00ff88", "#ff4444"]
            }]
          },
          options: {
            responsive:true,
            plugins:{legend:{position:"bottom", labels:{color:"#ffffff"}}}
          }
        });
  
        // Pie chart de aterrizajes
        new Chart(document.getElementById("landingsChart"), {
          type: "pie",
          data: {
            labels: ["Exitosos", "Fallidos"],
            datasets: [{
              data: [stats.aterrizajes.exitosos, stats.aterrizajes.fallidos],
              backgroundColor: ["#00ff88", "#ff4444"]
            }]
          },
          options: {
            responsive:true,
            plugins:{legend:{position:"bottom", labels:{color:"#ffffff"}}}
          }
        });
  
        // Pie chart de vuelos por vehículo
        new Chart(document.getElementById("vehicleChart"), {
          type: "pie",
          data: {
            labels: ["Falcon 9", "Falcon Heavy"],
            datasets: [{
              data: [
                stats.vuelosVehiculos.falcon9.exitosos + stats.vuelosVehiculos.falcon9.fallidos,
                stats.vuelosVehiculos.falconHeavy.exitosos + stats.vuelosVehiculos.falconHeavy.fallidos
              ],
              backgroundColor: ["#2196f3", "#ff9800"]
            }]
          },
          options: {
            responsive:true,
            plugins:{legend:{position:"bottom", labels:{color:"#ffffff"}}}
          }
        });
  
      })
      .catch(err => console.error("Error cargando estadísticas:", err));
  
  });
  