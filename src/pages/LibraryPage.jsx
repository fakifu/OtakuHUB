import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Filter, BookOpen, Grid3X3,
  ChevronDown, Star, Clock, Bookmark, CheckCircle, Play,
  SlidersHorizontal
} from 'lucide-react';

import AnimeGridCard from '../components/anime/AnimeGridCard';
import AnimeDetailPage from './AnimeDetailPage';
import Pill from '../components/ui/Pill';
import { useLibrary } from '../context/LibraryContext';
import { sortLibraryBy, searchInLibrary } from '../utils/animeStats';
import { useTranslation } from '../hooks/useTranslation';

// ── FILTER PILL ──────────────────────────────────────────────────────────
function FilterPill({ label, isActive, onClick, icon: Icon, status }) {
  return (
    <Pill
      label={label}
      status={status}
      icon={Icon}
      active={isActive}
      onClick={onClick}
      color={status ? undefined : 'accent'}
      size="sm"
    />
  );
}

// ── EMPTY STATE ──────────────────────────────────────────────────────────
function EmptyLibrary({ hasFilter }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-8 text-center space-y-4"
    >
      <div className="relative">
        <div className="w-20 h-20 rounded-[2rem] glass-liquid flex items-center justify-center">
          <BookOpen size={32} className="text-muted" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
          <span className="text-white text-xs font-bold">0</span>
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-black text-foreground">
          {hasFilter ? t('search.empty') : t('library.empty')}
        </p>
        <p className="text-sm text-muted">
          {hasFilter
            ? t('search.empty_sub')
            : t('library.empty_sub')
          }
        </p>
      </div>
    </motion.div>
  );
}

export default function LibraryPage() {
  const { library, updateEntry, removeFromLibrary, incrementEpisode } = useLibrary();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState(null);
  const [sortKey, setSortKey] = useState('addedAt');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const SORT_OPTIONS = [
    { value: 'addedAt', label: t('library.sort_updated'), icon: Clock },
    { value: 'rating', label: t('library.my_rating'), icon: Star },
    { value: 'title', label: t('library.sort_title'), icon: BookOpen },
    { value: 'progress', label: t('library.sort_progress'), icon: CheckCircle },
  ];

  const STATUS_FILTERS = [
    { value: null, label: t('library.all'), icon: Grid3X3 },
    { value: 'WATCHING', label: t('status.watching'), icon: Play },
    { value: 'COMPLETED', label: t('status.completed'), icon: CheckCircle },
    { value: 'PLAN_TO_WATCH', label: t('status.planning'), icon: Bookmark },
  ];

  // Filtrage et tri dynamique
  const displayedLibrary = useMemo(() => {
    let result = [...library];

    // Filtre texte
    if (searchQuery.trim().length > 0) {
      result = searchInLibrary(result, searchQuery);
    }

    // Filtre statut
    if (activeStatus) {
      result = result.filter(e => e.status === activeStatus);
    }

    // Tri
    result = sortLibraryBy(result, sortKey);

    return result;
  }, [library, searchQuery, activeStatus, sortKey]);

  const [selectedAnimeId, setSelectedAnimeId] = useState(null);
  const listScrollTopRef = React.useRef(0);

  // Écouter le re-clic sur l'onglet actif dans la barre de navigation du bas
  useEffect(() => {
    const handleReset = (e) => {
      if (e.detail?.route === '/library' || e.detail?.tabIndex === 2) {
        setSelectedAnimeId(null);
      }
    };
    window.addEventListener('reset-tab-detail', handleReset);
    return () => window.removeEventListener('reset-tab-detail', handleReset);
  }, []);

  const handleOpenDetail = (entry) => {
    const id = entry?.animeId || entry?.anime?.id || entry?.id;
    if (id) {
      const container = document.getElementById('library-page-root')?.closest('.overflow-y-auto');
      if (container) {
        listScrollTopRef.current = container.scrollTop;
      }
      setSelectedAnimeId(id);
    }
  };

  const handleBackFromDetail = () => {
    setSelectedAnimeId(null);
    requestAnimationFrame(() => {
      const container = document.getElementById('library-page-root')?.closest('.overflow-y-auto');
      if (container) {
        container.scrollTop = listScrollTopRef.current;
      }
    });
  };

  if (selectedAnimeId) {
    return (
      <AnimeDetailPage
        animeId={selectedAnimeId}
        onBack={handleBackFromDetail}
        onSelectAnime={setSelectedAnimeId}
      />
    );
  }

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortKey)?.label || t('library.sort_by');

  return (
    <div id="library-page-root" className="space-y-3 pb-8 px-4">
      {/* ── BARRE DE RECHERCHE ABSOLUMENT COLLÉE EN HAUT (0PX PADDING) ── */}
      <div className="sticky top-0 z-30 pt-[env(safe-area-inset-top,0px)] pb-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('search.search_in_library')}
            className="w-full glass-liquid rounded-[1.4rem] py-3 pl-10 pr-10 text-sm text-foreground focus:outline-none placeholder:text-muted shadow-lg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-muted"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── FILTRES STATUT PERMANENTS ET STATIQUES ── */}
      <div>
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-0.5 pt-0.5">
          {STATUS_FILTERS.map(f => (
            <FilterPill
              key={String(f.value)}
              label={f.label}
              status={f.value}
              icon={f.icon}
              isActive={activeStatus === f.value}
              onClick={() => setActiveStatus(f.value)}
            />
          ))}

          {/* Séparateur */}
          <div className="w-px bg-border shrink-0 mx-1" />

          {/* Bouton tri */}
          <div className="relative">
            <FilterPill
              label={currentSortLabel}
              icon={SlidersHorizontal}
              isActive={isSortOpen}
              onClick={() => setIsSortOpen(v => !v)}
            />
            <AnimatePresence>
              {isSortOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 400 }}
                  className="absolute top-10 left-0 z-50 glass-panel-radiant rounded-[1.3rem] p-2 min-w-[160px] shadow-xl border border-border"
                >
                  {SORT_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => { setSortKey(opt.value); setIsSortOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[1rem] text-sm transition-colors
                          ${sortKey === opt.value ? 'bg-accent/20 text-accent font-bold' : 'text-muted hover:text-foreground hover:bg-white/5'}`}
                      >
                        <Icon size={14} />
                        {opt.label}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Clic ailleurs ferme le dropdown tri */}
      {isSortOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
      )}

      {/* ── CONTENU ── */}
      <div>
        {/* Compteur traduit i18n */}
        {displayedLibrary.length > 0 && (
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4 px-1">
            {t(displayedLibrary.length > 1 ? 'library.anime_count_other' : 'library.anime_count_one', { count: displayedLibrary.length })}
            {activeStatus ? ` · ${STATUS_FILTERS.find(f => f.value === activeStatus)?.label}` : ''}
            {searchQuery ? ` · "${searchQuery}"` : ''}
          </p>
        )}

        {/* Empty state */}
        {displayedLibrary.length === 0 && (
          <EmptyLibrary hasFilter={!!activeStatus || searchQuery.length > 0} />
        )}

        {/* Grille animés — 2 colonnes par écran */}
        <div className="grid grid-cols-2 gap-3.5">
          {displayedLibrary.map((entry, i) => {
            const isFirstBatch = i < 6;
            return (
              <motion.div
                key={entry.animeId}
                initial={isFirstBatch ? { opacity: 0, scale: 0.95 } : false}
                animate={{ opacity: 1, scale: 1 }}
                transition={isFirstBatch ? { delay: i * 0.03, duration: 0.2 } : { duration: 0 }}
              >
                <AnimeGridCard
                  entry={entry}
                  onClick={() => handleOpenDetail(entry)}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
}
