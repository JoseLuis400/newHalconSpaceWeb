// inicio.js
// Cargar como <script type="module" src="inicio.js"></script>

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// ===== Configuración Firebase =====
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

// ===== Funciones auxiliares =====
function parseFecha(fechaStr) {
  const [dia, mes, anio] = fechaStr.split("/").map(Number);
  return new Date(anio, mes - 1, dia);
}

function normalizeURL(url) {
  if (!url) return "";
  url = url.trim();
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (!url.startsWith("/")) url = "/" + url;
  return `https://new.halconspace.site${url}`;
}

const getFechaHora = (lanzamiento) => {
  // Priorizar utcTime (formato ISO completo) si existe
  if (lanzamiento.utcTime) {
    return new Date(lanzamiento.utcTime);
  }
  // Fallback: construir desde fecha + timeUTC
  const fechaStr = lanzamiento.fecha;
  const timeStr = lanzamiento.timeUTC || "00:00:00";
  
  if (!fechaStr) return new Date(0);
  const partes = fechaStr.split("/");
  if (partes.length !== 3) return new Date(0);
  const [dia, mes, anio] = partes.map(Number);
  if (isNaN(dia) || isNaN(mes) || isNaN(anio)) return new Date(0);
  
  const [h, m, s] = timeStr.split(":").map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia, h || 0, m || 0, s || 0));
};

const formatearFechaHora = (lanzamiento) => {
  const mesesAbrev = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const fechaHora = getFechaHora(lanzamiento);
  
  const dia = fechaHora.getUTCDate();
  const mes = mesesAbrev[fechaHora.getUTCMonth()];
  const anio = fechaHora.getUTCFullYear();
  const horas = String(fechaHora.getUTCHours()).padStart(2, "0");
  const minutos = String(fechaHora.getUTCMinutes()).padStart(2, "0");
  
  return `${dia} ${mes} ${anio} - ${horas}:${minutos} UTC`;
};

const formatearFechaPorTipo = (lanzamiento) => {
  const fechaHora = getFechaHora(lanzamiento);
  const dia = fechaHora.getUTCDate();
  const mes = fechaHora.getUTCMonth();
  const anio = fechaHora.getUTCFullYear();
  const mesesLargos = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const mesesAbrev = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const horas = String(fechaHora.getUTCHours()).padStart(2, "0");
  const minutos = String(fechaHora.getUTCMinutes()).padStart(2, "0");

  const typeDate = lanzamiento.typeDate; // No le pongas valor por defecto aquí

  if(typeDate === "year_long") {
    return `NET ${anio}`;
  } else if (typeDate === "month_long") {
    return `NET ${mesesLargos[mes]} ${anio}`;
  } else if (typeDate === "day_long") {
    return `NET ${dia} ${mesesLargos[mes]} ${anio}`;
  } else {
    // Si no existe typeDate o tiene otro valor, usa el formato normal
    return `${dia} ${mesesAbrev[mes]} ${anio} - ${horas}:${minutos} UTC`;
  }
};

// ===== Contador dinámico =====
function calcularContador(fechaStr, timeStr, now = null) {
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
}

// ===== Renderizado de lanzamientos =====
function renderLanzamientos(lanzamientos) {
  const contenedor = document.getElementById("lanzamientos");
  contenedor.innerHTML = "";

  // Ordenar por fecha Y hora: más reciente primero
  lanzamientos.sort((a, b) => {
    const fechaHoraA = getFechaHora(a);
    const fechaHoraB = getFechaHora(b);
    return fechaHoraB - fechaHoraA;
  });

  const ahora = new Date();
  
  // Separar lanzamientos futuros y pasados
  const futuros = lanzamientos.filter(l => getFechaHora(l) > ahora);
  const pasados = lanzamientos.filter(l => getFechaHora(l) <= ahora);

  // Ordenar futuros ascendente (el más cercano primero) y pasados descendente (el más reciente primero)
  futuros.sort((a, b) => getFechaHora(a) - getFechaHora(b));
  pasados.sort((a, b) => getFechaHora(b) - getFechaHora(a));

  // Seleccionar: máximo 1 futuro + 2 pasados
  const seleccionados = [];
  
  if (futuros.length > 0) {
    seleccionados.push(futuros[0]); // 1 próximo lanzamiento
  }
  
  const pasadosAMostrar = seleccionados.length === 1 ? 2 : 3;
  seleccionados.push(...pasados.slice(0, pasadosAMostrar));

  seleccionados.forEach(l => {
    const card = document.createElement("div");
    card.className = "card-lanzamiento";
    card.setAttribute("data-estado", (l.estado ?? "desconocido").toLowerCase());
    card.setAttribute("data-fecha", l.fecha);
    card.setAttribute("data-timeutc", l.timeUTC || "00:00:00");
    card.setAttribute("data-contador", l.contador ? "true" : "false");
    card.setAttribute("data-holdtime", l.holdTime || "");

    const isPaused = (l.estado ?? "").toLowerCase() === "hold" || (l.estado ?? "").toLowerCase() === "scrub";
    const initialTime = (isPaused && l.holdTime) ? l.holdTime : null;

    card.innerHTML = `
      <div class="img-wrapper">
        <img src="${normalizeURL(l.imagen)}" alt="${l.alt ?? ""}">
        <span class="estado ${(l.estado ?? "desconocido").toLowerCase()}">${(l.estado ?? "Desconocido").toUpperCase()}</span>
        ${l.contador ? `<span class="contador">${calcularContador(l.fecha, l.timeUTC, initialTime)}</span>` : ""}
      </div>
      <div class="info">
        <h3>${l.nombre}</h3>
        <p><strong>Fecha:</strong> ${formatearFechaPorTipo(l)}</p>
        <p><strong>Vehículo:</strong> ${l.vehiculo}</p>
        <p><strong>Plataforma:</strong> ${l.plataforma ?? "Desconocido"}</p>
        <div class="links">
          ${l.detalleUrl ? `<a href="${l.detalleUrl}" class="btn">Detalles</a>` : ""}
          ${l.stream ? `<a href="${l.stream}" target="_blank" class="btn live">Ver transmisión</a>` : ""}
        </div>
      </div>
    `;

    contenedor.appendChild(card);
  });
}

// ===== Obtener lanzamientos desde Firebase =====
const lanzamientosCol = collection(db, "lanzamientos");
onSnapshot(lanzamientosCol, snapshot => {
  const lanzamientos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderLanzamientos(lanzamientos);
});

// ===== Actualizar contadores dinámicos =====
setInterval(() => {
  document.querySelectorAll(".card-lanzamiento .contador").forEach(span => {
    const card = span.closest(".card-lanzamiento");
    const estado = card.getAttribute("data-estado");
    const isPaused = estado === "hold" || estado === "scrub";

    const fecha = card.dataset.fecha;
    const time = card.dataset.timeutc || "00:00:00";
    const holdTime = card.dataset.holdtime; // Obtener holdTime de Firebase
    
    let now = null;
    
    // Si está en HOLD/SCRUB y tiene holdTime, usar ese momento congelado
    if (isPaused && holdTime) {
      now = holdTime; // Usar el timestamp de Firebase
    }

    const nuevoValor = calcularContador(fecha, time, now);
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

// ===== Estadísticas desde Firebase =====
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

async function loadStats() {
  try {
    const ref = doc(db, "estadisticas", "general");
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      console.error("No hay estadísticas en Firestore");
      return;
    }

    const data = snap.data();

    const opcionesBase = (titulo) => ({
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#fff' }
        },
        title: {
          display: true,
          text: titulo,
          color: '#fff',
          font: { size: 16 }
        }
      }
    });

    // Lanzamientos
    new Chart(document.getElementById("lanzamientosChart"), {
      type: 'pie',
      data: {
        labels: ['Exitosos', 'Fallidos'],
        datasets: [{
          data: [data.lanzamientos.exitosos, data.lanzamientos.fallidos],
          backgroundColor: ['#178236', '#A50C36']
        }]
      },
      options: opcionesBase("Lanzamientos")
    });

    // Aterrizajes
    new Chart(document.getElementById("aterrizajesChart"), {
      type: 'pie',
      data: {
        labels: ['Exitosos', 'Fallidos'],
        datasets: [{
          data: [data.aterrizajes.exitosos, data.aterrizajes.fallidos],
          backgroundColor: ['#178236', '#A50C36']
        }]
      },
      options: opcionesBase("Aterrizajes")
    });

    // Vuelos por vehículo
    const vuelosF9 = data.vuelosVehiculos.falcon9.exitosos + data.vuelosVehiculos.falcon9.fallidos;
    const vuelosFH = data.vuelosVehiculos.falconHeavy.exitosos + data.vuelosVehiculos.falconHeavy.fallidos;

    new Chart(document.getElementById("vuelosChart"), {
      type: 'pie',
      data: {
        labels: ['Falcon 9', 'Falcon Heavy'],
        datasets: [{
          data: [vuelosF9, vuelosFH],
          backgroundColor: ['#193CB8', '#1e1a4d']
        }]
      },
      options: opcionesBase("Vuelos por Vehículo")
    });

  } catch(err) {
    console.error("Error cargando estadísticas desde Firebase:", err);
  }
}

// Llamar a la función
loadStats();

      
      //// GALERIA DE FOTOS

      document.addEventListener("DOMContentLoaded", () => {
        const images = [
          { src: "https://halconspace.site/img/fotos/Falcon%209%20en%20SLC-40.jpg", alt: "Falcon 9 en SLC-40" },
          { src: "https://halconspace.site/img/misiones/Crew%20Demo%202/Crew%20Demo%202%20Sep%20etapas.jpg", alt: "Crew Demo 2" },
          { src: "https://halconspace.site/img/misiones/Crew%20Demo%202/Crew%20Demo%202%20launch.jpg", alt: "Crew Demo 2" },
          { src: "https://halconspace.site/img/misiones/Eyes%20above%20the%20Horizon%201/Falcon%209%20en%20vuelo.png", alt: "Eyes above the Horizon 1" },
          { src: "https://halconspace.site/img/misiones/USSF-101/Despegue.png", alt: "USSF-101" },
          { src: "https://halconspace.site/img/misiones/Eyes%20above%20the%20Horizon%201/Aterrizaje.png", alt: "Eyes above the Horizon 1" },
          { src: "https://halconspace.site/img/misiones/Crew%20Demo%202/Falcon%209%20Crew.jpg", alt: "Crew Demo 2" },
          { src: "https://halconspace.site/img/misiones/NROL-12/Landing.jpg", alt: "NROL-12" },
          { src: "https://halconspace.site/img/misiones/Eyes%20Above%20The%20Horizon%203/Thumbnail.png", alt: "Falcon Heavy" },
          { src: "https://halconspace.site/img/misiones/Eyes%20above%20the%20Horizon%202/Reentrada.png", alt: "Eyes above the Horizon 2" },
        ];
      
        let current = 0;
        const wrapper = document.getElementById("slides-wrapper");
        const prevBtn = document.getElementById("prev");
        const nextBtn = document.getElementById("next");
        const dotsContainer = document.getElementById("dots");
      
        // Crear las imágenes dentro del wrapper
        images.forEach(img => {
          const el = document.createElement("img");
          el.src = img.src;
          el.alt = img.alt;
          wrapper.appendChild(el);
        });
      
        const slides = wrapper.querySelectorAll("img");
        wrapper.style.width = `${images.length * 100}%`;
        slides.forEach(slide => slide.style.width = `${100 / images.length}%`);
      
        // Crear dots
        images.forEach((_, i) => {
          const dot = document.createElement("span");
          dot.className = "dot";
          dot.addEventListener("click", () => showSlide(i));
          dotsContainer.appendChild(dot);
        });
        const dots = document.querySelectorAll(".dot");
      
        function updateDots() {
          dots.forEach(d => d.classList.remove("active"));
          dots[current].classList.add("active");
        }
      
        function showSlide(index) {
          current = (index + images.length) % images.length;
          wrapper.style.transform = `translateX(-${current * (100 / images.length)}%)`;
          updateDots();
        }
      
        prevBtn.addEventListener("click", () => showSlide(current - 1));
        nextBtn.addEventListener("click", () => showSlide(current + 1));
      
        showSlide(0);
        setInterval(() => showSlide(current + 1), 5000);
      });