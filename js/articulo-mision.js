document.addEventListener("DOMContentLoaded", () => {
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabPanes = document.querySelectorAll(".tab-pane");
  
    tabButtons.forEach((btn, index) => {
      btn.addEventListener("click", () => {
        // Activar botón
        tabButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
  
        // Mostrar solo la pestaña correspondiente
        tabPanes.forEach(pane => pane.style.display = "none");
        tabPanes[index].style.display = "block";
      });
    });
  });
  
  document.addEventListener("DOMContentLoaded", () => {
    // ==========================
    // 1. Limpiar estilos inline
    // ==========================
    document.querySelectorAll("video, img").forEach(el => el.removeAttribute("style"));
  
    // ==========================
    // 2. Tomar galería
    // ==========================
    const galeria = document.querySelector(".imagenes .galeria");
    if (!galeria) return;
  
    const items = Array.from(galeria.children);
  
    // Separar imágenes y videos
    const images = items.filter(el => el.tagName.toLowerCase() === "img")
                        .map(img => ({ src: img.src, alt: img.alt }));
    const videos = items.filter(el => el.tagName.toLowerCase() === "video");
  
    // ==========================
    // 3. Crear carrusel de imágenes
    // ==========================
    const section = document.querySelector(".imagenes");
    section.innerHTML = `
      <h3>Imágenes de la misión</h3>
      <div class="carousel-wrapper">
        <div id="slides-wrapper" class="slides"></div>
        <button id="prev">&#10094;</button>
        <button id="next">&#10095;</button>
        <div id="dots" class="dots"></div>
      </div>
  
      ${videos.length ? `
        <div class="video-directo-tabs">
          <h3>Videos de la misión</h3>
          <div class="tabs" id="video-tabs-buttons"></div>
          <div class="tab-content" id="video-tabs-content"></div>
        </div>
      ` : ''}
    `;
  
    // --- Carrusel ---
    const wrapper = document.getElementById("slides-wrapper");
    const prevBtn = document.getElementById("prev");
    const nextBtn = document.getElementById("next");
    const dotsContainer = document.getElementById("dots");
  
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
  
    let current = 0;
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
  
    // ==========================
    // 4. Crear pestañas de videos
    // ==========================
    if (videos.length > 0) {
      const tabsButtons = document.getElementById("video-tabs-buttons");
      const tabsContent = document.getElementById("video-tabs-content");
  
      videos.forEach((video, i) => {
        // Botón de pestaña
        const tabBtn = document.createElement("button");
        tabBtn.className = `tab-button${i === 0 ? ' active' : ''}`;
        tabBtn.textContent = video.alt || `Video ${i + 1}`;
        tabsButtons.appendChild(tabBtn);
  
        // Contenido de pestaña
        const tabPane = document.createElement("div");
        tabPane.className = `tab-pane${i === 0 ? ' active' : ''}`;
        tabPane.style.display = i === 0 ? 'block' : 'none';
  
        const container = document.createElement("div");
        container.className = "video-container";
  
        const newVideo = document.createElement("video");
        newVideo.src = video.src;
        newVideo.controls = true;      // Usar controles nativos
        newVideo.style.width = "100%";
        newVideo.style.height = "100%";
  
        container.appendChild(newVideo);
        tabPane.appendChild(container);
        tabsContent.appendChild(tabPane);
  
        // Click en pestaña
        tabBtn.addEventListener("click", () => {
          tabsButtons.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
          tabBtn.classList.add("active");
          tabsContent.querySelectorAll(".tab-pane").forEach(p => p.style.display = 'none');
          tabPane.style.display = 'block';
        });
      });
    }
  });