import React from 'react';
import { motion } from 'framer-motion';

// ── Color palette per variant ─────────────────────────────────────────────────
const COLOR_MAP = {
  indigo: {
    bg: 'bg-indigo-500/20',
    text: 'text-indigo-400',
    glow: 'rgba(99,102,241,0.25)',
  },
  cyan: {
    bg: 'bg-cyan-500/20',
    text: 'text-cyan-400',
    glow: 'rgba(6,182,212,0.25)',
  },
  emerald: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    glow: 'rgba(16,185,129,0.25)',
  },
  yellow: {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
    glow: 'rgba(234,179,8,0.25)',
  },
  rose: {
    bg: 'bg-rose-500/20',
    text: 'text-rose-400',
    glow: 'rgba(244,63,94,0.25)',
  },
  purple: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    glow: 'rgba(168,85,247,0.25)',
  },
};

// ── StatCard ──────────────────────────────────────────────────────────────────
export default function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color = 'indigo',
  delay = 0,
  className = '',
}) {
  const palette = COLOR_MAP[color] || COLOR_MAP.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut', delay }}
      whileHover={{ scale: 1.02 }}
      className={`glass-liquid rounded-card p-5 flex flex-col gap-4 cursor-default relative overflow-hidden transition-transform ${className}`}
      style={{ willChange: 'transform' }}
    >

      {/* Background glow behind icon */}
      <div
        className="absolute top-3 left-3 w-14 h-14 rounded-full blur-2xl pointer-events-none"
        style={{ background: palette.glow }}
      />

      {/* Icon */}
      {Icon && (
        <div className={`relative w-10 h-10 rounded-list ${palette.bg} flex items-center justify-center shrink-0`}>
          <Icon size={20} className={palette.text} strokeWidth={2.5} />
        </div>
      )}

      {/* Values */}
      <div className="flex flex-col gap-1">
        <span className="text-2xl font-black text-foreground leading-none tracking-tight">
          {value ?? '—'}
        </span>
        <span className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">
          {label}
        </span>
        {subValue && (
          <span className="text-xs text-muted/60 font-medium mt-0.5">{subValue}</span>
        )}
      </div>
    </motion.div>
  );
}
