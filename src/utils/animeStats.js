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

// ── Helper: Extraire le nom de franchise racine (ex: Attack on Titan Season 2 -> Attack on Titan)
function getFranchiseRoot(rawTitle) {
  if (!rawTitle) return '';
  return rawTitle
    .replace(/\s*(?::\s*)?(?:season\s*\d+|part\s*\d+|\d+(?:st|nd|rd|th)\s*season|final\s*season|cour\s*\d+|the\s*final\s*chapters?|movie|ova|ona|special|specials).*/i, '')
    .trim() || rawTitle;
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
 * Trie la library par clé.
 * sortKey: 'rating' | 'title' | 'addedAt' | 'progress' | 'status' | 'chronological'
 */
export function sortLibraryBy(library, sortKey) {
  if (!library) return [];
  const copy = [...library];

  const STATUS_ORDER = { WATCHING: 0, PLAN_TO_WATCH: 1, COMPLETED: 2 };

  switch (sortKey) {
    case 'chronological':
      return copy.sort((a, b) => {
        const titleA = a.title || a.anime_data?.title?.english || a.anime_data?.title?.romaji || a.anime?.title?.english || '';
        const titleB = b.title || b.anime_data?.title?.english || b.anime_data?.title?.romaji || b.anime?.title?.english || '';
        const rootA = getFranchiseRoot(titleA);
        const rootB = getFranchiseRoot(titleB);

        // Si même franchise -> trier par ordre chronologique de sortie (S1 -> S2 -> S3)
        if (rootA.toLowerCase() === rootB.toLowerCase()) {
          const dateA = getStartDateVal(a);
          const dateB = getStartDateVal(b);
          if (dateA !== dateB) return dateA - dateB;
          return titleA.localeCompare(titleB, 'fr', { sensitivity: 'base' });
        }

        // Sinon trier les franchises par ordre alphabétique
        return rootA.localeCompare(rootB, 'fr', { sensitivity: 'base' });
      });

    case 'rating':
      return copy.sort((a, b) => {
        // Les animés non notés (0) vont à la fin
        if (a.rating === 0 && b.rating > 0) return 1;
        if (b.rating === 0 && a.rating > 0) return -1;
        return b.rating - a.rating;
      });

    case 'title':
      return copy.sort((a, b) =>
        (a.title || '').localeCompare(b.title || '', 'fr', { sensitivity: 'base' })
      );

    case 'addedAt':
      return copy.sort((a, b) =>
        new Date(b.addedAt || 0) - new Date(a.addedAt || 0)
      );

    case 'progress':
      return copy.sort((a, b) => {
        const progA = a.totalEpisodes > 0 ? (a.episodesWatched / a.totalEpisodes) : 0;
        const progB = b.totalEpisodes > 0 ? (b.episodesWatched / b.totalEpisodes) : 0;
        return progB - progA;
      });

    case 'status':
      return copy.sort((a, b) =>
        (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
      );

    default:
      return copy;
  }
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
