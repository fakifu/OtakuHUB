import fs from 'fs';
import path from 'path';

const BACKUP_DIR = path.resolve('public/anime backup');

// 1. Lire la note markdown d'un animé
function getMarkdownNote(animeName) {
  const files = fs.readdirSync(BACKUP_DIR);
  const targetFile = files.find(f => f.toLowerCase().includes(animeName.toLowerCase()) && f.endsWith('.md'));
  
  if (!targetFile) return '';
  
  const content = fs.readFileSync(path.join(BACKUP_DIR, targetFile), 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);

  const textLines = lines.filter(line => 
    !line.startsWith('#') && 
    !line.startsWith('Avancement') && 
    !line.startsWith('Note:') && 
    !line.startsWith('![')
  );

  return textLines.join('\n');
}

// 2. Interroger AniList pour un animé spécifique
async function fetchAniList(searchQuery) {
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
        averageScore
        genres
        description(asHtml: false)
      }
    }
  `;

  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query, variables: { search: searchQuery } }),
  });

  if (!res.ok) {
    throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
  }

  const json = await res.json();
  return json.data?.Media;
}

async function testOne() {
  const animeTitle = "86 EIGHTY SIX";
  const searchKeyword = "86";
  const noteRating = 10;
  const noteStatus = "COMPLETED";

  console.log(`\n🔍 Test d'importation pour 1 animé : "${animeTitle}"`);

  // A. Extraire la note personnelle du Markdown
  const personalNote = getMarkdownNote("86 EIGHTY SIX");
  console.log(`📝 Critique personnelle trouvée (${personalNote.length} caractères) :`);
  console.log(`   "${personalNote.substring(0, 120)}..."`);

  // B. Interroger AniList
  console.log(`🌐 Recherche AniList pour "${searchKeyword}"...`);
  const media = await fetchAniList(searchKeyword);

  if (!media) {
    console.error("❌ Animé non trouvé sur AniList !");
    return;
  }

  console.log(`✅ Animé trouvé sur AniList !`);
  console.log(`   ID AniList : ${media.id}`);
  console.log(`   Titre Officiel : ${media.title.userPreferred}`);
  console.log(`   Nombre d'épisodes : ${media.episodes}`);
  console.log(`   Image de couverture : ${media.coverImage.extraLarge}`);

  // C. Formater l'entrée OtakuHUB complète
  const importedEntry = {
    animeId: media.id,
    title: media.title.userPreferred || media.title.english || animeTitle,
    coverImage: media.coverImage.extraLarge || media.coverImage.large,
    bannerImage: media.bannerImage || media.coverImage.extraLarge,
    status: noteStatus,
    rating: noteRating,
    episodesWatched: media.episodes || 23,
    totalEpisodes: media.episodes || 23,
    notes: personalNote,
    updatedAt: new Date().toISOString(),
    anime: media
  };

  // D. Écrire le résultat dans src/data/imported_backup.json (contenant cet animé de test)
  const outPath = path.resolve('src/data/imported_backup.json');
  fs.writeFileSync(outPath, JSON.stringify([importedEntry], null, 2), 'utf-8');

  console.log(`\n🎉 SUCCÈS ! 1 animé importé et enregistré dans src/data/imported_backup.json`);
}

testOne();
