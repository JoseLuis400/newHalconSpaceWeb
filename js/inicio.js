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

  // Ordenar: futuros primero, luego pasados
  lanzamientos.sort((a, b) => parseFecha(b.fecha) - parseFecha(a.fecha));

  const ultimos = lanzamientos.slice(0, 3);

  ultimos.forEach(l => {
    const card = document.createElement("div");
    card.className = "card-lanzamiento";
    card.setAttribute("data-estado", (l.estado ?? "desconocido").toLowerCase());
    card.setAttribute("data-fecha", l.fecha);
    card.setAttribute("data-timeutc", l.timeUTC || "00:00:00");
    card.setAttribute("data-contador", l.contador ? "true" : "false");

    card.innerHTML = `
      <div class="img-wrapper">
        <img src="${normalizeURL(l.imagen)}" alt="${l.alt ?? ""}">
        <span class="estado ${(l.estado ?? "desconocido").toLowerCase()}">${(l.estado ?? "Desconocido").toUpperCase()}</span>
        ${l.contador ? `<span class="contador">${calcularContador(l.fecha, l.timeUTC)}</span>` : ""}
      </div>
      <div class="info">
        <h3>${l.nombre}</h3>
        <p><strong>Fecha:</strong> ${l.fecha}</p>
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
    const isPaused = (estado === "hold" || estado === "scrub");

    const fecha = card.dataset.fecha;
    const time = card.dataset.timeutc || "00:00:00";
    let now = isPaused ? new Date(Number(span.dataset.freezeTime || Date.now())) : null;

    if (isPaused && !span.dataset.freezeTime) span.dataset.freezeTime = Date.now();
    if (!isPaused) delete span.dataset.freezeTime;

    const nuevoValor = calcularContador(fecha, time, now);
    if (!span.dataset.lastText) span.dataset.lastText = nuevoValor;

    const lastChars = span.dataset.lastText.split("");
    const newChars = nuevoValor.split("");

    span.innerHTML = '';
    newChars.forEach((c, i) => {
      const wrapper = document.createElement("span");
      wrapper.classList.add("digit-wrapper");
      const digit = document.createElement("span");
      digit.classList.add("digit");
      digit.textContent = c;

      if (lastChars[i] !== c) {
        digit.style.transform = 'translateY(-100%)';
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
      