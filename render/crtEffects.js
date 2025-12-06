let scanPattern = null;
export function applyCRTEffects(ctx, intensity = 1) {
    if (intensity <= 0) return;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    if (!scanPattern) {
        const c = document.createElement("canvas");
        c.width = 1; c.height = 3;
        const g = c.getContext("2d");
        g.fillStyle = "rgba(0,0,0,0.15)";
        g.fillRect(0, 1, 1, 1);
        scanPattern = ctx.createPattern(c, "repeat");
    }
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = scanPattern;
    ctx.globalAlpha = intensity;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
}