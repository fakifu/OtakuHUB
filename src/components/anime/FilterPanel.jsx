import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, RotateCcw, Clock, Star, BookOpen, CheckCircle, Sparkles, Layers } from 'lucide-react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { useTranslation } from '../../hooks/useTranslation';
import Button from '../ui/Primitives/Button';

const GENRE_OPTIONS = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi',
  'Fantasy', 'Isekai', 'Mecha', 'Romance', 'Sci-Fi', 'Slice of Life'
];

export default function FilterPanel({
  isOpen,
  onClose,
  sortKey,
  setSortKey,
  isGroupedByFranchise,
  setIsGroupedByFranchise,
  selectedGenre,
  setSelectedGenre,
  selectedFormat,
  setSelectedFormat,
  totalResults,
  onReset
}) {
  const { t } = useTranslation();
  useLockBodyScroll(isOpen);

  const SORT_OPTIONS = [
    { value: 'addedAt', label: t('library.sort_updated') || 'Récents / Mis à jour', icon: Clock },
    { value: 'rating', label: t('library.my_rating') || 'Ma note (/10)', icon: Star },
    { value: 'title', label: t('library.sort_title') || 'Nom (A-Z)', icon: BookOpen },
    { value: 'progress', label: t('library.sort_progress') || 'Progression (%)', icon: CheckCircle },
  ];

  const FORMAT_OPTIONS = [
    { value: 'ALL', label: 'Tous' },
    { value: 'TV', label: 'Séries TV' },
    { value: 'MOVIE', label: 'Films' },
    { value: 'SPECIAL', label: 'Spéciaux / OVA' },
  ];

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex justify-end items-start isolate">
          {/* BACKDROP FLOU */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 backdrop-blur-sm bg-black/40"
            onClick={onClose}
          />

          {/* PANNEAU FLOATING GLASS SCROLLABLE AVEC ARRONDI ROUNDED-BIGBOX */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-[360px] m-2 max-h-[calc(100dvh-1rem)] glass-panel-radiant border border-white/10 rounded-bigbox shadow-2xl overflow-hidden flex flex-col pointer-events-auto z-10"
          >
            {/* SAFE AREA TOP */}
            <div className="pt-[env(safe-area-inset-top,0px)] bg-surface/5" />

            {/* HEADER */}
            <div className="p-6 pb-4 flex justify-between items-center shrink-0 border-b border-white/10">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2 tracking-tight">
                <SlidersHorizontal size={18} className="text-indigo-400" />
                Filtres & Tri Multi-Niveaux
              </h2>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onReset}
                  className="flex items-center gap-1.5 text-[11px] uppercase font-bold text-muted hover:text-red-400 transition-colors cursor-pointer"
                >
                  <RotateCcw size={12} />
                  Réinitialiser
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-muted hover:text-foreground hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* CONTENU DEFILANT (SCROLLABLE SI PAS ASSEZ DE PLACE) */}
            <div className="px-6 py-4 overflow-y-auto min-h-0 flex-1 overscroll-contain space-y-6 scrollbar-thin">
              
              {/* SECTION REGROUPEMENT PAR SAGA (ORGANISATION CHRONOLOGIQUE) */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted block">
                  Structure de la Liste
                </label>
                <button
                  type="button"
                  onClick={() => setIsGroupedByFranchise(!isGroupedByFranchise)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    isGroupedByFranchise
                      ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300 shadow-lg shadow-indigo-500/10'
                      : 'glass-panel text-muted hover:text-foreground hover:bg-white/5 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Layers size={18} className={isGroupedByFranchise ? 'text-indigo-400' : 'text-muted'} />
                    <div className="text-left">
                      <p className="font-extrabold text-sm leading-tight text-foreground">Regrouper par Saga</p>
                      <p className="text-[11px] text-muted font-medium mt-0.5">Saisons dans l'ordre (S1 ➔ S2 ➔ S3...)</p>
                    </div>
                  </div>

                  {/* BOUTON SWITCH TOGGLE */}
                  <div className={`w-11 h-6 rounded-full p-0.5 transition-colors ${isGroupedByFranchise ? 'bg-indigo-500' : 'bg-white/20'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isGroupedByFranchise ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </button>
              </div>

              {/* SECTION TRI SECONDAIRE */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted block">
                  {isGroupedByFranchise ? 'Puis trier les Sagas par' : 'Trier la bibliothèque par'}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {SORT_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = sortKey === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSortKey(opt.value)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400 shadow-md'
                            : 'glass-panel text-muted hover:text-foreground hover:bg-white/5 border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={16} />
                          <span>{opt.label}</span>
                        </div>
                        {isSelected && <Sparkles size={14} className="text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION GENRES */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted block">
                  Filtrer par Genre
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedGenre(null)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedGenre === null
                        ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/30'
                        : 'glass-panel text-muted hover:text-foreground border-white/5'
                    }`}
                  >
                    Tous les genres
                  </button>
                  {GENRE_OPTIONS.map((genre) => {
                    const isSelected = selectedGenre === genre;
                    return (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => setSelectedGenre(isSelected ? null : genre)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/30'
                            : 'glass-panel text-muted hover:text-foreground border-white/5'
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION FORMAT */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted block">
                  Format de l'animé
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {FORMAT_OPTIONS.map((fmt) => {
                    const isSelected = selectedFormat === fmt.value;
                    return (
                      <button
                        key={fmt.value}
                        type="button"
                        onClick={() => setSelectedFormat(fmt.value)}
                        className={`p-3 rounded-2xl text-xs font-bold text-center border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400'
                            : 'glass-panel text-muted hover:text-foreground border-white/5'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* FOOTER AVEC BOUTON SYSTEME UNIQUE */}
            <div className="p-5 border-t border-white/10 shrink-0 bg-surface/5">
              <Button
                variant="primary"
                onClick={onClose}
                className="w-full"
              >
                Afficher {totalResults} animé{totalResults > 1 ? 's' : ''}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
