import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.resolve('public');
const PWA_DIR = path.resolve('public/assets/pwa');
const SOURCE_TRANSPARENT = path.resolve('public/logo-transparent.png');
const SOURCE_BLACK = path.resolve('public/logo-black.png');

if (!fs.existsSync(PWA_DIR)) {
  fs.mkdirSync(PWA_DIR, { recursive: true });
}

// ── 1. Génération des sous-icônes PWA ──
async function generateIcons() {
  console.log('🖼️ Génération des sous-icônes PWA...');

  // 64x64
  await sharp(SOURCE_BLACK)
    .resize(64, 64)
    .toFile(path.join(PUBLIC_DIR, 'pwa-64x64.png'));

  // Favicon png
  await sharp(SOURCE_BLACK)
    .resize(64, 64)
    .toFile(path.join(PUBLIC_DIR, 'favicon.png'));

  // 192x192
  await sharp(SOURCE_BLACK)
    .resize(192, 192)
    .toFile(path.join(PUBLIC_DIR, 'pwa-192x192.png'));

  // 512x512
  await sharp(SOURCE_BLACK)
    .resize(512, 512)
    .toFile(path.join(PUBLIC_DIR, 'pwa-512x512.png'));

  // Maskable 512x512
  await sharp(SOURCE_BLACK)
    .resize(512, 512)
    .toFile(path.join(PUBLIC_DIR, 'maskable-icon-512x512.png'));

  // Apple touch icon 180x180
  await sharp(SOURCE_BLACK)
    .resize(180, 180)
    .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon-180x180.png'));

  console.log('✅ Sous-icônes générées !');
}

// ── 2. Liste des dimensions Splash Screen iOS ──
const SPLASH_SCREENS = [
  { w: 1290, h: 2796 }, { w: 2796, h: 1290 },
  { w: 1179, h: 2556 }, { w: 2556, h: 1179 },
  { w: 1284, h: 2778 }, { w: 2778, h: 1284 },
  { w: 1170, h: 2532 }, { w: 2532, h: 1170 },
  { w: 1125, h: 2436 }, { w: 2436, h: 1125 },
  { w: 1242, h: 2688 }, { w: 2688, h: 1242 },
  { w: 828, h: 1792 },   { w: 1792, h: 828 },
  { w: 1620, h: 2160 }, { w: 2160, h: 1620 },
  { w: 1668, h: 2388 }, { w: 2388, h: 1668 },
  { w: 2048, h: 2732 }, { w: 2732, h: 2048 }
];

async function generateSplashScreens() {
  console.log('📱 Génération des 20+ Splash Screens iOS...');

  for (const { w, h } of SPLASH_SCREENS) {
    const filename = `apple-splash-${w}-${h}.png`;
    const outputPath = path.join(PWA_DIR, filename);

    // Taille du logo centré (environ 28% de la plus petite dimension)
    const logoSize = Math.round(Math.min(w, h) * 0.28);

    const resizedLogo = await sharp(SOURCE_TRANSPARENT)
      .resize(logoSize, logoSize, { fit: 'contain' })
      .toBuffer();

    await sharp({
      create: {
        width: w,
        height: h,
        channels: 4,
        background: { r: 11, g: 12, b: 16, alpha: 1 } // #0B0C10
      }
    })
    .composite([
      {
        input: resizedLogo,
        gravity: 'center'
      }
    ])
    .png()
    .toFile(outputPath);

    console.log(`  └─ Généré ${filename}`);
  }

  console.log('🎉 TOUS LES SPLASH SCREENS iOS SONT PRÊTS !');
}

async function main() {
  await generateIcons();
  await generateSplashScreens();
}

main();
