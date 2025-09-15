document.addEventListener("DOMContentLoaded", () => {
  const slidesWrapper = document.getElementById("slides-wrapper");
  const slides = slidesWrapper.querySelectorAll("img");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const dotsContainer = document.getElementById("dots");

  let currentIndex = 0;
  let slideWidth = slides[0].clientWidth;

  // Crear los dots dinámicamente
  slides.forEach((_, index) => {
    const dot = document.createElement("span");
    dot.classList.add("dot");
    if (index === 0) dot.classList.add("active");
    dot.addEventListener("click", () => goToSlide(index));
    dotsContainer.appendChild(dot);
  });
  const dots = dotsContainer.querySelectorAll(".dot");

  function updateSlide() {
    slideWidth = slides[0].clientWidth; // recalcula siempre
    slidesWrapper.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
    dots.forEach(dot => dot.classList.remove("active"));
    dots[currentIndex].classList.add("active");
  }

  function goToSlide(index) {
    currentIndex = index;
    updateSlide();
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % slides.length;
    updateSlide();
  }

  function prevSlide() {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    updateSlide();
  }

  nextBtn.addEventListener("click", nextSlide);
  prevBtn.addEventListener("click", prevSlide);

  // Recalcular en resize para pantallas responsive
  window.addEventListener("resize", updateSlide);

  // Inicializar
  updateSlide();
});
