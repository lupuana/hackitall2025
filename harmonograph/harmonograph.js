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

    const vol   = audioData.volume || 0;
    const E     = audioData.energy || 0;
    const V     = audioData.variability || 0;
    const peak  = audioData.peak || 0;
    const bass  = audioData.bass || 0;
    const mid   = audioData.mid || 0;
    const treble= audioData.treble || 0;

    const scale = Math.min(canvas.width, canvas.height) * (0.24 + E * 0.12 + vol * 0.05 + bass * 0.08);

    // Audio-driven amplitudes and slight randomness via time-based oscillations
    const drift = t * 0.00015;
    const osc1 = Math.sin(drift * 1.7 + peak * 5);
    const osc2 = Math.cos(drift * 2.3 + V * 6);

    const A1 = scale * (0.85 + vol * 0.45 + osc1 * 0.12 + mid * 0.25);
    const A2 = scale * (0.75 + E   * 0.55 + osc2 * 0.10 + treble * 0.18);
    const A3 = scale * (0.35 + V   * 0.65 + peak * 0.32 + bass * 0.22);

    // Frequencies morph with audio so shapes change over time
    const f1 = 1.10 + vol * 0.8 + mid * 0.6 + osc1 * 0.16;
    const f2 = 1.55 + V   * 0.45 + treble * 0.7 + osc2 * 0.22;
    const f3 = 1.85 + E   * 0.35 + bass * 0.6 + peak * 0.28;

    const p1 = 0;
    const p2 = Math.PI / 2 + t * (0.00022 + E * 0.00015 + treble * 0.0002);
    const p3 = Math.PI / 3 + t * (0.00034 + V * 0.00016 + bass * 0.00012) + osc1 * 0.45;

    const d1 = 0.00016 + V * 0.00009 + treble * 0.00006;
    const d2 = 0.00013 + vol * 0.00008 + mid * 0.00005;
    const d3 = 0.00008 + peak * 0.00014 + bass * 0.00005;

    const twistAmp  = scale * (0.07 + V * 0.14 + peak * 0.12 + treble * 0.08);
    const twistFreq = 0.6 + V * 0.42 + osc2 * 0.12 + mid * 0.08;

    // Slow rotation + breathing scale to avoid repeating the same base shape
    const rot = (E * 0.65 + vol * 0.28 + bass * 0.35) * Math.sin(drift * 0.9 + peak * 4.2);
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);
    const breathe = 1.0 + (0.05 + E * 0.10 + treble * 0.05) * Math.sin(drift * 1.3 + V * 3.2 + mid * 2.0);

    // ⚡ armonograful evoluează mai rapid
    const steps = 1400; // fewer points for performance while keeping smoothness

    for (let i = 0; i < steps; i++) {
        const tt = t * 0.0012 + i * 0.0105; // ← versiunea rapidă

        const x0 =
            A1 * Math.sin(f1 * tt + p1) * Math.exp(-d1 * tt) +
            A3 * Math.sin(f3 * tt + p3) * Math.exp(-d3 * tt);

        const y0 =
            A2 * Math.sin(f2 * tt + p2) * Math.exp(-d2 * tt) +
            A3 * Math.sin(f1 * tt + p1 + Math.PI / 4) * Math.exp(-d3 * tt);

        const twist = twistAmp * Math.sin(twistFreq * tt + p3);
        let x = (x0 + twist) * breathe;
        let y = (y0 - twist * 0.5) * breathe;

        // Rotate around center
        const rx = x * cosR - y * sinR;
        const ry = x * sinR + y * cosR;

        pts.push({
            x: cx + rx,
            y: cy + ry
        });
    }

    return pts;
}
