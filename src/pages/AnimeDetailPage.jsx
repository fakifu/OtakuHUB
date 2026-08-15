import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Star, Calendar, Film, CheckCircle,
  Plus, Trash2, Play, Bookmark, Clock, ChevronRight,
  Tv, Sparkles, Building2, RefreshCw, BookOpen,
  Award, Layers, Youtube, Info, Tag
} from 'lucide-react';

import AnimeCover from '../components/anime/AnimeCover';
import Pill from '../components/ui/Pill';
import { useLibrary } from '../context/LibraryContext';
import { getAnimeById } from '../services/anilistService';
import { useTranslation } from '../hooks/useTranslation';

const STATUS_OPTIONS = [
  { value: 'PLAN_TO_WATCH', labelKey: 'status.planning', icon: Bookmark, color: 'purple' },
  { value: 'WATCHING', labelKey: 'status.watching', icon: Play, color: 'cyan' },
  { value: 'COMPLETED', labelKey: 'status.completed', icon: CheckCircle, color: 'emerald' },
];

const RELATION_LABELS = {
  PREQUEL: 'Saison précédente (Prequel)',
  SEQUEL: 'Saison suivante (Sequel)',
  PARENT: 'Série originale',
  SIDE_STORY: 'Histoire secondaire',
  SPIN_OFF: 'Spin-off',
  ALTERNATIVE: 'Version alternative',
  SUMMARY: 'Résumé / Film',
};

const BROADCAST_STATUS = {
  FINISHED: 'Terminé',
  RELEASING: 'En cours de diffusion',
  NOT_YET_RELEASED: 'À venir / Prochainement',
  CANCELLED: 'Annulé',
  HIATUS: 'En pause de production',
};

const SOURCE_LABELS = {
  MANGA: 'Manga',
  LIGHT_NOVEL: 'Light Novel',
  VISUAL_NOVEL: 'Visual Novel',
  VIDEO_GAME: 'Jeu Vidéo',
  ORIGINAL: 'Œuvre Originale',
  NOVEL: 'Roman',
  OTHER: 'Autre',
};

export default function AnimeDetailPage({ animeId: propAnimeId, onBack, onSelectAnime }) {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { library, addToLibrary, updateEntry, removeFromLibrary } = useLibrary();

  const animeIdNum = Number(propAnimeId || paramId);
  const libraryEntry = library.find(e => e.animeId === animeIdNum);

  const [animeData, setAnimeData] = useState(libraryEntry?.anime || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  // Charger les données AniList complètes
  useEffect(() => {
    let cancelled = false;
    async function fetchDetails() {
      setIsLoading(true);
      try {
        const fetched = await getAnimeById(animeIdNum);
        if (!cancelled && fetched) {
          setAnimeData(fetched);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Erreur de chargement');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchDetails();
    return () => { cancelled = true; };
  }, [animeIdNum]);

  // Remonter automatiquement le conteneur de défilement tout en haut à l'ouverture ou au changement d'animé
  useEffect(() => {
    const resetScroll = () => {
      const scrollContainer = document.getElementById('anime-detail-root')?.closest('.overflow-y-auto');
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
      }
      window.scrollTo(0, 0);
    };

    resetScroll(); // 1. Immédiat
    requestAnimationFrame(resetScroll); // 2. À la prochaine frame
    const timer = setTimeout(resetScroll, 50); // 3. Sécurité absolue après peinture du DOM

    return () => clearTimeout(timer);
  }, [animeIdNum]);

  // Collecter l'animé actuel et toutes ses saisons/relations pour les classer dans l'ordre chronologique (Saison 1, Saison 2... puis spin-offs/movies)
  const allSeasonsList = React.useMemo(() => {
    if (!animeData) return [];

    const itemsMap = new Map();

    // 1. Ajouter l'animé actuellement consulté
    itemsMap.set(animeData.id, {
      id: animeData.id,
      title: animeData.title,
      coverImage: animeData.coverImage,
      format: animeData.format,
      startDate: animeData.startDate,
      seasonYear: animeData.seasonYear,
      relationType: 'CURRENT',
      isCurrent: true,
    });

    // 2. Ajouter les animés reliés (préquelles, séquelles, spin-offs, etc.)
    if (animeData.relations?.edges) {
      animeData.relations.edges.forEach(edge => {
        if (edge.node?.type === 'ANIME' && edge.node?.id && !itemsMap.has(edge.node.id)) {
          itemsMap.set(edge.node.id, {
            id: edge.node.id,
            title: edge.node.title,
            coverImage: edge.node.coverImage,
            format: edge.node.format,
            startDate: edge.node.startDate,
            seasonYear: edge.node.seasonYear,
            relationType: edge.relationType,
            isCurrent: false,
          });
        }
      });
    }

    const list = Array.from(itemsMap.values());

    const getSortDate = (item) => {
      const year = item.startDate?.year || item.seasonYear || 9999;
      const month = item.startDate?.month || 1;
      const day = item.startDate?.day || 1;
      return year * 10000 + month * 100 + day;
    };

    // Distinguer l'histoire principale (TV/Prequel/Sequel/Parent/Current) des spin-offs/histoires secondaires
    const isMainStory = (item) => {
      if (item.isCurrent || item.relationType === 'PREQUEL' || item.relationType === 'SEQUEL' || item.relationType === 'PARENT') return true;
      if ((item.format === 'TV' || item.format === 'TV_SHORT') && item.relationType !== 'SPIN_OFF' && item.relationType !== 'SIDE_STORY') return true;
      return false;
    };

    const mainSeasons = list.filter(isMainStory).sort((a, b) => getSortDate(a) - getSortDate(b));
    const sideStories = list.filter(item => !isMainStory(item)).sort((a, b) => getSortDate(a) - getSortDate(b));

    // Attribuer un numéro de saison chronologique (Saison 1, Saison 2...) aux animés principaux
    mainSeasons.forEach((item, idx) => {
      item.seasonNumber = idx + 1;
    });

    return [...mainSeasons, ...sideStories];
  }, [animeData]);

  if (isLoading && !animeData) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center pt-12 pb-24">
        <div className="space-y-4 text-center">
          <RefreshCw size={28} className="animate-spin text-accent mx-auto" />
          <p className="text-xs text-muted font-bold uppercase tracking-widest">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !animeData) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 space-y-4">
        <p className="text-sm text-red-400 font-bold">{error || 'Animé introuvable'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-full glass-panel text-xs font-bold"
        >
          {t('common.back')}
        </button>
      </div>
    );
  }

  const {
    title,
    coverImage,
    bannerImage,
    averageScore,
    meanScore,
    popularity,
    genres = [],
    description,
    episodes,
    duration,
    status,
    format,
    seasonYear,
    season,
    startDate,
    source,
    studios,
    relations,
    trailer,
    rankings = [],
  } = animeData;

  const poster = coverImage?.extraLarge || coverImage?.large;
  const banner = bannerImage || poster;
  const titleMain = title?.english || title?.userPreferred || title?.romaji || 'Sans titre';
  const titleSub = (title?.english && title?.romaji && title.english !== title.romaji) ? title.romaji : null;
  const mainStudio = studios?.nodes?.find(s => s.isAnimationStudio)?.name || studios?.nodes?.[0]?.name;

  const isSaved = Boolean(libraryEntry);
  const currentStatus = libraryEntry?.status || 'PLAN_TO_WATCH';
  const watchedCount = libraryEntry?.episodesWatched || 0;
  const currentRating = libraryEntry?.rating || 0;

  // Formater la date de début de sortie
  const formattedStartDate = startDate?.year
    ? `${startDate.day ? startDate.day + ' ' : ''}${startDate.month ? ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'][startDate.month - 1] + ' ' : ''}${startDate.year}`
    : null;

  // Trouver les meilleurs classements
  const ratedRank = rankings?.find(r => r.type === 'RATED' && r.allTime)?.rank;
  const popularRank = rankings?.find(r => r.type === 'POPULAR' && r.allTime)?.rank;

  const handleAddOrUpdateStatus = (newStatus) => {
    if (isSaved) {
      updateEntry(animeIdNum, { status: newStatus });
    } else {
      addToLibrary(animeData, newStatus, 0);
    }
  };

  const handleEpisodeChange = (valStr) => {
    if (!isSaved) return;
    const val = parseInt(valStr, 10);
    const safeVal = isNaN(val) ? 0 : Math.max(0, episodes ? Math.min(episodes, val) : val);
    const updates = { episodesWatched: safeVal };
    if (episodes && safeVal >= episodes) {
      updates.status = 'COMPLETED';
    }
    updateEntry(animeIdNum, updates);
  };

  const handleSetRating = (score) => {
    if (isSaved) {
      if (currentRating === score) {
        updateEntry(animeIdNum, { rating: 0 });
      } else {
        updateEntry(animeIdNum, { rating: score });
      }
    }
  };

  const notesText = libraryEntry?.notes || '';
  const handleNotesChange = (text) => {
    if (!isSaved) return;
    updateEntry(animeIdNum, { notes: text.slice(0, 500) });
  };

  const handleRemove = () => {
    if (isSaved) {
      removeFromLibrary(animeIdNum);
    }
  };

  return (
    <div id="anime-detail-root" className="min-h-screen bg-transparent text-foreground pb-24 relative overflow-x-hidden">
      {/* ── BARRE FLOTTANTE RETOUR ── */}
      <div className="fixed top-[calc(0.75rem+env(safe-area-inset-top,0px))] left-4 right-4 z-50 flex items-center justify-between pointer-events-none">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-foreground hover:text-accent shadow-xl border border-white/20 active:scale-95 transition-all pointer-events-auto"
          title={t('common.back')}
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      {/* ── SECTEUR SUPÉRIEUR (BANNIÈRE + TITRE + COVER + GENRES) — DÉGRADÉ ADAPTATIF THÈME ── */}
      <div className="relative w-full bg-gradient-to-b dark:from-black/95 dark:via-black/85 dark:via-75% dark:to-transparent from-slate-100/95 via-slate-100/85 via-75% to-transparent pb-6">
        {/* Bannière d'illustration prolongée avec masque de fondu progressif */}
        <div className="relative w-full h-[32vh] min-h-[220px] max-h-[300px] overflow-hidden">
          <img
            src={banner}
            alt={titleMain}
            style={{
              maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
            }}
            className="w-full h-full object-cover object-top opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-b dark:from-black/60 dark:to-transparent from-slate-100/60 to-transparent pointer-events-none" />
        </div>

        {/* Titre, Cover & Genres enveloppés dans le même fond dégradé continu */}
        <div className="px-5 -mt-16 space-y-5 max-w-lg mx-auto relative z-10">
          {/* Titre & Badges en tête */}
          <div className="text-center space-y-2.5">
            <div className="flex gap-2 flex-wrap items-center justify-center">
              {format && <Pill label={format} color="indigo" size="xs" />}
              {averageScore != null && (
                <Pill
                  label={(averageScore / 10).toFixed(1)}
                  color="amber"
                  icon={Star}
                  size="xs"
                />
              )}
              {episodes && (
                <Pill
                  label={`${episodes} ${t('common.episodes_short')}`}
                  color="muted"
                  size="xs"
                />
              )}
            </div>

            <h1 className="font-['Unbounded'] font-black text-2xl sm:text-3xl leading-tight text-foreground tracking-tighter drop-shadow-xl">
              {titleMain}
            </h1>

            {titleSub && (
              <p className="text-xs text-muted font-medium italic -mt-1">
                {titleSub}
              </p>
            )}
          </div>

          {/* Cover Rectangulaire Agrandie via le composant unifié AnimeCover */}
          {poster && (
            <div className="flex justify-center my-4">
              <AnimeCover
                anime={animeData}
                showScore={false}
                className="w-[92%] max-w-[340px] aspect-[2/3] rounded-[2.2rem] shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-white/20"
              />
            </div>
          )}

          {/* Pilules de thèmes / genres (directement sous la cover, encore sous le fond noir dégradé) */}
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap justify-center">
              {genres.map(g => (
                <Pill key={g} label={g} color="glass" size="sm" />
              ))}
            </div>

            {mainStudio && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted font-medium pt-1">
                <Building2 size={14} className="text-accent" />
                <span>{t('detail.studio')} : <strong className="text-foreground">{mainStudio}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ZONE INFÉRIEURE DU CONTENU ── */}
      <div className="px-5 space-y-6 max-w-lg mx-auto relative z-10 -mt-2">

        {/* ── BOUTONS DE STATUTS DIRECTEMENT POSÉS SUR LE FOND CLASSIQUE ── */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
              <Sparkles size={14} className="text-accent" />
              {isSaved ? t('detail.status_in_lib') : t('detail.add_to_lib')}
            </span>
            {isSaved && (
              <button
                onClick={handleRemove}
                className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
              >
                <Trash2 size={13} />
                {t('detail.remove_button')}
              </button>
            )}
          </div>

          {/* Les 3 pilules de statut (PLAN_TO_WATCH, WATCHING, COMPLETED) posées directement sans wrapper glass */}
          <div className="flex gap-2.5 flex-wrap justify-center">
            {STATUS_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isActive = isSaved && currentStatus === opt.value;
              return (
                <Pill
                  key={opt.value}
                  label={t(opt.labelKey)}
                  color={opt.color}
                  icon={Icon}
                  active={isActive}
                  onClick={() => handleAddOrUpdateStatus(opt.value)}
                  size="md"
                />
              );
            })}
          </div>
        </div>

        {/* ── PROGRESSION & NOTE PERSONNELLE (POSÉE DIRECTEMENT SUR LE FOND CLASSIQUE SANS WRAPPER GLASS) ── */}
        {isSaved && (
          <div className="space-y-3 pt-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-1.5 px-1">
              <Film size={14} className="text-accent" />
              {t('detail.progression_rating')}
            </h3>

            {/* Saisie d'épisodes et Barre de Progression */}
            <div className="space-y-2.5 px-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-muted">{t('common.episodes_watched')}</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max={episodes || 9999}
                    value={watchedCount}
                    onChange={(e) => handleEpisodeChange(e.target.value)}
                    className="w-12 bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-center text-xs font-black text-accent cursor-pointer [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-xs font-bold text-muted">/ {episodes || '?'} {t('common.episodes_short')}</span>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{ width: `${episodes ? Math.min(100, (watchedCount / episodes) * 100) : 0}%` }}
                />
              </div>
            </div>

            {/* Note Personnelle (Étoiles 1-10 avec Bascule/Suppression au 2ème clic) */}
            <div className="space-y-2 pt-2 px-1">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-muted">{t('detail.my_personal_rating')}</span>
                <span className="text-yellow-400 font-extrabold">{currentRating > 0 ? `${currentRating}/10 ⭐` : t('detail.not_rated')}</span>
              </div>
              <div className="flex gap-1 justify-between overflow-x-auto py-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(star => (
                  <button
                    key={star}
                    onClick={() => handleSetRating(star)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all active:scale-95 ${
                      star <= currentRating
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 font-black scale-105'
                        : 'bg-white/5 text-muted hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    {star}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── FICHE TECHNIQUE COMPLÈTE & METRICS (POSÉE DIRECTEMENT SANS CONTENEUR GLASS INUTILE) ── */}
        <div className="space-y-3 pt-1">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-1.5 px-1">
            <Info size={14} className="text-accent" />
            {t('detail.info_rankings')}
          </h3>

          {/* Grille de métadonnées exhaustives */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Format & Épisodes */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] text-muted font-semibold uppercase tracking-wider block">{t('detail.episodes_format')}</span>
              <span className="font-bold text-foreground">{format || 'TV'} · {episodes ? `${episodes} éps` : 'Épisodes inconnus'} {duration ? `(${duration} min/ép)` : ''}</span>
            </div>

            {/* Statut de diffusion */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] text-muted font-semibold uppercase tracking-wider block">{t('detail.broadcast')}</span>
              <span className="font-bold text-accent">{BROADCAST_STATUS[status] || status || 'Inconnu'}</span>
            </div>

            {/* Saison & Date de sortie */}
            {formattedStartDate && (
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] text-muted font-semibold uppercase tracking-wider block">{t('detail.date_season')}</span>
                <span className="font-bold text-foreground">{season ? `${season} ` : ''}{formattedStartDate}</span>
              </div>
            )}

            {/* Source originelle */}
            {source && (
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] text-muted font-semibold uppercase tracking-wider block">{t('detail.source')}</span>
                <span className="font-bold text-foreground">{SOURCE_LABELS[source] || source}</span>
              </div>
            )}
          </div>

          {/* Badges de Classements (Rankings AniList) */}
          {(ratedRank || popularRank) && (
            <div className="flex gap-2 flex-wrap pt-1 px-1">
              {ratedRank && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold">
                  <Award size={14} className="text-amber-400" />
                  <span>{t('detail.best_score_rank', { rank: ratedRank })}</span>
                </div>
              )}
              {popularRank && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
                  <Sparkles size={14} className="text-cyan-400" />
                  <span>{t('detail.popular_rank', { rank: popularRank })}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── LECTEUR TRAILER VIDÉO YOUTUBE (POSÉ DIRECTEMENT SANS CONTENEUR GLASS INUTILE) ── */}
        {trailer?.site === 'youtube' && trailer?.id && (
          <div className="space-y-2.5 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-1.5 px-1">
              <Youtube size={16} className="text-red-500" />
              {t('detail.trailer')}
            </h3>

            <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${trailer.id}`}
                title="Anime Trailer"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* ── SYNOPSIS / DESCRIPTION (CARD GLASS LIQUID) ── */}
        {description && (
          <div className="glass-liquid rounded-card transition-all hover:border-accent/30 p-5 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
              <BookOpen size={14} className="text-accent" />
              {t('detail.synopsis')}
            </h3>
            <div
              className="text-sm text-foreground/90 leading-relaxed font-normal space-y-2 pt-1"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </div>
        )}

        {/* ── NOTES PERSONNELLES (SAISIE TRANSPARENTE EN LIGNE IDENTIQUE AU SYNOPSIS) ── */}
        {isSaved && (
          <div className="glass-liquid rounded-card transition-all hover:border-accent/30 p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
                <Bookmark size={14} className="text-accent" />
                {t('detail.personal_notes')}
              </h3>
              <span className="text-[10px] font-semibold text-muted">
                {notesText.length} / 500
              </span>
            </div>

            <textarea
              rows={3}
              maxLength={500}
              value={notesText}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder={t('detail.notes_placeholder')}
              className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-sm text-foreground/90 leading-relaxed font-normal resize-none placeholder:text-muted/50 placeholder:italic transition-colors"
            />
          </div>
        )}

        {/* ── SECTION TOUTES LES SAISONS & ANIMÉS LIÉS (RANGÉS PAR ORDRE CHRONOLOGIQUE STRICT, POSÉS TOUT EN BAS) ── */}
        {allSeasonsList.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-1.5 px-1">
              <Layers size={14} className="text-accent" />
              {t('detail.seasons_relations')} ({allSeasonsList.length})
            </h3>

            <div className="flex gap-3.5 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-none">
              {allSeasonsList.map((item) => {
                const itemTitle = item.title?.english || item.title?.userPreferred || item.title?.romaji || 'Sans titre';
                const itemCover = item.coverImage?.extraLarge || item.coverImage?.large;
                const isCurrent = item.isCurrent;

                let relTypeLabel;
                if (isCurrent) {
                  relTypeLabel = t('detail.current_season');
                } else if (item.relationType === 'PREQUEL') {
                  relTypeLabel = t('detail.previous_season');
                } else if (item.relationType === 'SEQUEL') {
                  relTypeLabel = t('detail.next_season');
                } else if (item.seasonNumber) {
                  relTypeLabel = `Saison ${item.seasonNumber}`;
                } else {
                  relTypeLabel = RELATION_LABELS[item.relationType] || (item.format === 'MOVIE' ? 'Film' : item.format === 'SPECIAL' ? 'Spécial' : 'Spin-off');
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (!isCurrent) {
                        if (onSelectAnime) {
                          onSelectAnime(item.id);
                        } else {
                          navigate(`/anime/${item.id}`);
                        }
                      }
                    }}
                    className={`shrink-0 w-[135px] text-left group cursor-pointer active:scale-95 transition-transform ${isCurrent ? 'cursor-default' : ''}`}
                  >
                    <div className={`relative w-[135px] h-[195px] rounded-2xl overflow-hidden shadow-lg border transition-all ${
                      isCurrent
                        ? 'border-accent ring-2 ring-accent/50 shadow-accent/20 scale-[1.02]'
                        : 'border-white/15 bg-surface group-hover:border-accent/40'
                    }`}>
                      {itemCover ? (
                        <img src={itemCover} alt={itemTitle} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white/5" />
                      )}

                      {/* Dégradé sombre au bas pour la lisibilité du titre */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

                      {/* Badge Saison (Top) */}
                      <div className="absolute top-1.5 left-1.5 right-1.5 z-10 pointer-events-none">
                        <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md backdrop-blur-md truncate block ${
                          isCurrent
                            ? 'bg-accent text-white border border-white/30'
                            : 'bg-black/75 text-cyan-300 border border-cyan-400/30'
                        }`}>
                          {relTypeLabel}
                        </span>
                      </div>

                      {/* Titre de l'animé (Bottom) */}
                      <div className="absolute bottom-0 left-0 right-0 p-2.5 z-10 pointer-events-none">
                        <p className={`text-xs font-bold line-clamp-2 leading-tight drop-shadow-md transition-colors ${
                          isCurrent ? 'text-accent font-black' : 'text-white group-hover:text-accent'
                        }`}>
                          {itemTitle}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
