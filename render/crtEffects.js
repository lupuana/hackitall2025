// render/crtEffects.js

// Cached patterns to avoid per-frame loops
let scanPattern = null;
let phosphorPattern = null;

function ensurePatterns(ctx) {
    if (!scanPattern) {
        const c = document.createElement("canvas");
        c.width = 1;
        c.height = 3;
        const g = c.getContext("2d");
        g.fillStyle = "rgba(0,0,0,0.18)";
        g.fillRect(0, 1, 1, 1); // 1px dark every 3px
        scanPattern = ctx.createPattern(c, "repeat");
    }
    if (!phosphorPattern) {
        const c = document.createElement("canvas");
        c.width = 3;
        c.height = 1;
        const g = c.getContext("2d");
        g.fillStyle = "rgba(255,0,0,0.08)"; g.fillRect(0, 0, 1, 1);
        g.fillStyle = "rgba(0,255,0,0.06)"; g.fillRect(1, 0, 1, 1);
        g.fillStyle = "rgba(0,0,255,0.08)"; g.fillRect(2, 0, 1, 1);
        phosphorPattern = ctx.createPattern(c, "repeat");
    }
}

export function applyCRTEffects(ctx, intensity = 1) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    ensurePatterns(ctx);

    ctx.save();

    // Soft vignette glow
    ctx.globalCompositeOperation = "screen";
    const grad = ctx.createRadialGradient(
        w * 0.5, h * 0.5, h * 0.2,
        w * 0.5, h * 0.5, h * 0.7
    );
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(1, "rgba(0,0,30,0.22)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Horizontal scanlines via cached pattern
    ctx.globalAlpha = 0.18 * intensity;
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = scanPattern;
    ctx.fillRect(0, 0, w, h);

    // Phosphor mask via cached pattern
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = 0.16 * intensity;
    ctx.fillStyle = phosphorPattern;
    ctx.fillRect(0, 0, w, h);

    ctx.restore();
}
