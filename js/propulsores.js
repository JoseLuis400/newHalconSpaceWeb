// API Data URL
const apiURL = "json/propulsores.json"; // Cambia la ruta si es necesario

// Variables
let boostersData = [];
let currentFilter = "all";
let filteredBoosters = [];

// Elementos DOM
const boostersGrid = document.getElementById("boosters-grid");
const filterButtons = document.querySelectorAll(".filter-btn");
const modal = document.getElementById("booster-modal");
const modalBody = document.getElementById("modal-body");
const modalClose = document.querySelector(".modal-close");

// Funciones de fecha
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const [day, month, year] = dateString.split("/");
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

// Cargar datos desde la API
async function loadBoostersData() {
    try {
      const response = await fetch(apiURL);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
  
      // Convertimos el objeto de propulsores a array
      boostersData = Object.entries(data.propulsores).map(([id, booster]) => {
        const missions = Object.entries(booster.vuelos).map(([flightId, v]) => ({
          flightNumber: flightId,
          name: v.mision,
          date: v.fecha,
          url: v.url || "",
          programado: v.programado || false  // si viene programado desde API
        }));
  
        // Filtramos vuelos completados (no programados) para contar los vuelos totales
        const completedMissions = missions.filter(m => !m.programado);
  
        return {
          name: id,
          type: booster.tipo,
          status: booster.estado,
          flights: completedMissions.length,
          missions,
          image: booster.img,
          firstFlight: completedMissions.length ? completedMissions[0].date : null,
          lastFlight: completedMissions.length ? completedMissions[completedMissions.length - 1].date : null
        };
      });
  
      filteredBoosters = [...boostersData];
    } catch (error) {
      console.error("[API] Error cargando datos:", error);
      if (boostersGrid) {
        boostersGrid.innerHTML = '<div class="loading" style="color: #ef4444;">Error cargando datos de propulsores.</div>';
      }
    }
  }
  

// Renderizar tarjetas
function renderBoosters() {
  boostersGrid.innerHTML = "";
  if (filteredBoosters.length === 0) {
    boostersGrid.innerHTML = '<div class="loading">No se encontraron propulsores para este filtro.</div>';
    return;
  }
  filteredBoosters.forEach((booster) => boostersGrid.appendChild(createBoosterCard(booster)));
}

// Crear tarjeta de propulsor
function createBoosterCard(booster) {
  const card = document.createElement("div");
  card.className = "booster-card";
  card.addEventListener("click", () => openModal(booster));

  const statusClass = `status-${booster.status}`;
  const typeClass = `type-${booster.type.replace(/\s+/g, "-").toLowerCase()}`;
  const lastFlightText = booster.lastFlight ? `Último vuelo: ${formatDate(booster.lastFlight)}` : "Sin vuelos realizados";

  card.innerHTML = `
    <div class="booster-image">
      <img src="${booster.image}" alt="${booster.name}" 
           onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; background: linear-gradient(45deg, #f0f0f0, #e0e0e0); color: #6b7280;">
          ${booster.name}
      </div>
    </div>
    <div class="booster-content">
      <h3 class="booster-name">${booster.name}</h3>
      <span class="booster-status ${statusClass}">${booster.status}</span>
      <span class="booster-type ${typeClass}">${booster.type}</span>
      <p class="booster-flights">Vuelos realizados: ${booster.flights}</p>
      <p class="booster-first-flight">${lastFlightText}</p>
    </div>
  `;
  return card;
}

// Filtros
function setActiveFilter(filter) {
  filterButtons.forEach(btn => btn.classList.remove("active"));
  document.querySelector(`[data-filter="${filter}"]`).classList.add("active");
  currentFilter = filter;
}

function filterBoosters(filter) {
  filteredBoosters = filter === "all" ? [...boostersData] : boostersData.filter(b => b.status === filter);
  renderBoosters();
}

// Modal
function openModal(booster) {
  let flightHistoryHTML = "";
  if (booster.missions.length > 0) {
    flightHistoryHTML = `
      <div class="flight-history">
        <h3>Historial de Vuelos</h3>
        <table class="flight-details-table">
          <thead>
            <tr>
              <th>Vuelo #</th>
              <th>Misión</th>
              <th>Fecha</th>
              <th>Enlace</th>
            </tr>
          </thead>
          <tbody>
            ${booster.missions.map(mission => `
              <tr>
                <td><strong>${mission.flightNumber}</strong></td>
                <td>${mission.name}</td>
                <td>${formatDate(mission.date)}</td>
                <td>${mission.url ? `<a href="${mission.url}" target="_blank" class="btn btn-secondary" style="font-size: 0.875rem;">Ver misión</a>` : "N/A"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  } else {
    flightHistoryHTML = `<p style="text-align:center; padding:2rem;">Este propulsor aún no ha realizado vuelos.</p>`;
  }

  modalBody.innerHTML = `
    <div class="modal-header">
      <img src="${booster.image}" alt="${booster.name}" class="modal-image" onerror="this.style.display='none';">
      <h2 class="modal-title">${booster.name}</h2>
      <span class="booster-status status-${booster.status}">${booster.status}</span>
      <span class="booster-type type-${booster.type.replace(/\s+/g, "-").toLowerCase()}">${booster.type}</span>
    </div>
    <div style="display: flex; gap:1rem; margin-bottom:1rem;">
      <div style="flex:1; text-align:center; padding:1rem; background: rgba(255, 255, 255, 0.1); border-radius:8px;">
        <div style="font-size:2rem; font-weight:bold; color: var(--accent-primary);">${booster.flights}</div>
        <div style="color: var(--text-muted);">Vuelos Totales</div>
      </div>
      <div style="flex:1; text-align:center; padding:1rem; background: rgba(255, 255, 255, 0.1); border-radius:8px;">
        <div style="font-size:1.2rem; font-weight:bold; color: var(--accent-primary);">
          ${booster.firstFlight ? formatDate(booster.firstFlight) : "N/A"}
        </div>
        <div style="color: var(--text-muted);">Primer Vuelo</div>
      </div>
      <div style="flex:1; text-align:center; padding:1rem; background: rgba(255, 255, 255, 0.1); border-radius:8px;">
        <div style="font-size:1.2rem; font-weight:bold; color: var(--accent-primary);">
          ${booster.lastFlight ? formatDate(booster.lastFlight) : "N/A"}
        </div>
        <div style="color: var(--text-muted);">Último Vuelo</div>
      </div>
    </div>
    ${flightHistoryHTML}
  `;
  modal.style.display = "block";
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.style.display = "none";
  document.body.style.overflow = "auto";
}

// Event listeners
function setupEventListeners() {
  filterButtons.forEach(button => {
    button.addEventListener("click", function () {
      const filter = this.dataset.filter;
      setActiveFilter(filter);
      filterBoosters(filter);
    });
  });
  modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  // Buscador
  const searchInput = document.getElementById("search-input");
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const boosters = document.querySelectorAll(".booster-card");
    boosters.forEach(booster => {
      const name = booster.querySelector(".booster-name").textContent.toLowerCase();
      booster.style.display = name.includes(query) ? "block" : "none";
    });
  });
}

// Inicialización
document.addEventListener("DOMContentLoaded", async () => {
  boostersGrid.innerHTML = '<div class="loading">Cargando propulsores...</div>';
  await loadBoostersData();
  if (boostersData.length > 0) {
    renderBoosters();
    setupEventListeners();
  }
});
