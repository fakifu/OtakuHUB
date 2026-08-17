/**
 * animeStats.js — Fonctions de calcul pures pour les statistiques de la Library
 * Aucun effet de bord, aucun import React.
 */

/**
 * Calcule le total d'heures visionnées.
 * Durée par défaut: 24 min/épisode si non renseignée.
 */
export function getTotalHoursWatched(library) {
  if (!library || library.length === 0) return 0;
  const total = library.reduce((acc, entry) => {
    const dur = (entry.duration && entry.duration > 0) ? entry.duration : 24;
    return acc + (entry.episodesWatched || 0) * dur;
  }, 0);
  return Math.round((total / 60) * 10) / 10;
}

/**
 * Somme totale d'épisodes vus.
 */
export function getTotalEpisodesWatched(library) {
  if (!library || library.length === 0) return 0;
  return library.reduce((acc, entry) => acc + (entry.episodesWatched || 0), 0);
}

/**
 * Genre le plus représenté dans la library.
 * Retourne null si la library est vide.
 */
export function getFavoriteGenre(library) {
  if (!library || library.length === 0) return null;
  const counts = {};
  for (const entry of library) {
    for (const genre of (entry.genres || [])) {
      counts[genre] = (counts[genre] || 0) + 1;
    }
  }
  if (Object.keys(counts).length === 0) return null;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Compte les animés par statut.
 */
export function getStatusCounts(library) {
  const result = { watching: 0, completed: 0, planToWatch: 0, total: 0 };
  if (!library || library.length === 0) return result;
  for (const entry of library) {
    result.total++;
    if (entry.status === 'WATCHING') result.watching++;
    else if (entry.status === 'COMPLETED') result.completed++;
    else if (entry.status === 'PLAN_TO_WATCH') result.planToWatch++;
  }
  return result;
}

/**
 * Retourne l'animé avec la note la plus haute.
 * En cas d'égalité, retourne le plus récemment ajouté.
 * Retourne null si la library est vide ou si aucun animé n'est noté.
 */
export function getFavoriteAnime(library) {
  if (!library || library.length === 0) return null;
  const rated = library.filter(e => e.rating > 0);
  if (rated.length === 0) return null;
  return rated.reduce((best, entry) => {
    if (entry.rating > best.rating) return entry;
    if (entry.rating === best.rating) {
      return new Date(entry.addedAt) > new Date(best.addedAt) ? entry : best;
    }
    return best;
  });
}

/**
 * Retourne la liste de tous les animés partageant la note maximale de la library (ex: tous les 10/10).
 */
export function getFavoriteAnimes(library) {
  if (!library || library.length === 0) return [];
  const rated = library.filter(e => e.rating > 0);
  if (rated.length === 0) return [];
  const maxRating = Math.max(...rated.map(e => e.rating));
  return rated.filter(e => e.rating === maxRating);
}

/**
 * Retourne les animés en cours de visionnage.
 */
export function getWatchingAnime(library) {
  if (!library) return [];
  return library.filter(e => e.status === 'WATCHING');
}

/**
 * Filtre la library par statut.
 */
export function getLibraryByStatus(library, status) {
  if (!library) return [];
  return library.filter(e => e.status === status);
}

// ── Helper: Extraire toutes les clés de racine de franchise d'une entrée (Anglais, Romaji, UserPreferred)
function getFranchiseKeys(entry) {
  const anime = entry.anime_data || entry.anime || {};
  const titles = [
    entry.title,
    anime.title?.english,
    anime.title?.romaji,
    anime.title?.userPreferred,
  ].filter(Boolean);

  const clean = (t) => {
    if (typeof t !== 'string') return '';
    return t
      .replace(/:\s*.*$/, '') // Supprime les sous-titres après ':' (ex: Demon Slayer: Entertainment District Arc -> Demon Slayer)
      .replace(/\s*-\s*.*$/, '') // Supprime les sous-titres après '-' (ex: Kaguya-sama - Ultra Romantic -> Kaguya-sama)
      .replace(/\s*(?:season\s*\d+|part\s*\d+|\d+(?:st|nd|rd|th)\s*season|final\s*season|cour\s*\d+|the\s*final\s*chapters?|movie|ova|ona|special|specials).*/i, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Ne garder que alphanumérique (ex: "attackontitan")
      .trim();
  };

  const keys = new Set();
  titles.forEach(t => {
    const c = clean(t);
    if (c.length >= 3) keys.add(c);
  });

  return Array.from(keys);
}

// ── Helper: Date de début au format numérique pour tri (YYYYMMDD)
function getStartDateVal(entry) {
  const anime = entry.anime_data || entry.anime || entry;
  const start = anime.startDate || {};
  if (start.year) {
    const m = String(start.month || 1).padStart(2, '0');
    const d = String(start.day || 1).padStart(2, '0');
    return Number(`${start.year}${m}${d}`);
  }
  if (anime.seasonYear) {
    return anime.seasonYear * 10000;
  }
  return 99999999;
}

/**
 * Trie la library avec support du regroupement par Saga + Tri secondaire.
 * sortKey: 'rating' | 'title' | 'addedAt' | 'progress' | 'status'
 * isGroupedByFranchise: boolean (si true, regroupe par saga et classe chronologiquement S1 -> S2 -> S3...)
 */
export function sortLibraryBy(library, sortKey, isGroupedByFranchise = false) {
  if (!library || library.length === 0) return [];

  // Helper de comparaison de deux entrées pour un critère donné
  const compareEntriesByKey = (a, b, key) => {
    switch (key) {
      case 'rating':
        if (a.rating === 0 && b.rating > 0) return 1;
        if (b.rating === 0 && a.rating > 0) return -1;
        if (b.rating !== a.rating) return b.rating - a.rating;
        return new Date(b.updatedAt || b.addedAt || 0) - new Date(a.updatedAt || a.addedAt || 0);

      case 'addedAt':
        return new Date(b.updatedAt || b.addedAt || 0) - new Date(a.updatedAt || a.addedAt || 0);

      case 'progress': {
        const progA = a.totalEpisodes > 0 ? (a.episodesWatched / a.totalEpisodes) : 0;
        const progB = b.totalEpisodes > 0 ? (b.episodesWatched / b.totalEpisodes) : 0;
        if (progB !== progA) return progB - progA;
        return (a.title || '').localeCompare(b.title || '', 'fr', { sensitivity: 'base' });
      }

      case 'title':
      default:
        return (a.title || '').localeCompare(b.title || '', 'fr', { sensitivity: 'base' });
    }
  };

  // ── OPTION : REGROUPEMENT PAR SAGA & CHRONOLOGIE (S1, S2, S3...) ──
  if (isGroupedByFranchise) {
    // Regroupement par clés partagées (Graph-based Franchise Clustering)
    const groups = []; // [{ mainKey, items: [] }]

    library.forEach(entry => {
      const entryKeys = getFranchiseKeys(entry);
      let targetGroup = null;

      // Chercher si l'entrée partage une clé de racine avec un groupe existant
      for (const group of groups) {
        if (group.keys.some(k => entryKeys.includes(k))) {
          targetGroup = group;
          break;
        }
      }

      if (targetGroup) {
        targetGroup.items.push(entry);
        entryKeys.forEach(k => targetGroup.keys.push(k));
      } else {
        const primaryTitle = entry.title || entry.anime_data?.title?.english || entry.anime_data?.title?.romaji || 'Autre';
        groups.push({
          primaryTitle,
          keys: [...entryKeys],
          items: [entry],
        });
      }
    });

    // 1. Au sein de CHAQUE SAGA : Les saisons sont 100% indivisibles et triées chronologiquement (S1 -> S2 -> S3)
    groups.forEach(group => {
      group.items.sort((a, b) => {
        const dateA = getStartDateVal(a);
        const dateB = getStartDateVal(b);
        if (dateA !== dateB) return dateA - dateB;
        return (a.title || '').localeCompare(b.title || '', 'fr', { sensitivity: 'base' });
      });

      // Meilleure entrée de la saga pour classer la saga par rapport aux autres sagas
      group.bestEntry = group.items.reduce((best, cur) => {
        if (!best) return cur;
        return compareEntriesByKey(cur, best, sortKey) < 0 ? cur : best;
      }, null);
    });

    // 2. Classer les SAGAS (blocs complets) entre elles selon le critère de tri sélectionné (Note, Récents, A-Z...)
    groups.sort((gA, gB) => compareEntriesByKey(gA.bestEntry, gB.bestEntry, sortKey));

    // 3. Aplatir la liste finale : chaque saga reste 100% groupée et ininterrompue !
    return groups.flatMap(g => g.items);
  }

  // ── TRI CLASSIQUE PAR CLÉ UNIQUE ──
  const copy = [...library];
  return copy.sort((a, b) => compareEntriesByKey(a, b, sortKey));
}

/**
 * Recherche dans la library par titre (insensible à la casse).
 */
export function searchInLibrary(library, query) {
  if (!library || !query) return library || [];
  const q = query.toLowerCase().trim();
  return library.filter(e =>
    (e.title || '').toLowerCase().includes(q)
  );
}
