import { audioData } from "../audio/audioEngine.js";
import { applyCRTEffects } from "./crtEffects.js";

console.log("✅ Renderer v46 (HARMONIC SWARM) Loaded");

let currentMode = 'DJ';
let resetFlag = true;

// State-ul picturii (Art Mode)
let paintingState = { active: false, paused: false, duration: 30, startTime: 0, elapsedBeforePause: 0 };
let prevX = 0, prevY = 0;
let initialized = false;

// === VARS ===
const NUM_AGENTS = 15;
const NUM_PARTICLES = 26;
let agents = [];
let t = 0;
let pulses = [];
let particles = [];
let sparks = [];

// === EXPORTS ===
export function setRenderMode(mode) { currentMode = mode; resetFlag = true; }
export function setPaintingParams(active, paused, duration) {
    if (active && !paintingState.active) { paintingState.startTime = Date.now(); paintingState.elapsedBeforePause = 0; }
    if (paused && !paintingState.paused) { paintingState.elapsedBeforePause += (Date.now() - paintingState.startTime) / 1000; } 
    else if (!paused && paintingState.paused) { paintingState.startTime = Date.now(); }
    paintingState.active = active; paintingState.paused = paused; paintingState.duration = duration;
}
export function resetPainting() { resetFlag = true; initialized = false; paintingState.elapsedBeforePause = 0; }

const lerp = (start, end, amt) => (1 - amt) * start + amt * end;
const smooth = { vol: 0, bass: 0, mid: 0, treble: 0, pitch: 0 };
const labSmooth = { vol: 0, bass: 0, mid: 0, treble: 0, variability: 0 };

/* =======================
   MODE EQ: Studio-Style 3-Band Meter
========================== */
function renderEQBars(ctx, w, h) {
    const now = performance.now() * 0.001;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(0, 0, w, h);

    // subtle grid for level reference
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    const rows = 8;
    const top = h * 0.12;
    const height = h * 0.72;
    for (let i = 0; i <= rows; i++) {
        const y = top + (i / rows) * height;
        ctx.beginPath(); ctx.moveTo(w * 0.18, y); ctx.lineTo(w * 0.82, y); ctx.stroke();
    }

    const bars = [
        { label: "BASS", val: smooth.bass, colorTop: "rgba(255,60,90,0.95)", colorLow: "rgba(90,10,20,0.95)" },
        { label: "MID", val: smooth.mid, colorTop: "rgba(245,245,245,0.95)", colorLow: "rgba(60,60,70,0.95)" },
        { label: "TREB", val: smooth.treble, colorTop: "rgba(39,231,255,0.95)", colorLow: "rgba(8,20,30,0.95)" }
    ];

    const barWidth = Math.min(120, w * 0.18);
    const gap = Math.min(90, w * 0.09);
    const totalWidth = barWidth * bars.length + gap * (bars.length - 1);
    const startX = (w - totalWidth) * 0.5;
    const baseY = h * 0.84;
    const maxH = h * 0.6;

    ctx.lineWidth = 2;
    bars.forEach((bar, i) => {
        const x = startX + i * (barWidth + gap);
        const wiggle = Math.sin(now * 3 + i * 1.4) * 0.05;
        const level = Math.max(0.02, Math.min(1, bar.val + wiggle));
        const hgt = level * maxH;
        const y = baseY - hgt;

        const grad = ctx.createLinearGradient(x, baseY, x, y);
        grad.addColorStop(0, bar.colorLow);
        grad.addColorStop(0.5, bar.colorTop);
        grad.addColorStop(1, "rgba(255,255,255,0.9)");

        ctx.fillStyle = grad;
        ctx.shadowColor = bar.colorTop;
        ctx.shadowBlur = 22;
        ctx.fillRect(x, y, barWidth, hgt);
        ctx.shadowBlur = 0;

        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.strokeRect(x, y, barWidth, hgt);

        // peak cap flicker
        const capHeight = 8;
        const capY = y - 10 - Math.sin(now * 6 + i) * 4;
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillRect(x, capY, barWidth, capHeight);

        // label
        ctx.font = `${Math.max(12, Math.floor(barWidth * 0.18))}px var(--font-stencila, 'VT323')`;
        ctx.fillStyle = "rgba(200,200,200,0.9)";
        ctx.textAlign = "center";
        ctx.fillText(bar.label, x + barWidth / 2, baseY + 18);
    });

    // divider lines
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    bars.forEach((_, i) => {
        if (i === bars.length - 1) return;
        const dx = startX + (i + 1) * (barWidth + gap) - gap * 0.5;
        ctx.beginPath(); ctx.moveTo(dx, top * 0.8); ctx.lineTo(dx, baseY + 24); ctx.stroke();
    });

    ctx.shadowBlur = 0;
}

/* =======================
   MODE LAB: Lissajous Analyzer
========================== */
function renderLissajousLab(ctx, w, h) {
    const cx = w * 0.5;
    const cy = h * 0.5;
    const now = performance.now() * 0.001;

    // clear with subtle grid tint
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(0, 0, w, h);

    // axes/grid
    ctx.strokeStyle = "rgba(39,231,255,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();

    // Lissajous params from audio (slow smoothed to let you read motion)
    const a = 1 + labSmooth.mid * 2.0 + labSmooth.variability * 1.0;
    const b = 2 + labSmooth.treble * 2.0;
    const delta = Math.PI * labSmooth.bass * 0.8 + now * 0.02; // even slower phase drift
    const amp = Math.min(w, h) * (0.25 + labSmooth.vol * 0.25);
    const samples = 420;

    const pts = [];
    for (let i = 0; i < samples; i++) {
        const t0 = (i / samples) * Math.PI * 2;
        const x = cx + amp * Math.sin(a * t0 + delta);
        const y = cy + amp * Math.sin(b * t0);
        pts.push({ x, y });
    }

    // draw path
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 1.8 + labSmooth.vol * 1.8;
    ctx.strokeStyle = `hsla(${180 + labSmooth.treble * 120}, 90%, 60%, ${0.55 + labSmooth.vol * 0.35})`;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.stroke();

    // trailing glow dots for energy insight
    ctx.fillStyle = `hsla(${320 + labSmooth.bass * 80}, 100%, 65%, 0.5)`;
    for (let i = 0; i < pts.length; i += 35) {
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, 2 + smooth.bass * 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

/* =======================
   CLASA: HARMONIC LASER AGENT
   - Se mișcă matematic pe orbite Lissajous/Armonice
========================== */
class HarmonicAgent {
    constructor(w, h, id) {
        this.w = w; this.h = h; this.id = id;
        this.trail = [];
        this.reset();
    }

    reset() {
        // Parametri unici pentru fiecare agent (ADN-ul mișcării)
        // Frecvențe (cât de repede oscilează pe X și Y)
        this.fx = 1 + Math.random() * 2; 
        this.fy = 1 + Math.random() * 2;
        
        // Faze (unde începe)
        this.px = Math.random() * Math.PI * 2;
        this.py = Math.random() * Math.PI * 2;
        
        // Amplitudini de bază (raza orbitei)
        this.ampX = (this.w / 4) * (0.5 + Math.random() * 0.5);
        this.ampY = (this.h / 3) * (0.5 + Math.random() * 0.5);
        
        // Culoare unică
        this.hueBase = Math.random() * 360;
        
        this.x = this.w/2;
        this.y = this.h/2;
    }

    update(time, bass, mid, treble) {
        const cx = this.w / 2;
        const cy = this.h / 2;

        // Modulare Audio
        // Basul mărește raza
        const currentAmpX = this.ampX * (1 + bass * 0.8);
        const currentAmpY = this.ampY * (1 + bass * 0.8);
        
        // Mediile accelerează timpul local ușor
        const localTime = time * (1 + mid * 0.2);

        // === FORMULA ARMONOGRAF PENTRU ACEST AGENT ===
        // x = A * sin(fx * t + p)
        // Adăugăm un termen secundar pentru complexitate (buclă în buclă)
        
        let nx = cx + Math.sin(localTime * this.fx + this.px) * currentAmpX +
                      Math.cos(localTime * this.fx * 2) * (currentAmpX * 0.2); // Complexitate mică
                      
        let ny = cy + Math.sin(localTime * this.fy + this.py) * currentAmpY +
                      Math.sin(localTime * this.fy * 2) * (currentAmpY * 0.2);

        // Jitter electric pe înalte
        if (treble > 0.3) {
            nx += (Math.random() - 0.5) * treble * 20;
            ny += (Math.random() - 0.5) * treble * 20;
        }

        this.x = nx;
        this.y = ny;

        // Trail logic
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > 25) this.trail.shift();
    }

    draw(ctx, bass, vol) {
        if (this.trail.length < 2) return;

        const hue = (this.hueBase + t * 20) % 360;
        const color = `hsla(${hue}, 100%, 60%`;

        ctx.beginPath();
        // Desenăm coada
        for (let i = 0; i < this.trail.length - 1; i++) {
            const p1 = this.trail[i];
            const p2 = this.trail[i+1];
            
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            
            // Fade out la coadă
            ctx.strokeStyle = `${color}, ${i / this.trail.length})`;
            ctx.lineWidth = (i / this.trail.length) * (3 + bass * 5);
            ctx.stroke();
        }

        // Capul (Bila de energie)
        ctx.fillStyle = "#fff";
        ctx.shadowBlur = 15 + bass * 20;
        ctx.shadowColor = `${color}, 1)`;
        ctx.beginPath(); 
        ctx.arc(this.x, this.y, 3 + bass * 6, 0, Math.PI*2); 
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

/* =======================
   CLASA: PARTICULĂ COLIZIVĂ
   - Traiectorii de tip armonograf + coliziuni pereți/între ele
========================== */
class CollideParticle {
    constructor(w, h, id) {
        this.w = w; this.h = h; this.id = id;
        this.trail = [];
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.w;
        this.y = Math.random() * this.h;
        this.vx = (Math.random() - 0.5) * 1.2;
        this.vy = (Math.random() - 0.5) * 1.2;
        this.fx = 0.6 + Math.random() * 1.2;
        this.fy = 0.6 + Math.random() * 1.2;
        this.phaseX = Math.random() * Math.PI * 2;
        this.phaseY = Math.random() * Math.PI * 2;
        this.r = 4 + Math.random() * 3;
        this.hue = Math.random() * 360;
    }

    applyBounds() {
        if (this.x < this.r) { this.x = this.r; this.vx *= -0.9; }
        if (this.x > this.w - this.r) { this.x = this.w - this.r; this.vx *= -0.9; }
        if (this.y < this.r) { this.y = this.r; this.vy *= -0.9; }
        if (this.y > this.h - this.r) { this.y = this.h - this.r; this.vy *= -0.9; }
    }

    update(time, bass, mid, treble) {
        const oscX = Math.sin(time * this.fx + this.phaseX) * (1.6 + mid * 2.4);
        const oscY = Math.cos(time * this.fy + this.phaseY) * (1.6 + mid * 2.4);

        // energize velocity with bass
        this.vx += oscX * 0.08 + (Math.random() - 0.5) * treble * 0.4;
        this.vy += oscY * 0.08 + (Math.random() - 0.5) * treble * 0.4;

        // mild damping
        this.vx *= 0.985;
        this.vy *= 0.985;

        this.x += this.vx + bass * 0.6 * Math.sign(this.vx || 1);
        this.y += this.vy + bass * 0.6 * Math.sign(this.vy || 1);

        this.applyBounds();

        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 12) this.trail.shift();
    }
}

function initSystem(w, h) {
    agents = [];
    particles = [];
    sparks = [];
    for(let i=0; i<NUM_AGENTS; i++) agents.push(new HarmonicAgent(w, h, i));
    for(let i=0; i<NUM_PARTICLES; i++) particles.push(new CollideParticle(w, h, i));
}

/* =======================
   MODE A: HARMONIC SWARM (DJ)
========================== */
function renderHarmonicSwarm(ctx, w, h) {
    if (agents.length === 0) initSystem(w, h);

    const cx = w/2; const cy = h/2;

    // 1. PHYSICS TIME
    // Timpul avansează constant, dar e împins de volum
    t += 0.015 + smooth.mid * 0.03;

    // 2. BACKGROUND
    ctx.globalCompositeOperation = "source-over";
    // Flash pe Kick puternic
    if (smooth.bass > 0.9 && Math.random() > 0.85) {
        ctx.fillStyle = "rgba(20, 0, 10, 0.2)"; // Roșu închis flash
    } else {
        ctx.fillStyle = "rgba(0, 0, 0, 0.22)"; // Fade normal
    }
    ctx.fillRect(0, 0, w, h);

    // 2.1 CERC DE IMPACT (valuri violente pe bass)
    if (smooth.bass > 0.55 && Math.random() < 0.35 + smooth.bass * 0.4) {
        pulses.push({
            r: 10,
            dr: 8 + smooth.bass * 32,
            alpha: 0.6 + smooth.bass * 0.3,
            width: 6 + smooth.bass * 10,
            hue: 180 + smooth.mid * 120 + Math.random() * 40
        });
    }
    const nextPulses = [];
    ctx.globalCompositeOperation = "screen";
    pulses.forEach(p => {
        p.r += p.dr;
        p.alpha *= 0.94;
        p.width *= 0.97;
        if (p.alpha > 0.02) {
            nextPulses.push(p);
            ctx.lineWidth = p.width;
            ctx.strokeStyle = `hsla(${p.hue}, 90%, 60%, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(cx, cy, p.r, 0, Math.PI * 2);
            ctx.stroke();
        }
    });
    pulses = nextPulses;

    // 3. DRAW AGENTS
    ctx.globalCompositeOperation = "lighter";

    // Desenăm un nucleu subtil în spate
    const coreR = 20 + smooth.bass * 60;
    ctx.beginPath(); 
    ctx.arc(cx, cy, coreR, 0, Math.PI*2);
    ctx.fillStyle = `rgba(0, 243, 255, ${0.1 + smooth.bass*0.2})`;
    ctx.fill();

    // Actualizăm și desenăm fiecare agent armonic
    agents.forEach(agent => {
        agent.update(t, smooth.bass, smooth.mid, smooth.treble);
        agent.draw(ctx, smooth.bass, smooth.vol);
    });

    /* PARTICULE COLIZIVE (swarm brutal) */
    const collisions = [];
    particles.forEach(p => p.update(t, smooth.bass, smooth.mid, smooth.treble));

    // Coliziuni între particule (repulsie simplă)
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i], b = particles[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist2 = dx*dx + dy*dy;
            const minD = a.r + b.r;
            if (dist2 < minD * minD) {
                const dist = Math.sqrt(dist2) || 0.001;
                const nx = dx / dist;
                const ny = dy / dist;
                const overlap = (minD - dist) * 0.5;
                a.x -= nx * overlap; b.x += nx * overlap;
                a.y -= ny * overlap; b.y += ny * overlap;
                // simple elastic swap on normal
                const va = a.vx * nx + a.vy * ny;
                const vb = b.vx * nx + b.vy * ny;
                const dv = vb - va;
                a.vx += nx * dv; a.vy += ny * dv;
                b.vx -= nx * dv; b.vy -= ny * dv;
                collisions.push({ x:(a.x+b.x)/2, y:(a.y+b.y)/2, hue:(a.hue+b.hue)*0.5 });
            }
        }
    }

    // Desenăm trails + particule
    ctx.globalCompositeOperation = "lighter";
    particles.forEach(p => {
        if (p.trail.length > 1) {
            for (let i = 0; i < p.trail.length - 1; i++) {
                const a = p.trail[i];
                const b = p.trail[i+1];
                const alpha = (i / p.trail.length) * 0.6 + 0.1;
                ctx.strokeStyle = `hsla(${p.hue + i*4}, 90%, 60%, ${alpha})`;
                ctx.lineWidth = 0.6 + (i / p.trail.length) * 2.2;
                ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
        }
        ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, 0.9)`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
    });

    // Scântei pe coliziuni
    collisions.forEach(c => {
        for (let k = 0; k < 4; k++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 2 + Math.random() * 3 + smooth.treble * 4;
            sparks.push({
                x: c.x, y: c.y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                life: 12 + Math.random() * 10,
                hue: c.hue + Math.random() * 40
            });
        }
    });

    const nextSparks = [];
    ctx.globalCompositeOperation = "screen";
    sparks.forEach(s => {
        s.x += s.vx; s.y += s.vy;
        s.vx *= 0.96; s.vy *= 0.96;
        s.life -= 1;
        if (s.life > 0) {
            nextSparks.push(s);
            const a = Math.min(1, s.life / 12);
            ctx.strokeStyle = `hsla(${s.hue}, 100%, 70%, ${a})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - s.vx * 0.8, s.y - s.vy * 0.8);
            ctx.stroke();
        }
    });
    sparks = nextSparks;

    // 4. CONEXIUNI (Web) - Doar la intensitate mare
    if (smooth.mid > 0.4) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(255, 255, 255, ${smooth.mid * 0.15})`;
        ctx.beginPath();
        // Conectăm aleatoriu puncte apropiate
        for (let i = 0; i < agents.length; i++) {
            const a = agents[i];
            const b = agents[(i + 1) % agents.length]; // Următorul din listă
            
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < 300) {
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
            }
        }
        ctx.stroke();
    }
}

/* =======================
   MODE B: CYMATICS (ART) - CALM & CURAT
========================== */
function renderCymatics(ctx, w, h, startTime, totalDuration) {
    const cx = w/2; const cy = h/2;
    // 1. RESET COMPLET (Ecran Negru la început)
    if (resetFlag) {
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "#000000"; ctx.fillRect(0, 0, w, h);
        resetFlag = false; prevX = cx; prevY = cy; initialized = false; 
        return;
    }
    // 2. STOP dacă nu e activ
    if (!paintingState.active || paintingState.paused) return;

    // Logică desenare
    const currentRun = (Date.now() - paintingState.startTime) / 1000;
    const total = paintingState.elapsedBeforePause + currentRun;
    const progress = Math.min(1, total / paintingState.duration);

    const rotations = 20; 
    const angle = progress * (Math.PI * 2 * rotations);
    const maxR = Math.min(w, h) * 0.40; 
    const currentBaseRadius = progress * maxR;

    let sym = 3;
    if (audioData.pitch > 50) sym = 3 + Math.floor(audioData.pitch / 150);
    smooth.pitch = lerp(smooth.pitch, sym, 0.1);
    
    const scaleFactor = 1.0 + (progress * 2.5); 
    const vibration = smooth.vol * 60 * scaleFactor;
    const grit = (Math.random()-0.5) * smooth.treble * 20 * scaleFactor;

    const shape = Math.cos(smooth.pitch * angle) * vibration;
    const r = currentBaseRadius + shape + grit;

    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;

    ctx.globalCompositeOperation = "lighter";
    if (!initialized) { prevX = x; prevY = y; initialized = true; }

    const hue = 180 + (progress * 140); 
    ctx.lineWidth = (1 + smooth.vol * 3) * (0.8 + progress * 0.5);
    ctx.strokeStyle = `hsla(${hue}, 100%, 60%, 0.8)`;
    ctx.lineCap = "round";

    ctx.beginPath(); ctx.moveTo(prevX, prevY); ctx.lineTo(x, y); ctx.stroke();
    prevX = x; prevY = y;
}

export function renderFrame(ctx) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    if (!audioData) return;

    smooth.vol = lerp(smooth.vol, audioData.volume, 0.15);
    smooth.bass = lerp(smooth.bass, audioData.bass, 0.2);
    smooth.mid = lerp(smooth.mid, audioData.mid, 0.15);
    smooth.treble = lerp(smooth.treble, audioData.treble, 0.15);

    // LAB smoothing is slower to let shapes settle for analysis
    labSmooth.vol = lerp(labSmooth.vol, audioData.volume || 0, 0.06);
    labSmooth.bass = lerp(labSmooth.bass, audioData.bass || 0, 0.06);
    labSmooth.mid = lerp(labSmooth.mid, audioData.mid || 0, 0.06);
    labSmooth.treble = lerp(labSmooth.treble, audioData.treble || 0, 0.06);
    labSmooth.variability = lerp(labSmooth.variability, audioData.variability || 0, 0.06);

    if (currentMode === 'DJ') {
        renderHarmonicSwarm(ctx, w, h);
        applyCRTEffects(ctx, 0.4);
    } else if (currentMode === 'ART') {
        renderCymatics(ctx, w, h, paintingState.startTime, paintingState.duration);
    } else if (currentMode === 'LAB') {
        renderLissajousLab(ctx, w, h);
    } else if (currentMode === 'EQ') {
        renderEQBars(ctx, w, h);
        applyCRTEffects(ctx, 0.35);
    }
}