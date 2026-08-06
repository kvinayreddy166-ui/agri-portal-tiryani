import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const screenshotsDir = path.join(__dirname, '../public/screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });

const mobileWidth = 1080;
const mobileHeight = 1920;

const svgMobile = `
<svg width="${mobileWidth}" height="${mobileHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#eef6f0"/>
  <rect x="64" y="72" width="952" height="178" rx="36" fill="#0f766e"/>
  <circle cx="164" cy="161" r="50" fill="#ffffff"/>
  <text x="240" y="150" font-family="Inter, Arial" font-size="48" font-weight="700" fill="#ffffff">AGRONIX</text>
  <text x="240" y="202" font-family="Inter, Arial" font-size="28" fill="#ccfbf1">Agriculture Department Digital Platform</text>
  <rect x="64" y="310" width="952" height="360" rx="32" fill="#ffffff"/>
  <text x="112" y="392" font-family="Inter, Arial" font-size="48" font-weight="700" fill="#0f172a">Dashboard</text>
  <rect x="112" y="460" width="248" height="130" rx="24" fill="#dcfce7"/>
  <rect x="416" y="460" width="248" height="130" rx="24" fill="#e0f2fe"/>
  <rect x="720" y="460" width="248" height="130" rx="24" fill="#fef3c7"/>
  <rect x="64" y="730" width="952" height="300" rx="32" fill="#ffffff"/>
  <rect x="112" y="800" width="856" height="32" rx="16" fill="#d1fae5"/>
  <rect x="112" y="872" width="700" height="32" rx="16" fill="#e2e8f0"/>
  <rect x="112" y="944" width="760" height="32" rx="16" fill="#e2e8f0"/>
  <rect x="64" y="1090" width="952" height="560" rx="32" fill="#ffffff"/>
  <text x="112" y="1170" font-family="Inter, Arial" font-size="40" font-weight="700" fill="#0f172a">Farmer Services</text>
  <rect x="112" y="1238" width="856" height="88" rx="22" fill="#f8fafc"/>
  <rect x="112" y="1362" width="856" height="88" rx="22" fill="#f8fafc"/>
  <rect x="112" y="1486" width="856" height="88" rx="22" fill="#f8fafc"/>
</svg>
`;

await sharp(Buffer.from(svgMobile))
  .png()
  .toFile(path.join(screenshotsDir, 'mobile-home.png'));

console.log('Generated mobile screenshot placeholder');

const desktopWidth = 1440;
const desktopHeight = 900;

const svgDesktop = `
<svg width="${desktopWidth}" height="${desktopHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#eef6f0"/>
  <rect x="0" y="0" width="280" height="900" fill="#0f766e"/>
  <circle cx="72" cy="76" r="38" fill="#ffffff"/>
  <text x="126" y="70" font-family="Inter, Arial" font-size="26" font-weight="700" fill="#ffffff">AGRONIX</text>
  <text x="126" y="102" font-family="Inter, Arial" font-size="18" fill="#ccfbf1">Agriculture Intelligence Platform</text>
  <rect x="32" y="170" width="216" height="44" rx="14" fill="#14b8a6"/>
  <rect x="32" y="238" width="216" height="44" rx="14" fill="#0d9488"/>
  <rect x="32" y="306" width="216" height="44" rx="14" fill="#0d9488"/>
  <rect x="328" y="48" width="1048" height="172" rx="28" fill="#ffffff"/>
  <text x="376" y="122" font-family="Inter, Arial" font-size="44" font-weight="700" fill="#0f172a">AGRONIX</text>
  <text x="376" y="170" font-family="Inter, Arial" font-size="22" fill="#475569">Dashboard, farmer data, stock monitoring, reports and PDF tools</text>
  <rect x="328" y="260" width="316" height="150" rx="24" fill="#dcfce7"/>
  <rect x="682" y="260" width="316" height="150" rx="24" fill="#e0f2fe"/>
  <rect x="1036" y="260" width="340" height="150" rx="24" fill="#fef3c7"/>
  <rect x="328" y="456" width="500" height="360" rx="24" fill="#ffffff"/>
  <rect x="876" y="456" width="500" height="360" rx="24" fill="#ffffff"/>
  <rect x="376" y="530" width="400" height="28" rx="14" fill="#d1fae5"/>
  <rect x="376" y="600" width="330" height="28" rx="14" fill="#e2e8f0"/>
  <rect x="924" y="530" width="400" height="28" rx="14" fill="#dbeafe"/>
  <rect x="924" y="600" width="360" height="28" rx="14" fill="#e2e8f0"/>
</svg>
`;

await sharp(Buffer.from(svgDesktop))
  .png()
  .toFile(path.join(screenshotsDir, 'desktop-dashboard.png'));

console.log('Generated desktop screenshot placeholder');

console.log('PWA screenshot placeholders generated successfully!');
