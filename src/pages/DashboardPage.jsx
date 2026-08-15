import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Play, Star, BookOpen, Heart, TrendingUp,
  Tv, CheckCircle, Bookmark, Sparkles, Flame, Calendar, Compass,
  ChevronLeft, ChevronRight
} from 'lucide-react';

import HeroBanner from '../components/anime/HeroBanner';
import AnimeCover from '../components/anime/AnimeCover';
import StatCard from '../components/anime/StatCard';
import AnimeDetailPage from './AnimeDetailPage';
import Pill from '../components/ui/Pill';
import { useLibrary } from '../context/LibraryContext';
import {
  getTotalHoursWatched,
  getTotalEpisodesWatched,
  getFavoriteGenre,
  getStatusCounts,
  getFavoriteAnime,
  getFavoriteAnimes,
} from '../utils/animeStats';
import {
  getTrendingAnime,
  getSeasonalAnime,
  getNextSeasonAnime,
} from '../services/anilistService';

import { useTranslation } from '../hooks/useTranslation';

// Skeleton pour le Hero quand l'API charge
function HeroSkeleton() {
  return (
    <div className="relative w-full h-[420px] rounded-b-[2.5rem] overflow-hidden animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-black" />
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
        <div className="h-4 w-24 bg-white/10 rounded-full" />
        <div className="h-8 w-64 bg-white/10 rounded-xl" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-white/10 rounded-full" />
          <div className="h-6 w-20 bg-white/10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Skeleton pour les carrousels d'animés
function CarouselSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden px-4 pt-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="shrink-0 w-28 space-y-2 animate-pulse">
          <div className="w-28 h-40 rounded-card bg-white/10" />
          <div className="h-3 w-20 bg-white/10 rounded-full" />
          <div className="h-2.5 w-12 bg-white/10 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// Section titre avec icône
function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 px-4">
      <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-accent" />
      </div>
      <div>
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest leading-none mb-0">{title}</h2>
        {subtitle && <p className="text-xs text-muted m-0">{subtitle}</p>}
      </div>
    </div>
  );
}

// Mini carte verticale pour les carrousels défilants (2 visibles par largeur d'écran)
function CarouselAnimeCard({ anime, onClick }) {
  const title = anime.title?.english || anime.title?.userPreferred || anime.title?.romaji || 'Sans titre';

  return (
    <button
      type="button"
      onClick={() => onClick(anime)}
      className="shrink-0 w-[155px] text-left group cursor-pointer active:scale-95 transition-transform"
    >
      <AnimeCover anime={anime} className="w-[155px] h-[220px] rounded-2xl shadow-lg border border-white/10">
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10 pointer-events-none">
          <p className="text-xs font-black text-white leading-tight line-clamp-2 drop-shadow-md group-hover:text-accent transition-colors">
            {title}
          </p>
        </div>
      </AnimeCover>
    </button>
  );
}

// Carte animé en cours (mini-card horizontale)
function WatchingCard({ entry }) {
  const progress = entry.totalEpisodes > 0
    ? Math.round((entry.episodesWatched / entry.totalEpisodes) * 100)
    : null;

  return (
    <div className="flex items-center gap-3 glass-liquid-lite rounded-list p-3">
      <div className="relative shrink-0">
        <img
          src={entry.coverImage}
          alt={entry.title}
          className="w-12 h-[68px] object-cover rounded-field"
          loading="lazy"
        />
        <div className="absolute inset-0 rounded-field bg-gradient-to-t from-black/40 to-transparent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground truncate">{entry.title}</p>
        <p className="text-[10px] text-muted mt-0.5">
          {entry.episodesWatched} / {entry.totalEpisodes > 0 ? entry.totalEpisodes : '?'} ep.
        </p>
        {progress !== null && (
          <div className="mt-1.5 w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      <div className="shrink-0">
        <span className="text-[10px] font-bold text-cyan-400 border border-cyan-400/30 rounded-full px-2 py-0.5">
          {progress !== null ? `${progress}%` : 'En cours'}
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { library, addToLibrary } = useLibrary();
  const { t } = useTranslation();

  // Équipes d'animés AniList
  const [heroAnime, setHeroAnime] = useState(null);
  const [isHeroLoading, setIsHeroLoading] = useState(true);

  const [seasonalAnimes, setSeasonalAnimes] = useState([]);
  const [isSeasonalLoading, setIsSeasonalLoading] = useState(true);

  const [nextSeasonAnimes, setNextSeasonAnimes] = useState([]);
  const [isNextSeasonLoading, setIsNextSeasonLoading] = useState(true);

  // État de la modale de détail
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Calculs dynamiques depuis la library
  const stats = {
    totalHours: getTotalHoursWatched(library),
    totalEpisodes: getTotalEpisodesWatched(library),
    favoriteGenre: getFavoriteGenre(library),
    statusCounts: getStatusCounts(library),
    favoriteAnime: getFavoriteAnime(library),
  };

  const favoriteAnimes = React.useMemo(() => getFavoriteAnimes(library), [library]);
  const [favIndex, setFavIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);

  const activeFavAnime = favoriteAnimes.length > 0
    ? favoriteAnimes[Math.abs(favIndex) % favoriteAnimes.length]
    : stats.favoriteAnime;

  const handleNextFav = useCallback(() => {
    if (favoriteAnimes.length <= 1) return;
    setSlideDirection(1);
    setFavIndex(prev => prev + 1);
  }, [favoriteAnimes.length]);

  const handlePrevFav = useCallback(() => {
    if (favoriteAnimes.length <= 1) return;
    setSlideDirection(-1);
    setFavIndex(prev => prev - 1 + favoriteAnimes.length);
  }, [favoriteAnimes.length]);

  const handleFavDragEnd = useCallback((_event, info) => {
    if (favoriteAnimes.length <= 1) return;
    const isFlickLeft = info.velocity.x < -220 || info.offset.x < -45;
    const isFlickRight = info.velocity.x > 220 || info.offset.x > 45;

    if (isFlickLeft) {
      handleNextFav();
    } else if (isFlickRight) {
      handlePrevFav();
    }
  }, [favoriteAnimes.length, handleNextFav, handlePrevFav]);

  const watchingList = library.filter(e => e.status === 'WATCHING').slice(0, 5);

  const [trendingList, setTrendingList] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);

  // Chargement des données AniList au montage
  useEffect(() => {
    let cancelled = false;

    async function loadDashboardData() {
      // 1. Trending (utilisé pour choisir l'animé star du Hero)
      try {
        setIsHeroLoading(true);
        const trendingData = await getTrendingAnime(1, 15);
        if (!cancelled && trendingData?.length > 0) {
          setTrendingList(trendingData);
          setHeroAnime(trendingData[0]);
          setHeroIndex(0);
        }
      } catch (err) {
        console.error('Erreur chargement Hero Trending:', err);
      } finally {
        if (!cancelled) setIsHeroLoading(false);
      }

      // 2. Popular This Season
      try {
        setIsSeasonalLoading(true);
        const seasonalData = await getSeasonalAnime(null, null, 1, 12);
        if (!cancelled) setSeasonalAnimes(seasonalData || []);
      } catch (err) {
        console.error('Erreur chargement Saisonnières:', err);
      } finally {
        if (!cancelled) setIsSeasonalLoading(false);
      }

      // 3. Next Season (Upcoming)
      try {
        setIsNextSeasonLoading(true);
        const nextSeasonData = await getNextSeasonAnime(1, 12);
        if (!cancelled) setNextSeasonAnimes(nextSeasonData || []);
      } catch (err) {
        console.error('Erreur chargement Saison Prochaine:', err);
      } finally {
        if (!cancelled) setIsNextSeasonLoading(false);
      }
    }

    loadDashboardData();
    return () => { cancelled = true; };
  }, []);

  const handleNextHeroAnime = useCallback(() => {
    if (trendingList.length === 0) return;
    const nextIndex = (heroIndex + 1) % trendingList.length;
    setHeroIndex(nextIndex);
    setHeroAnime(trendingList[nextIndex]);
  }, [trendingList, heroIndex]);

  const [selectedAnimeId, setSelectedAnimeId] = useState(null);
  const listScrollTopRef = React.useRef(0);

  // Écouter le re-clic sur l'onglet actif dans la barre de navigation du bas
  useEffect(() => {
    const handleReset = (e) => {
      if (e.detail?.route === '/' || e.detail?.tabIndex === 0) {
        setSelectedAnimeId(null);
      }
    };
    window.addEventListener('reset-tab-detail', handleReset);
    return () => window.removeEventListener('reset-tab-detail', handleReset);
  }, []);

  // Navigation vers la page dédiée de détail au sein de cet onglet
  const handleOpenDetail = useCallback((anime) => {
    const id = anime?.id || anime?.animeId;
    if (id) {
      const container = document.getElementById('dashboard-page-root')?.closest('.overflow-y-auto');
      if (container) {
        listScrollTopRef.current = container.scrollTop;
      }
      setSelectedAnimeId(id);
    }
  }, []);

  const handleBackFromDetail = () => {
    setSelectedAnimeId(null);
    requestAnimationFrame(() => {
      const container = document.getElementById('dashboard-page-root')?.closest('.overflow-y-auto');
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

  const statCards = [
    {
      icon: Clock,
      label: t('stats.total_time'),
      value: `${stats.totalHours}h`,
      subValue: stats.totalEpisodes > 0 ? `${stats.totalEpisodes} ${t('common.episodes')}` : t('stats.fav_genre_empty'),
      color: 'indigo',
      delay: 0,
    },
    {
      icon: Tv,
      label: t('status.watching'),
      value: String(stats.statusCounts.watching),
      subValue: t('dashboard.watching_sub'),
      color: 'cyan',
      delay: 0.07,
    },
    {
      icon: CheckCircle,
      label: t('status.completed'),
      value: String(stats.statusCounts.completed),
      subValue: t('stats.completed'),
      color: 'emerald',
      delay: 0.14,
    },
    {
      icon: Bookmark,
      label: t('status.planning'),
      value: String(stats.statusCounts.planToWatch),
      subValue: t('common.in_library'),
      color: 'purple',
      delay: 0.21,
    },
    {
      icon: TrendingUp,
      label: t('stats.fav_genre'),
      value: stats.favoriteGenre || 'Aucun',
      subValue: stats.favoriteGenre ? t('stats.fav_genre_sub') : t('stats.fav_genre_empty'),
      color: 'rose',
      delay: 0.28,
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
  };

  return (
    <div id="dashboard-page-root" className="pb-8 space-y-0">
      {/* ── HERO BANNER (Top Trending Now) ── */}
      <div className="-mx-4 cursor-pointer" onClick={() => heroAnime && handleOpenDetail(heroAnime)}>
        {isHeroLoading ? (
          <HeroSkeleton />
        ) : (
          <HeroBanner anime={heroAnime} onNextAnime={handleNextHeroAnime} />
        )}
      </div>

      {/* ── SECTION 1 : POPULAIRES CETTE SAISON ── */}
      <div className="pt-7 space-y-3">
        <SectionTitle
          icon={Flame}
          title={t('dashboard.trending')}
          subtitle={t('dashboard.trending_sub')}
        />

        {isSeasonalLoading ? (
          <CarouselSkeleton />
        ) : (
          <div className="flex gap-3 overflow-x-auto custom-scrollbar px-4 pt-1 pb-2">
            {seasonalAnimes.map((anime) => (
              <CarouselAnimeCard
                key={anime.id}
                anime={anime}
                onClick={handleOpenDetail}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 2 : LA SAISON PROCHAINE (UPCOMING) ── */}
      <div className="pt-6 space-y-3">
        <SectionTitle
          icon={Calendar}
          title={t('dashboard.upcoming')}
          subtitle={t('dashboard.upcoming_sub')}
        />

        {isNextSeasonLoading ? (
          <CarouselSkeleton />
        ) : (
          <div className="flex gap-3 overflow-x-auto custom-scrollbar px-4 pt-1 pb-2">
            {nextSeasonAnimes.map((anime) => (
              <CarouselAnimeCard
                key={anime.id}
                anime={anime}
                onClick={handleOpenDetail}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── STATS BENTO GRID ── */}
      <div className="pt-8 px-4 space-y-4">
        <SectionTitle
          icon={Sparkles}
          title={t('dashboard.stats')}
          subtitle={library.length > 0 ? `${stats.statusCounts.total} ${t('dashboard.stats_count')}` : t('dashboard.stats_empty')}
        />

        {library.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-liquid rounded-card p-6 text-center space-y-2"
          >
            <BookOpen size={32} className="text-muted mx-auto" />
            <p className="text-sm font-bold text-foreground">{t('dashboard.empty_title')}</p>
            <p className="text-xs text-muted">
              {t('dashboard.empty_sub')}
            </p>
          </motion.div>
        )}

        <motion.div
          className="grid grid-cols-2 gap-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {statCards.map((card, i) => (
            <StatCard
              key={card.label}
              icon={card.icon}
              label={card.label}
              value={card.value}
              subValue={card.subValue}
              color={card.color}
              delay={card.delay}
              className={i === 5 ? 'col-span-2' : ''}
            />
          ))}
        </motion.div>
      </div>

      {/* ── EN COURS DE VISIONNAGE ── */}
      {watchingList.length > 0 && (
        <div className="pt-8 px-4 space-y-4">
          <SectionTitle
            icon={Play}
            title={t('dashboard.watching_title')}
            subtitle={`${watchingList.length} ${t('dashboard.watching_sub')}`}
          />
          <div className="space-y-2">
            {watchingList.map((entry) => (
              <WatchingCard key={entry.animeId} entry={entry} />
            ))}
          </div>
        </div>
      )}

      {/* ── ANIMÉ COUP DE CŒUR (SWIPE GESTURE SI MULTIPLES 10/10) ── */}
      {activeFavAnime && (
        <div className="pt-8 px-4 space-y-4">
          <SectionTitle
            icon={Heart}
            title={t('dashboard.favorite_title')}
            subtitle={t('dashboard.favorite_sub')}
          />

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeFavAnime.animeId || activeFavAnime.id}
              drag={favoriteAnimes.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={handleFavDragEnd}
              onClick={(e) => {
                // Seulement si clic direct sans glisser
                handleOpenDetail(activeFavAnime);
              }}
              initial={{ opacity: 0, x: slideDirection * 60, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -slideDirection * 60, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.8 }}
              className={`relative rounded-card overflow-hidden cursor-pointer group shadow-xl border border-white/10 ${
                favoriteAnimes.length > 1 ? 'cursor-grab active:cursor-grabbing touch-pan-y select-none' : ''
              }`}
              style={{ height: 160 }}
            >
              {activeFavAnime.bannerImage && (
                <img
                  src={activeFavAnime.bannerImage}
                  alt={activeFavAnime.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                  draggable={false}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-transparent pointer-events-none" />
              <div className="absolute inset-0 flex items-center gap-4 px-5 pointer-events-none">
                <img
                  src={activeFavAnime.coverImage}
                  alt={activeFavAnime.title}
                  className="w-16 h-24 object-cover rounded-[1rem] drop-shadow-2xl shrink-0 border border-white/20"
                  draggable={false}
                />
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <Pill
                      label={`${activeFavAnime.rating}/10`}
                      color="amber"
                      icon={Star}
                      size="xs"
                    />
                    <Pill
                      label={t('stats.favorite')}
                      color="rose"
                      size="xs"
                    />
                  </div>
                  <p className="font-black text-lg text-white leading-tight line-clamp-2 drop-shadow-md">
                    {activeFavAnime.title}
                  </p>
                  <div className="flex gap-1.5 flex-wrap">
                    {(activeFavAnime.genres || []).slice(0, 3).map(g => (
                      <Pill key={g} label={g} color="glass" size="xs" />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Spacer pour BottomNav */}
      <div className="h-8" />
    </div>
  );
}
