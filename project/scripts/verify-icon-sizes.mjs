import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesDir = path.join(__dirname, '../public/images');

const icons = [
  'agri-emblem-192.png',
  'agri-emblem-512.png',
  'agri-emblem-maskable-192.png',
  'agri-emblem-maskable-512.png'
];

for (const icon of icons) {
  const iconPath = path.join(imagesDir, icon);
  const metadata = await sharp(iconPath).metadata();
  console.log(`${icon}: ${metadata.width}x${metadata.height}`);
}
