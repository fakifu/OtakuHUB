import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputFile = path.join(process.cwd(), 'public', 'logo-transparent.png');
const outputFiles = [
  { file: 'public/favicon.ico', size: 64 }, // We'll just output a PNG and name it .ico (browsers handle this, or we just write a small png). Wait, let's output a 64x64 PNG.
  { file: 'public/apple-touch-icon-180x180.png', size: 180 },
  { file: 'public/pwa-192x192.png', size: 192 },
  { file: 'public/assets/pwa/apple-icon-180.png', size: 180 },
];

async function generate() {
  try {
    for (const out of outputFiles) {
      const targetPath = path.join(process.cwd(), out.file);
      await sharp(inputFile)
        .resize({ width: out.size, height: out.size, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toFile(targetPath);
      console.log(`Generated ${targetPath}`);
    }
  } catch (err) {
    console.error(err);
  }
}

generate();
