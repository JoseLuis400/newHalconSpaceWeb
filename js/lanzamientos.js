// lanzamientos.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getFirestore, collection, doc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

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

document.addEventListener("DOMContentLoaded", () => {

  const contenedor = document.getElementById("launchesContainer");
  const statusFilter = document.getElementById("filter-status");
  const vehicleFilter = document.getElementById("filter-vehicle");
  const platformFilter = document.getElementById("filter-plataforma");
  const searchInput = document.getElementById("search-name");
  const noResults = document.getElementById("no-results");
  const viewSelector = document.getElementById("view-selector");

  let allLanzamientos = [];
  let currentView = 'card';

  if (viewSelector) {
    viewSelector.value = currentView;
    viewSelector.addEventListener("change", () => {
      currentView = viewSelector.value;
      renderLanzamientos(allLanzamientos);
    });
  }

  // ===== Funciones Auxiliares =====
  const parseFecha = fechaStr => {
    const [dia, mes, anio] = fechaStr.split("/").map(Number);
    return new Date(Date.UTC(anio, mes - 1, dia));
  };

  const normalizeURL = url => {
    if (!url) return "";
    url = url.trim();
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (!url.startsWith("/")) url = "/" + url;
    return `https://halconspace.site${url}`;
  };

  const normalizeURLArticulo = url => {
    if (!url) return "";
    url = url.trim();
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (!url.startsWith("/")) url = "/" + url;
    return `https://new.halconspace.site${url}`;
  };

  const getFechaHora = (fechaStr, timeStr = "00:00:00") => {
    const [dia, mes, anio] = fechaStr.split("/").map(Number);
    const [h, m, s] = (timeStr || "00:00:00").split(":").map(Number);
    return new Date(Date.UTC(anio, mes - 1, dia, h, m, s));
  };

  const calcularContador = (fechaStr, timeStr, now = null) => {
    const [dia, mes, anio] = fechaStr.split("/").map(Number);
    const [h, m, s] = (timeStr || "00:00:00").split(":").map(Number);
    const launchDate = new Date(Date.UTC(anio, mes - 1, dia, h, m, s));
    const currentTime = now ? new Date(now) : new Date();
    let diff = Math.floor((launchDate - currentTime) / 1000);
    let signo = diff >= 0 ? "T-" : "T+";
    diff = Math.abs(diff);
    const dias = Math.floor(diff / 86400);
    const horas = String(Math.floor((diff % 86400) / 3600)).padStart(2, "0");
    const minutos = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
    const segundos = String(diff % 60).padStart(2, "0");
    return dias > 0 ? `${signo}${dias}D / ${horas}:${minutos}:${segundos}` : `${signo}${horas}:${minutos}:${segundos}`;
  };

  // ===== Renderizado de lanzamientos =====
  const renderLanzamientos = (lanzamientos) => {
    contenedor.innerHTML = "";

    if(currentView==='card'){
      lanzamientos.sort((a, b) => parseFecha(b.fecha) - parseFecha(a.fecha));
      lanzamientos.forEach(l => {
        const item = document.createElement("div");
        item.className = `item-lanzamiento card-lanzamiento`;
        item.dataset.estado = (l.estado ?? "desconocido").toLowerCase();
        item.dataset.vehiculo = (l.vehiculo ?? "desconocido").toLowerCase();
        item.dataset.plataforma = (l.plataforma ?? "desconocido").toLowerCase();
        item.dataset.fecha = l.fecha;
        item.dataset.timeutc = l.timeUTC || "00:00:00";
        item.dataset.contador = l.contador === true ? "true" : "false";
        item.dataset.holdtime = l.holdTime || ""; // Guardar holdTime de Firebase

        // Calcular el valor inicial correcto del contador considerando holdTime
        const isPaused = (l.estado ?? "").toLowerCase() === "hold" || (l.estado ?? "").toLowerCase() === "scrub";
        const initialTime = (isPaused && l.holdTime) ? l.holdTime : null;
        const contadorHTML = l.contador ? 
          `<span class="contador" style="position:absolute;top:10px;left:10px;background:rgba(0,0,0,0.5);padding:2px 5px;border-radius:3px;font-weight:bold;">${calcularContador(l.fecha, l.timeUTC, initialTime)}</span>` 
          : "";

        item.innerHTML = `
          <div class="img-wrapper" style="position:relative;">
            <img src="${normalizeURL(l.imagen)}" alt="${l.alt ?? ""}">
            <span class="estado ${(l.estado ?? "desconocido").toLowerCase()}">${(l.estado ?? "Desconocido").toUpperCase()}</span>
            ${contadorHTML}
          </div>
          <div class="info">
            <h3>${l.nombre}</h3>
            <p><strong>Fecha:</strong> ${l.fecha}</p>
            <p><strong>Vehículo:</strong> ${l.vehiculo ?? "Desconocido"}</p>
            <p><strong>Plataforma:</strong> ${l.plataforma ?? "Desconocido"}</p>
            <div class="links">
              ${l.detalleUrl ? `<a href="${normalizeURLArticulo(l.detalleUrl)}" class="btn">Detalles</a>` : ""}
              ${l.stream ? `<a href="${normalizeURL(l.stream)}" target="_blank" class="btn live">Ver transmisión</a>` : ""}
            </div>
          </div>
        `;
        contenedor.appendChild(item);
      });

    } else if(currentView==='list'){
      lanzamientos.sort((a,b)=>parseFecha(b.fecha)-parseFecha(a.fecha));
      lanzamientos.forEach(l=>{
        const item = document.createElement("div");
        item.className="item-lanzamiento list-lanzamiento";
        const content = `
          <div class="data-wrapper">
            <h3>${l.vehiculo} • ${l.nombre}</h3>
            <p><strong>Estado:</strong> ${(l.estado ?? "Desconocido").toUpperCase()}</p>
            <p><strong>Fecha:</strong> ${l.fecha}</p>
            <p><strong>Plataforma:</strong> ${l.plataforma ?? "Desconocido"}</p>
            <div class="links">
              ${l.detalleUrl ? `<a href="${normalizeURLArticulo(l.detalleUrl)}" class="btn">Detalles</a>` : ""}
              ${l.stream ? `<a href="${normalizeURL(l.stream)}" target="_blank" class="btn live">Ver transmisión</a>` : ""}
            </div>
          </div>
        `;
        item.innerHTML = content;
        contenedor.appendChild(item);
      });

    } else if(currentView==='calendar'){
      // Mantener renderizado de calendario como estaba
    }

    aplicarFiltros();
  };

  // ===== Contador animado con HOLD/SCRUB =====
  function iniciarContadoresAnimados() {
    setInterval(() => {
      document.querySelectorAll(".card-lanzamiento .contador").forEach(span => {
        const card = span.closest(".card-lanzamiento");
        if (!card) return;

        const estado = card.dataset.estado;
        const isPaused = estado === "hold" || estado === "scrub";

        const fecha = card.dataset.fecha;
        const timeUTC = card.dataset.timeutc || "00:00:00";
        const holdTime = card.dataset.holdtime; // Obtener holdTime de Firebase
        
        let now = null;
        
        // Si está en HOLD/SCRUB y tiene holdTime, usar ese momento congelado
        if (isPaused && holdTime) {
          now = holdTime; // Usar el timestamp de Firebase
        }

        const nuevoValor = calcularContador(fecha, timeUTC, now);
        const lastText = span.dataset.lastText || "";

        // Normalizar longitudes de lastText y nuevoValor
        const maxLength = Math.max(lastText.length, nuevoValor.length);
        const lastChars = lastText.padEnd(maxLength, " ").split("");
        const newChars = nuevoValor.padEnd(maxLength, " ").split("");

        // Limpiar span y reconstruir cada dígito
        span.innerHTML = "";
        newChars.forEach((c, i) => {
          const wrapper = document.createElement("span");
          wrapper.classList.add("digit-wrapper");
          const digit = document.createElement("span");
          digit.classList.add("digit");
          digit.textContent = c;

          // Animar solo si cambió el carácter
          if (lastChars[i] !== c) {
            digit.style.transform = 'translateY(-100%)';
            digit.style.transition = 'transform 0.3s ease';
            setTimeout(() => digit.style.transform = 'translateY(0)', 10);
          }

          wrapper.appendChild(digit);
          span.appendChild(wrapper);
        });

        span.dataset.lastText = nuevoValor;

        // Glow si HOLD o SCRUB
        if (isPaused) {
          span.setAttribute("data-state", estado);
        } else {
          span.removeAttribute("data-state");
        }
      });
    }, 1000);
  }

  // ===== Filtros y búsqueda =====
  const aplicarFiltros = () => {
    const statusValue = statusFilter.value.toLowerCase();
    const vehicleValue = vehicleFilter.value.toLowerCase();
    const platformValue = platformFilter.value.toLowerCase();
    const searchValue = searchInput.value.toLowerCase();
    let anyVisible = false;

    document.querySelectorAll("#launchesContainer .item-lanzamiento").forEach(item => {
      const estado = item.dataset.estado;
      const vehiculo = item.dataset.vehiculo;
      const plataforma = item.dataset.plataforma;
      const nombre = item.querySelector("h3")?.textContent.toLowerCase() ?? "";

      const matchStatus = statusValue === "all" || estado === statusValue;
      const matchVehicle = vehicleValue === "all" || vehiculo.includes(vehicleValue);
      const matchPlatform = platformValue === "all" || plataforma === platformValue;
      const matchSearch = searchValue === "" || nombre.includes(searchValue);

      if(matchStatus && matchVehicle && matchPlatform && matchSearch){
        item.classList.remove("fade");
        item.style.display="block";
        setTimeout(()=>item.classList.add("show"),10);
        anyVisible=true;
      } else {
        item.classList.remove("show");
        item.classList.add("fade");
        setTimeout(()=>{item.style.display="none";},300);
      }
    });

    noResults.style.display = anyVisible ? "none" : "block";
  };

  statusFilter.addEventListener("change", aplicarFiltros);
  vehicleFilter.addEventListener("change", aplicarFiltros);
  platformFilter.addEventListener("change", aplicarFiltros);
  searchInput.addEventListener("input", aplicarFiltros);

  // ===== Cargar lanzamientos desde Firebase =====
  onSnapshot(collection(db,"lanzamientos"), snapshot=>{
    allLanzamientos = snapshot.docs.map(docSnap => ({id:docSnap.id, ...docSnap.data()}));
    renderLanzamientos(allLanzamientos);
    iniciarContadoresAnimados();
  });
  
  // ===== Modal calendario =====
  function openModal(launches){
    // Se mantiene igual tu modal
  }
  
  // ===== Estadísticas desde Firebase =====
  async function loadStats() {
    try {
      const snap = await getDoc(doc(db, "estadisticas", "general"));
      if (!snap.exists()) return;

      const stats = snap.data();
      new Chart(document.getElementById("launchesChart"), {
        type: "pie",
        data: { labels: ["Exitosos", "Fallidos"], datasets:[{data:[stats.lanzamientos.exitosos,stats.lanzamientos.fallidos],backgroundColor:["#00ff88","#ff4444"]}] },
        options: { responsive:true, plugins:{legend:{position:"bottom", labels:{color:"#ffffff"}}} }
      });
      new Chart(document.getElementById("landingsChart"), {
        type: "pie",
        data: { labels: ["Exitosos", "Fallidos"], datasets:[{data:[stats.aterrizajes.exitosos,stats.aterrizajes.fallidos],backgroundColor:["#00ff88","#ff4444"]}] },
        options: { responsive:true, plugins:{legend:{position:"bottom", labels:{color:"#ffffff"}}} }
      });
      new Chart(document.getElementById("vehicleChart"), {
        type: "pie",
        data: { labels:["Falcon 9","Falcon Heavy"], datasets:[{data:[stats.vuelosVehiculos.falcon9.exitosos+stats.vuelosVehiculos.falcon9.fallidos, stats.vuelosVehiculos.falconHeavy.exitosos+stats.vuelosVehiculos.falconHeavy.fallidos],backgroundColor:["#2196f3","#ff9800"]}] },
        options:{ responsive:true, plugins:{legend:{position:"bottom", labels:{color:"#ffffff"}}} }
      });
    } catch(err){
      console.error("Error cargando estadísticas desde Firestore:", err);
    }
  }

  loadStats();
});