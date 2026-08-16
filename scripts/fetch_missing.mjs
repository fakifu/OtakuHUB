import fs from 'fs';
import path from 'path';

const BACKUP_FILE = path.resolve('src/data/imported_backup.json');
const currentList = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));

const MISSING = [
  { title: 'The Case Study of Vanitas', query: 'Vanitas no Carte', rating: 0, status: 'PLAN_TO_WATCH' },
  { title: 'ORESUKI Are you the only one who loves me ?', query: 'Oresuki', rating: 0, status: 'PLAN_TO_WATCH' },
  { title: 'To Your Eternity', query: 'Fumetsu no Anata e', rating: 0, status: 'PLAN_TO_WATCH' },
  { title: 'Moshoku Tensei', query: 'Mushoku Tensei', rating: 10, status: 'WATCHING' },
  { title: 'THE GIRL DOWNSTAIRS', query: 'Lee Doo-Na!', rating: 8.75, status: 'COMPLETED' },
  { title: "Hell's Paradise", query: 'Jigokuraku', rating: 9.75, status: 'WATCHING' },
  { title: 'The Dangers in My Heart', query: 'Boku no Kokoro no Yabai Yatsu', rating: 8.75, status: 'COMPLETED' },
  { title: 'The high school of the dead', query: 'Highschool of the Dead', rating: 8, status: 'WATCHING' },
  { title: 'The eminence in shadow', query: 'Kage no Jitsuryokusha ni Naritakute!', rating: 7, status: 'WATCHING' }
];

async function fetchAniListAnime(queryTerm) {
  const query = `
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        id
        title {
          romaji
          english
          native
          userPreferred
        }
        coverImage {
          extraLarge
          large
          medium
          color
        }
        bannerImage
        format
        episodes
        duration
        status
        season
        seasonYear
        startDate { year month day }
        averageScore
        meanScore
        popularity
        genres
        description(asHtml: false)
        studios(isMain: true) {
          nodes { id name isAnimationStudio }
        }
      }
    }
  `;

  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query, variables: { search: queryTerm } }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.Media || null;
  } catch (err) {
    return null;
  }
}

async function main() {
  console.log('🔄 Récupération complémentaire des 9 animés restants...');

  for (const item of MISSING) {
    console.log(`FETCH: "${item.title}" via "${item.query}"...`);
    const animeData = await fetchAniListAnime(item.query);
    await new Promise(r => setTimeout(r, 1200));

    if (animeData) {
      const totalEps = animeData.episodes || 12;
      const watchedEps = item.status === 'COMPLETED' ? totalEps : (item.status === 'WATCHING' ? Math.floor(totalEps * 0.75) : 0);

      currentList.push({
        animeId: animeData.id,
        title: animeData.title.userPreferred || animeData.title.english || animeData.title.romaji || item.title,
        coverImage: animeData.coverImage.extraLarge || animeData.coverImage.large,
        bannerImage: animeData.bannerImage || animeData.coverImage.extraLarge,
        status: item.status,
        rating: item.rating,
        episodesWatched: watchedEps,
        totalEpisodes: totalEps,
        notes: '',
        updatedAt: new Date().toISOString(),
        anime: animeData
      });
      console.log(`✅ Ajouté: ${animeData.title.userPreferred}`);
    } else {
      console.error(`❌ Échec pour "${item.title}"`);
    }
  }

  fs.writeFileSync(BACKUP_FILE, JSON.stringify(currentList, null, 2), 'utf-8');
  console.log(`🎉 IMPORTATION 100% FINALISÉE ! Total d'animés: ${currentList.length}`);
}

main();
