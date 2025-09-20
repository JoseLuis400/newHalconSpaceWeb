document.addEventListener("DOMContentLoaded", () => {
  // =======================
  // SLIDESHOW (si lo tenés)
  // =======================
  const slidesWrapper = document.getElementById("slides-wrapper");
  if(slidesWrapper){
    const slides = slidesWrapper.querySelectorAll("img");
    const prevBtn = document.getElementById("prev");
    const nextBtn = document.getElementById("next");
    const dotsContainer = document.getElementById("dots");
    let currentIndex = 0;
    let slideWidth = slides[0].clientWidth;

    // Crear dots
    slides.forEach((_, index) => {
      const dot = document.createElement("span");
      dot.classList.add("dot");
      if(index===0) dot.classList.add("active");
      dot.addEventListener("click", ()=> goToSlide(index));
      dotsContainer.appendChild(dot);
    });
    const dots = dotsContainer.querySelectorAll(".dot");

    function updateSlide(){
      slideWidth = slides[0].clientWidth;
      slidesWrapper.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
      dots.forEach(dot => dot.classList.remove("active"));
      dots[currentIndex].classList.add("active");
    }

    function goToSlide(index){
      currentIndex = index;
      updateSlide();
    }

    function nextSlide(){
      currentIndex = (currentIndex + 1) % slides.length;
      updateSlide();
    }

    function prevSlide(){
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      updateSlide();
    }

    nextBtn.addEventListener("click", nextSlide);
    prevBtn.addEventListener("click", prevSlide);
    window.addEventListener("resize", updateSlide);
    updateSlide();
  }

  // =======================
  // CABECERA DINÁMICA
  // =======================
  (async () => {
    try {
      const response = await fetch("https://halconspace.site/json/lanzamientos.json"); // Cargar por API
      //const response = await fetch("../json/lanzamientos.json"); // Cargar por archivo
      const lanzamientos = await response.json();

      const misionHeader = document.querySelector(".mision-header");
      const filtro = misionHeader.dataset.lanzamiento.toLowerCase().trim();

      let lanzamiento;
      if (/^\d{4}$/.test(filtro)) {
        lanzamiento = lanzamientos.find(l => l.fecha.endsWith(filtro));
      } else if (/^\d{2}\/\d{4}$/.test(filtro)) {
        lanzamiento = lanzamientos.find(l => l.fecha.endsWith(filtro));
      } else {
        lanzamiento = lanzamientos.find(l => l.nombre.toLowerCase() === filtro);
      }

      if (!lanzamiento) {
        console.warn("Lanzamiento no encontrado para filtro:", filtro);
        return;
      }

      // Actualizar cabecera
      const misionContent = misionHeader.querySelector(".mision-content");
      let imagenUrl = lanzamiento.imagen;
      if (!imagenUrl.startsWith("https://halconspace.site/")) {
        imagenUrl = `https://halconspace.site/${lanzamiento.imagen}`;
      }
      misionHeader.style.backgroundImage = `url('${imagenUrl}')`;

      const [dia, mes, año] = lanzamiento.fecha.split("/");
      const meses = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
      ];
      const fechaFormateada = dia ? `${dia} de ${meses[parseInt(mes,10)-1]} de ${año}` : `${meses[parseInt(mes,10)-1]} de ${año}`;

      let estado = lanzamiento.estado;
      if(estado == "exito") {
        estado = "Éxito";
      }

      misionContent.innerHTML = `
        <h2>${lanzamiento.nombre}</h2>
        <p><strong>Vehículo:</strong> ${lanzamiento.vehiculo}</p>
        <p><strong>Fecha:</strong> ${fechaFormateada}</p>
        <p><strong>Estado:</strong> ${estado}</p>
      `;

      // =======================
      // STREAMS
      // =======================
      const main = document.querySelector("main") || document.body;

      // Caso múltiples streams
      if (lanzamiento.streams && lanzamiento.streams.length > 0) {
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

        lanzamiento.streams.forEach((s, index) => {
          const btn = document.createElement("button");
          btn.textContent = s.titulo;
          btn.addEventListener("click", () => {
            const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|live\/|embed\/))([a-zA-Z0-9_-]{11})/;
            const match = s.url.match(ytRegex);
            const videoID = match ? match[1] : null;
            if(videoID) iframe.src = `https://www.youtube.com/embed/${videoID}?autoplay=1&rel=0`;
          });
          if(index===0) btn.click();
          selector.appendChild(btn);
        });

      } 
      // Caso un solo stream
      else if (lanzamiento.stream) {
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
                <iframe src="https://www.youtube.com/embed/${videoID}?autoplay=1&rel=0" 
                        frameborder="0" allowfullscreen allow="encrypted-media">
                </iframe>
              </div>
            </div>
          `;
          main.appendChild(section);
        }
      }

    } catch (error) {
      console.error("Error cargando la cabecera desde JSON:", error);
    }
  })();
});
