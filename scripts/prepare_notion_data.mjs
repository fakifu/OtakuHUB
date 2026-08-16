import fs from 'fs';
import path from 'path';

const BACKUP_DIR = path.resolve('public/anime backup');

const ANIME_NOTION_LIST = [
  { rawTitle: "86 EIGHTY SIX", query: "86", rating: 10, status: "COMPLETED" },
  { rawTitle: "Cyberpunk : Edgerunners", query: "Cyberpunk: Edgerunners", rating: 10, status: "COMPLETED" },
  { rawTitle: "Re:Zero", query: "Re:Zero", rating: 8.5, status: "COMPLETED" },
  { rawTitle: "Solo Leveling", query: "Solo Leveling", rating: 8, status: "COMPLETED" },
  { rawTitle: "Moshoku Tensei", query: "Mushoku Tensei", rating: 10, status: "WATCHING" },
  { rawTitle: "Dandadan", query: "Dandadan", rating: 9, status: "WATCHING" },
  { rawTitle: "Engage Kiss", query: "Engage Kiss", rating: 8.25, status: "COMPLETED" },
  { rawTitle: "Hajimete No Gal", query: "Hajimete No Gal", rating: 8, status: "COMPLETED" },
  { rawTitle: "Failure Frame", query: "Failure Frame", rating: 7.25, status: "WATCHING" },
  { rawTitle: "Giji harem", query: "Giji Harem", rating: 8.75, status: "COMPLETED" },
  { rawTitle: "Chillin' in Another World with Level 2 Super Cheat Powers", query: "Chillin' in Another World with Level 2 Super Cheat Powers", rating: 7.25, status: "WATCHING" },
  { rawTitle: "Akashic Records of bastard magic instructor", query: "Akashic Records of Bastard Magic Instructor", rating: 7.75, status: "WATCHING" },
  { rawTitle: "Maoyuu maou yuusha", query: "Maoyu", rating: 7, status: "WATCHING" },
  { rawTitle: "couple of cuckoos", query: "A Couple of Cuckoos", rating: 7, status: "WATCHING" },
  { rawTitle: "Full Dive", query: "Full Dive", rating: 4, status: "COMPLETED" },
  { rawTitle: "Tonikaku kawaii", query: "Tonikaku Kawaii", rating: 7.25, status: "COMPLETED" },
  { rawTitle: "My Dress-Up Darling", query: "My Dress-Up Darling", rating: 9.25, status: "WATCHING" },
  { rawTitle: "Love, Chunibyo & Other Delusions", query: "Love, Chunibyo & Other Delusions", rating: 9, status: "COMPLETED" },
  { rawTitle: "My Stepmom's Daughter Is My Ex", query: "My Stepmom's Daughter Is My Ex", rating: 8.5, status: "COMPLETED" },
  { rawTitle: "Mother of the Goddess' Dormitory", query: "Mother of the Goddess' Dormitory", rating: 8.5, status: "COMPLETED" },
  { rawTitle: "Roshidere", query: "Alya Sometimes Hides Her Feelings in Russian", rating: 7.25, status: "WATCHING" },
  { rawTitle: "The rising of the shield hero", query: "The Rising of the Shield Hero", rating: 7, status: "COMPLETED" },
  { rawTitle: "Arifureta", query: "Arifureta", rating: 7.5, status: "WATCHING" },
  { rawTitle: "Harem in the labyrinth of another world", query: "Harem in the Labyrinth of Another World", rating: 8, status: "WATCHING" },
  { rawTitle: "how not to reincarnate a demon king from another world", query: "How NOT to Summon a Demon Lord", rating: 6.5, status: "COMPLETED" },
  { rawTitle: "Nisekoi", query: "Nisekoi", rating: 8, status: "WATCHING" },
  { rawTitle: "THE ANGEL NEXT DOOR SPOILS ME ROTTEN", query: "The Angel Next Door Spoils Me Rotten", rating: 8.5, status: "WATCHING" },
  { rawTitle: "THE GIRL DOWNSTAIRS", query: "The Girl Downstairs", rating: 8.75, status: "COMPLETED" },
  { rawTitle: "Hell's Paradise", query: "Jigokuraku", rating: 9.75, status: "WATCHING" },
  { rawTitle: "The Dangers in My Heart", query: "The Dangers in My Heart", rating: 8.75, status: "COMPLETED" },
  { rawTitle: "The high school of the dead", query: "Highschool of the Dead", rating: 8, status: "WATCHING" },
  { rawTitle: "The eminence in shadow", query: "The Eminence in Shadow", rating: 7, status: "WATCHING" },
  { rawTitle: "Loving Yamada at LV999", query: "Loving Yamada at Lv999!", rating: 6, status: "WATCHING" },
  { rawTitle: "DEMON SLAYER", query: "Demon Slayer: Kimetsu no Yaiba", rating: 8.5, status: "WATCHING" },
  { rawTitle: "TENGOW DAIMAKYOU", query: "Heavenly Delusion", rating: 8, status: "WATCHING" },
  { rawTitle: "THE IRREGULAR AT MAGIC HIGH SCHOOL", query: "The Irregular at Magic High School", rating: 7, status: "WATCHING" },
  { rawTitle: "I Made Friends with the Second Prettiest Girl in My Class", query: "I Made Friends with the Second Prettiest Girl in My Class", rating: 8.5, status: "COMPLETED" },
  { rawTitle: "The Dreaming Boy Is a Realist", query: "The Dreaming Boy Is a Realist", rating: 7, status: "COMPLETED" },
  { rawTitle: "The Fragrant Flower Blooms with Dignity", query: "The Fragrant Flower Blooms with Dignity", rating: 7, status: "COMPLETED" },
  { rawTitle: "Chivalry of a Failed Knight", query: "Chivalry of a Failed Knight", rating: 7.5, status: "COMPLETED" },
  { rawTitle: "Mobile Suit Gundam the Witch from Mercury", query: "Mobile Suit Gundam: The Witch from Mercury", rating: 9.75, status: "COMPLETED" },
  { rawTitle: "Trapped in a Dating Sim", query: "Trapped in a Dating Sim: The World of Otome Games is Tough for Mobs", rating: 6.5, status: "COMPLETED" },
  { rawTitle: "You thought there is never a girl online", query: "And You Thought There Is Never a Girl Online?", rating: 7, status: "COMPLETED" },
  { rawTitle: "The Case Study of Vanitas", query: "Vanitas no Carte", rating: 0, status: "PLAN_TO_WATCH" },
  { rawTitle: "ORESUKI Are you the only one who loves me ?", query: "Oresuki", rating: 0, status: "PLAN_TO_WATCH" },
  { rawTitle: "To Your Eternity", query: "Fumetsu no Anata e", rating: 0, status: "PLAN_TO_WATCH" },
  { rawTitle: "Science Fell in Love, So I Tried to Prove It", query: "Science Fell in Love, So I Tried to Prove It", rating: 0, status: "PLAN_TO_WATCH" },
  { rawTitle: "My Happy Marriage", query: "My Happy Marriage", rating: 0, status: "PLAN_TO_WATCH" },
  { rawTitle: "The Testament of Sister New Devil", query: "The Testament of Sister New Devil", rating: 0, status: "PLAN_TO_WATCH" },
  { rawTitle: "Monogatari Series", query: "Bakemonogatari", rating: 0, status: "PLAN_TO_WATCH" },
  { rawTitle: "Peter Grill and the Philosopher's Time", query: "Peter Grill and the Philosopher's Time", rating: 0, status: "PLAN_TO_WATCH" },
  { rawTitle: "The Demon Sword Master of Excalibur Academy", query: "The Demon Sword Master of Excalibur Academy", rating: 0, status: "PLAN_TO_WATCH" },
  { rawTitle: "Tenpuru", query: "Tenpuru", rating: 0, status: "PLAN_TO_WATCH" },
  { rawTitle: "Maburaho", query: "Maburaho", rating: 0, status: "PLAN_TO_WATCH" },
  { rawTitle: "The Hidden Dungeon Only I Can Enter", query: "The Hidden Dungeon Only I Can Enter", rating: 0, status: "PLAN_TO_WATCH" },
  { rawTitle: "My Life as Inukai-san's Dog", query: "My Life as Inukai-san's Dog", rating: 0, status: "PLAN_TO_WATCH" },
  { rawTitle: "Beheneko", query: "S-Rank Monster", rating: 0, status: "PLAN_TO_WATCH" },
  { rawTitle: "Akame ga Kill!", query: "Akame ga Kill!", rating: 0, status: "PLAN_TO_WATCH" },
  { rawTitle: "Our dating story", query: "Our Dating Story", rating: 0, status: "PLAN_TO_WATCH" },
  { rawTitle: "Hinamizawa, le village maudit", query: "Higurashi", rating: 0, status: "PLAN_TO_WATCH" },
  { rawTitle: "Kubo Won't Let Me Be Invisible", query: "Kubo-san", rating: 0, status: "PLAN_TO_WATCH" },
  { rawTitle: "Toradora", query: "Toradora", rating: 0, status: "PLAN_TO_WATCH" },
  { rawTitle: "Yosuga no Sora", query: "Yosuga no Sora", rating: 0, status: "PLAN_TO_WATCH" }
];

function getMarkdownNote(rawTitle) {
  const files = fs.readdirSync(BACKUP_DIR);
  const targetFile = files.find(f => f.toLowerCase().includes(rawTitle.toLowerCase()) && f.endsWith('.md'));
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

async function fetchAniList(queryTerm) {
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

  for (let attempt = 1; attempt <= 3; attempt++) {
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
        console.warn(`⏳ Rate-limit pour "${queryTerm}". Pause de 4s...`);
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
  console.log(`🚀 Génération complète du fichier JSON de sauvegarde (${ANIME_NOTION_LIST.length} animés)...`);

  const results = [];

  for (let i = 0; i < ANIME_NOTION_LIST.length; i++) {
    const item = ANIME_NOTION_LIST[i];
    console.log(`[${i + 1}/${ANIME_NOTION_LIST.length}] AniList: "${item.query}"...`);

    const media = await fetchAniList(item.query);
    await new Promise(r => setTimeout(r, 700));

    if (!media) {
      console.warn(`⚠️ Non trouvé: "${item.query}"`);
      continue;
    }

    const personalNote = getMarkdownNote(item.rawTitle);
    const totalEps = media.episodes || 12;
    const watchedEps = item.status === 'COMPLETED' ? totalEps : (item.status === 'WATCHING' ? Math.floor(totalEps * 0.75) : 0);

    results.push({
      animeId: media.id,
      title: media.title.userPreferred || media.title.english || media.title.romaji || item.rawTitle,
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
  }

  const outPath = path.resolve('src/data/imported_backup.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`🎉 TOUT EST PRÊT ! ${results.length} animés enregistrés dans src/data/imported_backup.json !`);
}

main();
