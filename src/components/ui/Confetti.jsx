/**
 * Confetti — Canvas burst ultra-léger
 *
 * Usage :
 *   const { burst } = useConfetti();
 *   burst(x, y);          // coordonnées fenêtre (optionnelles — défaut: centre)
 *   burst();              // burst centré en bas (parfait pour completion habit/todo)
 *
 * Le canvas est monté une seule fois dans l'arbre via ConfettiProvider.
 * Aucun re-render React — tout tourne via requestAnimationFrame sur le canvas.
 */
import React, { useRef, useContext, useCallback, useEffect } from 'react';

// ─── Palette confetti ─────────────────────────────────────────────────────────
const COLORS = [
    '#6366f1', '#818cf8', '#a5b4fc',   // indigo / accent
    '#10b981', '#34d399', '#6ee7b7',   // emerald (success)
    '#f59e0b', '#fcd34d',              // amber
    '#ec4899', '#f9a8d4',              // pink
    '#ffffff',                          // white
];

// ─── Paramètres du burst ──────────────────────────────────────────────────────
const CFG = {
    count: 72,          // nombre de particules
    spread: 120,        // demi-angle du cône (°)
    speed: [6, 18],     // [min, max] vélocité initiale
    gravity: 0.55,      // gravité par frame
    drag: 0.97,         // facteur de traîné (friction air)
    wobble: 3,          // rotation max par frame (°)
    lifetime: 110,      // frames de vie totale
    sizeRange: [6, 14], // [min, max] taille particule en px
};

// ─── Context ──────────────────────────────────────────────────────────────────
const ConfettiCtx = React.createContext(null);

export function useConfetti() {
    const ctx = useContext(ConfettiCtx);
    if (!ctx) throw new Error('useConfetti must be used inside <ConfettiProvider>');
    return ctx;
}

// ─── Provider — monte le canvas une fois, expose burst() ─────────────────────
export function ConfettiProvider({ children }) {
    const canvasRef = useRef(null);
    const particles = useRef([]);
    const rafRef = useRef(null);

    // Boucle d'animation — tourne uniquement quand il y a des particules
    const loop = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Sync dimensions (resize happen rarely)
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.current = particles.current.filter(p => p.life > 0);

        for (const p of particles.current) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += CFG.gravity;
            p.vx *= CFG.drag;
            p.vy *= CFG.drag;
            p.rot += p.rotSpeed;
            p.life--;

            const alpha = Math.min(1, p.life / 20); // fade out last 20 frames
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rot * Math.PI) / 180);
            ctx.fillStyle = p.color;

            if (p.shape === 'rect') {
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        if (particles.current.length > 0) {
            rafRef.current = requestAnimationFrame(loop);
        } else {
            rafRef.current = null;
        }
    }, []);

    // burst(originX?, originY?) — coordonnées en px dans la fenêtre
    const burst = useCallback((originX, originY) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ox = originX ?? window.innerWidth / 2;
        const oy = originY ?? window.innerHeight * 0.72; // légèrement sous le centre

        const newParticles = Array.from({ length: CFG.count }, () => {
            // angle dans le cône centré vers le haut (−90° ± spread/2)
            const angle = (-90 + (Math.random() - 0.5) * CFG.spread) * (Math.PI / 180);
            const speed = CFG.speed[0] + Math.random() * (CFG.speed[1] - CFG.speed[0]);
            const size = CFG.sizeRange[0] + Math.random() * (CFG.sizeRange[1] - CFG.sizeRange[0]);

            return {
                x: ox,
                y: oy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                rot: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * CFG.wobble * 2,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                shape: Math.random() > 0.4 ? 'rect' : 'circle',
                w: size,
                h: size * (0.4 + Math.random() * 0.6), // rectangles aplatis
                life: CFG.lifetime,
            };
        });

        particles.current = [...particles.current, ...newParticles];

        // Démarre la boucle si elle n'est pas déjà en cours
        if (!rafRef.current) {
            rafRef.current = requestAnimationFrame(loop);
        }
    }, [loop]);

    // Nettoyage
    useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

    return (
        <ConfettiCtx.Provider value={{ burst }}>
            {children}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'fixed',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 9999,
                }}
            />
        </ConfettiCtx.Provider>
    );
}
