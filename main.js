import { initAudio, updateAudio, audioEngine, audioData, ensureAudioRunning } from "./audio/audioEngine.js";
import { generateHarmonographPoints } from "./harmonograph/harmonograph.js";
import { renderFrame } from "./render/renderer.js";

let canvas, ctx;
let t = 0;
let started = false;
let smoothSpeed = 0;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// 🔥 Browserul NU permite audio până la un click/tap/tastă
const unlockAudio = async () => {
    if (started) return;
    started = true;
    await start();
};
window.addEventListener("pointerdown", unlockAudio, { once: true });
window.addEventListener("keydown", unlockAudio, { once: true });

async function start() {
    canvas = document.getElementById("screen");
    ctx = canvas.getContext("2d");

    resize();
    window.addEventListener("resize", resize);

    await initAudio();
    await ensureAudioRunning();
    loop();
}

function loop() {
    requestAnimationFrame(loop);

    updateAudio();

    const vol = audioData.volume || 0;
    const energy = audioData.energy || 0;
    const variability = audioData.variability || 0;

    // viteză lină: joasă pe sunet lent, energică pe volum/frecvențe mari
    const targetSpeed = 0.3 + vol * 1.4 + energy * 1.8 + variability * 1.2;
    smoothSpeed = smoothSpeed * 0.85 + targetSpeed * 0.15;
    t += smoothSpeed;

    const points = generateHarmonographPoints(t, canvas);

    renderFrame(ctx, points);
}
