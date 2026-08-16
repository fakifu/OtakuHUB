import fs from 'fs';
import path from 'path';

const OUT_PATH = path.resolve('src/data/imported_backup.json');
const currentList = JSON.parse(fs.readFileSync(OUT_PATH, 'utf-8'));
const BACKUP_DIR = path.resolve('public/anime backup');

const REMAINING = [
  { rawTitle: "I Made Friends with the Second Prettiest Girl in My Class", query: "Second Prettiest Girl", rating: 8.5, status: "COMPLETED" },
  { rawTitle: "The Dreaming Boy Is a Realist", query: "Yumemiru Otoko", rating: 7, status: "COMPLETED" },
  { rawTitle: "The Fragrant Flower Blooms with Dignity", query: "Kaoru Hana wa Rin to Saku", rating: 7, status: "COMPLETED" },
  { rawTitle: "Chivalry of a Failed Knight", query: "Rakudai Kishi no Cavalry", rating: 7.5, status: "COMPLETED" },
  { rawTitle: "Mobile Suit Gundam the Witch from Mercury", query: "Gundam Witch from Mercury", rating: 9.75, status: "COMPLETED" }
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
  console.log('🔄 Récupération des 5 derniers animés...');

  for (const item of REMAINING) {
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
  console.log(`🎉 IMPORTATION 100% COMPLETÉE ! TOTAL FINAL: ${currentList.length} animés dans src/data/imported_backup.json !`);
}

main();
