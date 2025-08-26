////// ESTADISTICAS

document.addEventListener("DOMContentLoaded", () => {
  fetch("../json/estadisticas.json")
    .then(res => res.json())
    .then(data => {

      const totalVuelos = data.vuelosVehiculos.falcon9.exitosos + data.vuelosVehiculos.falcon9.fallidos;
      document.getElementById("vuelosTotales").textContent = totalVuelos;

      const opcionesBase = (titulo) => ({
        responsive: true,
        maintainAspectRatio: true, // 🔑 Mantiene proporción cuadrada
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
            data: [data.vuelosVehiculos.falcon9.exitosos, data.vuelosVehiculos.falcon9.fallidos],
            backgroundColor: ['#178236', '#A50C36']
          }]
        },
        options: opcionesBase("Lanzamientos")
      });
    })
    .catch(err => console.error("Error cargando estadísticas:", err));
});


//// LANZAMIENTOS

// Función para convertir DD/MM/YYYY a Date
function parseFecha(fechaStr) {
  const [dia, mes, anio] = fechaStr.split("/").map(Number);
  return new Date(anio, mes - 1, dia);
}

// Cargar JSON de lanzamientos
fetch("https://halconspace.site/json/lanzamientos.json")
  .then(res => res.json())
  .then(lanzamientos => {

    const hoy = new Date();

    // Filtrar solo lanzamientos pasados y del Falcon 9
    const filtrados = lanzamientos.filter(l => 
      parseFecha(l.fecha) <= hoy && l.vehiculo.toLowerCase().includes("falcon 9")
    );

    // Ordenar de más reciente a más antiguo
    filtrados.sort((a, b) => parseFecha(b.fecha) - parseFecha(a.fecha));

    // Tomar solo los 3 más recientes
    const ultimos = filtrados.slice(0, 3);

    const contenedor = document.getElementById("lanzamientos");

    ultimos.forEach(l => {
      const card = document.createElement("div");
      card.className = "card-lanzamiento";

      let imagenUrl = l.imagen;
  if (!imagenUrl.startsWith("https://halconspace.site/")) {
    imagenUrl = `https://halconspace.site/${imagenUrl}`;
  }

      card.innerHTML = `
<div class="img-wrapper">
  <img src="${imagenUrl}" alt="${l.alt}">
  <span class="estado ${l.estado}">${l.estado.toUpperCase()}</span>
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
  })
  .catch(err => console.error("Error cargando lanzamientos:", err));

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
  