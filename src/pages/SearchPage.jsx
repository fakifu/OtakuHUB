import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, X, Loader2, Filter, Flame } from 'lucide-react';

import AnimeListItem from '../components/anime/AnimeListItem';
import AnimeDetailPage from './AnimeDetailPage';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';
import { searchAnime, getTrendingAnime } from '../services/anilistService';
import { useTranslation } from '../hooks/useTranslation';

// Hook debounce local
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// Skeleton card
function AnimeCardSkeleton() {
  return (
    <div className="flex gap-3 glass-liquid-lite rounded-list p-3 animate-pulse">
      <div className="w-[70px] h-[100px] rounded-field bg-white/10 shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-4 bg-white/10 rounded-full w-3/4" />
        <div className="h-3 bg-white/10 rounded-full w-1/2" />
        <div className="h-3 bg-white/10 rounded-full w-1/3 mt-4" />
        <div className="flex gap-2 mt-2">
          <div className="h-5 w-14 bg-white/10 rounded-full" />
          <div className="h-5 w-16 bg-white/10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [trendingAnimes, setTrendingAnimes] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);
  const [searchError, setSearchError] = useState(null);

  const debouncedQuery = useDebounce(query, 300);
  const { isInLibrary } = useLibrary();

  // Charger trending au montage
  useEffect(() => {
    let cancelled = false;
    async function loadTrending() {
      try {
        const data = await getTrendingAnime(1, 12);
        if (!cancelled) setTrendingAnimes(data || []);
      } catch (err) {
        console.error('Erreur trending:', err);
      } finally {
        if (!cancelled) setIsTrendingLoading(false);
      }
    }
    loadTrending();
    return () => { cancelled = true; };
  }, []);

  // Recherche debouncée avec gestion gracieuse d'erreurs/rate-limit via Toast
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    let cancelled = false;
    async function doSearch() {
      setIsSearchLoading(true);
      setSearchError(null);
      try {
        const data = await searchAnime(debouncedQuery, 1, 20);
        if (!cancelled) {
          setSearchResults(data || []);
        }
      } catch (err) {
        console.error('Erreur recherche:', err);
        if (!cancelled) {
          const errorMsg = err.message || 'Erreur lors de la recherche.';
          setSearchError(errorMsg);
          toast.error(errorMsg, 5000);
        }
      } finally {
        if (!cancelled) setIsSearchLoading(false);
      }
    }
    doSearch();
    return () => { cancelled = true; };
  }, [debouncedQuery, toast]);

  const [animeStack, setAnimeStack] = useState([]);
  const selectedAnimeId = animeStack[animeStack.length - 1] || null;
  const listScrollTopRef = useRef(0);

  // Re-clic onglet -> Reset
  useEffect(() => {
    const handleReset = (e) => {
      if (e.detail?.route === '/search' || e.detail?.tabIndex === 1) {
        setAnimeStack([]);
      }
    };
    window.addEventListener('reset-tab-detail', handleReset);
    return () => window.removeEventListener('reset-tab-detail', handleReset);
  }, []);

  const handleSelectAnime = useCallback((anime) => {
    const id = typeof anime === 'number' || typeof anime === 'string' ? anime : (anime?.id || anime?.animeId);
    if (id) {
      const container = document.getElementById('search-page-root')?.closest('.overflow-y-auto');
      if (container) {
        listScrollTopRef.current = container.scrollTop;
      }
      setAnimeStack(prev => [...prev, id]);
    }
  }, []);

  const handleBackFromDetail = () => {
    setAnimeStack(prev => {
      if (prev.length <= 1) {
        requestAnimationFrame(() => {
          const container = document.getElementById('search-page-root')?.closest('.overflow-y-auto');
          if (container) {
            container.scrollTop = listScrollTopRef.current;
          }
        });
        return [];
      }
      return prev.slice(0, -1);
    });
  };

  if (selectedAnimeId) {
    return (
      <AnimeDetailPage
        animeId={selectedAnimeId}
        onBack={handleBackFromDetail}
        onSelectAnime={handleSelectAnime}
      />
    );
  }

  const isSearching = query.trim().length > 0;
  const isPending = isSearchLoading || query.trim() !== debouncedQuery.trim();

  return (
    <div id="search-page-root" className="space-y-4 pb-8 px-4">
      {/* ── BARRE DE RECHERCHE ABSOLUMENT COLLÉE EN HAUT (0PX PADDING) ── */}
      <div className="sticky top-0 z-30 pt-[env(safe-area-inset-top,0px)] pb-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
            {isPending ? (
              <Loader2 size={18} className="animate-spin text-accent" />
            ) : (
              <Search size={18} className="text-accent" />
            )}
          </div>
          <input
            type="text"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full glass-liquid rounded-[1.4rem] py-3.5 pl-12 pr-12 text-sm text-foreground focus:outline-none focus:border-accent/40 shadow-lg placeholder:text-muted"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSearchError(null); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-muted hover:text-foreground transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── RÉSULTATS DE RECHERCHE OU TENDANCES ── */}
      <div className="space-y-4">
        {isSearching ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-accent" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                  {isPending
                    ? t('common.loading')
                    : `${searchResults.length} ${t('search.results_count')}`}
                </span>
              </div>
            </div>

            {/* Placeholders (Skeletons) affichés INSTANTANÉMENT pendant la frappe et le chargement API */}
            {isPending && (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <AnimeCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Aucun résultat : affiché SEULEMENT une fois la frappe ET la requête terminées sans erreur */}
            {!isPending && !searchError && searchResults.length === 0 && (
              <div className="text-center py-12 space-y-2">
                <Search size={36} className="text-muted mx-auto" />
                <p className="text-sm font-bold text-foreground">
                  {t('search.no_results_query', { query })}
                </p>
                <p className="text-xs text-muted">{t('search.no_results_sub')}</p>
              </div>
            )}

            {/* Liste des résultats pré-triés */}
            {!isPending && !searchError && searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((anime, i) => (
                  <AnimeListItem
                    key={anime.id}
                    anime={anime}
                    index={i}
                    onClick={handleSelectAnime}
                    isInLibrary={isInLibrary(anime.id)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Flame size={14} className="text-orange-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                {t('search.trending_now')}
              </span>
            </div>

            {isTrendingLoading && (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <AnimeCardSkeleton key={i} />
                ))}
              </div>
            )}

            {!isTrendingLoading && (
              <div className="space-y-2">
                {trendingAnimes.map((anime, i) => (
                  <AnimeListItem
                    key={anime.id}
                    anime={anime}
                    index={i}
                    onClick={handleSelectAnime}
                    isInLibrary={isInLibrary(anime.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
}
