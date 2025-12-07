import { initAudio, updateAudio, audioEngine, audioData, ensureAudioRunning } from "./audio/audioEngine.js";
import { renderFrame, setRenderMode, setPaintingParams, resetPainting } from "./render/renderer.js";

console.log("✅ Main.js v44 (AUTO-HOLD SAVE) Loaded");

const ui = {
    
    bootLayer: document.getElementById('boot-layer'),
    bootBtn: document.getElementById('start-btn'),
    leverContainer: document.getElementById('engage-container'),
    console: document.getElementById('console-log'),
    criticalOverlay: document.getElementById('critical-overlay'),
    terminalLog: document.getElementById('live-log'),

    hud: document.getElementById('hud-layer'),
    timeDisplay: document.getElementById('time-display'),

    btnRecord: document.getElementById('btn-record'),
    bulbRec: document.querySelector('.indicator-bulb.red'),
    btnPause: document.getElementById('btn-pause'),
    bulbPause: document.querySelector('.indicator-bulb.yellow'),
    btnReset: document.getElementById('btn-reset'),
    bulbReset: document.querySelector('.indicator-bulb.green'),

    durationInput: document.getElementById('rec-duration'),
    progressBar: document.getElementById('rec-progress'),
    progressRemaining: document.getElementById('rec-remaining'),
    statusText: document.getElementById('rec-status'),
    pitchText: document.getElementById('note-val'),
    
    sensSlider: document.getElementById('ctrl-sens'),

    btnAnalysis: document.getElementById('btn-analysis'),
    analysisStatus: document.getElementById('analysis-status'),
    analysisVol: document.getElementById('analysis-vol'),
    analysisBass: document.getElementById('analysis-bass'),
    analysisMid: document.getElementById('analysis-mid'),
    analysisTreble: document.getElementById('analysis-treble'),
    analysisVar: document.getElementById('analysis-var'),

    modeDJ: document.getElementById('btn-mode-dj'),
    modeArt: document.getElementById('btn-mode-art'),
    modeLab: document.getElementById('btn-mode-lab'),
    modeEQ: document.getElementById('btn-mode-eq'),

    modsBtn: document.getElementById('btn-mods'),
    modsStatus: document.getElementById('mods-status'),
    modsPanel: document.getElementById('mods-panel'),
    modsBackdrop: document.querySelector('.mods-backdrop'),
    modsClose: document.getElementById('mods-close'),
    modDemo: document.getElementById('mod-demo'),
    modDemoStatus: document.getElementById('mod-demo-status'),
    modKonamiPill: document.getElementById('mod-konami-pill'),
    modArpToggle: document.getElementById('mod-arp-toggle'),
    modBeatToggle: document.getElementById('mod-beat-toggle'),
    modBeatPrompt: document.getElementById('mod-beat-prompt'),
    modRecorder: document.getElementById('mod-recorder'),
    modRecorderStatus: document.getElementById('mod-recorder-status'),
    modChallenge: document.getElementById('mod-challenge'),
    modChallengeStatus: document.getElementById('mod-challenge-status'),
    modCrtToggle: document.getElementById('mod-crt-toggle'),

    themeDefault: document.getElementById('theme-default'),
    themeNeon: document.getElementById('theme-neon'),
    themeAmber: document.getElementById('theme-amber'),
    themeIce: document.getElementById('theme-ice'),
    perfToggle: document.getElementById('perf-toggle'),

    hudToggle: document.getElementById('hud-toggle')
};

const bootFrame = document.querySelector('.boot-frame');
const bootLog = document.querySelector('.boot-log');

let bootDodges = 0;

let canvas, ctx;
let isRecording = false, isPaused = false;
let startTime = 0, pausedElapsed = 0, totalDuration = 60;
let activeMode = 'DJ'; 
let isBufferFull = false; 
let overloadOn = false;
let analysisOn = false;
let hudHidden = false;
let perfMode = false;
const analysisSmooth = { vol: 0, bass: 0, mid: 0, treble: 0, variability: 0 };

function setModsOpen(open) {
    modsOpen = open;
    ui.modsPanel.classList.toggle('hidden', !open);
    if (ui.modsStatus) ui.modsStatus.classList.toggle('on', open);
}

function runDemoScene() {
    if (demoTimer) return;
    demoRestoreMode = activeMode;
    ui.modDemo.disabled = true;
    ui.modDemoStatus.textContent = 'Running 7s...';
    const steps = ['DJ','EQ','LAB','ART','DJ'];
    steps.forEach((mode, i) => {
        setTimeout(() => {
            if (mode === 'DJ') ui.modeDJ.click();
            if (mode === 'EQ') ui.modeEQ.click();
            if (mode === 'LAB') ui.modeLab.click();
            if (mode === 'ART') ui.modeArt.click();
        }, i * 1400);
    });
    demoTimer = setTimeout(() => {
        demoTimer = null;
        ui.modDemo.disabled = false;
        ui.modDemoStatus.textContent = 'Done';
        if (demoRestoreMode === 'DJ') ui.modeDJ.click();
        if (demoRestoreMode === 'EQ') ui.modeEQ.click();
        if (demoRestoreMode === 'LAB') ui.modeLab.click();
        if (demoRestoreMode === 'ART') ui.modeArt.click();
    }, 7200);
}

function handleKonami(key) {
    if (!ui.modKonamiPill) return;
    if (key.toLowerCase() === konamiSeq[konamiIndex].toLowerCase()) {
        konamiIndex += 1;
        if (konamiIndex === konamiSeq.length) {
            konamiIndex = 0;
            document.body.classList.toggle('konami-mode');
            const on = document.body.classList.contains('konami-mode');
            ui.modKonamiPill.textContent = on ? 'ALT PALETTE ON' : 'Palette reset';
        } else {
            ui.modKonamiPill.textContent = `Step ${konamiIndex}/${konamiSeq.length}`;
        }
    } else {
        konamiIndex = 0;
        ui.modKonamiPill.textContent = 'Awaiting code';
    }
}

function setArpEnabled(on) {
    arpEnabled = on;
    if (ui.modArpToggle) ui.modArpToggle.textContent = on ? 'On' : 'Off';
}

function applyTheme(name) {
    const preset = themePresets[name] || themePresets.default;
    const root = document.documentElement.style;
    Object.entries(preset).forEach(([k,v]) => root.setProperty(k, v));
}

function playArp(freq) {
    const ctxAudio = audioEngine.audioContext;
    if (!ctxAudio) return;
    const now = ctxAudio.currentTime;
    const osc = ctxAudio.createOscillator();
    const gain = ctxAudio.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    osc.connect(gain).connect(ctxAudio.destination);
    osc.start(now);
    osc.stop(now + 0.35);
}

function startModsRecording() {
    if (!audioEngine.stream || recorderActive) {
        if (!audioEngine.stream) ui.modRecorderStatus.textContent = 'Need mic access';
        return;
    }
    ui.modRecorderStatus.textContent = 'Recording 15s...';
    recorderActive = true;
    let rec;
    try {
        rec = new MediaRecorder(audioEngine.stream);
    } catch (err) {
        recorderActive = false;
        ui.modRecorderStatus.textContent = 'MediaRecorder unsupported';
        return;
    }
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    rec.onstop = () => {
        recorderActive = false;
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `mods_recording_${Date.now()}.webm`; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        ui.modRecorderStatus.textContent = 'Saved';
    };
    rec.start();
    setTimeout(() => { if (rec.state === 'recording') rec.stop(); }, 15000);
}

function resetChallengeState() {
    challenge.tasks = [
        { id: 'modeLab', label: 'Comută pe LAB', done: false },
        { id: 'gainHigh', label: 'GAIN > 2.0', done: false },
        { id: 'recordTap', label: 'Apasă REC', done: false }
    ];
}

function renderChallengeStatus() {
    if (!ui.modChallengeStatus) return;
    const done = challenge.tasks.filter(t => t.done).length;
    const total = challenge.tasks.length;
    const timeText = challenge.active ? `${challenge.countdown}s` : 'Ready';
    ui.modChallengeStatus.textContent = `${timeText} · ${done}/${total}`;
}

function markTask(id) {
    if (!challenge.active) return;
    const t = challenge.tasks.find(x => x.id === id);
    if (t) t.done = true;
    renderChallengeStatus();
}

function startChallenge() {
    if (challenge.active) return;
    resetChallengeState();
    challenge.active = true;
    challenge.countdown = 45;
    renderChallengeStatus();
    if (challenge.timer) clearInterval(challenge.timer);
    challenge.timer = setInterval(() => {
        challenge.countdown -= 1;
        if (challenge.countdown <= 0) {
            clearInterval(challenge.timer);
            challenge.timer = null; challenge.active = false;
            const done = challenge.tasks.filter(t => t.done).length;
            ui.modChallengeStatus.textContent = `Done ${done}/${challenge.tasks.length}`;
        } else {
            renderChallengeStatus();
        }
    }, 1000);
}

let modsOpen = false;
let demoTimer = null;
let demoRestoreMode = 'DJ';
let konamiIndex = 0;
const konamiSeq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let arpEnabled = false;
let recorderActive = false;
let crtWobble = false;
let challenge = { active: false, timer: null, countdown: 0, tasks: [] };
let beatPadsEnabled = false;
let beatMaster = null;

const themePresets = {
    default: {
        '--metal-dark': '#0a0a10', '--metal-light': '#141420', '--indicator-red': '#ff0040',
        '--indicator-amber': '#ff9000', '--indicator-green': '#00ffcc', '--neon-cyan': '#00ffff',
        '--neon-magenta': '#ff00ff', '--neon-violet': '#8000ff', '--crt-green': '#39ff14'
    },
    neon: {
        '--metal-dark': '#06060d', '--metal-light': '#0f0f1c', '--indicator-red': '#ff3b6b',
        '--indicator-amber': '#ffb347', '--indicator-green': '#28ffd0', '--neon-cyan': '#5af2ff',
        '--neon-magenta': '#ff5ad1', '--neon-violet': '#9c6bff', '--crt-green': '#4dff7a'
    },
    amber: {
        '--metal-dark': '#0c0906', '--metal-light': '#16100b', '--indicator-red': '#ff6f3c',
        '--indicator-amber': '#ffb347', '--indicator-green': '#ffd166', '--neon-cyan': '#f2e9d0',
        '--neon-magenta': '#ff9e6d', '--neon-violet': '#d2743a', '--crt-green': '#ffb347'
    },
    ice: {
        '--metal-dark': '#061018', '--metal-light': '#0c1c2a', '--indicator-red': '#5ec5ff',
        '--indicator-amber': '#7fd8ff', '--indicator-green': '#a6fff6', '--neon-cyan': '#7ff0ff',
        '--neon-magenta': '#9cd4ff', '--neon-violet': '#7fb4ff', '--crt-green': '#b8fffb'
    }
};

const beatPads = {
    bass: { keys: { q: 55.0, w: 65.41, e: 73.42, r: 82.41 }, type: 'sawtooth', gain: 0.18 },
    lead: { keys: { a: 220.0, s: 247.0, d: 261.63, f: 293.66, g: 329.63 }, type: 'square', gain: 0.14 },
    perc: { keys: { '1': 'kick', '2': 'snare', '3': 'hat' } }
};

function ensureBeatNodes() {
    if (!audioEngine.audioContext || !audioEngine.analyser) return false;
    if (!beatMaster) {
        beatMaster = audioEngine.audioContext.createGain();
        beatMaster.gain.value = 0.24;
        beatMaster.connect(audioEngine.analyser);
        beatMaster.connect(audioEngine.audioContext.destination);
    }
    return true;
}

function setBeatPadsEnabled(on) {
    beatPadsEnabled = on;
    if (on && !ensureBeatNodes()) {
        beatPadsEnabled = false;
        if (ui.modBeatPrompt) ui.modBeatPrompt.textContent = 'Pornește START ca să se lege audio';
        if (ui.modBeatToggle) ui.modBeatToggle.textContent = 'Off';
        return;
    }
    if (ui.modBeatToggle) ui.modBeatToggle.textContent = on ? 'On' : 'Off';
    if (ui.modBeatPrompt) ui.modBeatPrompt.textContent = on ? 'PLAY: QWER bass · ASDFG lead · 1/2/3 perc' : 'Bass: QWER · Lead: ASDFG · Perc: 1/2/3';
}

function playBeatNote(freq, cfg) {
    if (!ensureBeatNodes()) return;
    const ctxAudio = audioEngine.audioContext;
    const now = ctxAudio.currentTime;
    const osc = ctxAudio.createOscillator();
    const gain = ctxAudio.createGain();

    osc.type = cfg.type || 'square';
    osc.frequency.setValueAtTime(freq, now);

    const peak = cfg.gain || 0.12;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (cfg.decay || 0.55));

    osc.connect(gain).connect(beatMaster);
    osc.start(now);
    osc.stop(now + 0.6);
}

function playPerc(type) {
    if (!ensureBeatNodes()) return;
    const ctxAudio = audioEngine.audioContext;
    const now = ctxAudio.currentTime;

    if (type === 'kick') {
        const osc = ctxAudio.createOscillator();
        const gain = ctxAudio.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(48, now + 0.22);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.32, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
        osc.connect(gain).connect(beatMaster);
        osc.start(now);
        osc.stop(now + 0.32);
        return;
    }

    const buffer = ctxAudio.createBuffer(1, ctxAudio.sampleRate * 0.35, ctxAudio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctxAudio.createBufferSource();
    noise.buffer = buffer;

    let filter = null;
    if (type === 'hat') {
        filter = ctxAudio.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(8000, now);
    }

    const gain = ctxAudio.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    const peak = type === 'snare' ? 0.22 : 0.12;
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    if (filter) noise.connect(filter).connect(gain).connect(beatMaster);
    else noise.connect(gain).connect(beatMaster);
    noise.start(now);
    noise.stop(now + 0.22);
}

function handleBeatPadKey(key) {
    if (!beatPadsEnabled) return false;
    const k = key.toLowerCase();
    if (beatPads.bass.keys[k]) { playBeatNote(beatPads.bass.keys[k], beatPads.bass); return true; }
    if (beatPads.lead.keys[k]) { playBeatNote(beatPads.lead.keys[k], beatPads.lead); return true; }
    if (beatPads.perc.keys[k]) { playPerc(beatPads.perc.keys[k]); return true; }
    return false;
}

async function runBootSequence() {
    const logs = ["HYDRAULICS... CHECK", "PRESSURE... STABLE", "READY FOR ENGAGE"];
    for (let line of logs) {
        ui.console.innerText = line + "_";
        await new Promise(r => setTimeout(r, 600));
    }
    ui.leverContainer.classList.remove('hidden');
}
runBootSequence();

if (ui.modsBtn) ui.modsBtn.addEventListener('click', () => setModsOpen(true));
if (ui.modsClose) ui.modsClose.addEventListener('click', () => setModsOpen(false));
if (ui.modsBackdrop) ui.modsBackdrop.addEventListener('click', () => setModsOpen(false));
if (ui.modDemo) ui.modDemo.addEventListener('click', runDemoScene);
if (ui.modArpToggle) ui.modArpToggle.addEventListener('click', () => setArpEnabled(!arpEnabled));
if (ui.modBeatToggle) ui.modBeatToggle.addEventListener('click', () => setBeatPadsEnabled(!beatPadsEnabled));
if (ui.modRecorder) ui.modRecorder.addEventListener('click', startModsRecording);
if (ui.modChallenge) ui.modChallenge.addEventListener('click', startChallenge);
if (ui.modCrtToggle) ui.modCrtToggle.addEventListener('click', () => {
    crtWobble = !crtWobble;
    ui.modCrtToggle.textContent = crtWobble ? 'On' : 'Off';
});
if (ui.themeDefault) ui.themeDefault.addEventListener('click', () => applyTheme('default'));
if (ui.themeNeon) ui.themeNeon.addEventListener('click', () => applyTheme('neon'));
if (ui.themeAmber) ui.themeAmber.addEventListener('click', () => applyTheme('amber'));
if (ui.themeIce) ui.themeIce.addEventListener('click', () => applyTheme('ice'));
if (ui.perfToggle) ui.perfToggle.addEventListener('click', () => {
    perfMode = !perfMode;
    document.body.classList.toggle('perf-mode', perfMode);
    ui.perfToggle.textContent = perfMode ? 'PERF ON' : 'PERF OFF';
});
if (ui.hudToggle) ui.hudToggle.addEventListener('click', () => {
    hudHidden = !hudHidden;
    document.body.classList.toggle('hud-hidden', hudHidden);
    ui.hudToggle.textContent = hudHidden ? 'HUD ▲' : 'HUD ▼';
});
resetChallengeState();
renderChallengeStatus();

ui.bootBtn.addEventListener('click', async (ev) => {
    if (bootDodges < 3) {
        ev.preventDefault();
        bootDodges += 1;
        if (bootFrame && ui.bootBtn) {
            const frameRect = bootFrame.getBoundingClientRect();
            const btnRect = ui.bootBtn.getBoundingClientRect();
            const pad = 60;
            const maxX = Math.max(0, (frameRect.width / 2) - btnRect.width - pad);
            const maxY = Math.max(0, (frameRect.height / 2) - btnRect.height - pad);
            const dx = (Math.random() * 2 - 1) * maxX;
            const dy = (Math.random() * 2 - 1) * maxY;
            ui.bootBtn.style.setProperty('--dodge-x', `${dx}px`);
            ui.bootBtn.style.setProperty('--dodge-y', `${dy}px`);
        }
        if (bootLog) bootLog.textContent = `[SKIP ${bootDodges}/3] BUTTON EVADED`;
        return;
    }

    ui.bootBtn.style.setProperty('--dodge-x', '0px');
    ui.bootBtn.style.setProperty('--dodge-y', '0px');
    if (bootLog) bootLog.textContent = '[ENGAGE] CALIBRATING AUDIO...';

    try {
        await initAudio(); await ensureAudioRunning();
        ui.bootLayer.classList.add('boot-hide');
        setTimeout(() => {
            ui.bootLayer.style.display = 'none';
            ui.hud.classList.remove('hidden');
            ui.bulbReset.classList.add('on');
            ui.statusText.innerText = "ONLINE"; ui.statusText.className = ""; ui.statusText.style.color = "var(--indicator-green)";
        }, 800);
        canvas = document.getElementById("screen");
        ctx = canvas.getContext("2d");
        resize(); window.addEventListener('resize', resize);
        loop();
    } catch(e) { alert("FAIL: " + e); }
});

function resize() { if(canvas){canvas.width = window.innerWidth; canvas.height = window.innerHeight;} }

ui.btnRecord.addEventListener('click', () => {
    if (isRecording) return;
    totalDuration = parseInt(ui.durationInput.value) || 60;

    isRecording = true; isPaused = false; isBufferFull = false;
    startTime = Date.now(); pausedElapsed = 0;
    
    ui.bulbRec.classList.add('on'); ui.bulbReset.classList.remove('on'); ui.bulbPause.classList.remove('on');
    ui.btnPause.disabled = false;
    ui.statusText.innerText = "REC"; ui.statusText.className = "blink-amber"; ui.statusText.style.color = "var(--indicator-red)";

    ui.modeArt.click(); 
    
    resetPainting(); setPaintingParams(true, false, totalDuration);
    markTask('recordTap');
});

ui.btnPause.addEventListener('click', () => {
    if (!isRecording) return;
    if (!isPaused) {
        
        isPaused = true; 
        ui.bulbPause.classList.add('on'); ui.bulbRec.classList.remove('on');
        ui.statusText.innerText = "HOLD"; ui.statusText.style.color = "var(--indicator-amber)";
        ui.statusText.className = "";
        pausedElapsed += Date.now() - startTime; 
        setPaintingParams(true, true, totalDuration);
    } else {
        
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
    ui.progressRemaining.textContent = '--';
    ui.progressRemaining.classList.remove('low-time');
    
    setPaintingParams(false, false, totalDuration); resetPainting(); 
    ui.modeDJ.click(); 
});

ui.sensSlider.addEventListener('input', (e) => audioEngine.setSensitivity(e.target.value));
ui.sensSlider.addEventListener('input', (e) => { if (parseFloat(e.target.value) > 2.0) markTask('gainHigh'); });

ui.btnAnalysis.addEventListener('click', () => {
    analysisOn = !analysisOn;
    ui.analysisStatus.textContent = analysisOn ? 'ON' : 'OFF';
    ui.analysisStatus.classList.toggle('on', analysisOn);
    ui.analysisStatus.classList.toggle('off', !analysisOn);
});

ui.modeDJ.addEventListener('click', () => { 
    setRenderMode('DJ'); activeMode = 'DJ';
    document.querySelectorAll('.toggle-switch').forEach(b => b.classList.remove('active')); 
    ui.modeDJ.classList.add('active'); 
});

ui.modeArt.addEventListener('click', () => { 
    setRenderMode('ART'); activeMode = 'ART';
    document.querySelectorAll('.toggle-switch').forEach(b => b.classList.remove('active')); 
    ui.modeArt.classList.add('active'); 
});

ui.modeLab.addEventListener('click', () => {
    setRenderMode('LAB'); activeMode = 'LAB';
    document.querySelectorAll('.toggle-switch').forEach(b => b.classList.remove('active'));
    ui.modeLab.classList.add('active');
    markTask('modeLab');
});

ui.modeEQ.addEventListener('click', () => {
    setRenderMode('EQ'); activeMode = 'EQ';
    document.querySelectorAll('.toggle-switch').forEach(b => b.classList.remove('active'));
    ui.modeEQ.classList.add('active');
});

window.addEventListener('keydown', (e) => {
    if (e.target && ['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
    handleKonami(e.key);
    const key = e.key.toLowerCase();
    if (handleBeatPadKey(key)) return;
    const arpMap = { 'a': 261.63, 's': 293.66, 'd': 329.63, 'f': 349.23, 'g': 392.00 };
    if (arpEnabled && arpMap[key]) playArp(arpMap[key]);

    if (key === 's' && canvas && isBufferFull) {
        const link = document.createElement('a');
        link.download = `CYBER_ART_${Date.now()}.png`; 
        link.href = canvas.toDataURL(); 
        link.click();

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

function updateTerminal(note, db) {
    if (!ui.terminalLog) return;
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

    if (audioData) {
        const volPercent = audioData.volume * 100;
        updateTerminal(audioData.note, volPercent);

        if (analysisOn) {
            analysisSmooth.vol = analysisSmooth.vol * 0.9 + (audioData.volume || 0) * 0.1;
            analysisSmooth.bass = analysisSmooth.bass * 0.9 + (audioData.bass || 0) * 0.1;
            analysisSmooth.mid = analysisSmooth.mid * 0.9 + (audioData.mid || 0) * 0.1;
            analysisSmooth.treble = analysisSmooth.treble * 0.9 + (audioData.treble || 0) * 0.1;
            analysisSmooth.variability = analysisSmooth.variability * 0.9 + (audioData.variability || 0) * 0.1;

            ui.analysisVol.textContent = `${Math.round(analysisSmooth.vol * 100)}%`;
            ui.analysisBass.textContent = `${Math.round(analysisSmooth.bass * 100)}%`;
            ui.analysisMid.textContent = `${Math.round(analysisSmooth.mid * 100)}%`;
            ui.analysisTreble.textContent = `${Math.round(analysisSmooth.treble * 100)}%`;
            ui.analysisVar.textContent = `${Math.round(analysisSmooth.variability * 100)}%`;
        }

        if (activeMode === 'DJ') {
            const onThresh = 0.78; 
            const offThresh = 0.72; 
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

    if (canvas) {
        if (crtWobble && audioData) {
            const wob = Math.min(1, (audioData.bass || 0) * 1.2);
            const dx = (Math.random() - 0.5) * wob * 6;
            const dy = (Math.random() - 0.5) * wob * 4;
            const skew = wob * 1.4;
            canvas.style.transform = `translate(${dx}px, ${dy}px) skew(${skew}deg, ${-skew * 0.5}deg)`;
            canvas.style.filter = `contrast(${1 + wob * 0.12}) saturate(${1 + wob * 0.22})`;
        } else {
            canvas.style.transform = '';
            canvas.style.filter = '';
        }
    }

    if (isRecording) {
        let current = isPaused ? 0 : (Date.now() - startTime);
        let total = (pausedElapsed + current) / 1000;
        let pct = Math.min(100, (total / totalDuration) * 100);
        ui.progressBar.style.width = `${pct}%`;
        const remaining = Math.max(0, Math.ceil(totalDuration - total));
        ui.progressRemaining.textContent = `${remaining}s`;
        const low = remaining <= 5 && isRecording && !isPaused;
        ui.progressRemaining.classList.toggle('low-time', low);

        if (total >= totalDuration) {
            
            if (!isPaused) {
                isPaused = true;
                pausedElapsed = totalDuration * 1000; 
            }
            isBufferFull = true; 

            ui.btnRecord.classList.remove('recording'); 
            ui.bulbRec.classList.remove('on');
            ui.bulbPause.classList.add('on'); 
            
            ui.statusText.innerText = "HOLD: PRESS 'S'"; 
            ui.statusText.style.color = "var(--indicator-amber)";
            ui.statusText.className = "blink-amber";

            ui.progressRemaining.textContent = '0s';
            ui.progressRemaining.classList.add('low-time');

            setPaintingParams(true, true, totalDuration);
        }
    }
    renderFrame(ctx);
}