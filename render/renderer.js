// render/renderer.js
import { audioData } from "../audio/audioEngine.js";
import { applyCRTEffects } from "./crtEffects.js";

/* =======================
    UTILITIES (OPTIMIZED)
========================== */

// rapid noise, fără smoothstep
function fastNoise(x, y) {
    return (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
}

// jitter super rapid
function jitterPoints(pts, amount, t) {
    return pts.map((p, i) => ({
        x: p.x + fastNoise(t + i, t * 0.7) * amount,
        y: p.y + fastNoise(t * 0.5, t + i * 0.3) * amount
    }));
}

// downsample cu stride fix (de 5–10 ori mai rapid)
function downsample(points, target) {
    const N = points.length;
    if (N <= target) return points;
    const step = Math.floor(N / target);
    const out = [];
    for (let i = 0; i < N; i += step) out.push(points[i]);
    return out;
}

// spline simplificat (NU Bezier complet → mult mai rapid)
function quickSpline(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        ctx.lineTo(p.x, p.y); // lineTo e EXTREM de rapid
    }
}

/* =======================
    SUPERFORMULA (FAST)
========================== */
function superformula(cx, cy, baseR, m, n1, n2, n3, count) {
    const pts = new Array(count);
    for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2;

        const a = Math.abs(Math.cos((m * t) / 4)) ** n2;
        const b = Math.abs(Math.sin((m * t) / 4)) ** n3;
        const r = (a + b) ** (-1 / n1);

        pts[i] = {
            x: cx + baseR * r * Math.cos(t),
            y: cy + baseR * r * Math.sin(t)
        };
    }
    return pts;
}

/* =======================
    RENDER FRAME
========================== */

let flowerEnergy = 0;
let flowerPhase = 0;

export function renderFrame(ctx, points) {
    const {
        volume: vol,
        energy,
        variability,
        bass,
        mid,
        treble,
        beat
    } = audioData;

    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const now = performance.now() * 0.001;

    /* -------------------------
        PHOSPHOR FADE (FAST)
    -------------------------- */
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(0,0,0,0.04)";
    ctx.fillRect(0, 0, w, h);

    if (!points || points.length < 2) return;

    /* -------------------------
        OPTIMIZED POINT FLOW
    -------------------------- */

    // limităm punctele → huge FPS boost
    let pts = downsample(points, 220);

    // breathing effect (cheap)
    const scale = 1 + (vol * 0.2 + energy * 0.2);
    const cx = w * 0.5, cy = h * 0.5;
    pts = pts.map(p => ({
        x: cx + (p.x - cx) * scale,
        y: cy + (p.y - cy) * scale
    }));

    // jitter analog minimal
    const jitter = (variability * 5 + treble * 3) * 0.3;
    pts = jitterPoints(pts, jitter, now);

    /* -------------------------
        MID (main vector)
    -------------------------- */
    {
        const hue = (200 + mid * 120 + variability * 40) % 360;
        ctx.strokeStyle = `hsla(${hue}, 70%, ${58 + beat * 10}%, 0.9)`;
        ctx.lineWidth = 1.4 + mid * 2;
        ctx.shadowBlur = 4 + mid * 8;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.globalCompositeOperation = "lighter";
        quickSpline(ctx, pts);
        ctx.stroke();
    }

    /* -------------------------
        BASS LAYER (heavy)
    -------------------------- */
    {
        const offset = bass * 12;
        const bassPts = pts.map(p => ({ x: p.x, y: p.y + offset }));
        ctx.strokeStyle = `hsla(${300 + bass * 80}, 60%, 45%, 0.5)`;
        ctx.lineWidth = 2 + bass * 4;
        ctx.globalCompositeOperation = "color-dodge";
        quickSpline(ctx, bassPts);
        ctx.stroke();
    }

    /* -------------------------
        TREBLE LAYER (fine)
    -------------------------- */
    {
        const trePts = jitterPoints(pts, jitter * 2, now);
        ctx.strokeStyle = `hsla(${120 + treble * 180}, 80%, 70%, 0.5)`;
        ctx.lineWidth = 0.8 + treble * 2;
        ctx.globalCompositeOperation = "screen";
        quickSpline(ctx, trePts);
        ctx.stroke();
    }

    /* -------------------------
        SUPERFORMULA (FAST)
    -------------------------- */
    const trig = treble * 0.7 + energy * 0.4 + beat * 1.2;
    flowerEnergy = trig > 0.4 ? Math.min(1, flowerEnergy + 0.12) : flowerEnergy * 0.9;
    flowerPhase += 0.2 + variability * 0.4;

    if (flowerEnergy > 0.05) {
        const radius = Math.min(cx, cy) * (0.12 + energy * 0.25) * flowerEnergy;
        const m = 4 + treble * 5;

        const fPts = superformula(cx, cy, radius, m, 0.5 + variability, 0.3 + treble, 0.3 + energy, 120);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(flowerPhase * 0.01);
        ctx.translate(-cx, -cy);

        ctx.strokeStyle = `hsla(${now * 40 + treble * 140}, 70%, 55%, ${0.2 + flowerEnergy})`;
        ctx.lineWidth = 1.0;
        ctx.shadowBlur = 6;

        ctx.globalCompositeOperation = "lighter";
        quickSpline(ctx, fPts);
        ctx.stroke();

        ctx.restore();
    }

    /* -------------------------
        CRT EFFECTS (steady)
    -------------------------- */
    applyCRTEffects(ctx, 0.9);
}
