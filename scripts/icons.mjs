// Renders the web app icons from the SVG below. Run after changing the design:
//   npm run build && node scripts/icons.mjs
// Writes:
//   src/site/img/icons/  icon-192.png, icon-512.png (rounded, for the web manifest), icon-maskable-512.png
//                        (full bleed, mark inside the safe zone), apple-touch-icon.png (180, full bleed)
import fs from 'node:fs';
import { start } from '../tests/browser.mjs';

const ROOT = new URL('../', import.meta.url).pathname;
const ICONS = ROOT + 'src/site/img/icons/';
fs.mkdirSync(ICONS, { recursive: true });

const BG = '#120e1c';
const defs = `<defs>
  <radialGradient id="bg" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="#3a2a5c"/><stop offset=".55" stop-color="#1d1533"/><stop offset="1" stop-color="${BG}"/></radialGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8e4b0"/><stop offset=".55" stop-color="#e4c07a"/><stop offset="1" stop-color="#b98c45"/></linearGradient>
  <radialGradient id="lens" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#4a3a72"/><stop offset="1" stop-color="#241b3d"/></radialGradient>
  <clipPath id="lensClip"><circle cx="216" cy="216" r="106"/></clipPath>
</defs>`;

// The mark, drawn on a 512 grid: a 4×4 floor plan with one room picked out, a gold magnifying glass,
// and a suspect pawn inside the lens. s scales it around the centre (1 = fills the tile).
function mark(s = 1) {
  const tiles = [];
  const x0 = 96, step = 82, size = 72;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const room = (r === 2 || r === 3) && c >= 2; // one room in a slightly warmer tone
    tiles.push(`<rect x="${x0 + c * step}" y="${x0 + r * step}" width="${size}" height="${size}" rx="10" fill="${room ? '#5a3f70' : '#352b58'}"/>`);
  }
  const pawn = (cx, cy, k, fill) => `<g transform="translate(${cx} ${cy}) scale(${k})" fill="${fill}"><circle cx="0" cy="-34" r="22"/><path d="M-14-12h28l10 40h-48z"/><rect x="-36" y="26" width="72" height="16" rx="8"/></g>`;
  return `<g transform="translate(256 256) scale(${s}) translate(-256 -256)">
    ${tiles.join('')}
    <g clip-path="url(#lensClip)"><circle cx="216" cy="216" r="106" fill="url(#lens)"/>
      <path d="M136 96v240M218 96v240M300 96v240M96 136h240M96 218h240M96 300h240" stroke="#5b4a86" stroke-width="5" opacity=".55"/>
      ${pawn(216, 226, 1.45, '#f3ebdc')}
    </g>
    <circle cx="216" cy="216" r="106" fill="none" stroke="url(#gold)" stroke-width="26"/>
    <circle cx="216" cy="216" r="122" fill="none" stroke="#0a0712" stroke-width="5" opacity=".35"/>
    <path d="M300 300l98 98" stroke="#0a0712" stroke-width="50" stroke-linecap="round" opacity=".35"/>
    <path d="M296 296l96 96" stroke="url(#gold)" stroke-width="40" stroke-linecap="round"/>
    <path d="M150 168a84 84 0 0 1 52-46" stroke="#fff6dc" stroke-width="9" stroke-linecap="round" fill="none" opacity=".55"/>
  </g>`;
}

const svg = ({ size = 512, rounded = false, bg = true, s = 1 }) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">${defs}
  ${bg ? `<rect width="512" height="512" ${rounded ? 'rx="112"' : ''} fill="url(#bg)"/>` : ''}${s ? mark(s) : ''}</svg>`;

const { browser, url, stop } = await start();
const page = await browser.newPage();
async function render(file, w, h, body, transparent = false) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<!doctype html><base href="${url}"><link rel="stylesheet" href="vendor/fonts/fonts.css"><style>html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;background:${transparent ? 'transparent' : BG}}svg{display:block}</style>${body}`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: file, omitBackground: transparent });
  console.log('wrote', file.replace(ROOT, ''));
}

await render(ICONS + 'icon-192.png', 192, 192, svg({ size: 192, rounded: true }), true);
await render(ICONS + 'icon-512.png', 512, 512, svg({ size: 512, rounded: true }), true);
await render(ICONS + 'icon-maskable-512.png', 512, 512, svg({ size: 512, s: .76 }));
await render(ICONS + 'apple-touch-icon.png', 180, 180, svg({ size: 180, s: .9 }));
await stop();
