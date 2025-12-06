export function applyCRTEffects(ctx) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    ctx.save();

    ctx.globalAlpha = 0.04;
    ctx.fillStyle = "black";

    for (let y = 0; y < h; y += 2) {
        ctx.fillRect(0, y, w, 1);
    }

    ctx.restore();
}
