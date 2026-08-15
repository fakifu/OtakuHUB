/**
 * Switch — Liquid Glass (Architecture identique à BottomNav)
 *
 * ┌─────────────────── Container ───────────────────┐
 * │  [Pilule spring-animée]                         │
 * │  [Btn ghost ─ pointer-events:none ─ visuel only]│
 * │  [Overlay transparent z-20 ─ capte TOUS les     │
 * │   pointer events ─ même logique que la navbar]  │
 * └─────────────────────────────────────────────────┘
 *
 * Pourquoi ça marche sur iOS Safari :
 *   - Le pointerdown frappe l'overlay (div sans sémantique interactive)
 *   - iOS ne lui applique PAS son gesture recognizer "clickable element"
 *   - setPointerCapture sur l'overlay est honoré jusqu'au pointerup
 *   - Identique au mécanisme de la BottomNav
 */
import React from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useTheme } from '../../../hooks/useTheme';
import { UI } from '../../../designSystem';

// ─── CONFIG — Modifier ici pour ajuster le design ────────────────────────────
const SWITCH_CFG = {
  spring: { stiffness: 480, damping: 32, mass: 0.6 },

  // Apparence pilule au repos
  idle: {
    scaleX: 1,
    scaleY: 1,
  },

  // Apparence pilule au drag/press (glass)
  drag: {
    scaleX: 1.08,   // élargissement horizontal
    scaleY: 1.12,   // élargissement vertical (top: -4 / bottom: -4)
    topOffset: -4,  // dépasse du container en px (overflow:visible requis)
    blur: 'blur(20px) saturate(220%) brightness(1.18)',
    shadow: '0 6px 28px rgba(0,0,0,0.18), inset 0 1px 6px rgba(255,255,255,0.25)',
    bgLight: 'rgba(255,255,255,0.20)',
    bgDark: 'rgba(255,255,255,0.10)',
    border: 'rgba(255,255,255,0.42)',
  },

  // Seuil de distance pour démarrer le déplacement de la pilule
  // Mouse : plus grand → on peut cliquer sans drag involontaire
  dragThresholdTouch: 5,
  dragThresholdMouse: 10,
};

// Équivalents rgba des classes Tailwind pour "foreground" variant
const FOREGROUND_COLORS = {
  light: { bg: 'rgba(0,0,0,0.70)', border: 'rgba(255,255,255,0.10)', blur: 'blur(24px) saturate(200%)' },
  dark: { bg: 'rgba(255,255,255,0.80)', border: 'rgba(0,0,0,0.05)', blur: 'blur(24px) saturate(200%)' },
};
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_TOGGLE_OPTIONS = [
  { value: false, label: 'Off' },
  { value: true, label: 'On' },
];

export default function Switch({
  options = DEFAULT_TOGGLE_OPTIONS,
  checked,
  value,
  onChange,
  color,
  colors = {},
  size = 'md',
  height,
  variant,
}) {
  const activeValue = checked !== undefined ? checked : value;
  const n = options.length;
  const activeIndex = options.findIndex(o => o.value === activeValue);
  const { theme } = useTheme();

  // ── Sizing Centralisé (designSystem.js) ───────────────────────────────────
  const sizeConfig = UI.switches?.sizes[size] || UI.switches?.sizes.md;
  const H = height || sizeConfig.h;
  const INS = sizeConfig.inset;
  const TXCLS = sizeConfig.text;
  const ICOSZ = sizeConfig.icon;

  // ── Couleurs pilule legacy ─────────────────────────────────────────────────
  let pillBg = 'var(--accent-soft, rgba(79,70,229,0.15))';
  let pillBorder = 'var(--border-active, rgba(79,70,229,0.3))';
  let pillBlur = 'blur(0px)';

  const isForeground = color === 'foreground';

  if (color === 'danger') {
    pillBg = 'rgba(239,68,68,0.15)'; pillBorder = 'rgba(239,68,68,0.3)';
  } else if (color === 'success') {
    pillBg = 'rgba(16,185,129,0.15)'; pillBorder = 'rgba(16,185,129,0.3)';
  } else if (isForeground) {
    const fc = FOREGROUND_COLORS[theme] ?? FOREGROUND_COLORS.dark;
    pillBg = fc.bg;
    pillBorder = fc.border;
    pillBlur = fc.blur;
  } else if (Object.keys(colors).length > 0) {
    const c = colors[activeValue] ?? colors[activeIndex] ?? colors[activeIndex === 0 ? 'left' : 'right'];
    pillBg = c?.bg ?? pillBg;
    pillBorder = c?.border ?? pillBorder;
  }

  const getActiveText = (idx) => {
    if (!options[idx]) return 'text-muted';
    if (color === 'foreground') return 'text-white dark:text-black';
    if (color === 'danger') return 'text-danger';
    if (color === 'success') return 'text-success';
    if (Object.keys(colors).length > 0) {
      const optionValue = options[idx]?.value;
      const c = colors[optionValue] ?? colors[idx] ?? colors[idx === 0 ? 'left' : 'right'];
      return c?.text || 'text-accent';
    }
    return 'text-accent';
  };

  const containerBg = isForeground
    ? 'bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10'
    : 'glass-panel';

  // ── Refs ───────────────────────────────────────────────────────────────────
  const containerRef = React.useRef(null);
  const overlayRef = React.useRef(null);
  const isDraggingRef = React.useRef(false);
  const isPointerDownRef = React.useRef(false);
  const pointerDownX = React.useRef(0);
  const pointerDownY = React.useRef(0);      // ← NEW : pour détecter le scroll vertical
  const directionLocked = React.useRef(null); // ← NEW : 'horizontal' | 'vertical' | null
  const slotWRef = React.useRef(0);
  const lastDragIndexRef = React.useRef(-1);

  const [isDragging, setIsDragging] = React.useState(false);

  // ── Motion values ──────────────────────────────────────────────────────────
  const pillX = useMotionValue(0);
  const springX = useSpring(pillX, SWITCH_CFG.spring);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const slotCenter = React.useCallback(
    (idx) => idx * slotWRef.current,
    [],
  );

  const clamp = React.useCallback((x) =>
    Math.max(0, Math.min(x - slotWRef.current / 2, (n - 1) * slotWRef.current)),
    [n]);

  const getLocalX = React.useCallback((e) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    return e.clientX - rect.left - INS;
  }, [INS]);

  // ── ResizeObserver ─────────────────────────────────────────────────────────
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const sync = () => {
      const sw = el.clientWidth / n;
      slotWRef.current = sw;
      if (!isDraggingRef.current) {
        const safeIdx = Math.max(0, activeIndex);
        pillX.jump(safeIdx * sw);
        springX.jump(safeIdx * sw); // sync la spring aussi — même pattern que BottomNav
      }
    };
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    sync();
    return () => ro.disconnect();
  }, [n]); // eslint-disable-line react-hooks/exhaustive-deps

  const prevActiveIndexRef = React.useRef(activeIndex);

  // Sync position depuis l'extérieur (click → activeIndex change)
  React.useEffect(() => {
    if (!isDraggingRef.current && slotWRef.current > 0) {
      const safeIdx = Math.max(0, activeIndex);
      if (prevActiveIndexRef.current === -1 && activeIndex >= 0) {
        pillX.jump(safeIdx * slotWRef.current);
        springX.jump(safeIdx * slotWRef.current);
      } else {
        pillX.set(safeIdx * slotWRef.current);
      }
    }
    prevActiveIndexRef.current = activeIndex;
  }, [activeIndex, pillX, springX]);

  // ── Pointer handlers (sur l'OVERLAY — architecturalement identique à BottomNav)
  const handleDown = React.useCallback((e) => {
    pointerDownX.current = e.clientX;
    pointerDownY.current = e.clientY;
    directionLocked.current = null;
    isPointerDownRef.current = true;
    lastDragIndexRef.current = -1; // reset on new gesture
    overlayRef.current?.setPointerCapture(e.pointerId);
    setIsDragging(true);
  }, []);

  const handleMove = React.useCallback((e) => {
    if (!isPointerDownRef.current) return;

    const dx = Math.abs(e.clientX - pointerDownX.current);
    const dy = Math.abs(e.clientY - pointerDownY.current);
    const threshold = e.pointerType === 'mouse'
      ? SWITCH_CFG.dragThresholdMouse
      : SWITCH_CFG.dragThresholdTouch;

    // ─ Détection de direction (une seule fois par geste) ──────────────
    if (!directionLocked.current && (dx > threshold || dy > threshold)) {
      // Si le geste est surtout vertical → on laisse le scroll se faire
      if (dy > dx) {
        directionLocked.current = 'vertical';
        // On relâche le pointercapture pour que le scroll reprenne le dessus
        overlayRef.current?.releasePointerCapture(e.pointerId);
        // Annule proprement le switch
        isDraggingRef.current = false;
        isPointerDownRef.current = false;
        directionLocked.current = null;
        setIsDragging(false);
        return;
      }
      directionLocked.current = 'horizontal';
    }

    // Si on est en mode scroll vertical, on ne fait rien du tout
    if (directionLocked.current === 'vertical') return;

    // ─ Logique horizontale habituelle ────────────────────────
    if (!isDraggingRef.current && dx > threshold) {
      isDraggingRef.current = true;
    }
    if (isDraggingRef.current) {
      pillX.set(clamp(getLocalX(e)));
      // Haptic tick on each slot crossed during slide
      const currentIdx = Math.max(0, Math.min(Math.round(pillX.get() / slotWRef.current), n - 1));
      if (currentIdx !== lastDragIndexRef.current) {
        lastDragIndexRef.current = currentIdx;
      }
    }
  }, [pillX, clamp, getLocalX, n]);

  const handleUp = React.useCallback((e) => {
    setIsDragging(false);
    const localX = getLocalX(e);

    let idx;
    if (isDraggingRef.current) {
      // Drag : snap sur la position réelle de la pilule (pas du doigt → pas de biais)
      idx = Math.max(0, Math.min(Math.round(pillX.get() / slotWRef.current), n - 1));
    } else {
      // Tap : slot sous le tap (floor = aucun biais)
      idx = Math.max(0, Math.min(Math.floor(localX / slotWRef.current), n - 1));
    }

    isDraggingRef.current = false;
    isPointerDownRef.current = false;
    directionLocked.current = null; // ← NEW

    if (activeIndex === -1) {
      pillX.jump(slotCenter(idx));
      springX.jump(slotCenter(idx));
    } else {
      pillX.set(slotCenter(idx));
    }

    if (idx !== activeIndex) {
      onChange(options[idx].value);
    }
  }, [getLocalX, pillX, springX, slotCenter, activeIndex, onChange, options, n]);

  const handleCancel = React.useCallback(() => {
    setIsDragging(false);
    isPointerDownRef.current = false;
    directionLocked.current = null; // ← NEW
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    pillX.set(slotCenter(activeIndex));
  }, [activeIndex, pillX, slotCenter]);

  // ── Glass pilule hover drag ────────────────────────────────────────────────
  const glassBg = theme === 'dark' ? SWITCH_CFG.drag.bgDark : SWITCH_CFG.drag.bgLight;

  const pillAnimate = isDragging ? {
    backgroundColor: glassBg,
    borderColor: SWITCH_CFG.drag.border,
    backdropFilter: SWITCH_CFG.drag.blur,
    boxShadow: SWITCH_CFG.drag.shadow,
    top: SWITCH_CFG.drag.topOffset,
    bottom: SWITCH_CFG.drag.topOffset,
    scaleX: SWITCH_CFG.drag.scaleX,
    opacity: activeIndex >= 0 ? 1 : 0,
  } : {
    backgroundColor: pillBg,
    borderColor: pillBorder,
    backdropFilter: pillBlur,
    boxShadow: 'none',
    top: INS,
    bottom: INS,
    scaleX: SWITCH_CFG.idle.scaleX,
    opacity: activeIndex >= 0 ? 1 : 0,
  };

  const pillWidthPx = `calc(${100 / n}% - ${2 * INS}px)`;

  return (
    <div
      ref={containerRef}
      style={{ height: `${H}px` }}
      className={`
        ${variant === 'transparent' ? '' : `${containerBg} shadow-sm`}
        ${INS === 2 ? 'p-0.5' : 'p-1'}
        rounded-full flex items-center relative w-full select-none gap-0 overflow-visible
      `}
    >
      {/* ── PILULE ─────────────────────────────────────────────────────────── */}
      <motion.div
        className="absolute rounded-full border pointer-events-none"
        style={{ left: INS, width: pillWidthPx, x: springX }}
        animate={pillAnimate}
        initial={false}
        transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      />

      {/* ── BOUTONS (pointer-events:none — visuels seulement) ────────────── */}
      {options.map((option, index) => {
        const isActive = activeValue === option.value;
        return (
          <div
            key={String(option.value)}
            className={`
              pointer-events-none relative z-10 h-full flex items-center justify-center
              uppercase tracking-wider font-bold rounded-full
              ${TXCLS}
              ${option.className ? option.className : 'flex-1'}
              ${isActive ? getActiveText(index) : 'text-muted'}
            `}
          >
            <span className="relative z-20 flex items-center gap-2">
              {option.icon && <option.icon size={ICOSZ} />}
              {option.label && (
                <span className={option.className?.includes('w-12') ? 'hidden' : 'min-w-[20px] text-center inline-block whitespace-nowrap'}>
                  {option.label}
                </span>
              )}
            </span>
          </div>
        );
      })}

      {/* ── OVERLAY transparent — capte tous les pointer events (z-20)
          Identique au rôle du motion.div container dans BottomNav :
          - div sans sémantique "button/a" → iOS n'intercepte pas le gesture
          - setPointerCapture honoré par iOS Safari
          - Sur PC : drag démarre après DRAG_THRESHOLD px (pas au hover)       */}
      <div
        ref={overlayRef}
        className="absolute inset-0 z-20 touch-none cursor-pointer rounded-full"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => { e.stopPropagation(); handleDown(e); }}
        onPointerMove={(e) => { e.stopPropagation(); handleMove(e); }}
        onPointerUp={(e) => { e.stopPropagation(); e.preventDefault(); handleUp(e); }}
        onPointerLeave={(e) => { e.stopPropagation(); handleCancel(e); }}
        onPointerCancel={(e) => { e.stopPropagation(); handleCancel(e); }}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
      />
    </div>
  );
}
