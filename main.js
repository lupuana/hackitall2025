import { initAudio, updateAudio, audioEngine, audioData, ensureAudioRunning } from "./audio/audioEngine.js";
import { renderFrame, setRenderMode, setPaintingParams, resetPainting } from "./render/renderer.js";

console.log("✅ Main.js v44 (AUTO-HOLD SAVE) Loaded");

const ui = {
    // Boot & FX
    bootLayer: document.getElementById('boot-layer'),
    bootBtn: document.getElementById('engage-btn'),
    leverContainer: document.getElementById('engage-container'),
    console: document.getElementById('console-log'),
    criticalOverlay: document.getElementById('critical-overlay'),
    terminalLog: document.getElementById('live-log'),
    
    // Main HUD
    hud: document.getElementById('hud-layer'),
    timeDisplay: document.getElementById('time-display'),
    
    // Controls
    btnRecord: document.getElementById('btn-record'),
    bulbRec: document.querySelector('.indicator-bulb.red'),
    btnPause: document.getElementById('btn-pause'),
    bulbPause: document.querySelector('.indicator-bulb.yellow'),
    btnReset: document.getElementById('btn-reset'),
    bulbReset: document.querySelector('.indicator-bulb.green'),

    durationInput: document.getElementById('rec-duration'),
    progressBar: document.getElementById('rec-progress'),
    statusText: document.getElementById('rec-status'),
    pitchText: document.getElementById('note-val'),
    
    sensSlider: document.getElementById('ctrl-sens'),
    
    // Mode Switching
    modeDJ: document.getElementById('btn-mode-dj'),
    modeArt: document.getElementById('btn-mode-art')
};

let canvas, ctx;
let isRecording = false, isPaused = false;
let startTime = 0, pausedElapsed = 0, totalDuration = 60;
let activeMode = 'DJ'; 
let isBufferFull = false; // Flag pentru salvare
let overloadOn = false;

// === BOOT SEQUENCE ===
async function runBootSequence() {
    const logs = ["HYDRAULICS... CHECK", "PRESSURE... STABLE", "READY FOR ENGAGE"];
    for (let line of logs) {
        ui.console.innerText = line + "_";
        await new Promise(r => setTimeout(r, 600));
    }
    ui.leverContainer.classList.remove('hidden');
}
runBootSequence();

ui.bootBtn.addEventListener('click', async () => {
    try {
        await initAudio(); await ensureAudioRunning();
        ui.leverContainer.classList.add('lever-pulled');
        setTimeout(() => ui.bootLayer.classList.add('gates-open'), 600);
        setTimeout(() => {
            ui.bootLayer.style.display = 'none';
            ui.hud.classList.remove('hidden');
            ui.bulbReset.classList.add('on');
            ui.statusText.innerText = "ONLINE"; ui.statusText.className = ""; ui.statusText.style.color = "var(--indicator-green)";
        }, 2000);
        canvas = document.getElementById("screen");
        ctx = canvas.getContext("2d");
        resize(); window.addEventListener('resize', resize);
        loop();
    } catch(e) { alert("FAIL: " + e); }
});

function resize() { if(canvas){canvas.width = window.innerWidth; canvas.height = window.innerHeight;} }

// === LOGIC ===
ui.btnRecord.addEventListener('click', () => {
    if (isRecording) return;
    totalDuration = parseInt(ui.durationInput.value) || 60;
    
    // Reset States
    isRecording = true; isPaused = false; isBufferFull = false;
    startTime = Date.now(); pausedElapsed = 0;
    
    ui.bulbRec.classList.add('on'); ui.bulbReset.classList.remove('on'); ui.bulbPause.classList.remove('on');
    ui.btnPause.disabled = false;
    ui.statusText.innerText = "REC"; ui.statusText.className = "blink-amber"; ui.statusText.style.color = "var(--indicator-red)";
    
    // Auto switch to Art
    ui.modeArt.click(); 
    
    resetPainting(); setPaintingParams(true, false, totalDuration);
});

ui.btnPause.addEventListener('click', () => {
    if (!isRecording) return;
    if (!isPaused) {
        // PAUSE MANUAL
        isPaused = true; 
        ui.bulbPause.classList.add('on'); ui.bulbRec.classList.remove('on');
        ui.statusText.innerText = "HOLD"; ui.statusText.style.color = "var(--indicator-amber)";
        ui.statusText.className = "";
        pausedElapsed += Date.now() - startTime; 
        setPaintingParams(true, true, totalDuration);
    } else {
        // RESUME
        isPaused = false; 
        ui.bulbPause.classList.remove('on'); ui.bulbRec.classList.add('on');
        ui.statusText.innerText = "REC"; ui.statusText.style.color = "var(--indicator-red)";
        ui.statusText.className = "blink-amber";
        startTime = Date.now(); 
        setPaintingParams(true, false, totalDuration);
    }
});

ui.btnReset.addEventListener('click', () => {
    isRecording = false; isPaused = false; isBufferFull = false;
    ui.bulbRec.classList.remove('on'); ui.bulbPause.classList.remove('on'); ui.bulbReset.classList.add('on');
    ui.btnPause.disabled = true;
    
    ui.statusText.innerText = "IDLE"; ui.statusText.className = ""; ui.statusText.style.color = "var(--indicator-green)";
    ui.progressBar.style.width = '0%';
    
    setPaintingParams(false, false, totalDuration); resetPainting(); 
    ui.modeDJ.click(); 
});

ui.sensSlider.addEventListener('input', (e) => audioEngine.setSensitivity(e.target.value));

// === MODE SWITCHING ===
ui.modeDJ.addEventListener('click', () => { 
    setRenderMode('DJ'); activeMode = 'DJ';
    document.querySelectorAll('.toggle-switch').forEach(b => b.classList.remove('active')); 
    ui.modeDJ.parentElement.classList.add('active'); 
});

ui.modeArt.addEventListener('click', () => { 
    setRenderMode('ART'); activeMode = 'ART';
    document.querySelectorAll('.toggle-switch').forEach(b => b.classList.remove('active')); 
    ui.modeArt.parentElement.classList.add('active'); 
});

// === SAVE LOGIC (KEY 'S') ===
window.addEventListener('keydown', (e) => {
    // Salvăm doar dacă bufferul e plin (s-a terminat înregistrarea)
    if (e.key.toLowerCase() === 's' && canvas && isBufferFull) {
        const link = document.createElement('a');
        link.download = `CYBER_ART_${Date.now()}.png`; 
        link.href = canvas.toDataURL(); 
        link.click();
        
        // Feedback vizual rapid
        const originalText = ui.statusText.innerText;
        ui.statusText.innerText = "IMAGE SAVED";
        ui.statusText.style.color = "var(--neon-cyan)";
        ui.statusText.className = "";
        setTimeout(() => { 
            ui.statusText.innerText = originalText; 
            ui.statusText.style.color = "var(--indicator-amber)";
            ui.statusText.className = "blink-amber";
        }, 1500);
    }
});

// === TERMINAL LOG ===
function updateTerminal(note, db) {
    if (Math.random() > 0.9) {
        const hex = Math.random().toString(16).substring(2, 6).toUpperCase();
        const line = document.createElement('div');
        line.innerHTML = `> FRQ:${note} :: LEV:${db.toFixed(0)}% :: 0x${hex}`;
        ui.terminalLog.appendChild(line);
        if (ui.terminalLog.children.length > 8) ui.terminalLog.firstChild.remove();
    }
}

function loop() {
    requestAnimationFrame(loop);
    updateAudio();
    
    const now = new Date();
    ui.timeDisplay.innerText = now.toTimeString().split(' ')[0];
    if(audioData) ui.pitchText.innerText = audioData.note === '--' ? '--.-' : audioData.note;
    
    // Overload Logic
    if (audioData) {
        const volPercent = audioData.volume * 100;
        updateTerminal(audioData.note, volPercent);

        if (activeMode === 'DJ') {
            const onThresh = 0.6; // apare mult mai ușor
            const offThresh = 0.55; // hysteresis să nu pâlpâie
            if (!overloadOn && audioData.volume > onThresh) overloadOn = true;
            if (overloadOn && audioData.volume < offThresh) overloadOn = false;

            if (overloadOn) {
                ui.criticalOverlay.classList.remove('hidden');
                document.body.classList.add('ui-glitch');
            } else {
                ui.criticalOverlay.classList.add('hidden');
                document.body.classList.remove('ui-glitch');
            }
        } else {
            overloadOn = false;
            ui.criticalOverlay.classList.add('hidden');
            document.body.classList.remove('ui-glitch');
        }
    }

    if (isRecording) {
        let current = isPaused ? 0 : (Date.now() - startTime);
        let total = (pausedElapsed + current) / 1000;
        let pct = Math.min(100, (total / totalDuration) * 100);
        ui.progressBar.style.width = `${pct}%`;
        
        // Când se termină timpul
        if (total >= totalDuration) {
            // Nu oprim de tot, punem pe HOLD
            if (!isPaused) {
                isPaused = true;
                pausedElapsed = totalDuration * 1000; // Fixăm timpul la maxim
            }
            isBufferFull = true; // Activăm salvarea
            
            // Actualizăm UI pentru starea HOLD - READY TO SAVE
            ui.btnRecord.classList.remove('recording'); // Nu mai clipocește roșu
            ui.bulbRec.classList.remove('on');
            ui.bulbPause.classList.add('on'); // Bec galben aprins
            
            ui.statusText.innerText = "HOLD: PRESS 'S'"; // Mesajul cerut
            ui.statusText.style.color = "var(--indicator-amber)";
            ui.statusText.className = "blink-amber";
            
            // Înghețăm renderer-ul la ultimul cadru
            setPaintingParams(true, true, totalDuration);
        }
    }
    renderFrame(ctx);
}