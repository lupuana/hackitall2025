// main.js - Application Orchestrator

// We import the UI initialization logic (from your ui/controls.js file)
// and the core state management (from your ui/state.js file)
import { initializeControls } from './ui/controls.js'; 
// import { getState } from './ui/state.js'; 
// import { initializeAudio, getAudioData, stopAudio } from './audio/audioEngine.js'; // To be implemented later

// Global variables
let canvas, ctx;

// Time variable for Harmonograph animation
let t = 0;

// ================================
// 1. CANVAS SETUP & LOOP
// ================================

function setupCanvas() {
    canvas = document.getElementById("screen");
    ctx = canvas.getContext("2d");
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

/**
 * Placeholder function for drawing the Harmonograph.
 * This is where you will call the complex math/drawing logic.
 */
function drawHarmonograph(time) {
    // 🔥 The green square has been removed. 
    // This function is now empty and ready for your Harmonograph logic 
    // (which will be imported from harmonograph/harmonograph.js)
    
    // Example call structure for when you implement the math:
    // const { volume, pitch } = getAudioData(); // Get current audio values
    // const points = generateHarmonographPoints(volume, pitch, time); 
    // renderPoints(points); 
}

/**
 * Main animation loop (runs at ~60 FPS).
 */
function loop() {
    requestAnimationFrame(loop);

    // 1. Afterglow/CRT fade effect (keeps the screen dark and fades old drawings)
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Audio Analysis (When fully implemented)
    // if (getState().audioActive) {
    //     getAudioData(); 
    // }

    // 3. Drawing
    drawHarmonograph(t);

    // 4. Update Time (Controls the slow, organic rotation of the figure)
    t += 0.005; 
}


// ================================
// 2. INITIALIZATION
// ================================
document.addEventListener('DOMContentLoaded', () => {
    setupCanvas();

    // 1. Initialize UI Controls and event handlers (toggle, sliders, etc.)
    initializeControls(); 
    
    // 2. Start the animation loop
    loop();
    
    // You can also add status message updates here:
    console.log("Application initialized. Ready to render.");
});