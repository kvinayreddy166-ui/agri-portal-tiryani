import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const screenshotsDir = path.join(__dirname, '../public/screenshots');

// Create mobile screenshot placeholder (390x844 - typical iPhone)
const mobileWidth = 390;
const mobileHeight = 844;

const svgMobile = `
<svg width="${mobileWidth}" height="${mobileHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#eef6f0"/>
  <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#047857" text-anchor="middle" dominant-baseline="middle">
    Mobile Screenshot Placeholder
  </text>
  <text x="50%" y="55%" font-family="Arial" font-size="16" fill="#666" text-anchor="middle" dominant-baseline="middle">
    Replace with actual mobile screenshot
  </text>
</svg>
`;

await sharp(Buffer.from(svgMobile))
  .png()
  .toFile(path.join(screenshotsDir, 'mobile.png'));

console.log('Generated mobile screenshot placeholder');

// Create desktop/wide screenshot (1920x1080)
const desktopWidth = 1920;
const desktopHeight = 1080;

const svgDesktop = `
<svg width="${desktopWidth}" height="${desktopHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#eef6f0"/>
  <text x="50%" y="50%" font-family="Arial" font-size="48" fill="#047857" text-anchor="middle" dominant-baseline="middle">
    Desktop Screenshot Placeholder
  </text>
  <text x="50%" y="55%" font-family="Arial" font-size="32" fill="#666" text-anchor="middle" dominant-baseline="middle">
    Replace with actual desktop screenshot
  </text>
</svg>
`;

await sharp(Buffer.from(svgDesktop))
  .png()
  .toFile(path.join(screenshotsDir, 'desktop.png'));

console.log('Generated desktop screenshot placeholder');

console.log('PWA screenshot placeholders generated successfully!');
