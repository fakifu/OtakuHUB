/**
 * BottomNav — Liquid Glass Pill v3
 *
 * Corrections v3 vs v2 :
 *   - Barre : classes Tailwind light/dark (comme la legacy) — translucidité préservée
 *   - Pilule : top: BAR_H/2 - 1 restauré (réglage pixel-perfect intentionnel)
 *   - Anti-TP : spring plus amorti (damping 30) → snap doux sans saut visuel
 *   - Pilule drag : identique light/dark (semi-transparente neutre universelle)
 *   - Pilule idle : plus contrastée par thème
 *   - Physique organique : useVelocity → scaleX/scaleY squash&stretch (UiExperimentation V4)
 *   - Icônes : valeurs de contraste legacy restaurées (ICON_SIZE 26/34, colorNeutral fort)
 *
 * ═══════════════════════════════════════════════════════════════════════
 * 🎨 COMMENT PERSONNALISER — Tout se passe dans les blocs CONFIG ci-dessous
 * ═══════════════════════════════════════════════════════════════════════
 */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform, useVelocity } from 'framer-motion';
import { Circle, Sliders } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import useKeyboardStatus from '../../hooks/useKeyboardStatus';
import { useNavigation } from '../../context/NavigationContext';
import { UI } from '../../designSystem';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 PALETTE — Fond de barre + icônes (dépendant du thème)
// Les classes barBg/barBorder/barShadow sont des classes Tailwind
// pour que le backdrop-blur-[40px] fonctionne correctement sur les deux thèmes
// ═══════════════════════════════════════════════════════════════════════════════
const NAV_PALETTES = {
  light: {
    barBg: 'bg-white/[0.01]',
    barBorder: 'border border-white/10',
    barShadow: 'shadow-2xl',
    // Principe Switch : pilule très opaque au repos (effet verre solide lumineux)
    // → contraste fort sur fond clair, drag devient plus transparent (inverse du drag)
    pillBgIdle: 'rgba(255, 255, 255, 0.25)',  // quasi solide comme Switch foreground
    pillBorderIdle: 'rgba(0, 0, 0, 0.06)',         // léger bord sombre comme Switch
    pillBlurIdle: 'blur(24px) saturate(200%)',
    pillShadow: '0 4px 20px rgba(0,0,0,0.08), inset 0 1px 2px rgba(255,255,255,0.6)',
    colorNeutral: 'rgba(120, 120, 140, 0.8)',
    colorAccent: '#4f46e5',
  },
  dark: {
    barBg: 'bg-black/[0.08]',
    barBorder: 'border border-white/[0.03]',
    barShadow: 'shadow-2xl',
    // Dark : repos plus visible (fond sombre = besoin de contraste)
    pillBgIdle: 'rgba(255, 255, 255, 0.14)',
    pillBorderIdle: 'rgba(255, 255, 255, 0)',
    pillBlurIdle: 'blur(28px) saturate(220%) brightness(1.20)',
    pillShadow: '0 4px 20px rgba(0,0,0,0.35), inset 0 1px 3px rgba(255,255,255,0.22)',
    colorNeutral: 'rgba(140, 140, 160, 0.8)',
    colorAccent: '#818cf8',
  },
};

// Pilule drag — plus transparent que le repos (inverse du principe habituel)
// En light le drag est "effacé" pour laisser voir le mouvement
const PILL_DRAG = {
  bg: 'rgba(255, 255, 255, 0.18)',
  border: 'rgba(255, 255, 255, 0)',
  blur: 'blur(40px) saturate(280%) brightness(1.22)',
  shadow: 'inset 0 1px 10px rgba(255,255,255,0.18), 0 16px 48px rgba(0,0,0,0.22)',
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔵 PHYSIQUE — Décommenter un seul preset springPill à la fois
// ═══════════════════════════════════════════════════════════════════════════════
const NAV_CFG = {
  routes: ['/', '/tab2', '/tab3', '/settings'],
  icons: [Circle, Circle, Circle, Sliders],

  // Dimensions pixel-perfect pour conteneur 360px (328px interne après px-4)
  BAR_H: 70,
  PILL_W_IDLE: 80,     // 328 / 4 ≈ 82px — épouse exactement un slot
  PILL_W_DRAG: 95,    // Déborde lateralement au drag
  PILL_H_IDLE: 64,     // 3px gap top/bottom (70 - 64 = 6px / 2 = 3px)
  PILL_H_DRAG: 80,     // Déborde franchement en haut/bas
  ICON_SIZE: 26,       // Couche base (icons neutres)
  ICON_SIZE_ACCENT: 34,// Couche accent (sous pilule, loupe fixe)

  // ── Preset A : Fluide / Organique — ressort doux, inertie
  springPill: { damping: 22, stiffness: 220, mass: 1.1 },

  springBar: { damping: 24, stiffness: 220, mass: 0.8 },
  barExpand: 1.030,

  // ── Physique organique squash/stretch (UiExperimentation V4)
  // velMax     : vitesse à partir de laquelle la déformation est saturée (px/s)
  //              ↓ plus petit = déformation visible dès les mouvements lents
  // stretchMax : allongement horizontal max (1.0 = aucun, 1.5 = +50% de largeur)
  //              ↑ plus grand = pilule très élastique
  // compressMin: compression verticale correspondante (conservation de volume)
  //              ↓ plus petit = compression plus marquée
  velMax: 2600,
  stretchMax: 1.28,
  compressMin: 0.84,

  // Clés de mémoire correspondantes dans NavigationContext
  routeMemoryKeys: ['dashboard', 'finance', 'business', 'settings'],
};

// ─────────────────────────────────────────────────────────────────────────────
// DEBUG — Mettre à true pour afficher les centres théoriques et la position pilule
// ─────────────────────────────────────────────────────────────────────────────
const DEBUG = false;

function DebugOverlay({ springX, containerRef }) {
  const { icons } = NAV_CFG;
  const [info, setInfo] = React.useState({ w: 0, pillX: 0, centers: [] });
  React.useEffect(() => {
    const unsub = springX.on('change', (x) => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      setInfo({ w, pillX: Math.round(x), centers: Array.from({ length: icons.length }, (_, i) => Math.round((i + 0.5) * (w / icons.length))) });
    });
    return unsub;
  }, [springX, containerRef, icons.length]);
  if (!info.w) return null;
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
      {info.centers.map((cx, i) => (
        <div key={i} className="absolute top-0 bottom-0 w-px bg-red-500/80" style={{ left: cx }}>
          <span className="absolute text-[8px] text-red-400 font-mono bg-black/60 px-0.5" style={{ top: 2, left: 2 }}>{cx}</span>
        </div>
      ))}
      <motion.div className="absolute top-0 bottom-0 w-0.5 bg-green-400/90" style={{ left: springX }} />
      <div className="absolute bottom-0 left-0 right-0 text-center text-[7px] font-mono text-white/80 bg-black/50" style={{ lineHeight: '12px' }}>
        w={info.w}px | pillX={info.pillX}px | centers=[{info.centers.join(', ')}]
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PillIcon — Rendu purement réactif aux motion values (zéro re-render React)
// Couleur basculée via useTransform [proximity, activeMV] — garantit la couleur
// correcte au reload même avant le premier mouvement du spring.
// ─────────────────────────────────────────────────────────────────────────────
const PillIcon = React.memo(function PillIcon({ Icon, index, springX, isActive, isDraggingRef, containerRef, palette }) {
  const { icons, PILL_W_IDLE, PILL_W_DRAG, ICON_SIZE } = NAV_CFG;
  const { colorNeutral, colorAccent } = palette;

  const proximity = useTransform(springX, (x) => {
    if (!containerRef.current) return 0;
    const w = containerRef.current.clientWidth;
    const center = (index + 0.5) * (w / icons.length);
    const halfPill = (isDraggingRef.current ? PILL_W_DRAG : PILL_W_IDLE) / 2;
    return Math.max(0, Math.min(1, 1 - Math.abs(x - center) / halfPill));
  });

  // activeMV : convertit la prop React en motion value pour useTransform
  const activeMV = useMotionValue(isActive ? 1 : 0);
  React.useEffect(() => { activeMV.set(isActive ? 1 : 0); }, [isActive, activeMV]);

  // Couleur : max(proximité dynamique, état actif statique)
  const iconColor = useTransform([proximity, activeMV], ([p, a]) => {
    return Math.max(p, a) >= 0.08 ? colorAccent : colorNeutral;
  });

  const iconScale = useTransform(proximity, [0, 1], [1.0, 1.12]);

  return (
    <motion.div className="flex-1 flex items-center justify-center h-full" style={{ scale: iconScale }}>
      <motion.div style={{ color: iconColor }}>
        <Icon size={ICON_SIZE} strokeWidth={isActive ? 2.5 : 2} />
      </motion.div>
    </motion.div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// BottomNav
// ─────────────────────────────────────────────────────────────────────────────
export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme } = useTheme();
  const isKeyboardOpen = useKeyboardStatus();
  const { memory } = useNavigation();

  const palette = NAV_PALETTES[theme] ?? NAV_PALETTES.dark;
  const {
    routes, icons, PILL_W_IDLE, PILL_W_DRAG, PILL_H_IDLE, PILL_H_DRAG,
    BAR_H, springPill, springBar, barExpand, ICON_SIZE, ICON_SIZE_ACCENT,
    velMax, stretchMax, compressMin,
  } = NAV_CFG;
  const { barBg, barBorder, barShadow, pillBgIdle, pillBorderIdle, pillBlurIdle, pillShadow } = palette;

  // ── Index actif ─────────────────────────────────────────────────────────────
  const getActiveFromPath = React.useCallback((path) => {
    // Si correspondance exacte (ex: '/'), on prend immédiatement
    const exactIdx = routes.findIndex((r) => r === path);
    if (exactIdx !== -1) return exactIdx;
    
    // Sinon on cherche le préfixe le plus long (ex: '/settings' vs '/')
    let bestIdx = -1;
    let maxMatchLen = 0;
    routes.forEach((r, i) => {
      if (r !== '/' && path.startsWith(r) && r.length > maxMatchLen) {
        maxMatchLen = r.length;
        bestIdx = i;
      }
    });
    return bestIdx !== -1 ? bestIdx : 0;
  }, [routes]);

  const [activeIndex, setActiveIndex] = React.useState(() => getActiveFromPath(pathname));
  const [isDragging, setIsDragging] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  React.useEffect(() => { setActiveIndex(getActiveFromPath(pathname)); }, [pathname, getActiveFromPath]);

  React.useEffect(() => {
    const check = () => setIsModalOpen(!!document.querySelector('[data-modal-container]'));
    const obs = new MutationObserver(check);
    obs.observe(document.body, { childList: true, subtree: true });
    check();
    return () => obs.disconnect();
  }, []);

  // ── Motion values ────────────────────────────────────────────────────────────
  const containerRef = React.useRef(null);
  const isDraggingRef = React.useRef(false);
  const lastDragIndexRef = React.useRef(-1);
  const accentLayerRef = React.useRef(null);
  const baseLayerRef = React.useRef(null);

  const pillX = useMotionValue(0);
  const springX = useSpring(pillX, springPill);
  const barScaleMV = useMotionValue(1);
  const barScale = useSpring(barScaleMV, springBar);
  const pillWMV = useMotionValue(PILL_W_IDLE);
  const springPillW = useSpring(pillWMV, { stiffness: 420, damping: 26 });

  // ── Physique organique — squash/stretch basé sur la vélocité du spring ───────
  const velocity = useVelocity(springX);
  // scaleX ↔ stretch horizontal: s'allonge dans le sens du mouvement
  const pillScaleX = useTransform(velocity, [-velMax, 0, velMax], [stretchMax, 1, stretchMax]);
  // scaleY ↔ compression verticale: conservation de volume (inversé)
  const pillScaleY = useTransform(velocity, [-velMax, 0, velMax], [compressMin, 1, compressMin]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getIconCenter = React.useCallback((idx) => {
    if (!containerRef.current) return 0;
    const w = containerRef.current.clientWidth;
    return (idx + 0.5) * (w / icons.length);
  }, [icons.length]);

  const clampX = React.useCallback((x) => {
    if (!containerRef.current) return x;
    const w = containerRef.current.clientWidth;
    const slotW = w / icons.length;
    return Math.max(slotW * 0.5, Math.min(x, w - slotW * 0.5));
  }, [icons.length]);

  const snapToNearest = React.useCallback((x) => {
    if (!containerRef.current) return 0;
    const w = containerRef.current.clientWidth;
    return Math.max(0, Math.min(Math.round(x / (w / icons.length) - 0.5), icons.length - 1));
  }, [icons.length]);

  const getX = React.useCallback((e) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    const borderLeft = (rect.width - containerRef.current.clientWidth) / 2;
    return (clientX - rect.left - borderLeft) / barScaleMV.get();
  }, [barScaleMV]);

  // ── Effet loupe — clip Accent + mask Base — sync sur même spring ─────────────
  React.useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      if (w <= 0) return;
      const x = springX.get();
      const pw = springPillW.get();
      const L = Math.max(0, x - pw / 2);
      const R = Math.min(w, x + pw / 2);
      const rClip = Math.max(0, w - R);

      if (accentLayerRef.current)
        accentLayerRef.current.style.clipPath = `inset(0px ${rClip.toFixed(1)}px 0px ${L.toFixed(1)}px)`;

      if (baseLayerRef.current) {
        const mask = `linear-gradient(to right, black ${L.toFixed(1)}px, transparent ${L.toFixed(1)}px, transparent ${R.toFixed(1)}px, black ${R.toFixed(1)}px)`;
        baseLayerRef.current.style.maskImage = mask;
        baseLayerRef.current.style.webkitMaskImage = mask;
      }
    };
    const unsubX = springX.on('change', update);
    const unsubW = springPillW.on('change', update);
    return () => { unsubX(); unsubW(); };
  }, [springX, springPillW]);

  // Init avant le premier paint (sync) — évite le flash des deux couches
  React.useLayoutEffect(() => {
    const el = containerRef.current;
    const w = el ? el.clientWidth : 0;
    if (w > 0) {
      const center = (activeIndex + 0.5) * (w / icons.length);
      const pw = PILL_W_IDLE;
      const L = Math.max(0, center - pw / 2);
      const R = Math.min(w, center + pw / 2);
      const rClip = Math.max(0, w - R);
      if (accentLayerRef.current)
        accentLayerRef.current.style.clipPath = `inset(0px ${rClip.toFixed(1)}px 0px ${L.toFixed(1)}px)`;
      if (baseLayerRef.current) {
        const mask = `linear-gradient(to right, black ${L.toFixed(1)}px, transparent ${L.toFixed(1)}px, transparent ${R.toFixed(1)}px, black ${R.toFixed(1)}px)`;
        baseLayerRef.current.style.maskImage = mask;
        baseLayerRef.current.style.webkitMaskImage = mask;
      }
    } else {
      if (accentLayerRef.current) accentLayerRef.current.style.clipPath = 'inset(0px 100% 0px 0px)';
      if (baseLayerRef.current) { baseLayerRef.current.style.maskImage = 'none'; baseLayerRef.current.style.webkitMaskImage = 'none'; }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Ref pour que le ResizeObserver connaisse toujours l'index actif
  // sans être lui-même une dépendance de l'effet (évite le jump au changement de page)
  const activeIndexRef = React.useRef(activeIndex);
  React.useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);

  // ResizeObserver — positionnement initial et snap sur resize uniquement
  // activeIndex N'EST PAS dans les dépendances → l'effet ne re-tourne JAMAIS au changement de page
  React.useEffect(() => {
    if (!containerRef.current) return;
    const snapNow = () => {
      if (containerRef.current?.clientWidth > 0) {
        const center = getIconCenter(activeIndexRef.current);
        springX.jump(center);
        pillX.jump(center);
      }
    };
    const snapSpring = () => {
      if (containerRef.current?.clientWidth > 0) pillX.set(getIconCenter(activeIndexRef.current));
    };
    const obs = new ResizeObserver(snapNow);
    obs.observe(containerRef.current);
    snapNow(); // Positionnement initial au mount uniquement
    window.addEventListener('resize', snapSpring);
    return () => { obs.disconnect(); window.removeEventListener('resize', snapSpring); };
  }, [getIconCenter, pillX, springX]); // activeIndex retiré des dépendances

  // Effet de navigation — spring fluide vers l'index actif
  // S'exécute uniquement si on ne drague pas (handleUp gère déjà la position pendant le drag)
  React.useEffect(() => {
    if (!isDraggingRef.current && containerRef.current?.clientWidth > 0) {
      pillX.set(getIconCenter(activeIndex)); // .set() = animation spring, pas de jump
    }
  }, [activeIndex, getIconCenter, pillX]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleDown = React.useCallback((e) => {
    containerRef.current?.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    lastDragIndexRef.current = -1; // reset on new gesture
    setIsDragging(true);
    barScaleMV.set(barExpand);
    pillWMV.set(PILL_W_DRAG);
    pillX.set(clampX(getX(e)));
  }, [barExpand, barScaleMV, clampX, getX, pillX, pillWMV, PILL_W_DRAG]);

  const handleMove = React.useCallback((e) => {
    if (!isDraggingRef.current) return;
    pillX.set(clampX(getX(e)));
    const currentIdx = snapToNearest(getX(e));
    if (currentIdx !== lastDragIndexRef.current) {
      lastDragIndexRef.current = currentIdx;
    }
  }, [clampX, getX, pillX, snapToNearest]);

  const handleUp = React.useCallback((e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    barScaleMV.set(1);
    pillWMV.set(PILL_W_IDLE);
    const idx = snapToNearest(getX(e));
    pillX.set(getIconCenter(idx));

    // Check if user is clicking on the ALREADY active tab
    const isAlreadyActive = (activeIndex === idx);
    setActiveIndex(idx);

    if (isAlreadyActive) {
      // If déjà actif et qu'on n'est pas à la racine de l'onglet -> remonter d'un étage (à la racine)
      if (pathname !== routes[idx]) {
        React.startTransition(() => navigate(routes[idx]));
      }
    } else {
      // Si on change d'onglet, on va vers la mémoire de l'onglet cible
      const memoryKey = NAV_CFG.routeMemoryKeys?.[idx] || 'dashboard';
      const targetPath = memory?.[memoryKey] || routes[idx];
      React.startTransition(() => navigate(targetPath));
    }
  }, [activeIndex, barScaleMV, getIconCenter, getX, navigate, pathname, pillX, pillWMV, PILL_W_IDLE, routes, snapToNearest, memory]);

  const handleCancel = React.useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    barScaleMV.set(1);
    pillWMV.set(PILL_W_IDLE);
    pillX.set(getIconCenter(activeIndex));
  }, [activeIndex, barScaleMV, getIconCenter, pillX, pillWMV, PILL_W_IDLE]);

  // ── Rendu ─────────────────────────────────────────────────────────────────────
  // On NE fait PAS "return null" — causerait un démontage complet (flash garanti).
  // Solution : masquage CSS pur — le composant reste monté, tous ses états préservés.
  return (
    <nav
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[360px] px-4 md:hidden transition-all duration-300 ease-out ${(isKeyboardOpen && !isModalOpen)
        ? 'opacity-0 translate-y-4 pointer-events-none'
        : 'opacity-100 translate-y-0'
        }`}
    >
      <motion.div
        ref={containerRef}
        className={`relative w-full rounded-[2.5rem] touch-none cursor-pointer backdrop-blur-[20px] saturate-[150%] ${barBg} ${barBorder} ${barShadow}`}
        style={{ height: BAR_H, scale: barScale }}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerLeave={handleCancel}
        onPointerCancel={handleCancel}
      >
        {/* PILULE
            Outer div : suivi spring de la position X
            Wrapper div : centrage précis BAR_H/2 - 1 (réglage pixel-perfect intentionnel)
            Inner motion.div : squash/stretch via velocity (scaleX/scaleY organiques)
            Innermost motion.div : apparence (couleurs, blur, taille) via animate */}
        <motion.div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{ left: 0, x: springX, zIndex: 1 }}
        >
          <div
            className="absolute left-0 -translate-x-1/2"
            style={{ top: BAR_H / 2 - 1, transform: 'translateX(-50%) translateY(-50%)' }}
          >
            {/* Couche squash/stretch — scaleX/scaleY pilotés par la vélocité */}
            <motion.div style={{ scaleX: pillScaleX, scaleY: pillScaleY }}>
              <motion.div
                className="rounded-full"
                animate={{
                  width: isDragging ? PILL_W_DRAG : PILL_W_IDLE,
                  height: isDragging ? PILL_H_DRAG : PILL_H_IDLE,
                  backgroundColor: isDragging ? PILL_DRAG.bg : pillBgIdle,
                  backdropFilter: isDragging ? PILL_DRAG.blur : pillBlurIdle,
                  boxShadow: isDragging ? PILL_DRAG.shadow : pillShadow,
                  borderColor: isDragging ? PILL_DRAG.border : pillBorderIdle,
                  scale: isDragging ? 1.04 : 1,
                }}
                initial={false}
                transition={{ type: 'spring', stiffness: 420, damping: 26 }}
              />
            </motion.div>
          </div>
        </motion.div>

        {DEBUG && <DebugOverlay springX={springX} containerRef={containerRef} />}

        {/* COUCHE BASE — icônes petites couleur neutre
            mask-image inverse : disparaissent sous la pilule */}
        <div
          ref={baseLayerRef}
          className="absolute inset-0 flex items-center pointer-events-none"
          style={{ color: palette.colorNeutral }}
        >
          {icons.map((Icon, i) => (
            <div key={i} className="flex-1 flex items-center justify-center h-full">
              <Icon size={ICON_SIZE} strokeWidth={2} />
            </div>
          ))}
        </div>

        {/* COUCHE ACCENT — icônes GRANDES couleur accent
            clip-path : visibles UNIQUEMENT sous la pilule
            La différence de taille crée l'illusion de loupe */}
        <div
          ref={accentLayerRef}
          className="absolute inset-0 flex items-center pointer-events-none"
          style={{ color: palette.colorAccent }}
        >
          {icons.map((Icon, i) => (
            <div key={i} className="flex-1 flex items-center justify-center h-full">
              <Icon size={ICON_SIZE_ACCENT} strokeWidth={2.5} />
            </div>
          ))}
        </div>
      </motion.div>
    </nav>
  );
}
