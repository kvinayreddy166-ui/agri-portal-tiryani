import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconsDir = path.join(__dirname, '../public/icons');

const icons = [
  ['icon-192x192.png', 192],
  ['icon-512x512.png', 512],
  ['icon-maskable-192x192.png', 192],
  ['icon-maskable-512x512.png', 512],
  ['apple-touch-icon.png', 180],
];

for (const [icon, expectedSize] of icons) {
  const iconPath = path.join(iconsDir, icon);
  const metadata = await sharp(iconPath).metadata();
  const actualSize = `${metadata.width}x${metadata.height}`;
  console.log(`${icon}: ${actualSize}${metadata.hasAlpha ? ' alpha' : ' opaque'}`);

  if (metadata.width !== expectedSize || metadata.height !== expectedSize) {
    throw new Error(`${icon} must be ${expectedSize}x${expectedSize}, got ${actualSize}`);
  }

  if (metadata.hasAlpha) {
    throw new Error(`${icon} must be opaque for reliable PWA install branding`);
  }
}