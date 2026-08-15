import React from 'react';
import { Star } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import Pill from '../ui/Pill';

const STATUS_CONFIG = {
  WATCHING: {
    key: 'status.watching',
    label: 'En cours',
    className: 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/40',
    dot: true,
  },
  COMPLETED: {
    key: 'status.completed',
    label: 'Terminé',
    className: 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/40',
    dot: false,
  },
  PLAN_TO_WATCH: {
    key: 'status.planning',
    label: 'À voir',
    className: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40',
    dot: false,
  },
  DROPPED: {
    key: 'status.dropped',
    label: 'Abandonné',
    className: 'bg-red-400/20 text-red-400 border border-red-400/40',
    dot: false,
  },
  ON_HOLD: {
    key: 'status.paused',
    label: 'En pause',
    className: 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/40',
    dot: false,
  },
};

export default function AnimeCover({
  anime,
  coverUrl,
  title,
  score,
  showScore = true,
  status,
  showStatusBadge = false,
  episodesWatched,
  totalEpisodes,
  showProgress = false,
  children,
  className = '',
}) {
  const { t } = useTranslation();
  const poster = coverUrl || anime?.coverImage?.extraLarge || anime?.coverImage?.large || anime?.coverImage?.medium;
  const animeTitle = title || anime?.title?.english || anime?.title?.romaji || anime?.title?.userPreferred || 'Sans titre';
  const displayScore = score ?? (anime?.averageScore ? (anime.averageScore / 10).toFixed(1) : null);
  const statusCfg = status ? STATUS_CONFIG[status] : null;
  const statusLabel = statusCfg?.key ? t(statusCfg.key) : (statusCfg?.label || '');
  const maxEpisodes = totalEpisodes || anime?.episodes || 0;
  const pctProgress = (maxEpisodes > 0 && episodesWatched != null) ? Math.min(100, Math.round((episodesWatched / maxEpisodes) * 100)) : 0;

  return (
    <div className={`relative rounded-xl overflow-hidden shadow-md group ${className}`}>
      {poster ? (
        <img
          src={poster}
          alt={animeTitle}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 block"
          loading="lazy"
          draggable={false}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-indigo-900/40 via-background to-cyan-900/20 flex items-center justify-center">
          <span className="text-2xl">🎌</span>
        </div>
      )}

      {/* Overlay dégradé sombre en bas */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-90 pointer-events-none" />

      {/* Badge Note (ex: ★ 8.5) — Masqué si showScore={false} */}
      {showScore && displayScore && !showStatusBadge && (
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md border border-yellow-400/30 rounded-full px-2 py-0.5 flex items-center gap-1 z-10 pointer-events-none">
          <Star size={10} className="text-yellow-400 fill-yellow-400" />
          <span className="text-[10px] font-black text-yellow-300">{displayScore}</span>
        </div>
      )}

      {/* Badge Statut Bibliothèque (ex: En cours, Terminé, À voir) — Top Right */}
      {showStatusBadge && status && (
        <div className="absolute top-2 right-2 z-10 pointer-events-none">
          <Pill status={status} label={statusLabel} size="xs" />
        </div>
      )}

      {/* Barre de progression pour la bibliothèque */}
      {showProgress && status === 'WATCHING' && maxEpisodes > 0 && (
        <div className="absolute bottom-1 left-3 right-3 z-10 pointer-events-none">
          <div className="w-full bg-white/10 rounded-full overflow-hidden h-[3px]">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${pctProgress}%`, boxShadow: '0 0 6px rgba(99,102,241,0.6)' }}
            />
          </div>
        </div>
      )}

      {/* Children personnalisés (Titre, Note d'utilisateur, etc.) */}
      {children}
    </div>
  );
}
