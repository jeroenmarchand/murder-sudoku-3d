// Regenerates the landing page images in src/site/img/ (one per setting plus the social preview).
// Needs a real GPU for good results: run it on your own machine, not in CI.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { start, ready3d } from '../tests/browser.mjs';

const THEMES = fs.readdirSync(new URL('../src/3d/themes/', import.meta.url)).filter(f => f.endsWith('.js')).map(f => f.slice(0, -3));
const OUT = new URL('../src/site/img/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const { browser, url, stop } = await start();
const toJpg = (png, jpg, w) => {
  try { execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '78', ...(w ? ['--resampleWidth', String(w)] : []), png, '--out', jpg], { stdio: 'ignore' }) }
  catch { fs.copyFileSync(png, jpg.replace(/\.jpg$/, '.png')) }
  fs.rmSync(png, { force: true });
};
for (const id of THEMES) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5, locale: 'en-US' });
  const p = await ctx.newPage();
  await p.addInitScript(() => localStorage.setItem('murdoku2:seen', '1'));
  await p.goto(`${url}3d/?theme=${id}#medium-75`);
  await ready3d(p);
  await p.waitForTimeout(3500);
  // in-game shot with the full interface (the landing page uses the castle one)
  if (id === 'castle') await p.screenshot({ path: `${OUT}${id}-ui.png` });
  if (id === 'castle') toJpg(`${OUT}${id}-ui.png`, `${OUT}${id}-ui.jpg`, 1280);
  await ctx.close();
  if (id === 'castle') {
    // the Dutch landing page gets the same shot from /nl/
    const c = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5, locale: 'nl-NL' });
    const q = await c.newPage();
    await q.addInitScript(() => localStorage.setItem('murdoku2:seen', '1'));
    await q.goto(`${url}nl/3d/?theme=${id}#medium-75`);
    await ready3d(q);
    await q.waitForTimeout(3500);
    await q.screenshot({ path: `${OUT}${id}-ui-nl.png` });
    toJpg(`${OUT}${id}-ui-nl.png`, `${OUT}${id}-ui-nl.jpg`, 1280);
    await c.close();
  }
  // clean shot of the board only, in the narrow layout where the board sits centred
  const ctx2 = await browser.newContext({ viewport: { width: 880, height: 760 }, deviceScaleFactor: 1.5, locale: 'en-US' });
  const p2 = await ctx2.newPage();
  await p2.addInitScript(() => localStorage.setItem('murdoku2:seen', '1'));
  await p2.goto(`${url}3d/?theme=${id}#medium-75`);
  await ready3d(p2);
  await p2.addStyleTag({ content: 'header,#dossier,#hud,#toast{display:none!important}' });
  await p2.waitForTimeout(3500);
  await p2.screenshot({ path: `${OUT}${id}.png` });
  toJpg(`${OUT}${id}.png`, `${OUT}${id}.jpg`, 1100);
  await ctx2.close();
  console.log('shot', id);
}
// social preview (1200×630): castle board with the name on top
{
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const bg = 'data:image/jpeg;base64,' + fs.readFileSync(`${OUT}castle.jpg`).toString('base64');
  await p.setContent(`<style>body{margin:0;width:1200px;height:630px;background:#120e1c url(${bg}) center 40%/cover;font-family:Georgia,serif;color:#f6e7c8;display:flex;align-items:flex-end}
    div{width:100%;padding:44px 56px;background:linear-gradient(transparent,rgba(10,7,16,.92) 45%)}
    h1{margin:0;font-size:84px;letter-spacing:.02em}p{margin:6px 0 0;font:500 32px system-ui,sans-serif;color:#e8d3a6}</style>
    <div><h1>Murder Sudoku 3D</h1><p>Whodunit? Free murder mystery logic puzzles</p></div>`);
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}og.png` });
  toJpg(`${OUT}og.png`, `${OUT}og.jpg`, 1200);
  await ctx.close();
}
await stop();
