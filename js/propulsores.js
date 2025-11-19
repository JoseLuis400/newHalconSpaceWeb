import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
        import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

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

        let boostersData = [];
        let currentFilter = "all";
        let filteredBoosters = [];

        const boostersGrid = document.getElementById("boosters-grid");
        const filterButtons = document.querySelectorAll(".filter-btn");
        const modal = document.getElementById("booster-modal");
        const modalBody = document.getElementById("modal-body");
        const modalClose = document.querySelector(".modal-close");
        const searchInput = document.getElementById("search-input");

        function formatDate(dateString) {
            if (!dateString) return "N/A";
            const [day, month, year] = dateString.split("/");
            const date = new Date(year, month - 1, day);
            return date.toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" });
        }

        function updateStats() {
            const totalBoosters = boostersData.length;
            const totalFlights = boostersData.reduce((sum, b) => sum + b.flights, 0);
            const activeBoosters = boostersData.filter(b => b.status === "activo").length;

            document.getElementById("total-boosters").textContent = totalBoosters;
            document.getElementById("total-flights").textContent = totalFlights;
            document.getElementById("active-boosters").textContent = activeBoosters;
        }

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

                boostersData.sort((a, b) => b.name.localeCompare(a.name));
                filteredBoosters = [...boostersData];
                updateStats();
                renderBoosters();
            });
        }

        function renderBoosters() {
            boostersGrid.innerHTML = "";
            if (filteredBoosters.length === 0) {
                boostersGrid.innerHTML = '<div class="loading">No se encontraron propulsores</div>';
                return;
            }
            filteredBoosters.forEach(booster => boostersGrid.appendChild(createBoosterCard(booster)));
        }

        function createBoosterCard(booster) {
            const card = document.createElement("div");
            card.className = "booster-card";
            card.addEventListener("click", () => openModal(booster));

            const statusClass = `status-${booster.status}`;

            card.innerHTML = `
                <div class="booster-image">
                    <img src="${booster.image}" alt="${booster.name}" 
                         onerror="this.style.display='none';">
                </div>
                <div class="booster-content">
                    <div class="booster-header">
                        <h3 class="booster-name">${booster.name}</h3>
                        <div class="booster-flight-number">${booster.flights}</div>
                    </div>
                    <div class="booster-badges">
                        <span class="badge ${statusClass}">${booster.status}</span>
                        <span class="badge type-badge">${booster.type}</span>
                    </div>
                    <div class="booster-stats">
                        
                    </div>
                    <div class="booster-dates">
                        ${booster.firstFlight ? `<div class="booster-date">Primero: ${formatDate(booster.firstFlight)}</div>` : ''}
                        ${booster.lastFlight ? `<div class="booster-date">Último: ${formatDate(booster.lastFlight)}</div>` : ''}
                    </div>
                </div>
            `;
            return card;
        }

        function filterBoosters(filter) {
            filteredBoosters = filter === "all" ? [...boostersData] : boostersData.filter(b => b.status === filter);
            const query = searchInput.value.toLowerCase();
            if (query) {
                filteredBoosters = filteredBoosters.filter(b => 
                    b.name.toLowerCase().includes(query) || 
                    b.type.toLowerCase().includes(query)
                );
            }
            renderBoosters();
        }

        function openModal(booster) {
            let flightHistoryHTML = "";
            if (booster.missions.length > 0) {
                const orderedMissions = [...booster.missions].sort((a, b) => {
                    const aStr = String(a.flightNumber);
                    const bStr = String(b.flightNumber);
                    const aParts = aStr.split(".");
                    const bParts = bStr.split(".");
                    const aMain = parseInt(aParts[0].replace(/\D/g, ""), 10) || 0;
                    const bMain = parseInt(bParts[0].replace(/\D/g, ""), 10) || 0;
                    if (aMain !== bMain) return aMain - bMain;
                    const aSub = parseInt(aParts[1], 10) || 0;
                    const bSub = parseInt(bParts[1], 10) || 0;
                    return aSub - bSub;
                });

                flightHistoryHTML = `
                    <div class="flight-history">
                        <h3 class="section-title">Historial de Vuelos</h3>
                        <table class="flight-table">
                            <thead>
                                <tr>
                                    <th>Vuelo</th>
                                    <th>Misión</th>
                                    <th>Fecha</th>
                                    <th>Enlace</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${orderedMissions.map(mission => `
                                    <tr>
                                        <td class="flight-number" data-label="Vuelo">${mission.flightNumber}</td>
                                        <td data-label="Misión">${mission.name}</td>
                                        <td data-label="Fecha">${formatDate(mission.date)}</td>
                                        <td data-label="Enlace">${mission.url ? `<a href="${mission.url}" target="_blank" class="flight-link">Ver misión →</a>` : "—"}</td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                `;
            } else {
                flightHistoryHTML = `<div class="no-flights">Este propulsor aún no ha realizado vuelos.</div>`;
            }

            const statusClass = `status-${booster.status}`;

            modalBody.innerHTML = `
                <div class="modal-header-section">
                    <div class="modal-image-container">
                        <img src="${booster.image}" alt="${booster.name}" class="modal-image" onerror="this.style.display='none';">
                    </div>
                    <div class="modal-info">
                        <h2 class="modal-title">${booster.name}</h2>
                        <div class="modal-badges">
                            <span class="badge ${statusClass}">${booster.status}</span>
                            <span class="badge type-badge">${booster.type}</span>
                        </div>
                        <div class="modal-stats-grid">
                            <div class="modal-stat-card">
                                <div class="modal-stat-number">${booster.flights}</div>
                                <div class="modal-stat-label">Vuelos</div>
                            </div>
                            <div class="modal-stat-card">
                                <div class="modal-stat-date">${booster.firstFlight ? formatDate(booster.firstFlight) : "—"}</div>
                                <div class="modal-stat-label">Primer Vuelo</div>
                            </div>
                            <div class="modal-stat-card">
                                <div class="modal-stat-date">${booster.lastFlight ? formatDate(booster.lastFlight) : "—"}</div>
                                <div class="modal-stat-label">Último Vuelo</div>
                            </div>
                        </div>
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
        filterButtons.forEach(button => {
            button.addEventListener("click", function() {
                filterButtons.forEach(btn => btn.classList.remove("active"));
                this.classList.add("active");
                currentFilter = this.dataset.filter;
                filterBoosters(currentFilter);
            });
        });

        searchInput.addEventListener("input", () => {
            filterBoosters(currentFilter);
        });

        modalClose.addEventListener("click", closeModal);
        modal.addEventListener("click", (e) => { 
            if (e.target === modal) closeModal(); 
        });
        document.addEventListener("keydown", (e) => { 
            if (e.key === "Escape") closeModal(); 
        });

        // Inicialización
        loadBoostersData();