import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '../public');
const imagesDir = path.join(publicDir, 'images');
const iconsDir = path.join(publicDir, 'icons');
const logoPath = path.join(imagesDir, 'agronix-logo-original.jpeg');
const white = { r: 255, g: 255, b: 255 };

fs.mkdirSync(iconsDir, { recursive: true });

const sizes = [192, 512];

async function renderLogo(size, logoScale = 0.94) {
  const logoSize = Math.round(size * logoScale);
  const logo = await sharp(logoPath)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: white,
    },
  }).composite([{ input: logo, gravity: 'center' }]);
}

// Install surfaces can reject or visually flatten transparent icons, so generate opaque icons.
for (const size of sizes) {
  const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);

  await (await renderLogo(size, 0.96))
    .flatten({ background: white })
    .removeAlpha()
    .png()
    .toFile(outputPath);

  console.log(`Generated ${outputPath}`);
}

for (const size of sizes) {
  const outputPath = path.join(iconsDir, `icon-maskable-${size}x${size}.png`);

  await (await renderLogo(size, 0.78))
    .flatten({ background: white })
    .removeAlpha()
    .png()
    .toFile(outputPath);

  console.log(`Generated maskable ${outputPath}`);
}

await (await renderLogo(180, 0.96))
  .flatten({ background: white })
  .removeAlpha()
  .png()
  .toFile(path.join(iconsDir, 'apple-touch-icon.png'));

console.log('PWA icons generated successfully from agronix-logo-original.jpeg!');
