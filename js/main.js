document.addEventListener("DOMContentLoaded", () => {
    // Cargar menú
    fetch("../menu.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("menu-container").innerHTML = data;

            // Activar página actual en menú
            const currentPath = window.location.pathname.toLowerCase(); // toda la ruta
            const menuLinks = document.querySelectorAll("#menu a");

            menuLinks.forEach(link => {
                const page = link.getAttribute("data-page").toLowerCase();
                if (currentPath.includes(page)) {
                    link.classList.add("active");
                }
            });

            // Botón menú móvil
            const menuToggle = document.querySelector(".menu-toggle");
            const nav = document.querySelector("#menu");

            menuToggle.addEventListener("click", () => {
                nav.classList.toggle("open");
                menuToggle.innerHTML = nav.classList.contains("open") ? "✖" : "☰";
            });
        })
        .catch(error => console.error("Error al cargar el menú:", error));

    // Agregar footer dinámicamente
    const footer = document.createElement("footer");
    footer.innerHTML = `
        <p>© 2025 Halcon Space. Todos los derechos reservados.</p>
        <nav>
            <a href="lanzamientos">Lanzamientos</a> | 
            <a href="vehiculos">Vehículos</a> | 
            <a href="contacto">Contacto</a> | 
            <a href="discord">Discord</a> | 
            <a href="https://www.youtube.com/@HalconSpace" target="_blank">YouTube</a>
        </nav>
    `;
    document.body.appendChild(footer);
});


// Google Analytics
const gtagScript = document.createElement('script');
gtagScript.async = true;
gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-7S8NZ102SQ';
document.head.appendChild(gtagScript);

const inlineScript = document.createElement('script');
inlineScript.innerHTML = `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-7S8NZ102SQ');
`;
document.head.appendChild(inlineScript);
