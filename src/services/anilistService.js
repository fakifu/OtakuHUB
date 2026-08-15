/**
 * AniList GraphQL API Client
 * Endpoint: https://graphql.anilist.co
 * Pas besoin de clé API pour les requêtes publiques.
 * Rate limit: 90 requêtes/minute
 */

const ANILIST_ENDPOINT = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  ? '/api/anilist'
  : 'https://graphql.anilist.co';

// ── Fragments réutilisables ──────────────────────────────────────────────────
const MEDIA_FIELDS = `
  id
  title {
    romaji
    english
    native
  }
  coverImage {
    large
    extraLarge
    color
  }
  bannerImage
  averageScore
  meanScore
  popularity
  favourites
  genres
  episodes
  duration
  status
  season
  seasonYear
  format
  description(asHtml: false)
  studios(isMain: true) {
    nodes {
      name
      isAnimationStudio
    }
  }
  tags {
    name
    rank
    isMediaSpoiler
  }
  nextAiringEpisode {
    episode
    airingAt
    timeUntilAiring
  }
  trailer {
    id
    site
  }
  startDate {
    year
    month
    day
  }
  countryOfOrigin
  isAdult
  source
  rankings {
    id
    rank
    type
    allTime
    context
  }
`;

// ── Utilitaire: Helper saison courante ───────────────────────────────────────
export function getCurrentSeason() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  let season;
  if (month >= 1 && month <= 3) season = 'WINTER';
  else if (month >= 4 && month <= 6) season = 'SPRING';
  else if (month >= 7 && month <= 9) season = 'SUMMER';
  else season = 'FALL';

  return { season, year };
}

// ── Utilitaire: Helper saison suivante ────────────────────────────────────────
export function getNextSeason() {
  const current = getCurrentSeason();
  const SEASONS = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
  const currentIndex = SEASONS.indexOf(current.season);
  
  let nextIndex = (currentIndex + 1) % 4;
  let nextYear = current.year;
  
  if (currentIndex === 3) {
    nextYear += 1;
  }
  
  return { season: SEASONS[nextIndex], year: nextYear };
}

// ── Système de Cache Client (In-Memory + SessionStorage) ─────────────────────
const apiCache = new Map();

function getCachedData(key) {
  if (apiCache.has(key)) {
    return apiCache.get(key);
  }
  try {
    const sessionItem = sessionStorage.getItem(`otakuhub_cache_${key}`);
    if (sessionItem) {
      const parsed = JSON.parse(sessionItem);
      apiCache.set(key, parsed);
      return parsed;
    }
  } catch (e) {
    // Ignore storage errors
  }
  return null;
}

function setCachedData(key, data) {
  if (!data) return;
  apiCache.set(key, data);
  try {
    sessionStorage.setItem(`otakuhub_cache_${key}`, JSON.stringify(data));
  } catch (e) {
    // Ignore quota exceeded or storage errors
  }
}

// ── Système de débogage du nombre de requêtes API ───────────────────────────
let apiStats = {
  total: 0,
  network: 0,
  cached: 0,
};

function notifyStatsUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('anilist-api-stats-updated', { detail: { ...apiStats } }));
  }
}

export function getApiStats() {
  return { ...apiStats };
}

export function resetApiStats() {
  apiStats = { total: 0, network: 0, cached: 0 };
  notifyStatsUpdate();
}

// ── Fetch générique AniList avec Cache ───────────────────────────────────────
export async function fetchAniList(query, variables = {}) {
  const cacheKey = JSON.stringify({ query, variables });
  const cached = getCachedData(cacheKey);
  if (cached) {
    apiStats.total++;
    apiStats.cached++;
    notifyStatsUpdate();
    return cached;
  }

  try {
    apiStats.total++;
    apiStats.network++;
    notifyStatsUpdate();

    const response = await fetch(ANILIST_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
        const msg = `Rate limit AniList atteint. Réessaie dans ${retryAfter}s.`;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'error', message: msg, duration: 6000 } }));
        }
        throw new Error(msg);
      }
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const json = await response.json();

    if (json.errors) {
      console.warn('AniList GraphQL Errors:', json.errors);
      if (!json.data) throw new Error(json.errors[0]?.message || 'Erreur GraphQL AniList');
    }

    setCachedData(cacheKey, json.data);
    return json.data;
  } catch (err) {
    console.error('AniList fetch error:', err);
    throw err;
  }
}

// ── Helper de Pré-tri Intelligent (Animés Principaux TV & Popularité en Premier) ──
function preSortSearchMedia(items, searchQuery) {
  if (!items || !items.length) return [];
  const q = (searchQuery || '').toLowerCase().trim();

  return [...items].sort((a, b) => {
    // 1. Titre identique exact en premier
    const aEn = (a.title?.english || '').toLowerCase();
    const aRo = (a.title?.romaji || '').toLowerCase();
    const bEn = (b.title?.english || '').toLowerCase();
    const bRo = (b.title?.romaji || '').toLowerCase();

    const aExact = aEn === q || aRo === q;
    const bExact = bEn === q || bRo === q;
    if (aExact && !bExact) return -1;
    if (bExact && !aExact) return 1;

    // 2. Priorité de format : TV (Série principale) > MOVIE (Film) > TV_SHORT > OVA/ONA > SPECIAL
    const formatScore = (fmt) => {
      if (fmt === 'TV') return 100;
      if (fmt === 'MOVIE') return 80;
      if (fmt === 'TV_SHORT') return 60;
      if (fmt === 'OVA' || fmt === 'ONA') return 40;
      return 20;
    };

    const aScore = formatScore(a.format);
    const bScore = formatScore(b.format);

    if (aScore !== bScore) {
      return bScore - aScore;
    }

    // 3. Département de la popularité (les animés connus passent avant les OAV obscurs)
    return (b.popularity || 0) - (a.popularity || 0);
  });
}

// ── Recherche d'animés ───────────────────────────────────────────────────────
export async function searchAnime(query, page = 1, perPage = 20) {
  const GQL = `
    query SearchAnime($query: String!, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          hasNextPage
        }
        media(search: $query, type: ANIME, sort: [SEARCH_MATCH, POPULARITY_DESC]) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  const data = await fetchAniList(GQL, { query, page, perPage });
  const rawList = data?.Page?.media || [];
  return preSortSearchMedia(rawList, query);
}

// ── Animés saisonniers ───────────────────────────────────────────────────────
export async function getSeasonalAnime(season, year, page = 1, perPage = 12) {
  // Utiliser la saison courante si non spécifiée
  if (!season || !year) {
    const current = getCurrentSeason();
    season = current.season;
    year = current.year;
  }

  const GQL = `
    query SeasonalAnime($season: MediaSeason!, $year: Int!, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(
          season: $season
          seasonYear: $year
          type: ANIME
          sort: [POPULARITY_DESC]
          isAdult: false
        ) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  const data = await fetchAniList(GQL, { season, year, page, perPage });
  return data?.Page?.media || [];
}

// ── Animés de la saison prochaine (Upcoming) ─────────────────────────
export async function getNextSeasonAnime(page = 1, perPage = 12) {
  const next = getNextSeason();
  return getSeasonalAnime(next.season, next.year, page, perPage);
}

// ── Animés tendance (Trending) ───────────────────────────────────────────────
export async function getTrendingAnime(page = 1, perPage = 12) {
  const GQL = `
    query TrendingAnime($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(
          type: ANIME
          sort: [TRENDING_DESC]
          isAdult: false
        ) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  const data = await fetchAniList(GQL, { page, perPage });
  return data?.Page?.media || [];
}

// ── Détail d'un animé par ID ─────────────────────────────────────────────────
export async function getAnimeById(id) {
  const GQL = `
    query AnimeById($id: Int!) {
      Media(id: $id, type: ANIME) {
        ${MEDIA_FIELDS}
        relations {
          edges {
            relationType
            node {
              id
              title { romaji english userPreferred }
              coverImage { extraLarge large medium }
              type
              format
              status
              startDate { year month day }
              seasonYear
              season
            }
          }
        }
        characters(sort: [ROLE, RELEVANCE], perPage: 6) {
          edges {
            role
            node {
              id
              name { full }
              image { medium }
            }
          }
        }
      }
    }
  `;

  const data = await fetchAniList(GQL, { id });
  const anime = data?.Media || null;

  if (anime && anime.relations?.edges) {
    // Collecter récursivement les préquelles ET séquelles (ex: Saison 2 -> Saison 1 ET Saison 2 -> Saison 3 -> Saison 4 -> Saison 5)
    const visitedIds = new Set([anime.id]);
    anime.relations.edges.forEach(e => {
      if (e.node?.id) visitedIds.add(e.node.id);
    });

    const queue = anime.relations.edges
      .filter(e => (e.relationType === 'PREQUEL' || e.relationType === 'SEQUEL') && e.node?.type === 'ANIME')
      .map(e => e.node.id);

    let depth = 0;
    while (queue.length > 0 && depth < 6) {
      depth++;
      const currentRelatedId = queue.shift();
      try {
        const parentData = await fetchAniList(GQL, { id: currentRelatedId });
        if (parentData?.Media?.relations?.edges) {
          parentData.Media.relations.edges.forEach(parentEdge => {
            const nodeId = parentEdge.node?.id;
            if (nodeId && !visitedIds.has(nodeId) && parentEdge.node?.type === 'ANIME') {
              visitedIds.add(nodeId);
              anime.relations.edges.push(parentEdge);
              if (parentEdge.relationType === 'PREQUEL' || parentEdge.relationType === 'SEQUEL') {
                queue.push(nodeId);
              }
            }
          });
        }
      } catch (err) {
        // Ignorer les erreurs réseau silencieuses
      }
    }
  }

  return anime;
}

// ── Recommandations basées sur un animé ─────────────────────────────────────
export async function getAnimeRecommendations(id) {
  const GQL = `
    query AnimeRecommendations($id: Int!) {
      Media(id: $id, type: ANIME) {
        recommendations(sort: [RATING_DESC], perPage: 10) {
          nodes {
            mediaRecommendation {
              ${MEDIA_FIELDS}
            }
          }
        }
      }
    }
  `;

  try {
    const data = await fetchAniList(GQL, { id });
    const recs = data?.Media?.recommendations?.nodes || [];
    return recs
      .map(n => n?.mediaRecommendation)
      .filter(Boolean);
  } catch (err) {
    console.warn('Recommandations non disponibles:', err);
    return [];
  }
}

// ── Animés populaires de tous les temps ─────────────────────────────────────
export async function getPopularAnime(page = 1, perPage = 12) {
  const GQL = `
    query PopularAnime($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(
          type: ANIME
          sort: [POPULARITY_DESC]
          isAdult: false
        ) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  const data = await fetchAniList(GQL, { page, perPage });
  return data?.Page?.media || [];
}
