import { initAudio, updateAudio, audioEngine, audioData, ensureAudioRunning } from "./audio/audioEngine.js";
import { generateHarmonographPoints } from "./harmonograph/harmonograph.js";
import { renderFrame } from "./render/renderer.js";

let canvas, ctx;
let t = 0;
let started = false;

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

    // accelerăm timpul în funcție de audio
    const speed = 0.5 + vol * 2.0 + audioData.energy * 1.2;
    t += speed;

    const points = generateHarmonographPoints(t, canvas);

    renderFrame(ctx, points);
}
