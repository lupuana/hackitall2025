// harmonograph/harmonograph.js
import { audioData } from "../audio/audioEngine.js";

/*
   True Harmonograph v6
   - complex dar stabil
   - forme elegante
   - evoluție mai rapidă
*/

export function generateHarmonographPoints(t, canvas) {
    const pts = [];

    const cx = canvas.width * 0.5;
    const cy = canvas.height * 0.5;

    const vol = audioData.volume || 0;
    const E   = audioData.energy || 0;
    const V   = audioData.variability || 0;

    const scale = Math.min(canvas.width, canvas.height) * 0.30;

    const A1 = scale * (1.0 + vol * 0.2);
    const A2 = scale * (0.9 + E   * 0.3);
    const A3 = scale * (0.5 + V   * 0.4);

    const f1 = 1.50;
    const f2 = 1.82 + V * 0.15;
    const f3 = 2.25 + E * 0.08;

    const p1 = 0;
    const p2 = Math.PI / 2 + t * 0.00025;
    const p3 = Math.PI / 3 + t * 0.00035;

    const d1 = 0.00020;
    const d2 = 0.00016;
    const d3 = 0.00010;

    const twistAmp  = scale * 0.12;
    const twistFreq = 0.7 + V * 0.4;

    // ⚡ armonograful evoluează mai rapid
    const steps = 2000;

    for (let i = 0; i < steps; i++) {
        const tt = t * 0.0012 + i * 0.0105; // ← versiunea rapidă

        const x0 =
            A1 * Math.sin(f1 * tt + p1) * Math.exp(-d1 * tt) +
            A3 * Math.sin(f3 * tt + p3) * Math.exp(-d3 * tt);

        const y0 =
            A2 * Math.sin(f2 * tt + p2) * Math.exp(-d2 * tt) +
            A3 * Math.sin(f1 * tt + p1 + Math.PI / 4) * Math.exp(-d3 * tt);

        const twist = twistAmp * Math.sin(twistFreq * tt + p3);

        pts.push({
            x: cx + x0 + twist,
            y: cy + y0 - twist * 0.5
        });
    }

    return pts;
}
