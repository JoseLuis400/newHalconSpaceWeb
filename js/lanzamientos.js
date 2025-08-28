function parseFecha(fechaStr) {
    const [dia, mes, anio] = fechaStr.split("/").map(Number);
    return new Date(anio, mes - 1, dia);
  }
  
  // Cargar JSON de lanzamientos
  fetch("https://halconspace.site/json/lanzamientos.json")
    .then(res => res.json())
    .then(lanzamientos => {
      // Ordenar por fecha (más reciente primero)
      lanzamientos.sort((a, b) => parseFecha(b.fecha) - parseFecha(a.fecha));
  
      const contenedor = document.getElementById("launchesContainer");
  
      lanzamientos.forEach(l => {
        const card = document.createElement("div");
        card.className = "card-lanzamiento";
        card.setAttribute("data-estado", l.estado.toLowerCase());
        card.setAttribute("data-vehiculo", l.vehiculo.toLowerCase());
  
        // Función auxiliar para normalizar URL
        function normalizeURL(url) {
            if (!url) return ""; // null o undefined
            url = url.trim(); // quitar espacios
          
            // Si ya es absoluta
            if (url.startsWith("http://") || url.startsWith("https://")) {
              return url;
            }
          
            // Si no empieza con "/", agregamos la barra
            if (!url.startsWith("/")) {
              url = "/" + url;
            }
          
            return `https://halconspace.site${url}`;
          }
          
  
  // En la creación de la tarjeta
  card.innerHTML = `
    <div class="img-wrapper">
      <img src="${normalizeURL(l.imagen)}" alt="${l.alt ?? ""}">
      <span class="estado ${l.estado.toLowerCase()}">${l.estado.toUpperCase()}</span>
    </div>
    <div class="info">
      <h3>${l.nombre}</h3>
      <p><strong>Fecha:</strong> ${l.fecha}</p>
      <p><strong>Vehículo:</strong> ${l.vehiculo}</p>
      <p><strong>Plataforma:</strong> ${l.plataforma ?? "Desconocido"}</p>
      <div class="links">
        ${l.detalleUrl ? `<a href="${normalizeURL(l.detalleUrl)}" class="btn">Detalles</a>` : ""}
        ${l.stream ? `<a href="${normalizeURL(l.stream)}" target="_blank" class="btn live">Ver transmisión</a>` : ""}
      </div>
    </div>
  `;  
  
        contenedor.appendChild(card);
      });
  
      // === Filtros ===
      const filterButtons = document.querySelectorAll(".filter-btn");
  
      filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
          // Quitar clase active de todos
          filterButtons.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
  
          const filter = btn.dataset.filter.toLowerCase();
          const cards = contenedor.querySelectorAll(".card-lanzamiento");
  
          cards.forEach(card => {
            const estado = card.getAttribute("data-estado");
            const vehiculo = card.getAttribute("data-vehiculo");
  
            if (
              filter === "all" ||
              estado === filter ||
              vehiculo.includes(filter)
            ) {
              card.style.display = "block";
            } else {
              card.style.display = "none";
            }
          });
        });
      });
    })
    .catch(err => console.error("Error cargando lanzamientos:", err));

    // === Filtros ===
    const statusFilter = document.getElementById("filter-status");
    const vehicleFilter = document.getElementById("filter-vehicle");
    const searchInput = document.getElementById("search-name");
    const noResults = document.getElementById("no-results");
    
    function aplicarFiltros() {
      const statusValue = statusFilter.value.toLowerCase();
      const vehicleValue = vehicleFilter.value.toLowerCase();
      const searchValue = searchInput.value.toLowerCase();
      const cards = document.querySelectorAll("#launchesContainer .card-lanzamiento");
      let anyVisible = false;
    
      cards.forEach(card => {
        const estado = card.getAttribute("data-estado");
        const vehiculo = card.getAttribute("data-vehiculo");
        const nombre = card.querySelector("h3").textContent.toLowerCase();
    
        const matchStatus = (statusValue === "all" || estado === statusValue);
        const matchVehicle = (vehicleValue === "all" || vehiculo.includes(vehicleValue));
        const matchSearch = (searchValue === "" || nombre.includes(searchValue));
    
        if (matchStatus && matchVehicle && matchSearch) {
          card.style.display = "block";
          anyVisible = true;
        } else {
          card.style.display = "none";
        }
      });
    
      // Mostrar o ocultar mensaje
      noResults.style.display = anyVisible ? "none" : "block";
    }
    
    // Listeners
    statusFilter.addEventListener("change", aplicarFiltros);
    vehicleFilter.addEventListener("change", aplicarFiltros);
    searchInput.addEventListener("input", aplicarFiltros);




    /// ===== ESTADISTICAS =====



    fetch("https://halconspace.site/json/estadisticas.json")
    .then(res => res.json())
    .then(stats => {
  
      // === Pie chart de lanzamientos ===
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
  
      // === Pie chart de aterrizajes ===
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
  
      // === Pie chart de vuelos por vehículo ===
      new Chart(document.getElementById("vehicleChart"), {
        type: "pie",
        data: {
          labels: ["Falcon 9", "Falcon Heavy"],
          datasets: [{
            data: [stats.vuelosVehiculos.falcon9.exitosos + stats.vuelosVehiculos.falcon9.fallidos,
                   stats.vuelosVehiculos.falconHeavy.exitosos + stats.vuelosVehiculos.falconHeavy.fallidos],
            backgroundColor: ["#2196f3", "#ff9800"]
          }]
        },
        options: {
          responsive:true,
          plugins:{legend:{position:"bottom", labels:{color:"#ffffff"}}}
        }
      });
  
      // === Mostrar datos resumidos, con saltos de línea para mejor lectura ===
      const dataDiv = document.getElementById("launches-data");
      /*dataDiv.innerHTML = `
        <strong>Lanzamientos:</strong> Exitosos ${stats.lanzamientos.exitosos}, Fallidos ${stats.lanzamientos.fallidos}<br>
        <strong>Aterrizajes:</strong> Exitosos ${stats.aterrizajes.exitosos}, Fallidos ${stats.aterrizajes.fallidos}<br>
        <strong>Vuelos Falcon 9:</strong> Exitosos ${stats.vuelosVehiculos.falcon9.exitosos}, Fallidos ${stats.vuelosVehiculos.falcon9.fallidos}<br>
        <strong>Vuelos Falcon Heavy:</strong> Exitosos ${stats.vuelosVehiculos.falconHeavy.exitosos}, Fallidos ${stats.vuelosVehiculos.falconHeavy.fallidos}
      `;*/
    })
    .catch(err => console.error("Error cargando estadísticas:", err));
  