import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OLD_URL = "https://brtalmhcehpxiolxpsvc.supabase.co";
const OLD_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJydGFsbWhjZWhweGlvbHhwc3ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MDI4MzcsImV4cCI6MjEwMjM3ODgzN30.J8_kU9t5hJ3zBOC6PAJ25Yzf_fwXjBHg_DjDslR1Tm4";

const NEW_URL = "https://driffcolpuawsdjdgymj.supabase.co";
const NEW_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyaWZmY29scHVhd3NkamRneW1qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1NTk5NSwiZXhwIjoyMDg1NDMxOTk1fQ.ElBAYh7Luz8JyVKTPlUYBtRWjvmnLYRQCU3ZrlQJwm0";
const NEW_USER_ID = "e40b3ec3-9550-47a4-9d92-122b5f7ffff8"; // fakifu67@gmail.com sur NexusOS

async function run() {
  console.log("⏳ Test de connexion à l'ancien Supabase...");
  
  let oldData = null;
  try {
    const res = await fetch(`${OLD_URL}/rest/v1/otakuhub_library?select=*`, {
      headers: {
        'apikey': OLD_ANON_KEY,
        'Authorization': `Bearer ${OLD_ANON_KEY}`
      }
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`❌ Réponse de l'ancien Supabase (${res.status}): ${err}`);
      console.log("ℹ️ Si le projet est encore en cours de réactivation sur le dashboard, attends 1 minute et relance.");
      return;
    }

    oldData = await res.json();
  } catch (err) {
    console.error("❌ Impossible de contacter l'ancien Supabase pour le moment:", err.message);
    console.log("ℹ️ Vérifie sur https://supabase.com/dashboard si la restauration est terminée.");
    return;
  }

  console.log(`📦 ${oldData.length} animés récupérés depuis l'ancienne base !`);

  // Sauvegarder un export JSON brut par sécurité
  const backupDump = path.join(__dirname, `../src/data/recovered_old_supabase_${Date.now()}.json`);
  fs.writeFileSync(backupDump, JSON.stringify(oldData, null, 2));
  console.log(`💾 Dump de sécurité sauvegardé dans: ${backupDump}`);

  // Préparer pour injection dans le nouveau Supabase NexusOS
  const payload = oldData.map(item => ({
    user_id: NEW_USER_ID,
    anime_id: item.anime_id,
    status: item.status,
    episodes_watched: item.episodes_watched,
    total_episodes: item.total_episodes,
    rating: item.rating,
    notes: item.notes,
    anime_data: item.anime_data,
    added_at: item.added_at,
    updated_at: item.updated_at
  }));

  console.log(`🚀 Injection de ${payload.length} animés dans la base NexusOS...`);
  const injectRes = await fetch(`${NEW_URL}/rest/v1/otakuhub_library`, {
    method: 'POST',
    headers: {
      'apikey': NEW_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${NEW_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(payload)
  });

  if (!injectRes.ok) {
    const errText = await injectRes.text();
    console.error(`❌ Erreur lors de l'injection: ${errText}`);
    return;
  }

  console.log(`🎉 SUCCÈS TOTAL : Les ${payload.length} animés de l'ancienne base ont été migrés dans NexusOS !`);
}

run();
