import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Plus, CheckCheck, Trash2, Sparkles, BookOpen } from 'lucide-react';
import Modal from '../ui/Layout/Modal';
import CustomSelect from '../ui/Forms/CustomSelect';
import GlassInput from '../ui/Forms/GlassInput';
import Button from '../ui/Primitives/Button';
import Switch from '../ui/Forms/Switch';
import { getAnimeRecommendations } from '../../services/anilistService';
import { useTranslation } from '../../hooks/useTranslation';
import AnimeCover from './AnimeCover';

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ rating, onRate }) {
  const [hovered, setHovered] = useState(null);
  const display = hovered ?? rating ?? 0;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onRate(i)}
          className="p-0.5 transition-transform hover:scale-125 active:scale-95"
          aria-label={`Note ${i}/10`}
        >
          <Star
            size={18}
            className={`transition-colors ${
              i <= display
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-muted/40'
            }`}
          />
        </button>
      ))}
      {rating != null && rating > 0 && (
        <span className="text-yellow-400 text-sm font-black ml-1">{rating}/10</span>
      )}
    </div>
  );
}

// ── Animated Progress Bar ─────────────────────────────────────────────────────
function AnimatedProgressBar({ watched, total }) {
  const { t } = useTranslation();
  const pct = total > 0 ? Math.min(100, Math.round((watched / total) * 100)) : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted font-semibold uppercase tracking-widest">
          {t('common.progress')}
        </span>
        <span className="text-xs font-black text-foreground">
          {watched} / {total > 0 ? total : '?'} {t('common.episodes_short')}
        </span>
      </div>
      <div className="w-full bg-white/10 rounded-full overflow-hidden" style={{ height: 6 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full bg-accent"
          style={{ boxShadow: '0 0 10px rgba(99,102,241,0.7)' }}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-muted/60">{pct}% {t('common.completed_pct')}</span>
      </div>
    </div>
  );
}

// ── Recommendation mini card ──────────────────────────────────────────────────
function RecoCard({ anime }) {
  const title = anime?.title?.userPreferred || anime?.title?.romaji || anime?.title?.english || 'Sans titre';

  return (
    <div className="shrink-0 flex flex-col gap-1.5" style={{ width: 80 }}>
      <AnimeCover anime={anime} className="w-[80px] h-[110px]" />
      <p className="text-[10px] font-semibold text-muted leading-tight line-clamp-2 px-0.5">
        {title}
      </p>
    </div>
  );
}

// ── LibraryDetailView ─────────────────────────────────────────────────────────
export default function LibraryDetailView({
  entry,
  isOpen,
  onClose,
  onUpdate,
  onRemove,
  onIncrementEpisode,
}) {
  const { t } = useTranslation();
  // ── HOOKS ABSOLUMENT TOUJOURS AU SOMMET (Règles des Hooks React) ───────────
  const [localStatus, setLocalStatus] = useState('WATCHING');
  const [localRating, setLocalRating] = useState(0);
  const [localNotes, setLocalNotes] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [recoLoading, setRecoLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const SWITCH_STATUS_OPTIONS = [
    { value: 'WATCHING', label: t('status.watching') },
    { value: 'COMPLETED', label: t('status.completed') },
    { value: 'PLAN_TO_WATCH', label: t('status.planning') },
  ];

  const animeId = entry?.animeId;

  // Synchro des états locaux quand entry change
  useEffect(() => {
    if (entry) {
      setLocalStatus(entry.status ?? 'PLAN_TO_WATCH');
      setLocalRating(entry.rating ?? 0);
      setLocalNotes(entry.notes ?? '');
    }
  }, [entry?.animeId, entry?.status, entry?.rating, entry?.notes]);

  // Chargement des recommandations AniList
  useEffect(() => {
    if (!isOpen || !animeId) return;

    let cancelled = false;
    setRecoLoading(true);
    setRecommendations([]);

    (async () => {
      try {
        const data = await getAnimeRecommendations(animeId);
        if (!cancelled) setRecommendations(data?.slice(0, 10) ?? []);
      } catch (err) {
        if (!cancelled) setRecommendations([]);
      } finally {
        if (!cancelled) setRecoLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isOpen, animeId]);

  // Handlers mémoïsés
  const handleRating = useCallback((val) => {
    setLocalRating(val);
    onUpdate?.({ rating: val });
  }, [onUpdate]);

  const handleStatusChange = useCallback((val) => {
    setLocalStatus(val);
    onUpdate?.({ status: val });
  }, [onUpdate]);

  const handleSaveNotes = useCallback(() => {
    onUpdate?.({ notes: localNotes });
  }, [onUpdate, localNotes]);

  // ── CONDITION DE SORTIE UNIQUEMENT APRÈS TOUS LES HOOKS ────────────────────
  if (!entry) return null;

  const {
    title = 'Sans titre',
    coverImage,
    bannerImage,
    episodesWatched = 0,
    totalEpisodes = 0,
    genres = [],
  } = entry;

  const heroBg = bannerImage || coverImage;

  const footer = (
    <div className="flex gap-3 w-full">
      <Button
        variant="danger"
        isSquare={true}
        onClick={() => { onRemove?.(); onClose(); }}
      >
        <Trash2 size={24} />
      </Button>
      <Button
        variant="primary"
        className="w-full"
        onClick={() => { handleSaveNotes(); onClose(); }}
      >
        {t('common.save')}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      type="bottom"
      title={title}
      footer={footer}
    >
      {/* Hero Banner Image */}
      <div className="relative -mx-4 sm:-mx-6 -mt-4 mb-5 overflow-hidden" style={{ height: 160 }}>
        {heroBg ? (
          <img
            src={heroBg}
            alt={title}
            className="w-full h-full object-cover object-center"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900/60 via-background to-cyan-900/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>

      {/* Poster + Title */}
      <div className="flex gap-4 mb-5">
        {coverImage && (
          <img
            src={coverImage}
            alt={title}
            className="rounded-card object-cover shrink-0 border border-white/10 shadow-lg"
            style={{ width: 75, height: 105 }}
            draggable={false}
          />
        )}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          <h2 className="text-foreground font-black text-lg leading-tight line-clamp-2">{title}</h2>
          <div className="flex gap-1 flex-wrap mt-1">
            {genres.slice(0, 3).map((g) => (
              <span key={g} className="bg-accent/20 text-accent border border-accent/30 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Section 1: Statut (Switch) */}
      <div className="mb-5 space-y-1.5">
        <span className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">{t('common.status')}</span>
        <Switch
          size="sm"
          color="foreground"
          options={SWITCH_STATUS_OPTIONS}
          value={localStatus}
          onChange={handleStatusChange}
        />
      </div>

      {/* Section 2: Mon Avancement (Progression & +1 Épisode) */}
      <div className="glass-liquid rounded-card p-4 space-y-3 mb-5">
        <AnimatedProgressBar watched={episodesWatched} total={totalEpisodes} />
        <div className="flex gap-2 pt-1">
          <Button
            variant="success"
            className="flex-1"
            onClick={onIncrementEpisode}
          >
            <Plus size={16} /> +1 {t('common.episodes_short')}
          </Button>
          {localStatus === 'WATCHING' && totalEpisodes > 0 && episodesWatched < totalEpisodes && (
            <Button
              variant="outline"
              onClick={() => onUpdate?.({ status: 'COMPLETED', episodesWatched: totalEpisodes })}
            >
              <CheckCheck size={16} /> {t('status.completed')}
            </Button>
          )}
        </div>
      </div>

      {/* Section 3: Ma Note (1-10 Étoiles) */}
      <div className="glass-liquid rounded-card p-4 space-y-2 mb-5">
        <span className="text-[10px] font-bold text-muted uppercase tracking-widest block">{t('library.my_rating')}</span>
        <StarRating rating={localRating} onRate={handleRating} />
      </div>

      {/* Section 4: Notes Privées */}
      <div className="mb-5">
        <GlassInput
          label={t('common.notes')}
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          placeholder={t('common.personal_notes_placeholder')}
        />
      </div>

      {/* Section 5: Recommandations Dans le même genre */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 px-1">
          <Sparkles size={14} className="text-accent" />
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
            {t('common.recommendations')}
          </span>
        </div>

        {recoLoading && (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-20 h-28 rounded-list bg-white/10 animate-pulse shrink-0" />
            ))}
          </div>
        )}

        {!recoLoading && recommendations.length > 0 && (
          <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 pt-1">
            {recommendations.map((recoAnime) => (
              <RecoCard key={recoAnime.id} anime={recoAnime} />
            ))}
          </div>
        )}
      </div>

      <div className="h-4" />
    </Modal>
  );
}
