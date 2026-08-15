import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import AnimeCover from './AnimeCover';

// ── Status badge config ───────────────────────────────────────────────────────
const STATUS_CONFIG = {
  WATCHING: {
    label: 'En cours',
    className: 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/40',
    dot: true,
  },
  COMPLETED: {
    label: 'Terminé',
    className: 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/40',
    dot: false,
  },
  PLAN_TO_WATCH: {
    label: 'À voir',
    className: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40',
    dot: false,
  },
  DROPPED: {
    label: 'Abandonné',
    className: 'bg-red-400/20 text-red-400 border border-red-400/40',
    dot: false,
  },
  ON_HOLD: {
    label: 'En pause',
    className: 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/40',
    dot: false,
  },
};

// ── Fallback poster ───────────────────────────────────────────────────────────
function PosterFallback() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 via-background to-cyan-900/30 flex items-center justify-center">
      <span className="text-4xl select-none">🎌</span>
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ watched, total }) {
  if (!total || watched == null) return null;
  const pct = Math.min(100, Math.round((watched / total) * 100));

  return (
    <div className="w-full bg-white/10 rounded-full overflow-hidden" style={{ height: 3 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="h-full rounded-full bg-accent"
        style={{ boxShadow: '0 0 6px rgba(99,102,241,0.6)' }}
      />
    </div>
  );
}

// ── AnimeGridCard ─────────────────────────────────────────────────────────────
export default function AnimeGridCard({ entry, onClick }) {
  if (!entry) return null;

  const {
    status,
    episodesWatched = 0,
    rating,
    anime = {},
  } = entry;

  const animeObj = entry.anime || {
    title: entry.title,
    coverImage: entry.coverImage,
    episodes: entry.totalEpisodes,
  };

  const titleText = typeof animeObj.title === 'string'
    ? animeObj.title
    : (animeObj.title?.userPreferred || animeObj.title?.romaji || animeObj.title?.english || entry.title || 'Sans titre');

  const totalEpisodes = animeObj.episodes || entry.totalEpisodes || 0;

  return (
    <motion.div
      onClick={() => onClick?.(entry)}
      whileHover="hover"
      initial="rest"
      animate="rest"
      className="relative cursor-pointer rounded-xl overflow-hidden select-none touch-manipulation shadow-lg"
      style={{ aspectRatio: '2/3' }}
      variants={{
        rest: { scale: 1 },
        hover: { scale: 1.01 },
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Cover unifiée standardisée avec badge de statut et barre de progression */}
      <AnimeCover
        anime={animeObj}
        title={titleText}
        status={status}
        showStatusBadge={true}
        showProgress={true}
        episodesWatched={episodesWatched}
        totalEpisodes={totalEpisodes}
        className="absolute inset-0 w-full h-full"
      >
        {/* Contenu textuel superposé sur la cover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-1 z-10 pointer-events-none">
          {/* Note attribuée par l'utilisateur */}
          {rating != null && rating > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-yellow-400 self-start">
              <Star size={9} className="fill-yellow-400" />
              {rating}/10
            </span>
          )}

          {/* Titre de l'animé */}
          <h3 className="text-white font-extrabold text-xs leading-tight line-clamp-2 drop-shadow-md">
            {titleText}
          </h3>

          {/* Compteur d'épisodes vus pour WATCHING */}
          {status === 'WATCHING' && totalEpisodes > 0 && (
            <span className="text-[9px] text-white/60 font-semibold pt-0.5">
              {episodesWatched}/{totalEpisodes} ép.
            </span>
          )}
        </div>
      </AnimeCover>
    </motion.div>
  );
}
