import React from 'react';

// ── COLOR PALETTE MAP ──────────────────────────────────────────────────────────
const COLOR_VARIANTS = {
  indigo: {
    base: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
    active: 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/20',
    dot: 'bg-indigo-400',
  },
  cyan: {
    base: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    active: 'bg-cyan-500 text-black border-cyan-300 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-500/20 font-black',
    dot: 'bg-cyan-400 animate-pulse',
  },
  emerald: {
    base: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    active: 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  green: {
    base: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    active: 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  purple: {
    base: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    active: 'bg-purple-600 text-white border-purple-400 ring-2 ring-purple-500/40 shadow-lg shadow-purple-500/20',
    dot: 'bg-purple-400',
  },
  amber: {
    base: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    active: 'bg-amber-500 text-black border-amber-300 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/20 font-black',
    dot: 'bg-amber-400',
  },
  yellow: {
    base: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    active: 'bg-yellow-500 text-black border-yellow-300 ring-2 ring-yellow-400/40 shadow-lg shadow-yellow-500/20 font-black',
    dot: 'bg-yellow-400',
  },
  rose: {
    base: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    active: 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-500/40 shadow-lg shadow-rose-500/20',
    dot: 'bg-rose-400',
  },
  red: {
    base: 'bg-red-500/20 text-red-400 border-red-500/40',
    active: 'bg-red-600 text-white border-red-400 ring-2 ring-red-500/40 shadow-lg shadow-red-500/20',
    dot: 'bg-red-400',
  },
  accent: {
    base: 'bg-accent/20 text-accent border-accent/40',
    active: 'bg-accent text-white border-white/30 ring-2 ring-accent/40 shadow-lg shadow-accent/20 font-black',
    dot: 'bg-accent animate-pulse',
  },
  glass: {
    base: 'glass-liquid text-foreground/90 border-white/10 hover:border-white/25',
    active: 'bg-accent text-white border-accent ring-2 ring-accent/30 font-black',
    dot: 'bg-accent',
  },
  muted: {
    base: 'bg-white/5 text-muted border-white/10',
    active: 'bg-white/20 text-foreground border-white/30 font-bold',
    dot: 'bg-white/40',
  },
};

// ── STATUS TO COLOR PRESETS ────────────────────────────────────────────────────
const STATUS_PRESETS = {
  WATCHING: { color: 'cyan', defaultLabel: 'En cours', dot: true },
  COMPLETED: { color: 'emerald', defaultLabel: 'Terminé', dot: false },
  PLAN_TO_WATCH: { color: 'purple', defaultLabel: 'À voir', dot: false },
  DROPPED: { color: 'rose', defaultLabel: 'Abandonné', dot: false },
  ON_HOLD: { color: 'amber', defaultLabel: 'En pause', dot: false },
};

// ── SIZES ──────────────────────────────────────────────────────────────────────
const SIZE_PRESETS = {
  xs: 'text-[9px] px-2 py-0.5 gap-1 font-bold uppercase tracking-wider',
  sm: 'text-xs px-3 py-1 gap-1.5 font-bold',
  md: 'text-xs px-4 py-2 gap-2 font-bold',
  lg: 'text-sm px-5 py-2.5 gap-2 font-extrabold',
};

export default function Pill({
  label,
  children,
  color,
  status,
  size = 'sm',
  active = false,
  onClick,
  icon: Icon,
  dot,
  className = '',
  title,
  ...props
}) {
  const statusPreset = status ? STATUS_PRESETS[status] : null;
  const resolvedColor = color || statusPreset?.color || 'glass';
  const colorCfg = COLOR_VARIANTS[resolvedColor] || COLOR_VARIANTS.glass;
  const showDot = dot ?? statusPreset?.dot;
  const sizeClass = SIZE_PRESETS[size] || SIZE_PRESETS.sm;

  const contentText = label || children || statusPreset?.defaultLabel || '';

  const pillClasses = `
    inline-flex items-center justify-center rounded-full border backdrop-blur-md transition-all duration-200 select-none shrink-0
    ${active ? colorCfg.active : colorCfg.base}
    ${sizeClass}
    ${onClick ? 'cursor-pointer active:scale-95 hover:brightness-110' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const content = (
    <>
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colorCfg.dot}`} />
      )}
      {Icon && (
        <Icon className="shrink-0 text-current" size={size === 'xs' ? 10 : size === 'lg' ? 16 : 13} />
      )}
      <span className="truncate">{contentText}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={pillClasses}
        title={title}
        {...props}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={pillClasses} title={title} {...props}>
      {content}
    </span>
  );
}
