/**
 * BottomNav3Tabs — Variantes modulaire à 3 Onglets (ex: Home, Business, Settings)
 * Démontre la flexibilité mathématique de la pilule Liquid Glass pour N onglets.
 */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform, useVelocity } from 'framer-motion';
import { LayoutDashboard, Search, BookMarked } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import useKeyboardStatus from '../../hooks/useKeyboardStatus';
import { useNavigation } from '../../context/NavigationContext';


const NAV_PALETTES = {
  light: {
    barBg: 'bg-white/[0.01]',
    barBorder: 'border border-white/10',
    barShadow: 'shadow-2xl',
    pillBgIdle: 'rgba(255, 255, 255, 0.25)',
    pillBorderIdle: 'rgba(0, 0, 0, 0.06)',
    pillBlurIdle: 'blur(24px) saturate(200%)',
    pillShadow: '0 4px 20px rgba(0,0,0,0.08), inset 0 1px 2px rgba(255,255,255,0.6)',
    colorNeutral: 'rgba(120, 120, 140, 0.8)',
    colorAccent: '#4f46e5',
  },
  dark: {
    barBg: 'bg-black/[0.08]',
    barBorder: 'border border-white/[0.03]',
    barShadow: 'shadow-2xl',
    pillBgIdle: 'rgba(255, 255, 255, 0.14)',
    pillBorderIdle: 'rgba(255, 255, 255, 0)',
    pillBlurIdle: 'blur(28px) saturate(220%) brightness(1.20)',
    pillShadow: '0 4px 20px rgba(0,0,0,0.35), inset 0 1px 3px rgba(255,255,255,0.22)',
    colorNeutral: 'rgba(140, 140, 160, 0.8)',
    colorAccent: '#818cf8',
  },
};

const PILL_DRAG = {
  bg: 'rgba(255, 255, 255, 0.18)',
  border: 'rgba(255, 255, 255, 0)',
  blur: 'blur(40px) saturate(280%) brightness(1.22)',
  shadow: 'inset 0 1px 10px rgba(255,255,255,0.18), 0 16px 48px rgba(0,0,0,0.22)',
};

// 🎌 CONFIGURATION OTAKUHUB — 3 Onglets: Dashboard / Recherche / Library
const NAV_CFG_3 = {
  routes: ['/', '/search', '/library'],
  icons: [LayoutDashboard, Search, BookMarked],

  BAR_H: 70,
  PILL_W_IDLE: 104,
  PILL_W_DRAG: 120,
  PILL_H_IDLE: 64,
  PILL_H_DRAG: 80,
  ICON_SIZE: 26,
  ICON_SIZE_ACCENT: 34,

  springPill: { damping: 22, stiffness: 220, mass: 1.1 },
  springBar: { damping: 24, stiffness: 220, mass: 0.8 },
  barExpand: 1.030,

  velMax: 2600,
  stretchMax: 1.28,
  compressMin: 0.84,

  routeMemoryKeys: ['dashboard', 'search', 'library'],
};


export default function BottomNav3Tabs() {
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
  } = NAV_CFG_3;
  const { barBg, barBorder, barShadow, pillBgIdle, pillBorderIdle, pillBlurIdle, pillShadow } = palette;

  const getActiveFromPath = React.useCallback((path) => {
    const exactIdx = routes.findIndex((r) => r === path);
    if (exactIdx !== -1) return exactIdx;
    
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

  const velocity = useVelocity(springX);
  const pillScaleX = useTransform(velocity, [-velMax, 0, velMax], [stretchMax, 1, stretchMax]);
  const pillScaleY = useTransform(velocity, [-velMax, 0, velMax], [compressMin, 1, compressMin]);

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

  const activeIndexRef = React.useRef(activeIndex);
  React.useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);

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
    snapNow();
    window.addEventListener('resize', snapSpring);
    return () => { obs.disconnect(); window.removeEventListener('resize', snapSpring); };
  }, [getIconCenter, pillX, springX]);

  React.useEffect(() => {
    if (!isDraggingRef.current && containerRef.current?.clientWidth > 0) {
      pillX.set(getIconCenter(activeIndex));
    }
  }, [activeIndex, getIconCenter, pillX]);

  const handleDown = React.useCallback((e) => {
    containerRef.current?.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    lastDragIndexRef.current = -1;
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

    const isAlreadyActive = (activeIndex === idx);
    setActiveIndex(idx);

    if (isAlreadyActive) {
      window.dispatchEvent(new CustomEvent('reset-tab-detail', { detail: { tabIndex: idx, route: routes[idx] } }));
      if (pathname !== routes[idx]) {
        React.startTransition(() => navigate(routes[idx]));
      }
    } else {
      const memoryKey = NAV_CFG_3.routeMemoryKeys?.[idx] || 'dashboard';
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

  return (
    <nav
      className={`fixed bottom-5 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[360px] px-4 transition-all duration-300 ease-out ${(isKeyboardOpen && !isModalOpen)
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
        <motion.div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{ left: 0, x: springX, zIndex: 1 }}
        >
          <div
            className="absolute left-0 -translate-x-1/2"
            style={{ top: BAR_H / 2 - 1, transform: 'translateX(-50%) translateY(-50%)' }}
          >
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
