import React from 'react';
import { motion } from 'framer-motion';
import { Star, Calendar, Film } from 'lucide-react';
import AnimeCover from './AnimeCover';
import Pill from '../ui/Pill';

// ── Format label & colors map ──────────────────────────────────────────────────
const FORMAT_COLORS = {
  TV: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40',
  MOVIE: 'bg-purple-500/20 text-purple-400 border border-purple-500/40',
  OVA: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40',
  ONA: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
  SPECIAL: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
  MUSIC: 'bg-rose-500/20 text-rose-400 border border-rose-500/40',
  MANGA: 'bg-orange-500/20 text-orange-400 border border-orange-500/40',
};

const FORMAT_LABELS = {
  TV: 'TV',
  TV_SHORT: 'TV Short',
  MOVIE: 'Film',
  OVA: 'OVA',
  ONA: 'ONA',
  SPECIAL: 'Spécial',
  MUSIC: 'Musique',
  MANGA: 'Manga',
};

// ── AnimeListItem (Élément de liste standard avec conteneur rounded-list) ──────
export default function AnimeListItem({ anime, onClick, index = 0 }) {
  if (!anime) return null;

  const {
    title,
    averageScore,
    genres = [],
    seasonYear,
    episodes,
    format,
  } = anime;

  const titleRomaji = title?.romaji || title?.userPreferred || 'Sans titre';
  const titleEnglish = title?.english;

  // Masquer le sous-titre uniquement si le titre principal est très long (> 30 car) pour préserver la hauteur
  const showEnglishTitle = titleEnglish && titleEnglish !== titleRomaji && titleRomaji.length <= 30;

  const formatClass = FORMAT_COLORS[format] || FORMAT_COLORS.TV;
  const formatLabel = FORMAT_LABELS[format] || format || 'TV';
  const isFirstBatch = index < 7;

  return (
    <motion.div
      initial={isFirstBatch ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={isFirstBatch ? { delay: index * 0.03, duration: 0.2, ease: 'easeOut' } : { duration: 0 }}
      onClick={() => onClick?.(anime)}
      className="flex gap-3.5 glass-liquid-lite rounded-list p-3 cursor-pointer active:scale-[0.98] transition-transform max-h-[130px] overflow-hidden items-center select-none touch-manipulation shadow-sm"
    >
      {/* Cover unifiée posée sur l'élément de liste */}
      <AnimeCover
        anime={anime}
        showScore={false}
        className="w-[76px] h-[106px] shrink-0"
      />

      {/* Informations de l'animé */}
      <div className="flex flex-col justify-between h-[106px] flex-1 min-w-0 overflow-hidden py-0.5">
        {/* En-tête : Titre principal & sous-titre */}
        <div className="min-w-0 space-y-0.5">
          <h3 className="text-foreground font-extrabold text-sm leading-tight line-clamp-2 min-w-0">
            {titleRomaji}
          </h3>

          {showEnglishTitle && (
            <p className="text-muted text-xs truncate font-medium">
              {titleEnglish}
            </p>
          )}
        </div>

        {/* Ligne des statistiques (Note ⭐, Année 📅, Épisodes 🎬) */}
        <div className="flex items-center gap-3 text-xs text-muted font-medium flex-wrap">
          {averageScore != null && (
            <span className="inline-flex items-center gap-1 text-yellow-400 font-bold">
              <Star size={11} className="fill-yellow-400 text-yellow-400" />
              {(averageScore / 10).toFixed(1)}
            </span>
          )}
          {seasonYear && (
            <span className="inline-flex items-center gap-1 text-muted">
              <Calendar size={11} className="text-muted" />
              {seasonYear}
            </span>
          )}
          {episodes && (
            <span className="inline-flex items-center gap-1 text-muted">
              <Film size={11} className="text-muted" />
              {episodes} ép.
            </span>
          )}
        </div>

        {/* Ligne des badges : Pastille Format + Genres */}
        <div className="flex items-center gap-1.5 overflow-hidden flex-nowrap shrink-0">
          <Pill
            label={formatLabel}
            color={format === 'MOVIE' ? 'purple' : format === 'ONA' ? 'emerald' : format === 'OVA' ? 'cyan' : 'indigo'}
            size="xs"
          />

          {genres.slice(0, 3).map((genre) => (
            <Pill
              key={genre}
              label={genre}
              color="muted"
              size="xs"
              className="max-w-[85px]"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
