import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'otakuhub_library';

// ── Actions ──────────────────────────────────────────────────────────────────
const ACTIONS = {
  ADD: 'ADD',
  UPDATE: 'UPDATE',
  REMOVE: 'REMOVE',
  CLEAR: 'CLEAR',
};

// ── Reducer ──────────────────────────────────────────────────────────────────
function libraryReducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD: {
      const exists = state.findIndex(e => e.animeId === action.payload.animeId);
      if (exists !== -1) {
        // Upsert: mettre à jour l'entrée existante
        const updated = [...state];
        updated[exists] = {
          ...updated[exists],
          ...action.payload,
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }
      return [...state, action.payload];
    }

    case ACTIONS.UPDATE: {
      return state.map(entry =>
        entry.animeId === action.animeId
          ? { ...entry, ...action.updates, updatedAt: new Date().toISOString() }
          : entry
      );
    }

    case ACTIONS.REMOVE:
      return state.filter(entry => entry.animeId !== action.animeId);

    case ACTIONS.CLEAR:
      return [];

    default:
      return state;
  }
}

// ── Normalisation de la structure des entrées ────────────────────────────────
function normalizeEntry(entry) {
  if (!entry) return null;
  const anime = entry.anime || {
    id: entry.animeId,
    title: typeof entry.title === 'string'
      ? { userPreferred: entry.title, romaji: entry.title }
      : entry.title,
    coverImage: typeof entry.coverImage === 'string'
      ? { extraLarge: entry.coverImage, large: entry.coverImage, medium: entry.coverImage }
      : entry.coverImage,
    bannerImage: entry.bannerImage || null,
    episodes: entry.totalEpisodes || entry.episodes || 0,
    genres: entry.genres || [],
    duration: entry.duration || 24,
  };

  return {
    animeId: entry.animeId || anime.id,
    title: typeof entry.title === 'string' ? entry.title : (anime.title?.userPreferred || anime.title?.romaji || 'Sans titre'),
    coverImage: typeof entry.coverImage === 'string' ? entry.coverImage : (anime.coverImage?.extraLarge || anime.coverImage?.large || ''),
    bannerImage: entry.bannerImage || anime.bannerImage || null,
    anime,
    status: entry.status || 'PLAN_TO_WATCH',
    episodesWatched: Math.max(0, Number(entry.episodesWatched) || 0),
    totalEpisodes: anime.episodes || entry.totalEpisodes || 0,
    rating: entry.rating || 0,
    notes: entry.notes || '',
    genres: entry.genres || anime.genres || [],
    duration: entry.duration || anime.duration || 24,
    addedAt: entry.addedAt || new Date().toISOString(),
    updatedAt: entry.updatedAt || new Date().toISOString(),
  };
}

// ── Chargement initial depuis LocalStorage ────────────────────────────────────
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeEntry).filter(Boolean);
  } catch (err) {
    console.warn('OtakuHub: Erreur lecture LocalStorage', err);
    return [];
  }
}

// ── Context ──────────────────────────────────────────────────────────────────
const LibraryContext = createContext(null);

export function LibraryProvider({ children }) {
  const [library, dispatch] = useReducer(libraryReducer, [], loadFromStorage);

  // Persistance automatique à chaque changement
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    } catch (err) {
      console.warn('OtakuHub: Erreur écriture LocalStorage', err);
    }
  }, [library]);

  /**
   * Ajouter ou mettre à jour un animé dans la library.
   * animeData: objet AniList (Media)
   */
  const addToLibrary = useCallback((animeData, status = 'PLAN_TO_WATCH', episodesWatched = 0) => {
    if (!animeData || !animeData.id) return;

    const titleText = typeof animeData.title === 'string'
      ? animeData.title
      : (animeData?.title?.userPreferred || animeData?.title?.romaji || animeData?.title?.english || 'Sans titre');

    const coverUrl = typeof animeData.coverImage === 'string'
      ? animeData.coverImage
      : (animeData?.coverImage?.extraLarge || animeData?.coverImage?.large || animeData?.coverImage?.medium || '');

    const entry = {
      animeId: animeData.id,
      title: titleText,
      coverImage: coverUrl,
      bannerImage: animeData?.bannerImage || null,
      anime: animeData, // Conservation de l'objet AniList complet
      status,
      episodesWatched: Math.max(0, Number(episodesWatched) || 0),
      totalEpisodes: animeData?.episodes || animeData?.totalEpisodes || 0,
      rating: 0,
      notes: '',
      genres: animeData?.genres || [],
      duration: animeData?.duration || 24,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Auto-COMPLETED si épisodes vus >= total
    if (entry.totalEpisodes > 0 && entry.episodesWatched >= entry.totalEpisodes) {
      entry.status = 'COMPLETED';
    }

    dispatch({ type: ACTIONS.ADD, payload: entry });
    console.log(`✅ OtakuHub: "${entry.title}" ajouté à la library (${status})`);
  }, []);

  /**
   * Mettre à jour des champs spécifiques d'une entrée.
   */
  const updateEntry = useCallback((animeId, updates) => {
    dispatch({ type: ACTIONS.UPDATE, animeId, updates });
  }, []);

  /**
   * Incrémenter les épisodes vus de +1.
   * Passe automatiquement en COMPLETED si totalEpisodes atteint.
   */
  const incrementEpisode = useCallback((animeId) => {
    const entry = library.find(e => e.animeId === animeId);
    if (!entry) return;

    const newCount = (entry.episodesWatched || 0) + 1;
    const updates = { episodesWatched: newCount };

    // Auto-completion
    if (entry.totalEpisodes > 0 && newCount >= entry.totalEpisodes) {
      updates.status = 'COMPLETED';
      updates.episodesWatched = entry.totalEpisodes;
      console.log(`🎉 OtakuHub: "${entry.title}" marqué comme Terminé !`);
    }

    dispatch({ type: ACTIONS.UPDATE, animeId, updates });
  }, [library]);

  /**
   * Supprimer un animé de la library.
   */
  const removeFromLibrary = useCallback((animeId) => {
    dispatch({ type: ACTIONS.REMOVE, animeId });
    console.log(`🗑️ OtakuHub: Animé #${animeId} retiré de la library`);
  }, []);

  /**
   * Vérifier si un animé est dans la library.
   */
  const isInLibrary = useCallback((animeId) => {
    return library.some(e => e.animeId === animeId);
  }, [library]);

  /**
   * Obtenir une entrée par son ID.
   */
  const getEntry = useCallback((animeId) => {
    return library.find(e => e.animeId === animeId);
  }, [library]);

  /**
   * Vider toute la library (avec confirmation native).
   */
  const clearLibrary = useCallback(() => {
    if (window.confirm('Vider toute ta library ? Cette action est irréversible.')) {
      dispatch({ type: ACTIONS.CLEAR });
      console.log('🧹 OtakuHub: Library vidée');
    }
  }, []);

  const value = {
    library,
    addToLibrary,
    updateEntry,
    incrementEpisode,
    removeFromLibrary,
    isInLibrary,
    getEntry,
    clearLibrary,
  };

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  );
}

/**
 * Hook useLibrary — doit être utilisé à l'intérieur de LibraryProvider.
 */
export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) {
    throw new Error('useLibrary doit être utilisé à l\'intérieur de <LibraryProvider>');
  }
  return ctx;
}

export default LibraryContext;
