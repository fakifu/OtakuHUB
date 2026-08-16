import fs from 'fs';
import path from 'path';

const BACKUP_DIR = path.resolve('public/anime backup');

// Aliases pour corriger les titres de la sauvegarde et garantir une correspondance 100% exacte sur AniList
const TITLE_ALIASES = {
  'moshoku tensei': 'Mushoku Tensei',
  '86 eighty six': '86',
  'roshidere': 'Alya Sometimes Hides Her Feelings in Russian',
  'tengow daimakyou': 'Tengoku Daimakyou',
  'how not to reincarnate a demon king from another world': 'How NOT to Summon a Demon Lord',
  'the girl downstairs': 'The Girl Downstairs',
  'the high school of the dead': 'Highschool of the Dead',
  'the irregular at magic high school': 'The Irregular at Magic High School',
  'hinamizawa, le village maudit': 'Higurashi When They Cry',
  'couple of cuckoos': 'A Couple of Cuckoos',
  'cyberpunk : edgerunners': 'Cyberpunk: Edgerunners'
};

function cleanTitle(str) {
  if (!str) return '';
  return str.replace(/^["'\s]+|["'\s]+$/g, '').trim();
}

// Parser Markdown pour extraire les notes rédigées
function parseMarkdownNotes() {
  const notesMap = new Map();
  const files = fs.readdirSync(BACKUP_DIR);
  
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    
    const titlePart = file.replace(/\s+[a-f0-9]{32}\.md$/i, '').replace(/\.md$/, '').trim();
    if (!titlePart || titlePart === 'Untitled') continue;

    const content = fs.readFileSync(path.join(BACKUP_DIR, file), 'utf-8');
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);

    const textLines = lines.filter(line => 
      !line.startsWith('#') && 
      !line.startsWith('Avancement') && 
      !line.startsWith('Note:') && 
      !line.startsWith('![')
    );

    if (textLines.length > 0) {
      notesMap.set(titlePart.toLowerCase(), textLines.join('\n'));
    }
  }
  return notesMap;
}

// Parser CSV robuste gérant les saut de lignes entre guillemets
function parseFullCSV() {
  const csvFile = fs.readdirSync(BACKUP_DIR).find(f => f.endsWith('.csv') && !f.includes('_all'));
  if (!csvFile) throw new Error('Fichier CSV introuvable');

  const content = fs.readFileSync(path.join(BACKUP_DIR, csvFile), 'utf-8');
  
  const entries = [];
  let currentToken = '';
  let inQuotes = false;
  let row = [];

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(currentToken.trim());
      currentToken = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && content[i + 1] === '\n') {
        i++;
      }
      row.push(currentToken.trim());
      currentToken = '';
      if (row.some(Boolean)) {
        entries.push(row);
      }
      row = [];
    } else {
      currentToken += char;
    }
  }
  if (currentToken || row.length > 0) {
    row.push(currentToken.trim());
    entries.push(row);
  }

  const items = [];
  for (let i = 1; i < entries.length; i++) {
    const cols = entries[i];
    if (!cols || cols.length === 0) continue;

    const rawTitle = cleanTitle(cols[0]);
    if (!rawTitle || rawTitle === "L'anime") continue;

    const rawNote = cols[1] ? parseFloat(cols[1].replace(',', '.')) : null;
    const rawAdv = cols[2] ? cols[2].toLowerCase() : '';

    let status = 'COMPLETED';
    if (rawAdv.includes('a voir') && !rawAdv.includes('vu')) {
      status = 'PLAN_TO_WATCH';
    } else if (rawAdv.includes('attente') || rawAdv.includes('suite ?')) {
      status = 'WATCHING';
    } else if (rawAdv.includes('vu')) {
      status = 'COMPLETED';
    } else {
      status = rawNote ? 'COMPLETED' : 'PLAN_TO_WATCH';
    }

    items.push({
      title: rawTitle,
      rating: isNaN(rawNote) ? 0 : (rawNote || 0),
      status: status,
      rawAdv: cols[2] || '',
    });
  }

  return items;
}

// Requete AniList GraphQL avec retry automatique si rate limit (429)
async function fetchAniListWithRetry(searchTitle, retries = 3, delayMs = 1500) {
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

  const queryTerm = TITLE_ALIASES[searchTitle.toLowerCase()] || searchTitle;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ query, variables: { search: queryTerm } }),
      });

      if (res.status === 429) {
        console.warn(`⏳ Rate-limit AniList atteint pour "${queryTerm}". Pause de 2 secondes (Tentative ${attempt}/${retries})...`);
        await new Promise(r => setTimeout(r, 2000 * attempt));
        continue;
      }

      if (!res.ok) return null;
      const json = await res.json();
      return json.data?.Media || null;
    } catch (err) {
      console.error(`Erreur AniList (${attempt}/${retries}) pour "${queryTerm}":`, err.message);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  return null;
}

async function main() {
  console.log('🚀 Démarrage du script d\'importation optimisé...');

  const notesMap = parseMarkdownNotes();
  const csvEntries = parseFullCSV();

  console.log(`📋 ${csvEntries.length} animés uniques extraits du CSV.`);
  console.log(`📝 ${notesMap.size} critiques personnelles chargées.`);

  const importedList = [];
  const failedTitles = [];

  for (let i = 0; i < csvEntries.length; i++) {
    const entry = csvEntries[i];
    console.log(`[${i + 1}/${csvEntries.length}] Interrogation AniList: "${entry.title}" (Note: ${entry.rating}/10, Statut: ${entry.status})...`);

    const animeData = await fetchAniListWithRetry(entry.title);
    
    // Pause de 600ms entre les requêtes pour respecter scrupuleusement la limite AniList (90 req/min)
    await new Promise(resolve => setTimeout(resolve, 600));

    if (!animeData) {
      console.warn(`❌ ÉCHEC: Anime introuvable sur AniList: "${entry.title}"`);
      failedTitles.push(entry.title);
      continue;
    }

    // Récupérer la note markdown personnelle
    let noteText = notesMap.get(entry.title.toLowerCase()) || '';
    if (!noteText) {
      for (const [key, value] of notesMap.entries()) {
        if (key.includes(entry.title.toLowerCase()) || entry.title.toLowerCase().includes(key)) {
          noteText = value;
          break;
        }
      }
    }

    const totalEps = animeData.episodes || 12;
    const watchedEps = entry.status === 'COMPLETED' ? totalEps : (entry.status === 'WATCHING' ? Math.floor(totalEps * 0.75) : 0);

    const formattedEntry = {
      animeId: animeData.id,
      title: animeData.title.userPreferred || animeData.title.english || animeData.title.romaji || entry.title,
      coverImage: animeData.coverImage.extraLarge || animeData.coverImage.large,
      bannerImage: animeData.bannerImage || animeData.coverImage.extraLarge,
      status: entry.status,
      rating: entry.rating,
      episodesWatched: watchedEps,
      totalEpisodes: totalEps,
      notes: noteText,
      updatedAt: new Date().toISOString(),
      anime: animeData
    };

    importedList.push(formattedEntry);
  }

  console.log(`\n🎉 SUCCÈS COMPLET: ${importedList.length} / ${csvEntries.length} animés importés !`);
  if (failedTitles.length > 0) {
    console.log(`⚠️ Titres échoués (${failedTitles.length}):`, failedTitles);
  }

  const outDir = path.resolve('src/data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outDir, 'imported_backup.json'),
    JSON.stringify(importedList, null, 2),
    'utf-8'
  );

  console.log(`💾 Fichier de sauvegarde généré avec succès: src/data/imported_backup.json !`);
}

main();
