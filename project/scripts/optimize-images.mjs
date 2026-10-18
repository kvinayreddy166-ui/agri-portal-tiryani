import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imageDir = path.join(root, 'public', 'images');

const MAX_DIMENSION = 1200;
const WEBP_QUALITY = 80;

async function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else if (/\.(png|jpe?g)$/i.test(entry.name)) {
      const ext = path.extname(entry.name);
      const webpName = entry.name.slice(0, -ext.length) + '.webp';
      const webpPath = path.join(dirPath, webpName);

      try {
        const originalStats = fs.statSync(fullPath);
        const image = sharp(fullPath);
        const metadata = await image.metadata();

        let pipeline = image.rotate();
        if (metadata.width && metadata.height && (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION)) {
          pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
            fit: 'inside',
            withoutEnlargement: true,
          });
        }

        await pipeline.webp({ quality: WEBP_QUALITY, effort: 6 }).toFile(webpPath);
        const webpStats = fs.statSync(webpPath);
        const savedPct = (((originalStats.size - webpStats.size) / originalStats.size) * 100).toFixed(1);
        console.log(`[OK] ${path.relative(imageDir, fullPath)} (${(originalStats.size / 1024).toFixed(1)} KB) -> ${webpName} (${(webpStats.size / 1024).toFixed(1)} KB) [${savedPct}% saved]`);
      } catch (err) {
        console.error(`[FAIL] ${entry.name}:`, err.message);
      }
    }
  }
}

async function main() {
  console.log(`Scanning and optimizing images in ${imageDir}...`);
  await processDirectory(imageDir);
  console.log('Image optimization complete.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
