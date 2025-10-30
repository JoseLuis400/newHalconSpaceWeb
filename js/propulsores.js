import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// ===== Config Firebase =====
const firebaseConfig = {
  apiKey: "AIzaSyAiLw2zwfsjdMP-IlEoE5JugyFvmaQLFC0",
  authDomain: "halcon-space-348e7.firebaseapp.com",
  projectId: "halcon-space-348e7",
  storageBucket: "halcon-space-348e7.firebasestorage.app",
  messagingSenderId: "741724706453",
  appId: "1:741724706453:web:519531e63f2b923f952d9c",
  measurementId: "G-VG1Y2YMY4W"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== Variables =====
let boostersData = [];
let currentFilter = "all";
let filteredBoosters = [];

// ===== Elementos DOM =====
const boostersGrid = document.getElementById("boosters-grid");
const filterButtons = document.querySelectorAll(".filter-btn");
const modal = document.getElementById("booster-modal");
const modalBody = document.getElementById("modal-body");
const modalClose = document.querySelector(".modal-close");

// ===== Función para formatear fechas =====
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const [day, month, year] = dateString.split("/");
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
}

// ===== Cargar datos desde Firebase =====
function loadBoostersData() {
  const boostersCol = collection(db, "propulsores");

  onSnapshot(boostersCol, snapshot => {
    boostersData = snapshot.docs.map(doc => {
      const data = doc.data();
      const missions = Object.entries(data.vuelos || {}).map(([id, v]) => ({
        flightNumber: id,
        name: v.mision,
        date: v.fecha,
        url: v.url || "",
        programado: v.programado || false
      }));

      const completedMissions = missions.filter(m => !m.programado);

// Ordenar por fecha para obtener primer y último vuelo correctamente
const sortedByDate = [...completedMissions].sort((a, b) => {
  if (!a.date || !b.date) return 0;
  const [dayA, monthA, yearA] = a.date.split("/");
  const [dayB, monthB, yearB] = b.date.split("/");
  const dateA = new Date(yearA, monthA - 1, dayA);
  const dateB = new Date(yearB, monthB - 1, dayB);
  return dateA - dateB;
});

return {
  name: doc.id,
  type: data.tipo,
  status: data.estado,
  flights: completedMissions.length,
  missions,
  image: data.img,
  firstFlight: sortedByDate[0]?.date || null,
  lastFlight: sortedByDate[sortedByDate.length - 1]?.date || null
};
    });

    // Orden inverso por ID (B1076 → B1054)
    boostersData.sort((a, b) => b.name.localeCompare(a.name));

    filteredBoosters = [...boostersData];
    renderBoosters();
  }, err => console.error("[Firebase] Error cargando propulsores:", err));
}

// ===== Renderizar tarjetas =====
function renderBoosters() {
  boostersGrid.innerHTML = "";
  if (filteredBoosters.length === 0) {
    boostersGrid.innerHTML = '<div class="loading">No se encontraron propulsores para este filtro.</div>';
    return;
  }
  filteredBoosters.forEach(booster => boostersGrid.appendChild(createBoosterCard(booster)));
}

// ===== Crear tarjeta de propulsor =====
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

// ===== Filtros =====
function setActiveFilter(filter) {
  filterButtons.forEach(btn => btn.classList.remove("active"));
  document.querySelector(`[data-filter="${filter}"]`).classList.add("active");
  currentFilter = filter;
}

function filterBoosters(filter) {
  filteredBoosters = filter === "all" ? [...boostersData] : boostersData.filter(b => b.status === filter);
  renderBoosters();
}

// ===== Modal con vuelos ordenados =====
function openModal(booster) {
  let flightHistoryHTML = "";
  if (booster.missions.length > 0) {
    // Ordenar vuelos por flightNumber ascendente (B10xx.1 → B10xx.2)
const orderedMissions = [...booster.missions].sort((a, b) => {
  const aStr = String(a.flightNumber); // forzar string
  const bStr = String(b.flightNumber);

  const aParts = aStr.split(".");
  const bParts = bStr.split(".");

  // Extraer parte numérica principal
  const aMain = parseInt(aParts[0].replace(/\D/g, ""), 10) || 0;
  const bMain = parseInt(bParts[0].replace(/\D/g, ""), 10) || 0;

  if (aMain !== bMain) return aMain - bMain;

  // Extraer subparte (después del punto) si existe
  const aSub = parseInt(aParts[1], 10) || 0;
  const bSub = parseInt(bParts[1], 10) || 0;

  return aSub - bSub;
});


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
            ${orderedMissions.map(mission => `
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

// ===== Cerrar modal =====
function closeModal() {
  modal.style.display = "none";
  document.body.style.overflow = "auto";
}

// ===== Event listeners =====
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
    filteredBoosters = boostersData.filter(b => b.name.toLowerCase().includes(query) || b.type.toLowerCase().includes(query));
    if (currentFilter !== "all") filteredBoosters = filteredBoosters.filter(b => b.status === currentFilter);
    renderBoosters();
  });
}

// ===== Inicialización =====
document.addEventListener("DOMContentLoaded", () => {
  boostersGrid.innerHTML = '<div class="loading">Cargando propulsores...</div>';
  loadBoostersData();
  setupEventListeners();
});
