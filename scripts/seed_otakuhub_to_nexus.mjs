import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://driffcolpuawsdjdgymj.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyaWZmY29scHVhd3NkamRneW1qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1NTk5NSwiZXhwIjoyMDg1NDMxOTk1fQ.ElBAYh7Luz8JyVKTPlUYBtRWjvmnLYRQCU3ZrlQJwm0";
const USER_ID = "e40b3ec3-9550-47a4-9d92-122b5f7ffff8"; // fakifu67@gmail.com

async function run() {
  console.log("🚀 Début de la migration des animés vers NexusOS Supabase...");
  const backupPath = path.join(__dirname, '../src/data/imported_backup.json');
  
  if (!fs.existsSync(backupPath)) {
    console.error("❌ Fichier de sauvegarde introuvable:", backupPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(backupPath, 'utf-8');
  const items = JSON.parse(raw);
  console.log(`📦 ${items.length} animés trouvés dans le backup local.`);

  const payload = items.map(entry => ({
    user_id: USER_ID,
    anime_id: entry.animeId,
    status: entry.status || 'PLAN_TO_WATCH',
    episodes_watched: entry.episodesWatched || 0,
    total_episodes: entry.totalEpisodes || 0,
    rating: Math.round(Number(entry.rating) || 0),
    notes: entry.notes || '',
    anime_data: entry.anime || {},
    updated_at: entry.updatedAt || new Date().toISOString(),
    added_at: entry.addedAt || new Date().toISOString()
  }));

  const response = await fetch(`${SUPABASE_URL}/rest/v1/otakuhub_library`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Erreur HTTP ${response.status}:`, errorText);
    process.exit(1);
  }

  console.log(`✅ Succès ! ${payload.length} animés synchronisés avec succès dans la base NexusOS.`);
}

run();
