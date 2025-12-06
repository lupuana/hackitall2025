// main.js - Application Orchestrator

// ================================
// 1. IMPORTS
// ================================

// Imports esențiale din ambele ramuri:
import { initializeControls } from './ui/controls.js'; 
import { initAudio, updateAudio, audioEngine, audioData, ensureAudioRunning } from "./audio/audioEngine.js";
import { generateHarmonographPoints } from "./harmonograph/harmonograph.js";
import { renderFrame } from "./render/renderer.js";

// Global variables
let canvas, ctx;
let started = false; // Necessar pentru controlul audio (din HEAD)

// Time variable for Harmonograph animation
let t = 0;


// ================================
// 2. CANVAS SETUP & RESIZE
// ================================

// Păstrăm funcția de setup din a7e96c4 pentru a inițializa canvas-ul
function setupCanvas() {
    canvas = document.getElementById("screen");
    ctx = canvas.getContext("2d");
    resizeCanvas(); // Folosim resizeCanvas
    window.addEventListener("resize", resizeCanvas);
}

// Renunțăm la resize() și păstrăm resizeCanvas() din a7e96c4
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}


// ================================
// 3. AUDIO UNLOCK & STARTUP (Logică preluată din HEAD)
// ================================

// 🔥 Browserul NU permite audio până la un click/tap/tastă.
const unlockAudio = async () => {
    if (started) return;
    started = true;
    await start();
};
// Ascultători pentru deblocarea audio
window.addEventListener("pointerdown", unlockAudio, { once: true });
window.addEventListener("keydown", unlockAudio, { once: true });

async function start() {
    // Reinițializăm canvas-ul și contextul, deoarece setupCanvas() din a7e96c4 făcea asta
    canvas = document.getElementById("screen"); 
    ctx = canvas.getContext("2d");
    resizeCanvas(); // Folosim resizeCanvas
    window.addEventListener("resize", resizeCanvas);

    // 1. Initialize Audio
    await initAudio();
    await ensureAudioRunning();
    
    // 2. Initialize UI Controls (din a7e96c4)
    initializeControls(); 

    // 3. Start the animation loop
    loop();
    
    // Mesaj de status (din a7e96c4)
    console.log("Application initialized. Ready to render.");
}


// ================================
// 4. MAIN ANIMATION LOOP (Combinată)
// ================================

/**
 * Main animation loop (runs at ~60 FPS).
 */
function loop() {
    requestAnimationFrame(loop);

    // 1. Audio Analysis (Din HEAD)
    updateAudio();

    const vol = audioData.volume || 0;

    // 2. Update Time (Controls the slow, organic rotation of the figure) (Din HEAD)
    // accelerăm timpul în funcție de audio
    const speed = 0.5 + vol * 2.0 + audioData.energy * 1.2;
    t += speed;

    // 3. Drawing (Din HEAD)
    const points = generateHarmonographPoints(t, canvas);

    // 4. Render (Folosim renderFrame din HEAD/Renderer, care include efectul CRT)
    renderFrame(ctx, points);
}


// ================================
// 5. INITIALIZATION FALLBACK (Modificat)
// ================================

// Păstrăm listenerul 'DOMContentLoaded' doar pentru logica UI care nu necesită audio, 
// dar pornim bucla de animație în 'start()' (după click)
document.addEventListener('DOMContentLoaded', () => {
    // setupCanvas și initializeControls sunt mutate în start()
    // pentru a se asigura că funcționează după ce canvas-ul este gata.
    // Lăsăm această secțiune goală, deoarece 'start' este punctul de intrare real.
});