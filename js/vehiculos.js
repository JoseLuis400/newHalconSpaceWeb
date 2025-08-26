document.addEventListener("DOMContentLoaded", () => {
    // Función para animar el conteo de números
    const animateCountUp = (element, targetValue, duration = 800) => {
        let startValue = 0;
        const frameRate = 60; // 60 actualizaciones por segundo
        const totalFrames = Math.round((duration / 1000) * frameRate);
        const increment = targetValue / totalFrames;
        let currentFrame = 0;
      
        const counter = setInterval(() => {
          currentFrame++;
          startValue += increment;
          if (currentFrame >= totalFrames) {
            startValue = targetValue; // aseguramos que llegue exacto
            clearInterval(counter);
          }
          element.textContent = Math.floor(startValue);
        }, 1000 / frameRate);
      };
      
  
    // Función para obtener y actualizar las estadísticas
    const fetchAndUpdateStats = async () => {
      try {
        const response = await fetch("http://localhost:5500/json/estadisticas.json");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
  
        // Actualizar estadísticas generales
        animateCountUp(document.getElementById("totalLanzamientos"), data.lanzamientos.exitosos + data.lanzamientos.fallidos);
        animateCountUp(document.getElementById("lanzamientosFalcon9"), data.vuelosVehiculos.falcon9.exitosos + data.vuelosVehiculos.falcon9.fallidos);
        animateCountUp(document.getElementById("misionesFalconHeavy"), data.vuelosVehiculos.falconHeavy.exitosos + data.vuelosVehiculos.falconHeavy.fallidos);

        // Actualizar estadísticas de lanzamientos
        animateCountUp(document.getElementById("exitoFalcon9"), data.vuelosVehiculos.falcon9.exitosos);
        document.getElementById("lanzamientostFalcon9").textContent =  data.vuelosVehiculos.falcon9.exitosos + data.vuelosVehiculos.falcon9.fallidos;

        animateCountUp(document.getElementById("exitoFalconHeavy"), data.vuelosVehiculos.falconHeavy.exitosos);
        document.getElementById("lanzamientostFalconHeavy").textContent =  data.vuelosVehiculos.falconHeavy.exitosos + data.vuelosVehiculos.falconHeavy.fallidos;
  
        
      } catch (error) {
        console.error("Error fetching statistics:", error);
      }
    };
  
    // Llamar a la función para obtener y actualizar las estadísticas
    fetchAndUpdateStats();
  });
  
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const response = await fetch("https://new.halconspace.site/json/propulsores.json");
      const data = await response.json();
      const propulsores = data.propulsores;
  
      let activos = 0;
      let noActivos = 0;
  
      Object.values(propulsores).forEach(p => {
        if (p.estado === "activo") {
          activos++;
        } else {
          noActivos++;
        }
      });
  
      document.getElementById("propulsoresActivos").textContent = `${activos}`;
      document.getElementById("propulsoresNoActivos").textContent = `${noActivos}`;
  
    } catch (error) {
      console.error("Error cargando propulsores:", error);
    }
  });