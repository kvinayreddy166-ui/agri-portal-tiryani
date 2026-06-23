import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '../public');
const imagesDir = path.join(publicDir, 'images');
const iconsDir = path.join(publicDir, 'icons');
const svgPath = path.join(imagesDir, 'agri-emblem.svg');
const themeColor = { r: 4, g: 120, b: 87 };
const white = { r: 255, g: 255, b: 255 };

fs.mkdirSync(iconsDir, { recursive: true });

const sizes = [192, 512];

async function renderEmblem(size, background, emblemScale = 0.86) {
  const emblemSize = Math.round(size * emblemScale);
  const emblem = await sharp(svgPath)
    .resize(emblemSize, emblemSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background,
    },
  }).composite([{ input: emblem, gravity: 'center' }]);
}

// Install surfaces can reject or visually flatten transparent icons.
for (const size of sizes) {
  const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);

  await (await renderEmblem(size, white))
    .flatten({ background: white })
    .removeAlpha()
    .png()
    .toFile(outputPath);

  console.log(`Generated ${outputPath}`);
}

for (const size of sizes) {
  const outputPath = path.join(iconsDir, `icon-maskable-${size}x${size}.png`);

  await (await renderEmblem(size, themeColor, 0.6))
    .flatten({ background: themeColor })
    .removeAlpha()
    .png()
    .toFile(outputPath);

  console.log(`Generated maskable ${outputPath}`);
}

await (await renderEmblem(180, white))
  .flatten({ background: white })
  .removeAlpha()
  .png()
  .toFile(path.join(iconsDir, 'apple-touch-icon.png'));

console.log('PWA icons generated successfully!');