import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Filter, BookOpen, Grid3X3,
  ChevronDown, Star, Clock, Bookmark, CheckCircle, Play,
  SlidersHorizontal
} from 'lucide-react';

import AnimeGridCard from '../components/anime/AnimeGridCard';
import FilterPanel from '../components/anime/FilterPanel';
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
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

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

    // Filtre genre
    if (selectedGenre) {
      result = result.filter(e => {
        const itemGenres = e.genres || e.anime?.genres || [];
        return itemGenres.includes(selectedGenre);
      });
    }

    // Filtre format
    if (selectedFormat && selectedFormat !== 'ALL') {
      result = result.filter(e => {
        const fmt = e.format || e.anime?.format || 'TV';
        return fmt === selectedFormat;
      });
    }

    // Tri
    result = sortLibraryBy(result, sortKey);

    return result;
  }, [library, searchQuery, activeStatus, selectedGenre, selectedFormat, sortKey]);

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

  // Rendu de la fiche détaillée si un animé est sélectionné
  if (selectedAnimeId) {
    return (
      <AnimeDetailPage
        animeId={selectedAnimeId}
        onBack={handleBackFromDetail}
        onSelectAnime={setSelectedAnimeId}
      />
    );
  }

  const hasActiveFilters = Boolean(searchQuery || activeStatus || selectedGenre || (selectedFormat && selectedFormat !== 'ALL'));

  return (
    <div id="library-page-root" className="px-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-32 space-y-5 max-w-7xl mx-auto">
      {/* ── BARRE DE RECHERCHE ET BOUTON FILTRE ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
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
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-muted cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* BOUTON FILTRE SLIDE-OVER */}
          <button
            type="button"
            onClick={() => setIsFilterPanelOpen(true)}
            className={`h-11 px-3.5 rounded-[1.4rem] glass-liquid flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
              selectedGenre || (selectedFormat && selectedFormat !== 'ALL') || sortKey !== 'addedAt'
                ? 'border-accent text-accent shadow-lg shadow-accent/20'
                : 'text-foreground hover:border-accent/40'
            }`}
          >
            <SlidersHorizontal size={16} className={selectedGenre || (selectedFormat && selectedFormat !== 'ALL') ? 'text-accent' : 'text-muted'} />
            <span className="hidden sm:inline">Filtres</span>
          </button>
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
        </div>
      </div>

      {/* ── CONTENU ── */}
      <div>
        {/* Compteur traduit i18n */}
        {displayedLibrary.length > 0 && (
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4 px-1 flex items-center gap-1.5 flex-wrap">
            <span>{t(displayedLibrary.length > 1 ? 'library.anime_count_other' : 'library.anime_count_one', { count: displayedLibrary.length })}</span>
            {activeStatus ? <span>· {STATUS_FILTERS.find(f => f.value === activeStatus)?.label}</span> : null}
            {selectedGenre ? <span className="text-accent">· Genre: {selectedGenre}</span> : null}
            {searchQuery ? <span>· "{searchQuery}"</span> : null}
          </p>
        )}

        {/* Empty state */}
        {displayedLibrary.length === 0 && (
          <EmptyLibrary hasFilter={hasActiveFilters} />
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

      {/* PANNEAU DE FILTRES SLIDE-OVER NEXUSOS */}
      <FilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        sortKey={sortKey}
        setSortKey={setSortKey}
        selectedGenre={selectedGenre}
        setSelectedGenre={setSelectedGenre}
        selectedFormat={selectedFormat}
        setSelectedFormat={setSelectedFormat}
        totalResults={displayedLibrary.length}
        onReset={() => {
          setSortKey('addedAt');
          setSelectedGenre(null);
          setSelectedFormat('ALL');
        }}
      />

      <div className="h-8" />
    </div>
  );
}
