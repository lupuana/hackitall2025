import { audioData } from "../audio/audioEngine.js";
import { applyCRTEffects } from "./crtEffects.js";

console.log("✅ Renderer v36 (CYBER OVERLOAD) Loaded");

let currentMode = 'DJ';
let resetFlag = true;

// State-ul picturii (Art Mode)
let paintingState = { active: false, paused: false, duration: 30, startTime: 0, elapsedBeforePause: 0 };
let prevX = 0, prevY = 0;
let initialized = false;

// Vars
let harmTime = 0;
let shakeX = 0, shakeY = 0;

// === EXPORTS ===
export function setRenderMode(mode) { currentMode = mode; }
export function setPaintingParams(active, paused, duration) {
    if (active && !paintingState.active) { paintingState.startTime = Date.now(); paintingState.elapsedBeforePause = 0; }
    if (paused && !paintingState.paused) { paintingState.elapsedBeforePause += (Date.now() - paintingState.startTime) / 1000; } 
    else if (!paused && paintingState.paused) { paintingState.startTime = Date.now(); }
    paintingState.active = active; paintingState.paused = paused; paintingState.duration = duration;
}
export function resetPainting() { resetFlag = true; initialized = false; paintingState.elapsedBeforePause = 0; }

const lerp = (start, end, amt) => (1 - amt) * start + amt * end;
const smooth = { vol: 0, bass: 0, mid: 0, treble: 0, pitch: 0 };

/* =======================
   MODE A: CYBER WINGS OVERLOAD (DJ)
========================== */
function renderCyberWings(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;

    // 1. PHYSICS UPDATE
    harmTime += 0.02 + smooth.mid * 0.05; // Viteza crește cu sunetul
    
    // SCREEN SHAKE (Calculăm cât de mult tremură ecranul)
    // Doar dacă basul e puternic (> 0.6)
    if (smooth.bass > 0.6) {
        const shakePower = (smooth.bass - 0.6) * 30; // Intensitate
        shakeX = (Math.random() - 0.5) * shakePower;
        shakeY = (Math.random() - 0.5) * shakePower;
    } else {
        shakeX = 0; shakeY = 0;
    }

    // 2. BACKGROUND (Motion Blur)
    ctx.globalCompositeOperation = "source-over";
    // Dacă basul e MAXIM (Drop), facem un flash alb scurt
    if (smooth.bass > 0.9 && Math.random() > 0.8) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    } else {
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)"; // Fade normal
    }
    ctx.fillRect(0, 0, w, h);

    // Aplicăm Shake-ul la tot ce urmează
    ctx.save();
    ctx.translate(shakeX, shakeY);

    ctx.globalCompositeOperation = "lighter"; // Neon Blend

    // === FUNCȚIA DE DESENARE A ARIPILOR ===
    // O definim ca funcție internă ca să o putem apela de 3 ori (RGB Split)
    const drawWingsLayer = (color, offsetX, offsetY, scaleMod) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 + smooth.bass * 3;
        
        // Parametrii formei
        const wingspan = w * 0.4 * (1 + smooth.bass * 0.4) * scaleMod;
        const height = h * 0.3 * (1 + smooth.mid * 0.3) * scaleMod;
        
        // Câte "nervuri" desenăm
        const layers = 5; 

        for (let l = 0; l < layers; l++) {
            const layerNorm = l / (layers - 1);
            ctx.beginPath();
            
            // Desenăm de la stânga la dreapta
            const steps = 80;
            for (let i = 0; i <= steps; i++) {
                // t merge de la -PI la PI (tot ecranul)
                const t = (i / steps) * Math.PI * 2 - Math.PI;
                
                // MATH: HARMONIC CURVE
                // Baza este un Sinus
                let x = cx + t * (wingspan / Math.PI) + offsetX;
                
                // Modulație (Vibrația aripilor)
                // Treble adaugă "țepi" (jaggedness)
                const jagged = Math.sin(t * 20 + harmTime) * (smooth.treble * 20);
                
                let y = cy + offsetY;
                // Forma de aripă (Gaussian curve approx)
                y -= Math.cos(t) * height * (1 - layerNorm * 0.5);
                
                // Adăugăm vibrația
                y += Math.sin(t * (3 + layerNorm) + harmTime) * (20 + smooth.mid * 50);
                y += jagged; // Adăugăm țepii electrici

                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    };

    // === RGB SPLIT EFFECT (GLITCH) ===
    // Dacă sunetul e tare, desenăm de 3 ori decalat
    if (smooth.bass > 0.5) {
        const split = smooth.bass * 15; // Distanța dintre culori
        
        // Layer 1: RED (Stânga)
        drawWingsLayer("rgba(255, 0, 60, 0.7)", -split, 0, 1.02);
        
        // Layer 2: CYAN (Dreapta)
        drawWingsLayer("rgba(0, 243, 255, 0.7)", split, 0, 0.98);
        
        // Layer 3: WHITE (Centru - Nucleul fierbinte)
        ctx.shadowBlur = 20; ctx.shadowColor = "#fff";
        drawWingsLayer("#ffffff", 0, 0, 1.0);
        ctx.shadowBlur = 0;
    } else {
        // Mod Calm (Doar Cyan/Blue)
        const hue = 180 + smooth.mid * 50;
        ctx.shadowBlur = 10; ctx.shadowColor = `hsla(${hue}, 100%, 50%, 1)`;
        drawWingsLayer(`hsla(${hue}, 100%, 60%, 0.9)`, 0, 0, 1.0);
        ctx.shadowBlur = 0;
    }

    // === REACTOR CORE (Centrul) ===
    // Un cerc care explodează
    const coreR = 30 + smooth.bass * 80;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI*2);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    // Linii radiale din centru
    if (smooth.treble > 0.3) {
        for(let i=0; i<8; i++) {
            const a = (i/8)*Math.PI*2 + harmTime;
            const len = coreR + smooth.treble * 50;
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(a)*len, cy + Math.sin(a)*len);
        }
    }
    ctx.stroke();

    ctx.restore(); // Gata cu Shake-ul
}

/* =======================
   MODE B: CYMATICS PAINTER (Păstrat Stabil)
========================== */
function renderCymatics(ctx, w, h, startTime, totalDuration) {
    const cx = w/2; const cy = h/2;
    if (resetFlag) {
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "#000000"; ctx.fillRect(0, 0, w, h);
        resetFlag = false; prevX = cx; prevY = cy; initialized = false; return;
    }
    if (!paintingState.active || paintingState.paused) return;

    const currentRun = (Date.now() - paintingState.startTime) / 1000;
    const total = paintingState.elapsedBeforePause + currentRun;
    const progress = Math.min(1, total / paintingState.duration);

    const rotations = 20; 
    const angle = progress * (Math.PI * 2 * rotations);
    const maxR = Math.min(w, h) * 0.40; 
    const baseR = progress * maxR;

    let sym = 3;
    if (audioData.pitch > 50) sym = 3 + Math.floor(audioData.pitch / 150);
    smooth.pitch = lerp(smooth.pitch, sym, 0.1);
    
    // Scale factor pentru final
    const scale = 1.0 + (progress * 2.5); 
    const vib = smooth.vol * 60 * scale;
    const grit = (Math.random()-0.5) * smooth.treble * 20 * scale;

    const shape = Math.cos(smooth.pitch * angle) * vib;
    const r = baseR + shape + grit;

    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;

    ctx.globalCompositeOperation = "lighter";
    if (!initialized) { prevX = x; prevY = y; initialized = true; }

    const hue = 180 + (progress * 140); 
    ctx.lineWidth = (1 + smooth.vol * 3) * (0.8 + progress);
    ctx.strokeStyle = `hsla(${hue}, 100%, 60%, 0.8)`;
    ctx.lineCap = "round";

    ctx.beginPath(); ctx.moveTo(prevX, prevY); ctx.lineTo(x, y); ctx.stroke();
    prevX = x; prevY = y;
}

export function renderFrame(ctx) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    if (!audioData) return;

    // Smoothing agresiv pentru "Punch"
    smooth.vol = lerp(smooth.vol, audioData.volume, 0.2); // 0.2 e mai rapid ca 0.1
    smooth.bass = lerp(smooth.bass, audioData.bass, 0.25); // Bas foarte rapid
    smooth.mid = lerp(smooth.mid, audioData.mid, 0.15);
    smooth.treble = lerp(smooth.treble, audioData.treble, 0.15);

    if (currentMode === 'DJ') {
        renderCyberWings(ctx, w, h);
        applyCRTEffects(ctx, 0.4); 
    } else {
        renderCymatics(ctx, w, h, paintingState.startTime, paintingState.duration);
    }
}