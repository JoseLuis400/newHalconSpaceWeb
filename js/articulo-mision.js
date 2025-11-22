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

const normalizeURL = url => {
  if (!url) return "";
  url = url.trim();
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (!url.startsWith("/")) url = "/" + url;
  return `https://halconspace.site${url}`;
};


// ===== Función auxiliar para el contador con soporte HOLD/SCRUB =====
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

// ===== Función para formatear hora UTC desde ISO string =====
function formatearHoraUTC(isoString) {
  const date = new Date(isoString);
  const horas = String(date.getUTCHours()).padStart(2, "0");
  const minutos = String(date.getUTCMinutes()).padStart(2, "0");
  return `${horas}:${minutos}`;
}

// ===== Función para calcular posición en la barra de ventana =====
function calcularPosicionEnVentana(start, end, target) {
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const targetTime = new Date(target).getTime();
  
  const totalDuration = endTime - startTime;
  const targetOffset = targetTime - startTime;
  
  return (targetOffset / totalDuration) * 100;
}

document.addEventListener("DOMContentLoaded", () => {
  let contadorInterval = null;

  (async () => {
    try {
      const misionHeader = document.querySelector(".mision-header");
      const filtro = misionHeader.dataset.lanzamiento.toLowerCase().trim();
      const misionContent = misionHeader.querySelector(".mision-content");

      const lanzamientosCol = collection(db, "lanzamientos");

      onSnapshot(lanzamientosCol, snapshot => {
        const lanzamientos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Buscar lanzamiento por nombre o fecha
        let lanzamiento;
        if (/^\d{4}$/.test(filtro)) {
          lanzamiento = lanzamientos.find(l => l.fecha.endsWith(filtro));
        } else if (/^\d{2}\/\d{4}$/.test(filtro)) {
          lanzamiento = lanzamientos.find(l => l.fecha.endsWith(filtro));
        } else {
          lanzamiento = lanzamientos.find(l => l.nombre.toLowerCase() === filtro);
        }
        if (!lanzamiento) return;

        // ===== Actualizar cabecera =====
        let imagenUrl = lanzamiento.imagen;
        misionHeader.style.backgroundImage = `url('${normalizeURL(lanzamiento.imagen)}')`;

        const [dia, mes, año] = lanzamiento.fecha.split("/");
        const mesesCompletos = [
          "enero","febrero","marzo","abril","mayo","junio",
          "julio","agosto","septiembre","octubre","noviembre","diciembre"
        ];
        const mesesAbrev = [
          "ene","feb","mar","abr","may","jun",
          "jul","ago","sep","oct","nov","dic"
        ];

        let estado = lanzamiento.estado;
        if(estado?.toLowerCase() === "exito") estado = "Éxito";

        let lanzamientoEl = "";
        let ventanaEl = "";

// Función auxiliar para formatear fecha según typeDate
function formatearFechaPorTipoArticulo(dia, mes, año, timeUTC, typeDate) {
  const mesesCompletos = [
    "enero","febrero","marzo","abril","mayo","junio",
    "julio","agosto","septiembre","octubre","noviembre","diciembre"
  ];
  const mesesAbrev = [
    "ene","feb","mar","abr","may","jun",
    "jul","ago","sep","oct","nov","dic"
  ];

  if(typeDate === "year_long") {
    return `NET ${año}`;
  } else if (typeDate === "month_long") {
    return `NET ${mesesCompletos[mes]} ${año}`;
  } else if (typeDate === "day_long") {
    return `NET ${dia} ${mesesCompletos[mes]} ${año}`;
  } else {
    // Formato normal
    const mesTexto = dia ? mesesCompletos[mes] : mesesAbrev[mes];
    return `${dia ? dia + " " : ""}${mesTexto} ${año}, ${timeUTC} UTC`;
  }
}



// Si existe ventana de lanzamiento Y estado es "programado"
if(lanzamiento.window && lanzamiento.window.start && lanzamiento.window.end && lanzamiento.estado?.toLowerCase() === "programado") {
  const startHora = formatearHoraUTC(lanzamiento.window.start);
  const endHora = formatearHoraUTC(lanzamiento.window.end);

  // Usar typeDate si existe
  const lanzamientoTexto = formatearFechaPorTipoArticulo(
    dia,
    parseInt(mes,10)-1,
    año,
    lanzamiento.timeUTC,
    lanzamiento.typeDate
  );

  lanzamientoEl = `<p><strong>Tiempo:</strong> ${lanzamientoTexto}</p>`;
  ventanaEl = `<p><strong>Ventana:</strong> ${startHora} - ${endHora} UTC</p>`;
} else {
  // Sin ventana: usar typeDate si existe
  const lanzamientoTexto = formatearFechaPorTipoArticulo(
    dia,
    parseInt(mes,10)-1,
    año,
    lanzamiento.timeUTC,
    lanzamiento.typeDate
  );

  lanzamientoEl = `<p><strong>Tiempo:</strong> ${lanzamientoTexto}</p>`;
}


        misionContent.innerHTML = `
          <h2>${lanzamiento.nombre}</h2>
          <p><strong>Vehículo:</strong> ${lanzamiento.vehiculo}</p>
          ${lanzamientoEl}
          ${ventanaEl}
          <p><strong>Estado:</strong> ${estado}</p>
          ${lanzamiento.contador ? `<p><span id="t-counter"></span></p>` : ""}
          ${lanzamiento.estado?.toLowerCase() === "hold" ? `<p><span id="h-counter"></span></p>` : ""}
        `;

        // ===== Manejo dinámico del contador con HOLD/SCRUB =====
  if(lanzamiento.contador) {
  const contadorSpan = document.getElementById("t-counter");

  function actualizarContador() {
    let now = new Date();
    const estadoLower = lanzamiento.estado?.toLowerCase();
  
    // Congelar si HOLD o SCRUB
    if((estadoLower === "hold" || estadoLower === "scrub") && lanzamiento.holdTime){
      now = lanzamiento.holdTime;
    }
  
    const nuevoTexto = calcularContador(lanzamiento.fecha, lanzamiento.timeUTC, now);
  
    // Separar texto en caracteres
    const chars = nuevoTexto.split('');
  
    // Crear span por cada dígito/caracter
    if(!contadorSpan.dataset.lastText) contadorSpan.dataset.lastText = nuevoTexto;
    const lastChars = contadorSpan.dataset.lastText.split('');
  
    contadorSpan.innerHTML = '';
    chars.forEach((c, i) => {
      const span = document.createElement('span');
      span.classList.add('digit');
      
      // Comparar con último carácter
      if(lastChars[i] && lastChars[i] !== c){
        // Si aumenta T- -> retrocede hacia abajo
        if(nuevoTexto.startsWith("T-")) span.style.transform = 'translateY(-100%)';
        // Si aumenta T+ -> sube hacia arriba
        if(nuevoTexto.startsWith("T+")) span.style.transform = 'translateY(100%)';
        setTimeout(() => { span.style.transform = 'translateY(0)'; }, 10);
      }
      
      span.textContent = c;
      contadorSpan.appendChild(span);
    });
  
    contadorSpan.dataset.lastText = nuevoTexto;
  
    // Mantener siempre id="t-counter" y agregar data-state
    if(estadoLower === "hold" || estadoLower === "scrub") {
      contadorSpan.setAttribute("data-state", estadoLower);
    } else {
      contadorSpan.removeAttribute("data-state");
    }
  }  

  const elemento = document.getElementById("propulsorAUsar");
    if (elemento) {
      if (lanzamiento.propulsor) {
        elemento.textContent = lanzamiento.propulsor;
      } else {
        elemento.textContent = "Por confirmar";
      }
    }

  if (contadorInterval) clearInterval(contadorInterval);
  actualizarContador();
  contadorInterval = setInterval(actualizarContador, 1000);

  // ===== Contador H+ para HOLD =====
if(lanzamiento.estado?.toLowerCase() === "hold" && lanzamiento.holdTime) {
  const hCounterSpan = document.getElementById("h-counter");
  
  function actualizarHoldContador() {
    const holdStart = new Date(lanzamiento.holdTime);
    const now = new Date();
    
    let diff = Math.floor((now - holdStart) / 1000);
    if(diff < 0) diff = 0;
    
    const dias = Math.floor(diff / 86400);
    const horas = String(Math.floor((diff % 86400) / 3600)).padStart(2, "0");
    const minutos = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
    const segundos = String(diff % 60).padStart(2, "0");
    
    const nuevoTexto = dias > 0 
      ? `H+ ${dias}D / ${horas}:${minutos}:${segundos}` 
      : `H+ ${horas}:${minutos}:${segundos}`;
    
    // Usar la misma estructura que el contador T-/T+ (sin animación)
    const chars = nuevoTexto.split('');
    hCounterSpan.innerHTML = '';
    
    chars.forEach((c) => {
      const span = document.createElement('span');
      span.classList.add('digit'); // Misma clase que el contador principal
      span.textContent = c;
      hCounterSpan.appendChild(span);
    });
    
    hCounterSpan.setAttribute("data-state", "hold");
  }
  
  actualizarHoldContador();
  setInterval(actualizarHoldContador, 1000);
}

} else {
  if (contadorInterval) {
    clearInterval(contadorInterval);
    contadorInterval = null;
  }
}

        // ===== STREAMS =====
        const main = document.querySelector("main") || document.body;
        document.querySelectorAll(".transmisiones").forEach(el => el.remove());

        if (lanzamiento.streams?.length > 0) {
          const section = document.createElement("section");
          section.classList.add("transmisiones");
          section.innerHTML = `
            <h3>Transmisión en directo</h3>
            <div class="transmisiones-content">
              <div class="stream-selector"></div>
              <div class="video-container">
                <iframe frameborder="0" allowfullscreen allow="encrypted-media"></iframe>
              </div>
            </div>
          `;
          main.appendChild(section);

          const iframe = section.querySelector("iframe");
          const selector = section.querySelector(".stream-selector");

          lanzamiento.streams.forEach((s, i) => {
            const btn = document.createElement("button");
            btn.textContent = s.titulo;
            btn.addEventListener("click", () => {
              const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|live\/|embed\/))([a-zA-Z0-9_-]{11})/;
              const match = s.url.match(ytRegex);
              const videoID = match ? match[1] : null;
              if(videoID) iframe.src = `https://www.youtube.com/embed/${videoID}?autoplay=1&rel=0`;
            });
            if(i===0) btn.click();
            selector.appendChild(btn);
          });
        } else if (lanzamiento.stream) {
          const section = document.createElement("section");
          section.classList.add("transmisiones");
          const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|live\/|embed\/))([a-zA-Z0-9_-]{11})/;
          const match = lanzamiento.stream.match(ytRegex);
          const videoID = match ? match[1] : null;
          if(videoID){
            section.innerHTML = `
              <h3>Transmisión en directo</h3>
              <div class="transmisiones-content">
                <div class="video-container">
                  <iframe src="https://www.youtube.com/embed/${videoID}?autoplay=1&rel=0" frameborder="0" allowfullscreen allow="encrypted-media"></iframe>
                </div>
              </div>
            `;
            main.appendChild(section);
          }
        }

      });

    } catch (error) {
      console.error("Error cargando la cabecera desde Firebase:", error);
    }
  })();

});

//// GALERÍA DE FOTOS (corrigiendo cálculo de ancho)

//// GALERÍA DE FOTOS - usando imágenes del HTML directamente

document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.getElementById("slides-wrapper");
  const slides = wrapper.querySelectorAll("img");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const dotsContainer = document.getElementById("dots");

  let current = 0;
  const total = slides.length;

  // Hacemos que el wrapper sea flex y todas las imágenes ocupen 100% del viewport
  wrapper.style.display = "flex";
  wrapper.style.transition = "transform 0.5s ease";
  slides.forEach(slide => {
    slide.style.flex = "0 0 100%"; // cada imagen ocupa todo el ancho visible
  });

  // Crear dots dinámicamente
  slides.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.addEventListener("click", () => showSlide(i));
    dotsContainer.appendChild(dot);
  });
  const dots = dotsContainer.querySelectorAll(".dot");

  function updateDots() {
    dots.forEach(d => d.classList.remove("active"));
    if (dots[current]) dots[current].classList.add("active");
  }

  function showSlide(index) {
    current = (index + total) % total;
    wrapper.style.transform = `translateX(-${current * 100}%)`;
    updateDots();
  }

  // Botones
  prevBtn.addEventListener("click", () => showSlide(current - 1));
  nextBtn.addEventListener("click", () => showSlide(current + 1));

  // Inicialización
  showSlide(0);

  // Autoplay cada 5s
  setInterval(() => showSlide(current + 1), 10000);
});