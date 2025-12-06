import { audioData } from "../audio/audioEngine.js";
import { applyCRTEffects } from "./crtEffects.js";

/* =======================
   DUAL ENGINE RENDERER
========================== */
let currentMode = 'DJ'; // 'DJ' or 'ART'

export function setRenderMode(mode) {
    currentMode = mode;
}

const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

// Smooth States
const smooth = { vol: 0, bass: 0, mid: 0, treble: 0, pitch: 0 };
let rotation = 0;

/* --- MATH UTILS --- */
function getSuperformulaPoints(cx, cy, radius, m, n1, n2, n3, pointCount) {
    const pts = [];
    for (let i = 0; i <= pointCount; i++) {
        const phi = (i / pointCount) * Math.PI * 2;
        const t1 = Math.abs(Math.cos(m * phi / 4));
        const t2 = Math.abs(Math.sin(m * phi / 4));
        const ra = Math.pow(Math.pow(t1, n2) + Math.pow(t2, n3), -1 / n1);
        if (!isFinite(ra)) continue;
        pts.push({ x: cx + radius * ra * Math.cos(phi), y: cy + radius * ra * Math.sin(phi) });
    }
    return pts;
}

/* =======================
   MODE A: DJ / TECHNICAL
   - Spectrum Bars (Simulated)
   - Peak Rings
========================== */
function renderDJ(ctx, w, h, cx, cy) {
    const maxRadius = Math.min(w, h) * 0.35;
    
    // Background tehnic
    ctx.fillStyle = "#020202"; ctx.fillRect(0, 0, w, h);

    // Grid System
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(0, 243, 255, 0.1)";
    ctx.beginPath(); ctx.arc(cx, cy, maxRadius, 0, Math.PI*2); ctx.stroke();
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.arc(cx, cy, maxRadius * 0.6, 0, Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);

    // Spectrum Bars (Simulare 64 benzi)
    const bars = 64;
    const step = (Math.PI * 2) / bars;
    
    for (let i = 0; i < bars; i++) {
        const angle = i * step - Math.PI/2;
        
        // Simulare date spectru din cele 3 benzi disponibile
        let val = 0;
        if (i < 10 || i > 54) val = smooth.bass; // Zona Bass
        else if (i > 20 && i < 44) val = smooth.treble; // Zona Înalte
        else val = smooth.mid; // Zona Medii
        
        // Variație organică
        val *= (0.8 + Math.sin(i * 15.5) * 0.2); 
        const hBar = val * (maxRadius * 0.8);
        
        // Culoare: Verde (mic) -> Galben -> Roșu (tare)
        const hue = 160 - (val * 160); 
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.8)`;
        ctx.fillRect(0, maxRadius * 0.4, 4, hBar); 
        // Peak indicator
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, maxRadius * 0.4 + hBar + 4, 4, 2);
        ctx.restore();
    }

    // Central Woofer
    const kickR = (maxRadius * 0.25) + smooth.bass * 30;
    ctx.beginPath(); ctx.arc(cx, cy, kickR, 0, Math.PI*2);
    ctx.fillStyle = `rgba(0, 243, 255, ${0.1 + smooth.bass * 0.3})`;
    ctx.strokeStyle = "rgba(0, 243, 255, 0.5)";
    ctx.fill(); ctx.stroke();

    // Text Peak Warning
    if (smooth.vol > 0.85) {
        ctx.fillStyle = "red"; ctx.font = "bold 16px monospace";
        ctx.fillText("/// PEAK LIMIT ///", cx - 70, h - 100);
    }
}

/* =======================
   MODE B: ART / ORGANIC (Voice)
   - Shape determined by Pitch
   - Complexity determined by Volume
========================== */
function renderArt(ctx, w, h, cx, cy) {
    const minDim = Math.min(w, h);
    
    // Fade subtil
    ctx.fillStyle = "rgba(5, 5, 10, 0.15)"; ctx.fillRect(0, 0, w, h);
    
    rotation += 0.003;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    // PARAMETRI REACȚIVI LA VOCE
    // Pitch (Hz) dictează forma (m).
    // Voce joasă (100Hz) = m mic (3-4 colțuri). Voce înaltă (800Hz) = m mare.
    let targetM = 4;
    if (audioData.pitch > 0) {
        targetM = Math.floor(audioData.pitch / 50); // ex: 200Hz -> 4
    }
    targetM = Math.max(3, Math.min(18, targetM)); // Limităm între 3 și 18

    // Slider Complexity (n1, n2, n3)
    const complex = window.visualParams.complexity || 0.5;
    const sharp = 0.5 + complex * 4 + smooth.treble * 2;
    
    const r = minDim * 0.35 * (1 + smooth.bass * 0.5);
    const pts = getSuperformulaPoints(0, 0, r, targetM, 0.5 + smooth.bass, sharp, sharp, 300);

    // Draw
    ctx.beginPath();
    pts.forEach((p, i) => i===0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.closePath();

    const hue = 200 + (audioData.pitch / 1000) * 360; // Culoare după notă
    ctx.strokeStyle = `hsla(${hue}, 80%, 60%, 0.8)`;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 20; ctx.shadowColor = ctx.strokeStyle;
    ctx.stroke();

    // Mirror copy
    ctx.rotate(Math.PI);
    ctx.strokeStyle = `hsla(${hue + 180}, 80%, 60%, 0.4)`;
    ctx.stroke();

    ctx.restore();
}

/* =======================
   MAIN LOOP
========================== */
export function renderFrame(ctx, points) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    
    if (!audioData) return;

    // Global Smoothing
    smooth.vol = lerp(smooth.vol, audioData.volume, 0.1);
    smooth.bass = lerp(smooth.bass, audioData.bass, 0.2);
    smooth.mid = lerp(smooth.mid, audioData.mid, 0.1);
    smooth.treble = lerp(smooth.treble, audioData.treble, 0.1);

    if (currentMode === 'DJ') {
        renderDJ(ctx, w, h, w/2, h/2);
    } else {
        renderArt(ctx, w, h, w/2, h/2);
    }

    applyCRTEffects(ctx, 0.4);
}