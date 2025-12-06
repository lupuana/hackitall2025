import { initAudio, updateAudio, audioEngine, audioData, ensureAudioRunning } from "./audio/audioEngine.js";
import { generateHarmonographPoints } from "./harmonograph/harmonograph.js";
import { renderFrame, setRenderMode } from "./render/renderer.js";

// === UI REFERENCES ===
const ui = {
    boot: document.getElementById('boot-sequence'),
    console: document.getElementById('console-log'),
    btn: document.getElementById('engage-btn'),
    hud: document.getElementById('hud-layer'),
    
    // Data fields
    note: document.getElementById('note-val'),
    hz: document.getElementById('hz-val'),
    vol: document.getElementById('vol-val'),
    timer: document.getElementById('sys-timer'),
    cpu: document.getElementById('cpu-load'),

    // Controls
    controls: {
        sens: document.getElementById('ctrl-sens'),
        valSens: document.getElementById('val-sens'),
        complex: document.getElementById('ctrl-complex'),
        valComplex: document.getElementById('val-complex')
    },

    // Modes
    modeDJ: document.getElementById('btn-mode-dj'),
    modeArt: document.getElementById('btn-mode-art')
};

let canvas, ctx;
let t = 0;
let smoothSpeed = 0;
let startTime = 0;

// Init Global Params for Renderer
window.visualParams = { complexity: 0.5 };

// === BOOT SEQUENCE ===
const bootLines = [
    "> SYSTEM_CHECK: NEURAL_CORE",
    "> LOADING AUDIO DRIVERS...",
    "> CONNECTING TO HARDWARE RACK...",
    "> CALIBRATING SENSORS...",
    "> SYSTEM READY."
];

async function runBootSequence() {
    let delay = 0;
    for (const line of bootLines) {
        setTimeout(() => {
            const p = document.createElement('div');
            p.innerText = line;
            ui.console.appendChild(p);
            ui.console.scrollTop = ui.console.scrollHeight;
        }, delay);
        delay += Math.random() * 300 + 100;
    }
    setTimeout(() => { ui.btn.classList.remove('hidden'); }, delay + 200);
}
runBootSequence();

// === CONTROLS & MODES ===
ui.controls.sens.addEventListener('input', (e) => {
    ui.controls.valSens.innerText = e.target.value;
    audioEngine.setSensitivity(e.target.value);
});

ui.controls.complex.addEventListener('input', (e) => {
    ui.controls.valComplex.innerText = e.target.value + "%";
    window.visualParams.complexity = parseInt(e.target.value) / 100;
});

ui.modeDJ.addEventListener('click', () => {
    setRenderMode('DJ');
    ui.modeDJ.classList.add('active');
    ui.modeArt.classList.remove('active');
});

ui.modeArt.addEventListener('click', () => {
    setRenderMode('ART');
    ui.modeArt.classList.add('active');
    ui.modeDJ.classList.remove('active');
});

// === START ===
ui.btn.addEventListener('click', async () => {
    await initAudio();
    await ensureAudioRunning();
    ui.boot.style.opacity = '0';
    setTimeout(() => { ui.boot.style.display = 'none'; ui.hud.classList.remove('hidden'); }, 500);
    
    canvas = document.getElementById("screen");
    ctx = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
    startTime = Date.now();
    loop();
});

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'h') ui.hud.classList.toggle('hidden');
    if (e.key.toLowerCase() === 's') {
        const link = document.createElement('a');
        link.download = `NEURAL_SCAN_${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    }
});

function updateHUD() {
    if (!audioData) return;
    if (Math.random() > 0.9) ui.cpu.innerText = Math.floor(10 + Math.random() * 25) + "%";
    
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2,'0');
    const s = String(elapsed % 60).padStart(2,'0');
    ui.timer.innerText = `00:${m}:${s}`;

    ui.note.innerText = audioData.note !== "-" ? `${audioData.note}${audioData.octave}` : "--";
    ui.hz.innerText = Math.round(audioData.pitch) + " Hz";
    ui.vol.innerText = Math.floor(audioData.volume * 100) + "%";
}

function loop() {
    requestAnimationFrame(loop);
    updateAudio();
    updateHUD();
    
    const targetSpeed = 0.3 + audioData.volume * 1.4;
    smoothSpeed = smoothSpeed * 0.9 + targetSpeed * 0.1;
    t += smoothSpeed;

    const points = generateHarmonographPoints(t, canvas);
    renderFrame(ctx, points);
}