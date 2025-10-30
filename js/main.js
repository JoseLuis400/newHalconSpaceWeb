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
            <a href="https://new.halconspace.site/lanzamientos">Lanzamientos</a> | 
            <a href="https://new.halconspace.site/vehiculos">Vehículos</a> | 
            <a href="https://new.halconspace.site/contacto">Contacto</a> | 
            <a href="https://new.halconspace.site/discord">Discord</a> | 
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

/* ========= HALLOWINE =========== */

(function() {
    'use strict';

    // Configuración de efectos (puedes modificar estos valores)
    const config = {
        ghosts: { enabled: true, interval: 3000 },
        pumpkins: { enabled: true, interval: 2000 },
        bats: { enabled: true, interval: 4000 },
        spiders: { enabled: true, count: 5 },
        fog: { enabled: false },
        webs: { enabled: false }
    };

    // Esperar a que el DOM esté listo
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startHalloween);
        } else {
            startHalloween();
        }
    }

    function startHalloween() {
        if (config.fog.enabled) createFog();
        if (config.webs.enabled) createWebs();
        if (config.ghosts.enabled) createGhostsLoop();
        if (config.pumpkins.enabled) createPumpkinsLoop();
        if (config.bats.enabled) createBatsLoop();
        if (config.spiders.enabled) createSpiders();
    }

    function createFog() {
        const fog = document.createElement('div');
        fog.className = 'halloween-fog';
        document.body.appendChild(fog);
    }

    function createWebs() {
        const webTopLeft = document.createElement('div');
        webTopLeft.className = 'halloween-web halloween-web-top-left';
        document.body.appendChild(webTopLeft);

        const webTopRight = document.createElement('div');
        webTopRight.className = 'halloween-web halloween-web-top-right';
        document.body.appendChild(webTopRight);
    }

    function createGhostsLoop() {
        setInterval(() => {
            const ghost = document.createElement('div');
            ghost.className = 'halloween-ghost';
            ghost.textContent = '👻';
            ghost.style.left = Math.random() * 100 + '%';
            ghost.style.top = Math.random() * 100 + '%';
            ghost.style.animationDelay = Math.random() * 3 + 's';
            document.body.appendChild(ghost);
            
            setTimeout(() => {
                if (ghost.parentNode) {
                    ghost.remove();
                }
            }, config.ghosts.lifetime);
        }, config.ghosts.interval);
    }

    function createPumpkinsLoop() {
        setInterval(() => {
            const pumpkin = document.createElement('div');
            pumpkin.className = 'halloween-pumpkin';
            pumpkin.textContent = '🎃';
            pumpkin.style.left = Math.random() * 100 + '%';
            pumpkin.style.top = '-50px';
            const duration = config.pumpkins.minDuration + Math.random() * (config.pumpkins.maxDuration - config.pumpkins.minDuration);
            pumpkin.style.animationDuration = duration + 's';
            document.body.appendChild(pumpkin);
            
            setTimeout(() => {
                if (pumpkin.parentNode) {
                    pumpkin.remove();
                }
            }, duration * 1000);
        }, config.pumpkins.interval);
    }

    function createBatsLoop() {
        setInterval(() => {
            const bat = document.createElement('div');
            bat.className = 'halloween-bat';
            bat.textContent = '🦇';
            bat.style.top = Math.random() * 50 + '%';
            bat.style.left = '-100px';
            document.body.appendChild(bat);
            
            setTimeout(() => {
                if (bat.parentNode) {
                    bat.remove();
                }
            }, config.bats.lifetime);
        }, config.bats.interval);
    }

    function createSpiders() {
        for (let i = 0; i < config.spiders.count; i++) {
            const spider = document.createElement('div');
            spider.className = 'halloween-spider';
            spider.textContent = '🕷️';
            spider.style.left = (i * (100 / config.spiders.count) + 10) + '%';
            spider.style.top = '0';
            spider.style.animationDelay = i * 0.5 + 's';
            document.body.appendChild(spider);
        }
    }

    // Iniciar cuando se cargue el script
    init();

    // Exportar configuración para poder modificarla desde consola si se necesita
    window.HalloweenEffects = {
        config: config
    };

})();