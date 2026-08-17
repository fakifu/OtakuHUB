import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import importedBackup from '../data/imported_backup.json';

const STORAGE_KEY = 'otakuhub_library';

// ── Actions ──────────────────────────────────────────────────────────────────
const ACTIONS = {
  SET_LIBRARY: 'SET_LIBRARY',
  ADD: 'ADD',
  UPDATE: 'UPDATE',
  REMOVE: 'REMOVE',
  CLEAR: 'CLEAR',
};

// ── Reducer ──────────────────────────────────────────────────────────────────
function libraryReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LIBRARY:
      return action.payload;

    case ACTIONS.ADD: {
      const exists = state.findIndex(e => e.animeId === action.payload.animeId);
      if (exists !== -1) {
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
  const anime = entry.anime || entry.anime_data || {
    id: entry.animeId || entry.anime_id,
    title: typeof entry.title === 'string'
      ? { userPreferred: entry.title, romaji: entry.title }
      : entry.title,
    coverImage: typeof entry.coverImage === 'string'
      ? { extraLarge: entry.coverImage, large: entry.coverImage, medium: entry.coverImage }
      : entry.coverImage,
    bannerImage: entry.bannerImage || null,
    episodes: entry.totalEpisodes || entry.episodes || entry.total_episodes || 0,
    genres: entry.genres || [],
    duration: entry.duration || 24,
  };

  return {
    animeId: entry.animeId || entry.anime_id || anime.id,
    title: typeof entry.title === 'string' ? entry.title : (anime.title?.userPreferred || anime.title?.romaji || 'Sans titre'),
    coverImage: typeof entry.coverImage === 'string' ? entry.coverImage : (anime.coverImage?.extraLarge || anime.coverImage?.large || entry.cover_image || ''),
    bannerImage: entry.bannerImage || anime.bannerImage || null,
    anime,
    status: entry.status || 'PLAN_TO_WATCH',
    episodesWatched: Math.max(0, Number(entry.episodesWatched || entry.episodes_watched) || 0),
    totalEpisodes: anime.episodes || entry.totalEpisodes || entry.total_episodes || 0,
    rating: entry.rating || 0,
    notes: entry.notes || '',
    genres: entry.genres || anime.genres || [],
    duration: entry.duration || anime.duration || 24,
    addedAt: entry.addedAt || entry.added_at || new Date().toISOString(),
    updatedAt: entry.updatedAt || entry.updated_at || new Date().toISOString(),
  };
}

// ── Chargement initial depuis LocalStorage (Fallback hors-ligne) ──────────────
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return (importedBackup || []).map(normalizeEntry).filter(Boolean);
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return (importedBackup || []).map(normalizeEntry).filter(Boolean);
    }
    return parsed.map(normalizeEntry).filter(Boolean);
  } catch (err) {
    console.warn('OtakuHub: Erreur lecture LocalStorage', err);
    return (importedBackup || []).map(normalizeEntry).filter(Boolean);
  }
}

// ── Context ──────────────────────────────────────────────────────────────────
const LibraryContext = createContext(null);

export function LibraryProvider({ children }) {
  const [library, dispatch] = useReducer(libraryReducer, [], loadFromStorage);
  const { user } = useAuth();
  
  // Utilisation d'une ref pour éviter que les callbacks ne déclenchent la synchro en boucle
  const isSyncingRef = useRef(false);

  // ── Push de la bibliothèque locale vers Supabase ──
  const pushLocalLibraryToSupabase = useCallback(async (customUser = null) => {
    const targetUser = customUser || user;
    if (!targetUser || !library || library.length === 0) return;

    isSyncingRef.current = true;
    try {
      const payloadList = library.map(entryData => ({
        user_id: targetUser.id,
        anime_id: entryData.animeId,
        status: entryData.status,
        episodes_watched: entryData.episodesWatched,
        total_episodes: entryData.totalEpisodes,
        rating: Math.round(Number(entryData.rating) || 0),
        notes: entryData.notes || '',
        anime_data: entryData.anime,
        updated_at: entryData.updatedAt || new Date().toISOString(),
        added_at: entryData.addedAt || new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('otakuhub_library')
        .upsert(payloadList, { onConflict: 'user_id,anime_id' });

      if (error) {
        console.warn("OtakuHub: Erreur push local library vers Supabase", error);
      } else {
        console.log(`✨ Supabase: ${payloadList.length} animés locaux synchronisés avec succès !`);
      }
    } catch (err) {
      console.error("❌ OtakuHub: Exception push local library", err);
    } finally {
      setTimeout(() => { isSyncingRef.current = false; }, 500);
    }
  }, [user, library]);

  // 1. Charger les données Supabase au démarrage si connecté + fusionner la library locale
  useEffect(() => {
    if (!user) return;

    const fetchLibrary = async () => {
      try {
        const { data, error } = await supabase
          .from('otakuhub_library')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;

        if (data && data.length > 0) {
          const normalizedData = data.map(normalizeEntry).filter(Boolean);
          dispatch({ type: ACTIONS.SET_LIBRARY, payload: normalizedData });
        } else if (library.length > 0) {
          // Si Supabase est vide mais que l'appareil a une bibliothèque locale, pousser immédiatement vers Supabase
          pushLocalLibraryToSupabase(user);
        }
      } catch (err) {
        console.error("❌ OtakuHub: Erreur chargement Supabase", err);
      }
    };

    fetchLibrary();

    // 2. Écouter les changements en temps réel (Cross-Device Sync)
    const channel = supabase
      .channel('library-sync')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'otakuhub_library',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        // Ignorer nos propres changements si on est en train de sync
        if (isSyncingRef.current) return;
        console.log("🔄 Supabase Realtime: Changement détecté", payload);
        fetchLibrary(); // Re-fetch complet pour simplifier la cohérence
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Persistance automatique locale à chaque changement (Offline Support)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    } catch (err) {
      console.warn('OtakuHub: Erreur écriture LocalStorage', err);
    }
  }, [library]);

  // ── Sync Helper ────────────────────────────────────────────────────────────
  const syncToSupabase = async (entryData, isDelete = false) => {
    if (!user) return;
    isSyncingRef.current = true;
    try {
      if (isDelete) {
        await supabase
          .from('otakuhub_library')
          .delete()
          .eq('anime_id', entryData.animeId)
          .eq('user_id', user.id);
      } else {
        const payload = {
          user_id: user.id,
          anime_id: entryData.animeId,
          status: entryData.status,
          episodes_watched: entryData.episodesWatched,
          total_episodes: entryData.totalEpisodes,
          rating: Math.round(Number(entryData.rating) || 0),
          notes: entryData.notes || '',
          anime_data: entryData.anime, // Stocke l'objet complet
          updated_at: entryData.updatedAt
        };
        // Si c'est une création on garde added_at
        if (entryData.addedAt) payload.added_at = entryData.addedAt;

        const { error } = await supabase
          .from('otakuhub_library')
          .upsert(payload, { onConflict: 'user_id,anime_id' });

        if (error) {
          console.warn("OtakuHub: Supabase upsert notice", error);
        }
      }
    } catch (err) {
      console.error("❌ OtakuHub: Erreur synchronisation Supabase", err);
    } finally {
      setTimeout(() => { isSyncingRef.current = false; }, 500); // Debounce
    }
  };

  /**
   * Ajouter ou mettre à jour un animé dans la library.
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
      anime: animeData,
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

    if (entry.totalEpisodes > 0 && entry.episodesWatched >= entry.totalEpisodes) {
      entry.status = 'COMPLETED';
    }

    dispatch({ type: ACTIONS.ADD, payload: entry });
    syncToSupabase(entry);
    console.log(`✅ OtakuHub: "${entry.title}" ajouté à la library (${status})`);
  }, [user]);

  /**
   * Mettre à jour des champs spécifiques d'une entrée.
   */
  const updateEntry = useCallback((animeId, updates) => {
    // Si l'utilisateur marque l'animé comme terminé manuellement
    if (updates.status === 'COMPLETED') {
      const entry = library.find(e => e.animeId === animeId);
      if (entry && entry.totalEpisodes > 0) {
        updates.episodesWatched = entry.totalEpisodes;
      }
    }

    dispatch({ type: ACTIONS.UPDATE, animeId, updates });
    // On doit retrouver l'entrée complète pour l'envoyer à Supabase
    setTimeout(() => {
        const fullEntry = library.find(e => e.animeId === animeId);
        if (fullEntry) {
            syncToSupabase({ ...fullEntry, ...updates, updatedAt: new Date().toISOString() });
        }
    }, 0);
  }, [library, user]);

  /**
   * Incrémenter les épisodes vus de +1.
   */
  const incrementEpisode = useCallback((animeId) => {
    const entry = library.find(e => e.animeId === animeId);
    if (!entry) return;

    const newCount = (entry.episodesWatched || 0) + 1;
    const updates = { episodesWatched: newCount, updatedAt: new Date().toISOString() };

    if (entry.totalEpisodes > 0 && newCount >= entry.totalEpisodes) {
      updates.status = 'COMPLETED';
      updates.episodesWatched = entry.totalEpisodes;
      console.log(`🎉 OtakuHub: "${entry.title}" marqué comme Terminé !`);
    }

    dispatch({ type: ACTIONS.UPDATE, animeId, updates });
    syncToSupabase({ ...entry, ...updates });
  }, [library, user]);

  /**
   * Supprimer un animé de la library.
   */
  const removeFromLibrary = useCallback((animeId) => {
    dispatch({ type: ACTIONS.REMOVE, animeId });
    syncToSupabase({ animeId }, true);
    console.log(`🗑️ OtakuHub: Animé #${animeId} retiré de la library`);
  }, [user]);

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
      // Optionnel: Vider aussi dans Supabase
      if (user) {
          supabase.from('otakuhub_library').delete().eq('user_id', user.id).then(() => {
              console.log('🧹 OtakuHub: Supabase Library vidée');
          });
      }
    }
  }, [user]);

  const importBackupData = useCallback(async (items) => {
    if (!Array.isArray(items) || items.length === 0) return;
    const normalizedList = items.map(normalizeEntry).filter(Boolean);
    dispatch({ type: ACTIONS.SET_LIBRARY, payload: normalizedList });

    if (user) {
      isSyncingRef.current = true;
      try {
        const batchPayload = normalizedList.map(entryData => ({
          user_id: user.id,
          anime_id: entryData.animeId,
          status: entryData.status,
          episodes_watched: entryData.episodesWatched,
          total_episodes: entryData.totalEpisodes,
          rating: Math.round(Number(entryData.rating) || 0),
          notes: entryData.notes || '',
          anime_data: entryData.anime,
          updated_at: entryData.updatedAt,
          added_at: entryData.addedAt || new Date().toISOString()
        }));

        const { error } = await supabase
          .from('otakuhub_library')
          .upsert(batchPayload, { onConflict: 'user_id,anime_id' });

        if (error) {
          console.warn("OtakuHub: Supabase batch import notice", error);
        } else {
          console.log(`✨ Supabase: ${batchPayload.length} animés synchronisés en 1 seule requête !`);
        }
      } catch (err) {
        console.error("❌ OtakuHub: Erreur batch import Supabase", err);
      } finally {
        setTimeout(() => { isSyncingRef.current = false; }, 500);
      }
    }
  }, [user]);

  const value = {
    library,
    addToLibrary,
    updateEntry,
    incrementEpisode,
    removeFromLibrary,
    isInLibrary,
    getEntry,
    clearLibrary,
    importBackupData,
    pushLocalLibraryToSupabase,
  };

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) {
    throw new Error('useLibrary doit être utilisé à l\'intérieur de <LibraryProvider>');
  }
  return ctx;
}

export default LibraryContext;
