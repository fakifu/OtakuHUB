/**
 * AuroraBackground — Canvas WebGL full-screen
 * Auto-synced avec le thème : dark → OLED | light → Ivory
 * Mouse/touch tracking permanent avec lissage springy
 */
import React, { useRef, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { AURORA_PRESETS } from '../../utils/auroraPresets';

// ── ⚙️ REGLAGES PHYSIQUE (Modifiables pour faire tes tests) ──────────────────
const PHYSICS = {
    drag: 0.990,            // Frein naturel (0.90 = s'arrête vite, 0.999 = glisse indéfiniment)
    maxSpeed: 0.003,        // Vitesse maximale autorisée (très lent)
    baseSpeed: 0.0005,      // Vitesse minimale de "flottement"
    pushForce: 3.5,         // Force injectée par le doigt (sur 20 avant) -> beaucoup moins aggressive
    pushRadius: 0.35,       // Zone d'influence du doigt (0 à 1)
    gravityForce: 0.00001,  // Force très très douce qui ramène les blobs vers la diagonale (divisée par 5)
    repulsionForce: 0.0003, // Force anti-fusion frontale
    repulsionVortex: 0.0003,// Force tangentielle pour qu'ils s'esquivent (effet fronde croisée)
    repulsionRadius: 0.9,   // Tient les blobs à distance beaucoup plus loin (0.9 au lieu de 0.6)

    // ── Respiration Autonome (Idle Breath)
    idleDelay: 12000,       // Temps sans toucher avant déclenchement (12s)
    breathDuration: 4500,   // Respiration très lente et douce (4.5s)
    breathForceMax: 0.0025, // Force maximale réduite de moitié pour plus de subtilité
};

export default function AuroraBackground() {
    const { theme } = useTheme(); // 'dark' | 'light' (résolu, pas 'auto')
    const preset = AURORA_PRESETS[theme] ?? AURORA_PRESETS.dark;

    const canvasRef = useRef(null);
    const glRef = useRef(null);
    const mouseRef = useRef({ raw: { x: 0.5, y: 0.5 }, smooth: { x: 0.5, y: 0.5 } });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !preset?.frag) return;

        if (!glRef.current) {
            glRef.current = canvas.getContext('webgl', {
                alpha: false, antialias: false, powerPreference: 'low-power',
            });
        }
        const gl = glRef.current;
        if (!gl) return;

        // ── Compilation ─────────────────────────────────────────────────────────
        const compile = (type, src) => {
            const s = gl.createShader(type);
            if (!s) return null;
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                console.warn('[Aurora]', gl.getShaderInfoLog(s));
                gl.deleteShader(s); return null;
            }
            return s;
        };

        const vs = compile(gl.VERTEX_SHADER, `attribute vec2 a_pos;void main(){gl_Position=vec4(a_pos,0.,1.);}`);
        const fs = compile(gl.FRAGMENT_SHADER, preset.frag);
        if (!vs || !fs) return;

        const prog = gl.createProgram();
        gl.attachShader(prog, vs); gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        gl.deleteShader(vs); gl.deleteShader(fs);

        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            console.warn('[Aurora] Link:', gl.getProgramInfoLog(prog));
            gl.deleteProgram(prog); return;
        }
        gl.useProgram(prog);

        // ── Quad ────────────────────────────────────────────────────────────────
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, 'a_pos');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

        const uTime = gl.getUniformLocation(prog, 'uTime');
        const uRes = gl.getUniformLocation(prog, 'uRes');
        const uMouse = gl.getUniformLocation(prog, 'uMouse');
        const uPositions = gl.getUniformLocation(prog, 'uPositions');
        if (uMouse) gl.uniform2f(uMouse, 0.5, 0.5);

        // ── Physics Engine (Zero-G Fluid Dynamics) ──────────────────────────────
        // 5 blobs with position and velocity
        const blobs = Array(5).fill(0).map((_, i) => ({
            x: 0.1 + Math.random() * 0.8,
            y: 0.1 + Math.random() * 0.8,
            vx: (Math.random() - 0.5) * 0.002, // Initiale très lente
            vy: (Math.random() - 0.5) * 0.002,
        }));

        let lastMouseTime = performance.now();
        let lastMousePos = { x: 0.5, y: 0.5 };

        // ── Mouse / Touch tracking & Velocity Injection ─────────────────────────
        const updateMouse = (cx, cy) => {
            const rect = canvas.getBoundingClientRect();
            const px = (cx - rect.left) / rect.width;
            const py = 1.0 - (cy - rect.top) / rect.height; // Inverted Y for WebGL

            mouseRef.current.raw.x = px;
            mouseRef.current.raw.y = py;

            const now = performance.now();
            const dt = Math.max(1, now - lastMouseTime);
            lastMouseTime = now;

            // Velocity of the swipe
            const dx = (px - lastMousePos.x) / dt;
            const dy = (py - lastMousePos.y) / dt;

            // Inject velocity into nearby blobs (Fluid push effect)
            if (Math.abs(dx) > 0.0001 || Math.abs(dy) > 0.0001) {
                blobs.forEach(b => {
                    const dist = Math.hypot(b.x - px, b.y - py);
                    if (dist < PHYSICS.pushRadius) {
                        const force = (PHYSICS.pushRadius - dist) * PHYSICS.pushForce;
                        b.vx += dx * force;
                        b.vy += dy * force;
                    }
                });
            }

            lastMousePos.x = px;
            lastMousePos.y = py;
        };

        const onMouse = (e) => updateMouse(e.clientX, e.clientY);
        const onTouch = (e) => {
            if (e.touches.length) updateMouse(e.touches[0].clientX, e.touches[0].clientY);
        };
        window.addEventListener('mousemove', onMouse, { passive: true });
        window.addEventListener('touchmove', onTouch, { passive: true });
        window.addEventListener('touchstart', onTouch, { passive: true });

        // ── Render loop ─────────────────────────────────────────────────────────
        let raf, active = true;
        let isBreathing = false;
        let breathStartTime = 0;
        let breathCenter = { x: 0.5, y: 0.5 };

        const draw = (t) => {
            if (!active) return;
            const now = performance.now();
            const timeSinceLastTouch = now - lastMouseTime;

            // Gestion de l'état de respiration autonome
            if (!isBreathing && timeSinceLastTouch > PHYSICS.idleDelay) {
                isBreathing = true;
                breathStartTime = now;
                // On choisit un nouveau centre de respiration un peu aléatoire
                breathCenter.x = 0.3 + Math.random() * 0.4;
                breathCenter.y = 0.3 + Math.random() * 0.4;
            }

            // Si le cycle de respiration est en cours
            if (isBreathing) {
                // On vérifie la proximité de tous les blobs par rapport au point de chute
                let maxDist = 0;
                blobs.forEach(b => {
                    const dist = Math.hypot(breathCenter.x - b.x, breathCenter.y - b.y);
                    if (dist > maxDist) maxDist = dist;
                });

                // On coupe l'attraction JUSTE AVANT qu'ils ne se fracassent au centre (maxDist < 0.28)
                // Leurs vitesses colossales acquises vont les faire se frôler et se croiser très organiquement
                if (maxDist < 0.28 || now - breathStartTime > PHYSICS.breathDuration || timeSinceLastTouch < 50) {
                    isBreathing = false;
                    // On reset le timer d'idle pour relancer dans 7s
                    if (timeSinceLastTouch >= 50) lastMouseTime = now;
                }
            }
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = Math.round(canvas.clientWidth * dpr);
            const h = Math.round(canvas.clientHeight * dpr);
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w; canvas.height = h;
                gl.viewport(0, 0, w, h);
            }

            // Lissage springy du pointeur
            const { raw, smooth } = mouseRef.current;
            smooth.x += (raw.x - smooth.x) * 0.06;
            smooth.y += (raw.y - smooth.y) * 0.06;

            // Update Physics
            const positionsArray = new Float32Array(10); // 5 vec2 (x,y)
            blobs.forEach((b, i) => {
                b.x += b.vx;
                b.y += b.vy;

                // 1. Friction spatiale (freinage doux)
                b.vx *= PHYSICS.drag;
                b.vy *= PHYSICS.drag;

                // 2. Clamp (Limitation de vitesse max absolue)
                // Math.sign garde le vecteur positif ou négatif, Math.min cap la vitesse
                b.vx = Math.sign(b.vx) * Math.min(Math.abs(b.vx), PHYSICS.maxSpeed);
                b.vy = Math.sign(b.vy) * Math.min(Math.abs(b.vy), PHYSICS.maxSpeed);

                // 3. Flottement minimum
                if (Math.abs(b.vx) < PHYSICS.baseSpeed && b.x > 0 && b.x < 1) b.vx += (Math.random() - 0.5) * 0.0001;
                if (Math.abs(b.vy) < PHYSICS.baseSpeed && b.y > 0 && b.y < 1) b.vy += (Math.random() - 0.5) * 0.0001;

                if (isBreathing) {
                    // ── PHASE IMPLOSION AUTONOME (Progression Ease-in / Bézier)
                    // On calcule où on en est dans la respiration (0.0 au début, 1.0 à la fin)
                    const progress = Math.min((now - breathStartTime) / PHYSICS.breathDuration, 1.0);

                    // Courbe d'accélération (ease-in quartic : très lent, puis très rapide)
                    const easeIn = Math.pow(progress, 4);
                    const currentForce = PHYSICS.breathForceMax * easeIn;

                    // Attire vers le point central choisi avec cette force évolutive
                    b.vx += (breathCenter.x - b.x) * currentForce;
                    b.vy += (breathCenter.y - b.y) * currentForce;
                } else {
                    // ── PHYSIQUE STANDARD (Flottement Libre)

                    // 4. Gravité Diagonale Ligne (Attire vers l'axe y = x, pas vers le centre)
                    const avg = (b.x + b.y) / 2.0;
                    b.vx += (avg - b.x) * PHYSICS.gravityForce;
                    b.vy += (avg - b.y) * PHYSICS.gravityForce;
                }

                // 4.b Répulsion mutuelle TOUJOURS ACTIVE
                blobs.forEach((other, j) => {
                    if (i !== j) {
                        const dx = b.x - other.x;
                        const dy = b.y - other.y;
                        const dist = Math.hypot(dx, dy);
                        // On laisse la répulsion agir pour qu'ils ne fusionnent jamais en un seul point
                        if (dist > 0.001 && dist < PHYSICS.repulsionRadius) {
                            const rawForce = Math.pow((PHYSICS.repulsionRadius - dist) / PHYSICS.repulsionRadius, 2);
                            const repForce = rawForce * PHYSICS.repulsionForce;
                            const vortexForce = rawForce * PHYSICS.repulsionVortex;

                            // 1. Force de répulsion pure (éloignement)
                            b.vx += (dx / dist) * repForce;
                            b.vy += (dy / dist) * repForce;

                            // 2. Force Tangentielle / Vortex (esquive sur le côté)
                            // C'est ce qui transforme un rebond frontal en un croisement / enroulement fluide
                            b.vx += (-dy / dist) * vortexForce;
                            b.vy += (dx / dist) * vortexForce;
                        }
                    }
                });

                // 5. Murs élastiques
                if (b.x < -0.2) { b.x = -0.2; b.vx *= -0.5; }
                if (b.x > 1.2) { b.x = 1.2; b.vx *= -0.5; }
                if (b.y < -0.2) { b.y = -0.2; b.vy *= -0.5; }
                if (b.y > 1.2) { b.y = 1.2; b.vy *= -0.5; }

                // Remplir Float32Array pour uPositions
                positionsArray[i * 2] = b.x;
                positionsArray[i * 2 + 1] = b.y;
            });

            gl.uniform1f(uTime, t * 0.001);
            gl.uniform2f(uRes, w, h);
            if (uMouse) gl.uniform2f(uMouse, smooth.x, smooth.y);
            if (uPositions) gl.uniform2fv(uPositions, positionsArray);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            raf = requestAnimationFrame(draw);
        };
        raf = requestAnimationFrame(draw);

        return () => {
            active = false;
            cancelAnimationFrame(raf);
            window.removeEventListener('mousemove', onMouse);
            window.removeEventListener('touchmove', onTouch);
            window.removeEventListener('touchstart', onTouch);
            gl.deleteProgram(prog);
            gl.deleteBuffer(buf);
        };
    }, [preset?.frag, JSON.stringify(PHYSICS)]);

    return (
        <div className="fixed inset-0 z-[-50] pointer-events-none overflow-hidden">
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ display: 'block' }}
                aria-hidden="true"
            />
        </div>
    );
}
