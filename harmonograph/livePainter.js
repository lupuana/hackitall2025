import { audioData } from "../audio/audioEngine.js";

let pos = { x: 0, y: 0 };
let vel = { x: 0, y: 0 };

export function initPainter(canvas) {
    pos.x = canvas.width  * 0.5;
    pos.y = canvas.height * 0.5;
}

export function generateLiveStroke(canvas) {
    const vol  = audioData.volume;
    const E    = audioData.energy;
    const V    = audioData.variability;
    const peak = audioData.peak;

    const cx = canvas.width  / 2;
    const cy = canvas.height / 2;

    const force = {
        x: (Math.sin(E * 10 + V * 5) + (Math.random() - 0.5) * V * 2) * (2 + vol * 40),
        y: (Math.cos(E * 12 + V * 3) + (Math.random() - 0.5) * V * 2) * (2 + vol * 40)
    };

    vel.x += force.x * 0.1;
    vel.y += force.y * 0.1;

    vel.x *= 0.96;
    vel.y *= 0.96;

    pos.x += vel.x;
    pos.y += vel.y;

    if (pos.x < 0 || pos.x > canvas.width)  vel.x *= -0.8;
    if (pos.y < 0 || pos.y > canvas.height) vel.y *= -0.8;

    return { x: pos.x, y: pos.y };
}
