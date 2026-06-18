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

fs.mkdirSync(iconsDir, { recursive: true });

// Sizes to generate
const sizes = [192, 512];

// Generate regular icons
for (const size of sizes) {
  const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  
  await sharp(svgPath)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outputPath);
  
  console.log(`Generated ${outputPath}`);
}

// Generate maskable icons with safe padding (40% padding for maskable icons)
for (const size of sizes) {
  const outputPath = path.join(iconsDir, `icon-maskable-${size}x${size}.png`);
  
  // For maskable icons, we want the emblem to be centered with padding
  // The safe zone is typically 60% of the icon size, so we scale the emblem to 60%
  const safeSize = Math.round(size * 0.6);
  
  // Create a canvas with the theme color background
  const background = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 4, g: 120, b: 87, alpha: 1 } // theme_color #047857
    }
  });
  
  // Resize the SVG to safe size and composite onto background
  const emblem = await sharp(svgPath)
    .resize(safeSize, safeSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  
  await background
    .composite([{
      input: emblem,
      gravity: 'center'
    }])
    .png()
    .toFile(outputPath);
  
  console.log(`Generated maskable ${outputPath}`);
}

console.log('PWA icons generated successfully!');
