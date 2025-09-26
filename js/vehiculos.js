import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

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

document.addEventListener("DOMContentLoaded", async () => {

  const animateCountUp = (element, targetValue, duration = 800) => {
    let startValue = 0;
    const frameRate = 60;
    const totalFrames = Math.round((duration / 1000) * frameRate);
    const increment = targetValue / totalFrames;
    let currentFrame = 0;
    const counter = setInterval(() => {
      currentFrame++;
      startValue += increment;
      if (currentFrame >= totalFrames) {
        startValue = targetValue;
        clearInterval(counter);
      }
      element.textContent = Math.floor(startValue);
    }, 1000 / frameRate);
  };

  try {
    // --- Contar propulsores activos/no activos ---
    const boostersSnapshot = await getDocs(collection(db, "propulsores"));
    let activos = 0;
    let noActivos = 0;

    boostersSnapshot.forEach(docSnap => {
      const p = docSnap.data();
      if (p.estado === "activo") activos++;
      else noActivos++;
    });

    document.getElementById("propulsoresActivos").textContent = `${activos}`;
    document.getElementById("propulsoresNoActivos").textContent = `${noActivos}`;

    // --- Obtener estadísticas desde collection 'estadisticas' ---
    const statsDocRef = doc(db, "estadisticas", "general");
    const statsSnap = await getDoc(statsDocRef);

    if (statsSnap.exists()) {
      const data = statsSnap.data();
      const falcon9Stats = data.vuelosVehiculos.falcon9 || { exitosos: 0, fallidos: 0 };
      const falconHeavyStats = data.vuelosVehiculos.falconHeavy || { exitosos: 0, fallidos: 0 };

      const totalFalcon9 = falcon9Stats.exitosos + falcon9Stats.fallidos;
      const totalFalconHeavy = falconHeavyStats.exitosos + falconHeavyStats.fallidos;
      const totalLanzamientos = totalFalcon9 + totalFalconHeavy;

      animateCountUp(document.getElementById("totalLanzamientos"), totalLanzamientos);
      animateCountUp(document.getElementById("lanzamientosFalcon9"), totalFalcon9);
      animateCountUp(document.getElementById("misionesFalconHeavy"), totalFalconHeavy);

      animateCountUp(document.getElementById("exitoFalcon9"), falcon9Stats.exitosos);
      document.getElementById("lanzamientostFalcon9").textContent = totalFalcon9;

      animateCountUp(document.getElementById("exitoFalconHeavy"), falconHeavyStats.exitosos);
      document.getElementById("lanzamientostFalconHeavy").textContent = totalFalconHeavy;
    }

  } catch (error) {
    console.error("Error cargando datos desde Firebase:", error);
  }

});
