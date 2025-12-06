// render/renderer.js
import { audioData } from "../audio/audioEngine.js";

export function renderFrame(ctx, points) {
    if (!points?.length) return;

    const vol = audioData.volume || 0;

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(0,0,0,0.02)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const hue = 180 + vol * 80;
    const color = `hsla(${hue}, 60%, 65%, 0.9)`;

    ctx.lineWidth = 1.3 + vol * 0.8;
    ctx.shadowBlur = 3 + vol * 6;
    ctx.shadowColor = color;

    ctx.globalCompositeOperation = "lighter";

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.strokeStyle = color;
    ctx.stroke();

    ctx.globalCompositeOperation = "source-over";
}
