import fs from 'fs';
import path from 'path';

const OUT_PATH = path.resolve('src/data/imported_backup.json');
const currentList = JSON.parse(fs.readFileSync(OUT_PATH, 'utf-8'));
const BACKUP_DIR = path.resolve('public/anime backup');

const MISSING_8 = [
  { rawTitle: "THE GIRL DOWNSTAIRS", query: "The Girl Downstairs", rating: 8.75, status: "COMPLETED" },
  { rawTitle: "The high school of the dead", query: "Highschool of the Dead", rating: 8, status: "WATCHING" },
  { rawTitle: "Beheneko", query: "S-Rank Monster", rating: 0, status: "PLAN_TO_WATCH" },
  { rawTitle: "Akame ga Kill!", query: "Akame ga Kill!", rating: 0, status: "PLAN_TO_WATCH" },
  { rawTitle: "Our dating story", query: "Our Dating Story", rating: 0, status: "PLAN_TO_WATCH" },
  { rawTitle: "Hinamizawa, le village maudit", query: "Higurashi", rating: 0, status: "PLAN_TO_WATCH" },
  { rawTitle: "Kubo Won't Let Me Be Invisible", query: "Kubo-san", rating: 0, status: "PLAN_TO_WATCH" },
  { rawTitle: "Toradora", query: "Toradora", rating: 0, status: "PLAN_TO_WATCH" }
];

function getMarkdownNote(rawTitle) {
  const files = fs.readdirSync(BACKUP_DIR);
  const targetFile = files.find(f => f.toLowerCase().includes(rawTitle.toLowerCase()) && f.endsWith('.md'));
  if (!targetFile) return '';
  const content = fs.readFileSync(path.join(BACKUP_DIR, targetFile), 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const textLines = lines.filter(line => 
    !line.startsWith('#') && !line.startsWith('Avancement') && !line.startsWith('Note:') && !line.startsWith('![')
  );
  return textLines.join('\n');
}

async function fetchAniList(queryTerm) {
  const query = `
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        id
        title { romaji english native userPreferred }
        coverImage { extraLarge large medium color }
        bannerImage format episodes duration status season seasonYear averageScore genres description(asHtml: false)
      }
    }
  `;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { search: queryTerm } }),
      });
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 4000));
        continue;
      }
      if (!res.ok) return null;
      const json = await res.json();
      return json.data?.Media || null;
    } catch (err) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  return null;
}

async function main() {
  console.log('🔄 Finalisation des 8 animés restants...');

  for (const item of MISSING_8) {
    if (currentList.some(e => e.title.toLowerCase().includes(item.query.toLowerCase()))) continue;

    console.log(`FETCH: "${item.rawTitle}"...`);
    const media = await fetchAniList(item.query);
    await new Promise(r => setTimeout(r, 1500));

    if (media) {
      const totalEps = media.episodes || 12;
      const watchedEps = item.status === 'COMPLETED' ? totalEps : (item.status === 'WATCHING' ? Math.floor(totalEps * 0.75) : 0);
      const personalNote = getMarkdownNote(item.rawTitle);

      currentList.push({
        animeId: media.id,
        title: media.title.userPreferred || media.title.english || item.rawTitle,
        coverImage: media.coverImage.extraLarge || media.coverImage.large,
        bannerImage: media.bannerImage || media.coverImage.extraLarge,
        status: item.status,
        rating: item.rating,
        episodesWatched: watchedEps,
        totalEpisodes: totalEps,
        notes: personalNote,
        updatedAt: new Date().toISOString(),
        anime: media
      });
      console.log(`✅ Ajouté: ${media.title.userPreferred}`);
    }
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(currentList, null, 2), 'utf-8');
  console.log(`🎉 TOUT EST PRÊT ! TOTAL FINAL: ${currentList.length} animés dans src/data/imported_backup.json !`);
}

main();
