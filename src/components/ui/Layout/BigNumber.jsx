import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// ✅ AJOUT : On ajoute les icônes pour le style (et au cas où tu en voulais)
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const formatMoney = (val) => {
  // SÉCURITÉ : Si val n'est pas un nombre, on renvoie 0€ pour éviter le crash
  if (val === undefined || val === null || isNaN(val)) return '0 €';

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(val);
};

export default function BigNumber({
  label = "TITRE",
  value = 0,
  subLabel = null,
  subValue = null,
  color = "indigo",
  pill = null, // ✅ NEW: Support for a pill/badge
  secondaryLabel = null, // ✅ NEW: Support for another label (e.g. "Net")
  secondaryValue = null, // ✅ NEW: Support for another value
  onClick = null, // ✅ NEW: Support for click action
}) {

  const glowColors = {
    indigo: 'bg-accent/20',
    rose: 'bg-danger/20',
    emerald: 'bg-success/20',
    amber: 'bg-orange-500/20',
    blue: 'bg-blue-500/20',
  };

  const selectedGlow = glowColors[color] || glowColors.indigo;

  // Détermination de l'icône et de la couleur pour la sous-valeur
  let SubIcon = Minus;
  let subColor = 'text-dim';

  if (subValue !== null && !isNaN(subValue)) {
    if (subValue > 0) {
      SubIcon = TrendingUp;
      subColor = 'text-success';
    } else if (subValue < 0) {
      SubIcon = TrendingDown;
      subColor = 'text-danger';
    }
  }

  return (
    <div
      className={`flex flex-col items-center justify-center py-10 relative mb-6 transition-all ${onClick ? 'cursor-pointer active:scale-95 group' : ''}`}
      onClick={onClick}
    >

      {/* 1. EFFET DE LUEUR (GLOW) - Multi-layer for better visibility in light theme */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 ${selectedGlow} blur-[100px] opacity-50 pointer-events-none transition-opacity ${onClick ? 'group-hover:opacity-70' : ''}`} />
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 ${selectedGlow} blur-[60px] opacity-80 pointer-events-none transition-opacity ${onClick ? 'group-hover:opacity-100' : ''}`} />

      {/* 2. LABEL DU HAUT */}
      <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3 relative z-10 text-center opacity-80">
        {label}
      </span>

      {/* 3. GROS CHIFFRE ANIMÉ */}
      <AnimatePresence mode="wait">
        <motion.h1
          key={value || 0}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground via-foreground to-foreground/70 dark:to-foreground/40 relative z-10 py-2 drop-shadow-sm"
        >
          {formatMoney(value)}
        </motion.h1>
      </AnimatePresence>

      {/* 4. SOUS-LIGNES (Optionnelles) */}
      <div className="relative z-10 flex flex-col items-center gap-3 mt-2">
        {/* Ligne 1: SubLabel + SubValue (ex: Evolution) */}
        {(subLabel || subValue !== null) && (
          <div className="flex items-center gap-2">
            {subLabel && (
              <span className="text-xs font-bold text-dim uppercase tracking-widest">
                {subLabel}
              </span>
            )}

            {subValue !== null && (
              <div className={`flex items-center gap-1 text-lg font-bold ${subColor}`}>
                <SubIcon size={16} />
                <span>
                  {subValue > 0 ? '+' : ''}
                  {formatMoney(subValue)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ligne 2: Secondary Label + Value (ex: Net) */}
      {(secondaryLabel || secondaryValue !== null) && (
        <div className="flex items-center gap-2">
          {secondaryLabel && (
            <span className="text-xs font-bold text-muted uppercase tracking-widest">
              {secondaryLabel}
            </span>
          )}
          {secondaryValue !== null && (
            <span className={`text-lg font-bold ${secondaryValue >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {secondaryValue > 0 ? '+' : ''}{formatMoney(secondaryValue)}
            </span>
          )}
        </div>
      )}

      {/* Ligne 3: Pill (ex: "12 articles") */}
      {pill && (
        <div className="px-3 py-1 bg-surface border border-border rounded-full">
          <span className="text-[10px] font-bold text-dim uppercase tracking-wider">
            {pill}
          </span>
        </div>
      )}
    </div>
  );
}
