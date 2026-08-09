import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imageDir = path.join(root, 'public', 'images');

const webpImages = [
  'rice.jpg',
  'paddy.jpg',
  'maize.jpg',
  'cotton.jpg',
  'pulses.jpg',
  'oilseeds.jpg',
  'agri-emblem.png',
  'agri-emblem-192.png',
  'agri-emblem-512.png',
];

async function toWebp(fileName) {
  const input = path.join(imageDir, fileName);
  const output = path.join(imageDir, fileName.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
  await sharp(input)
    .rotate()
    .webp({
      quality: fileName.startsWith('agri-emblem') ? 78 : 58,
      effort: 6,
    })
    .toFile(output);
}

async function main() {
  await Promise.all(webpImages.map(toWebp));
  console.log(`Optimized ${webpImages.length} images to WebP.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
