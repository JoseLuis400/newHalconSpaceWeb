import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getFirestore, collection, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// Config Firebase
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

let lanzamientosChart = null;

// ===== Funciones Auxiliares =====
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

// ===== Actualizar gráfico =====
function actualizarGrafico(exitosos, fallidos) {
  const ctx = document.getElementById("lanzamientosChart").getContext("2d");
  if (lanzamientosChart) {
    lanzamientosChart.data.datasets[0].data = [exitosos, fallidos];
    lanzamientosChart.update();
  } else {
    lanzamientosChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Exitosos', 'Fallidos'],
        datasets: [{ data: [exitosos, fallidos], backgroundColor: ['#178236','#A50C36'] }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#fff' } },
          title: { display: true, text: 'Lanzamientos', color: '#fff', font: { size: 16 } }
        }
      }
    });
  }
}

// ===== Estadísticas Falcon 9 =====
function cargarEstadisticas() {
  console.log("Cargando estadísticas desde Firebase...");
  const estadisticasDoc = doc(db, "estadisticas", "general");

  onSnapshot(estadisticasDoc, snapshot => {
    const data = snapshot.data();
    const falcon9Stats = data.vuelosVehiculos.falcon9;

    const exitosos = falcon9Stats.exitosos || 0;
    const fallidos = falcon9Stats.fallidos || 0;
    const total = exitosos + fallidos;

    console.log("Falcon 9 - Total:", total, "Exitosos:", exitosos, "Fallidos:", fallidos);

    document.getElementById("vuelosTotales").textContent = total;
    actualizarGrafico(exitosos, fallidos);
  });
}

// ===== Últimos 3 lanzamientos Falcon 9 =====
function cargarLanzamientos() {
  const lanzamientosCol = collection(db, "lanzamientos");

  onSnapshot(lanzamientosCol, snapshot => {
    const hoy = new Date();

    const vuelosFalcon9 = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data(), fechaObj: parseFecha(doc.data().fecha) }))
      .filter(v => v.vehiculo.toLowerCase().includes("falcon 9") && v.fechaObj <= hoy);

    vuelosFalcon9.sort((a,b) => b.fechaObj - a.fechaObj);

    const ultimos = vuelosFalcon9.slice(0,3);
    console.log("Últimos 3 vuelos Falcon 9:", ultimos);

    const contenedor = document.getElementById("lanzamientos");
    contenedor.innerHTML = "";

    ultimos.forEach(l => {
      const card = document.createElement("div");
      card.className = "card-lanzamiento";

      let imagenUrl = l.imagen ?? `https://halconspace.site/img/propulsores/${l.propulsor ?? l.id}.png`;

      card.innerHTML = `
        <div class="img-wrapper">
          <img src="${normalizeURL(imagenUrl)}" alt="${l.alt ?? l.nombre}">
          <span class="estado ${(l.estado ?? "desconocido").toLowerCase()}">${(l.estado ?? "Desconocido").toUpperCase()}</span>
        </div>
        <div class="info">
          <h3>${l.nombre ?? l.id}</h3>
          <p><strong>Fecha:</strong> ${l.fecha}</p>
          <p><strong>Vehículo:</strong> ${l.vehiculo}</p>
          <div class="links">
            ${l.detalleUrl ? `<a href="${l.detalleUrl}" class="btn">Detalles</a>` : ""}
            ${l.stream ? `<a href="${l.stream}" target="_blank" class="btn live">Ver transmisión</a>` : ""}
          </div>
        </div>
      `;

      contenedor.appendChild(card);
    });
  });
}

// ===== Inicializar =====
document.addEventListener("DOMContentLoaded", () => {
  cargarEstadisticas();
  cargarLanzamientos();
});
