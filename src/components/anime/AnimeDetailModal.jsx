import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronDown, ChevronUp } from 'lucide-react';
import Modal from '../ui/Layout/Modal';
import CustomSelect from '../ui/Forms/CustomSelect';
import GlassInput from '../ui/Forms/GlassInput';
import Button from '../ui/Primitives/Button';

// ── Helpers ───────────────────────────────────────────────────────────────────
import { useTranslation } from '../../hooks/useTranslation';

function cleanHtml(str) {
  if (!str) return '';
  return str
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

const FORMAT_LABELS = {
  TV: 'TV', TV_SHORT: 'TV Short', MOVIE: 'Movie', OVA: 'OVA',
  ONA: 'ONA', SPECIAL: 'Special', MUSIC: 'Music',
};

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ icon, value }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 glass-liquid-lite rounded-full px-3 py-1 text-xs font-semibold text-foreground">
      <span className="text-muted">{icon}</span>
      {value}
    </span>
  );
}

// ── AnimeDetailModal ──────────────────────────────────────────────────────────
export default function AnimeDetailModal({
  anime,
  isOpen,
  onClose,
  onAddToLibrary,
}) {
  const { t } = useTranslation();
  const [selectedStatus, setSelectedStatus] = useState('PLAN_TO_WATCH');
  const [episodesWatched, setEpisodesWatched] = useState('0');
  const [descExpanded, setDescExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const STATUS_OPTIONS = [
    { value: 'WATCHING', label: t('status.watching_icon') },
    { value: 'COMPLETED', label: t('status.completed_icon') },
    { value: 'PLAN_TO_WATCH', label: t('status.planning_icon') },
    { value: 'DROPPED', label: t('status.dropped_icon') },
    { value: 'ON_HOLD', label: t('status.paused_icon') },
  ];

  if (!anime) return null;

  const {
    id,
    title,
    coverImage,
    bannerImage,
    averageScore,
    genres = [],
    description,
    episodes: totalEpisodes,
    duration,
    seasonYear,
    format,
    studios,
  } = anime;

  const titleRomaji = title?.romaji || title?.userPreferred || 'Sans titre';
  const titleEnglish = title?.english;
  const poster = coverImage?.large || coverImage?.medium;
  const heroBg = bannerImage || coverImage?.extraLarge || coverImage?.large;
  const studioName = studios?.nodes?.[0]?.name || studios?.edges?.[0]?.node?.name || '';
  const cleanDesc = cleanHtml(description);
  const showEpisodeInput = selectedStatus !== 'PLAN_TO_WATCH';

  const handleSubmit = async () => {
    const watched = parseInt(episodesWatched, 10) || 0;
    const maxEp = totalEpisodes || Infinity;
    if (watched > maxEp) return;

    setIsSubmitting(true);
    try {
      await onAddToLibrary?.(id, selectedStatus, watched);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <Button
      variant="primary"
      className="w-full"
      onClick={handleSubmit}
      isLoading={isSubmitting}
    >
      {t('common.add_to_library')}
    </Button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      type="bottom"
      title={titleRomaji}
      footer={footer}
    >
      {/* Hero image */}
      <div className="relative -mx-4 sm:-mx-6 -mt-4 mb-5 overflow-hidden" style={{ height: 180 }}>
        {heroBg ? (
          <img
            src={heroBg}
            alt={titleRomaji}
            className="w-full h-full object-cover object-center"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900/60 via-background to-cyan-900/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        {/* Score badge */}
        {averageScore != null && (
          <div className="absolute bottom-3 right-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 text-xs font-black">
              <Star size={11} className="fill-yellow-400 text-yellow-400" />
              {(averageScore / 10).toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Poster + title row */}
      <div className="flex gap-4 mb-5">
        {poster && (
          <img
            src={poster}
            alt={titleRomaji}
            className="rounded-card object-cover shrink-0 border border-white/10"
            style={{ width: 80, height: 110 }}
            draggable={false}
          />
        )}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          <h2 className="text-foreground font-black text-lg leading-tight">{titleRomaji}</h2>
          {titleEnglish && titleEnglish !== titleRomaji && (
            <p className="text-muted text-sm truncate">{titleEnglish}</p>
          )}
          {studioName && (
            <p className="text-accent text-xs font-semibold mt-1">{studioName}</p>
          )}
        </div>
      </div>

      {/* Description */}
      {cleanDesc && (
        <div className="mb-5">
          <motion.p
            className={`text-muted text-sm leading-relaxed ${!descExpanded ? 'line-clamp-3' : ''}`}
            initial={false}
          >
            {cleanDesc}
          </motion.p>
          <button
            onClick={() => setDescExpanded((p) => !p)}
            className="inline-flex items-center gap-1 text-accent text-xs font-bold mt-2 hover:underline"
          >
            {descExpanded ? (
              <>{t('common.read_less')} <ChevronUp size={13} /></>
            ) : (
              <>{t('common.read_more')} <ChevronDown size={13} /></>
            )}
          </button>
        </div>
      )}

      {/* Stats row */}
      <div className="flex flex-wrap gap-2 mb-5">
        <StatPill icon="🎬" value={totalEpisodes ? `${totalEpisodes} ${t('common.episodes')}` : null} />
        <StatPill icon="⏱️" value={duration ? `${duration} min` : null} />
        <StatPill icon="📅" value={seasonYear ? `${seasonYear}` : null} />
        <StatPill icon="📺" value={FORMAT_LABELS[format] || format} />
      </div>

      {/* Genres */}
      {genres.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {genres.map((genre) => (
            <span
              key={genre}
              className="bg-accent/20 text-accent border border-accent/30 rounded-full px-2.5 py-0.5 text-xs font-semibold"
            >
              {genre}
            </span>
          ))}
        </div>
      )}

      {/* Separator */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] font-black text-muted uppercase tracking-widest">
          {t('common.add_to_library')}
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Form */}
      <div className="flex flex-col gap-4">
        <CustomSelect
          label={t('common.status')}
          value={selectedStatus}
          onChange={setSelectedStatus}
          options={STATUS_OPTIONS}
        />

        <AnimatePresence>
          {showEpisodeInput && (
            <motion.div
              key="ep-input"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <GlassInput
                label={t('common.episodes_watched')}
                type="number"
                value={episodesWatched}
                onChange={(e) => setEpisodesWatched(e.target.value)}
                placeholder="0"
              />
              {totalEpisodes && parseInt(episodesWatched, 10) > totalEpisodes && (
                <p className="text-red-400 text-xs mt-1 ml-1 font-semibold">
                  {t('common.max_episodes', { total: totalEpisodes })}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom spacer for footer */}
      <div className="h-4" />
    </Modal>
  );
}
