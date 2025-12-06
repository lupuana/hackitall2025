import { generateHarmonographPoints } from "./harmonograph/harmonograph.js";
import { renderFrame } from "./render/renderer.js";
import { updateAudio, audioData, initAudio, ensureAudioRunning } from "./audio/audioEngine.js";
import { updateTime } from "./harmonograph/animator.js";

let canvas = document.getElementById("screen");
let ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let t = 0;
let drawIndex = 0;
let cachedCurve = [];
let loopStarted = false;

function loop() {
    requestAnimationFrame(loop);
    updateAudio();

    const vol = audioData.volume || 0;

    // VITEZA DE TRASARE SUPER RESPONSIVĂ
    const baseSpeed   = 12;
    const volBoost    = vol * 90;
    const energyBoost = audioData.energy * 120;
    const varBoost    = audioData.variability * 150;
    const peakBoost   = audioData.peak * 200;

    const speed = baseSpeed + volBoost + energyBoost + varBoost + peakBoost;
    const finalSpeed = Math.min(speed, 250);

    // evoluția matematică a armonografului, scalată cu viteza
    const timeStep = 0.8 + finalSpeed * 0.004;
    t = updateTime(t, timeStep);

    cachedCurve = generateHarmonographPoints(t, canvas);

    drawIndex += finalSpeed;
    if (drawIndex > cachedCurve.length) drawIndex = cachedCurve.length;

    // fade subtil când nu se vorbește
    if (vol < 0.01) {
        ctx.fillStyle = "rgba(0,0,0,0.02)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const visible = cachedCurve.slice(0, drawIndex);

    renderFrame(ctx, visible);
}

async function start() {
    try {
        await initAudio();
        await ensureAudioRunning();
        if (!loopStarted) {
            loopStarted = true;
            loop();
        }
    } catch (err) {
        console.error("Mic permission or init failed", err);
    }
}
const unlock = () => {
    start();
};

window.addEventListener("pointerdown", unlock, { once: true });
window.addEventListener("keydown", unlock, { once: true });

start();
