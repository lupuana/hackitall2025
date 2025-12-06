import { initAudio, updateAudio, audioEngine, audioData, ensureAudioRunning } from "./audio/audioEngine.js";
import { renderFrame, setRenderMode, setPaintingParams, resetPainting } from "./render/renderer.js";

console.log("✅ Main.js v99 Loaded");

const ui = {
    boot: document.getElementById('boot-sequence'),
    console: document.getElementById('console-log'),
    btn: document.getElementById('engage-btn'),
    hud: document.getElementById('hud-layer'),
    // Rec
    btnRecord: document.getElementById('btn-record'),
    btnPause: document.getElementById('btn-pause'),
    btnReset: document.getElementById('btn-reset'),
    timeDisplay: document.getElementById('time-display'),
    progress: document.getElementById('rec-progress'),
    duration: document.getElementById('rec-duration'),
    status: document.getElementById('rec-status'),
    // Data
    note: document.getElementById('note-val'),
    // Controls
    controls: { sens: document.getElementById('ctrl-sens') },
    // Modes
    modeDJ: document.getElementById('btn-mode-dj'),
    modeArt: document.getElementById('btn-mode-art')
};

let canvas, ctx;
let isRecording = false, isPaused = false;
let startTime = 0, pausedElapsed = 0, totalDuration = 60;

// === CRAZY BOOT SEQUENCE ===
async function runBootSequence() {
    const logs = [
        "KERNEL_PANIC: RECOVERING...",
        "BYPASSING FIREWALL... SUCCESS",
        "LOADING AUDIO DRIVERS... [OK]",
        "INITIALIZING NEURAL NET... [OK]",
        "CONNECTING TO MAINFRAME...",
        "SYSTEM_READY."
    ];
    
    for (let i = 0; i < logs.length; i++) {
        // Random delay pentru haos
        await new Promise(r => setTimeout(r, Math.random() * 200 + 50));
        const div = document.createElement('div');
        div.innerText = `> ${logs[i]}`;
        // Culori random pentru linii
        if(Math.random() > 0.7) div.style.color = "#ff0055";
        if(Math.random() > 0.9) div.style.color = "#fcee0a";
        ui.console.appendChild(div);
        ui.console.scrollTop = ui.console.scrollHeight;
    }
    setTimeout(() => ui.btn.classList.remove('hidden'), 300);
}
runBootSequence();

// === START ===
ui.btn.addEventListener('click', async () => {
    try {
        await initAudio();
        await ensureAudioRunning();
        ui.boot.style.display = 'none';
        ui.hud.classList.remove('hidden');
        
        canvas = document.getElementById("screen");
        ctx = canvas.getContext("2d");
        resize(); window.addEventListener('resize', resize);
        loop();
    } catch(e) { alert("Mic Error"); }
});

function resize() { if(canvas){canvas.width = window.innerWidth; canvas.height = window.innerHeight;} }

// === LOGICĂ ÎNREGISTRARE ===
ui.btnRecord.addEventListener('click', () => {
    if (isRecording) return;
    totalDuration = parseInt(ui.duration.value) || 60;
    
    isRecording = true; isPaused = false;
    startTime = Date.now(); pausedElapsed = 0;
    
    ui.btnRecord.innerText = "REC";
    ui.btnRecord.classList.add('recording');
    ui.btnPause.disabled = false; ui.btnPause.classList.remove('paused');
    ui.status.innerText = "RECORDING"; ui.status.style.color = "#ff0055";
    
    ui.modeArt.click();
    resetPainting();
    setPaintingParams(true, false, totalDuration);
});

ui.btnPause.addEventListener('click', () => {
    if (!isRecording) return;
    if (!isPaused) {
        isPaused = true;
        ui.btnPause.classList.add('paused');
        ui.status.innerText = "PAUSED"; ui.status.style.color = "#ffaa00";
        ui.btnRecord.classList.remove('recording');
        pausedElapsed += Date.now() - startTime;
        setPaintingParams(true, true, totalDuration);
    } else {
        isPaused = false;
        ui.btnPause.classList.remove('paused');
        ui.status.innerText = "RECORDING"; ui.status.style.color = "#ff0055";
        ui.btnRecord.classList.add('recording');
        startTime = Date.now();
        setPaintingParams(true, false, totalDuration);
    }
});

ui.btnReset.addEventListener('click', () => {
    isRecording = false; isPaused = false;
    ui.btnRecord.classList.remove('recording');
    ui.btnPause.disabled = true; ui.btnPause.classList.remove('paused');
    ui.status.innerText = "READY"; ui.status.style.color = "#00f3ff";
    ui.timeDisplay.innerText = `00:00 / 00:${totalDuration}`;
    ui.progress.style.width = '0%';
    setPaintingParams(false, false, totalDuration);
    resetPainting();
});

// Controls
ui.controls.sens.addEventListener('input', (e) => audioEngine.setSensitivity(e.target.value));
ui.modeDJ.addEventListener('click', () => { setRenderMode('DJ'); ui.modeDJ.classList.add('active'); ui.modeArt.classList.remove('active'); });
ui.modeArt.addEventListener('click', () => { setRenderMode('ART'); ui.modeArt.classList.add('active'); ui.modeDJ.classList.remove('active'); });

// Save
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 's' && canvas) {
        const link = document.createElement('a');
        link.download = `CYMATICS_${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    }
});

function loop() {
    requestAnimationFrame(loop);
    updateAudio();
    if(audioData) ui.note.innerText = audioData.note;
    
    if (isRecording) {
        let current = isPaused ? 0 : (Date.now() - startTime);
        let total = (pausedElapsed + current) / 1000;
        let pct = Math.min(100, (total / totalDuration) * 100);
        
        ui.progress.style.width = `${pct}%`;
        ui.timeDisplay.innerText = `${Math.floor(total).toString().padStart(2,'0')} / ${totalDuration}`;
        
        if (total >= totalDuration) {
            isRecording = false;
            ui.btnRecord.classList.remove('recording');
            ui.btnPause.disabled = true;
            ui.status.innerText = "DONE (PRESS S)";
            setPaintingParams(false, false, totalDuration);
        }
    }
    renderFrame(ctx);
}