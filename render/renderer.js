// render/renderer.js
import { audioData } from "../audio/audioEngine.js";

// --- Superformula helper ("floarea")
function superformulaPoints(cx, cy, rBase, m, n1, n2, n3, count) {
    const pts = [];
    for (let i = 0; i < count; i++) {
        const theta = (i / count) * Math.PI * 2;
        const a = Math.pow(Math.abs(Math.cos((m * theta) / 4)), n2);
        const b = Math.pow(Math.abs(Math.sin((m * theta) / 4)), n3);
        const r = Math.pow(a + b, -1 / n1) || 0;
        const rr = rBase * r;
        pts.push({ x: cx + rr * Math.cos(theta), y: cy + rr * Math.sin(theta) });
    }
    return pts;
}

let flowerEnergy = 0; // eased activation for the flower layer
let flowerPhase = 0;

// Lightweight noise
function hash2d(x, y) {
    return Math.sin(x * 127.1 + y * 311.7) * 43758.5453 % 1;
}

function smoothstep(t) {
    return t * t * (3 - 2 * t);
}

function noise2D(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const v00 = hash2d(xi, yi);
    const v10 = hash2d(xi + 1, yi);
    const v01 = hash2d(xi, yi + 1);
    const v11 = hash2d(xi + 1, yi + 1);
    const u = smoothstep(xf);
    const v = smoothstep(yf);
    const nx0 = v00 * (1 - u) + v10 * u;
    const nx1 = v01 * (1 - u) + v11 * u;
    return nx0 * (1 - v) + nx1 * v;
}

function jitterPoints(points, amount, time) {
    return points.map((p, i) => {
        const jx = noise2D(time * 0.4 + i * 0.01, time * 0.7) * amount;
        const jy = noise2D(time * 0.6, time * 0.5 + i * 0.01) * amount;
        return { x: p.x + jx, y: p.y + jy };
    });
}

function catmullRomToBezier(ctx, pts) {
    if (pts.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);

    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || p2;
        const t = 0.5;

        const cp1x = p1.x + (p2.x - p0.x) * (t / 6);
        const cp1y = p1.y + (p2.y - p0.y) * (t / 6);
        const cp2x = p2.x - (p3.x - p1.x) * (t / 6);
        const cp2y = p2.y - (p3.y - p1.y) * (t / 6);

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
}

export function renderFrame(ctx, points) {
    const vol = audioData.volume || 0;
    const energy = audioData.energy || 0;
    const variability = audioData.variability || 0;
    const beat = audioData.beat ? 1 : 0;
    const bass = audioData.bass || 0;
    const mid = audioData.mid || 0;
    const treble = audioData.treble || 0;

    const now = performance.now() * 0.001;

    // fade mai subtil -> păstrează arta
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(0,0,0,0.03)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (!points || points.length < 2) return;

    // jitter mic și elegant, dar crește pe treble/variability
    const jitterBase = (variability * 8 + vol * 4) * 0.3;
    const jitterTreble = jitterBase + treble * 8;
    const pts = jitterPoints(points, jitterBase, now);

    // strat MID (principal) – melodie/voce
    {
        const hue = 200 + mid * 80 + variability * 40;
        const sat = 55 + vol * 18;
        const light = 58 + beat * 12;
        ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, 0.85)`;
        ctx.lineWidth = 1.3 + mid * 2.3 + vol * 1.2;
        ctx.shadowBlur = 4 + mid * 10 + beat * 8;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.globalCompositeOperation = "lighter";
        catmullRomToBezier(ctx, pts);
        ctx.stroke();
    }

    // strat BASS – greutate și puls
    {
        const bassOffset = bass * 18;
        const bassPts = pts.map(p => ({ x: p.x, y: p.y + bassOffset }));
        const hue = 320 + bass * 50;
        const sat = 50 + bass * 30;
        const light = 48 + vol * 10;
        ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, 0.5)`;
        ctx.lineWidth = 2.0 + bass * 4.0 + beat * 1.2;
        ctx.shadowBlur = 6 + bass * 12;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.globalCompositeOperation = "color-dodge";
        catmullRomToBezier(ctx, bassPts);
        ctx.stroke();
    }

    // strat TREBLE – detalii fine, jitter mai mare
    {
        const hue = 120 + treble * 120 + variability * 30;
        const sat = 60 + treble * 25;
        const light = 70 + beat * 18;
        const treblePts = jitterPoints(points, jitterTreble, now * 1.3);
        ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, 0.55)`;
        ctx.lineWidth = 0.8 + treble * 2.0 + variability * 0.8;
        ctx.shadowBlur = 2 + treble * 8;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.globalCompositeOperation = "screen";
        catmullRomToBezier(ctx, treblePts);
        ctx.stroke();
    }

    // Floarea (superformula) apare doar când vocea/înaltele+energie sunt sus
    const trigger = (treble + mid * 0.4 + energy * 0.6) > 0.7 || beat > 0.5;
    const decay = 0.94;
    flowerEnergy = trigger ? Math.min(1, flowerEnergy + 0.08) : flowerEnergy * decay;
    flowerPhase += 0.4 + variability * 0.8 + treble * 0.6;

    if (flowerEnergy > 0.08) {
        const cx = ctx.canvas.width * 0.5;
        const cy = ctx.canvas.height * 0.5;
        const radius = Math.min(cx, cy) * (0.12 + energy * 0.28 + vol * 0.12) * flowerEnergy;
        const m = 5 + Math.floor(treble * 6 + beat * 2);
        const n1 = 0.5 + variability * 0.9;
        const n2 = 0.3 + treble * 2.0;
        const n3 = 0.3 + energy * 2.0;
        const ptsFlower = superformulaPoints(cx, cy, radius, m, n1, n2, n3, 180 + Math.floor(120 * flowerEnergy));

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(flowerPhase * 0.015);
        ctx.translate(-cx, -cy);

        const hueF = 260 + treble * 100 + variability * 60;
        ctx.strokeStyle = `hsla(${hueF % 360}, ${60 + treble * 20}%, ${50 + vol * 20}%, ${0.3 + 0.4 * flowerEnergy})`;
        ctx.lineWidth = 0.9 + flowerEnergy * 1.6;
        ctx.shadowBlur = 4 + flowerEnergy * 12;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.globalCompositeOperation = "lighter";
        catmullRomToBezier(ctx, ptsFlower);
        ctx.stroke();
        ctx.restore();
    }

    ctx.globalCompositeOperation = "source-over";
}
