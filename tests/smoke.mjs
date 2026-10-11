// Quick browser checks for every page, language, and 3D setting. Run with: npm run test:smoke
import { start, watchErrors, ready3d } from './browser.mjs';
import fs from 'node:fs';

const THEMES = fs.readdirSync(new URL('../src/3d/themes/', import.meta.url)).filter(f => f.endsWith('.js')).map(f => f.slice(0, -3));
const LANGS = { en: '', nl: 'nl/' };
// words that only show up when Dutch text leaks into the English pages
const DUTCH = /\b(Oplossing|Aanwijzing|Verdachten?|Slachtoffer|Nieuwe zaak|Makkelijk|Moeilijk|Afdrukken|Speel|Zaak \d|Was in de|naast een|Bevond zich|moordenaar)\b/;
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++ };
const { browser, url, stop } = await start();
// every page also records requests to other hosts: the site must work offline, so nothing may load from a CDN
const page = async (vp = { width: 1280, height: 800 }, locale = 'en-US') => {
  const ctx = await browser.newContext({ viewport: vp, locale }); const p = await ctx.newPage(); const ext = [];
  p.on('request', r => { const u = new URL(r.url()); if (/^https?:$/.test(u.protocol) && u.origin !== new URL(url).origin) ext.push(u.href) });
  return { ctx, p, errs: watchErrors(p), ext };
};
// width and height of a PNG, from its IHDR chunk
const pngSize = b => b.length > 24 && b.toString('latin1', 1, 4) === 'PNG' ? `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}` : null;
const leftovers = html => (html.match(/__[A-Z]+__|\{\{t:[\w.]+\}\}|<!--(CORE|FEEDBACK|HREFLANG)-->|\/\*@(LANG|THEMES)\*\//g) || []);

try {
  for (const [lang, pre] of Object.entries(LANGS)) {
    console.log(`== landing (${lang})`);
    const { ctx, p, errs, ext } = await page(undefined, lang);
    await p.goto(url + pre);
    ok(/Murder Sudoku 3D/.test(await p.title()), `${lang}: title mentions Murder Sudoku 3D`);
    ok(await p.getAttribute('html', 'lang') === lang, `${lang}: html lang`);
    ok(await p.locator('link[rel=alternate][hreflang]').count() === 3, `${lang}: hreflang links`);
    JSON.parse(await p.locator('script[type="application/ld+json"]').textContent());
    ok(leftovers(await p.content()).length === 0, `${lang}: placeholders replaced ` + leftovers(await p.content()).join(' '));
    const broken = await p.evaluate(() => [...document.images].filter(i => i.loading !== 'lazy' && !i.naturalWidth).map(i => i.src));
    ok(broken.length === 0, `${lang}: images load ` + broken.join(' '));
    if (lang === 'en') ok(!DUTCH.test(await p.locator('body').innerText()), 'en: no Dutch on the page ' + ((await p.locator('body').innerText()).match(DUTCH) || [''])[0]);
    // feedback opens a prefilled GitHub issue
    await p.evaluate(() => { window.open = u => { window.__opened = u } });
    await p.locator('footer [data-feedback]').first().click();
    ok(await p.locator('.fb-back.on').isVisible(), `${lang}: feedback dialog opens`);
    await p.locator('.fb .k button[data-k=puzzle]').click();
    await p.fill('#fb-t', 'Test title'); await p.fill('#fb-d', 'Something is off');
    await p.locator('.fb .go').click();
    const u = new URL(await p.evaluate(() => window.__opened));
    ok(u.hostname === 'github.com' && u.pathname === '/jeroenmarchand/murder-sudoku-3d/issues/new', `${lang}: opens GitHub new issue ` + u.pathname);
    ok(u.searchParams.get('template') === 'puzzle.yml' && u.searchParams.get('title') === 'Test title' && u.searchParams.get('description') === 'Something is off' && /(Page|Pagina):/.test(u.searchParams.get('context')), `${lang}: issue is prefilled`);
    for (const t of ['bug', 'puzzle', 'idea']) ok(fs.existsSync(new URL(`../.github/ISSUE_TEMPLATE/${t}.yml`, import.meta.url)), `issue template ${t}.yml exists`);
    ok(errs.length === 0, `${lang}: no errors ` + errs.join(' | '));
    ok(ext.length === 0, `${lang}: no requests to other hosts ` + ext.join(' '));
    ok(!await p.evaluate(() => navigator.serviceWorker.getRegistration().then(Boolean)), `${lang}: no service worker on localhost without ?sw`);
    await ctx.close();
  }

  console.log('== manifest and icons');
  {
    const { ctx, p } = await page();
    await p.goto(url);
    const get = async u => { const r = await p.request.get(new URL(u, url).href); return { status: r.status(), body: await r.body() } };
    const m = JSON.parse((await get(await p.getAttribute('link[rel=manifest]', 'href'))).body.toString());
    ok(/Murder Sudoku 3D/.test(m.name) && m.short_name.length <= 12, `manifest name "${m.name}", short name "${m.short_name}"`);
    ok(m.icons.some(i => i.purpose === 'maskable') && m.icons.some(i => i.sizes === '192x192') && m.icons.some(i => i.sizes === '512x512'), 'manifest has 192, 512, and maskable icons');
    for (const i of m.icons) {
      const r = await get(new URL(i.src, new URL('site.webmanifest', url)).href);
      ok(r.status === 200 && (i.type !== 'image/png' || pngSize(r.body) === i.sizes), `icon ${i.src} resolves (${i.type === 'image/png' ? pngSize(r.body) : i.type})`);
    }
    for (const pg of ['', 'nl/', '3d/', 'nl/3d/', 'classic/']) {
      await p.goto(url + pg);
      const href = await p.getAttribute('link[rel=apple-touch-icon]', 'href');
      const r = await get(new URL(href, p.url()).href);
      ok(r.status === 200 && pngSize(r.body) === '180x180' && await p.locator('meta[name=theme-color]').count() === 1, `${pg || '/'}: apple-touch-icon and theme-color`);
    }
    await ctx.close();
  }

  console.log('== service worker (offline)');
  {
    const { ctx, p, errs } = await page();
    await p.addInitScript(() => localStorage.setItem('murdoku2:seen', '1'));
    await p.goto(url + '?sw');
    const scope = await p.evaluate(() => navigator.serviceWorker.ready.then(r => r.scope));
    ok(scope === url, 'registers on the landing page with ?sw, scoped to the site root ' + scope);
    const cached = await p.evaluate(async () => { const c = await caches.open((await caches.keys()).find(k => k.startsWith('murdoku-'))); return (await c.keys()).map(r => r.url) });
    ok(['3d/', 'nl/3d/', 'classic/', 'nl/classic/', 'vendor/three/build/three.module.min.js', 'vendor/fonts/fonts.css'].every(u => cached.includes(url + u)), `precaches the app shell (${cached.length} files)`);
    await ctx.setOffline(true);
    await p.goto(url + '3d/?sw&theme=castle#easy-12');
    await ready3d(p);
    ok(await p.evaluate(() => __dbg.TH.id) === 'castle', 'offline: the 3D app loads and builds a case');
    ok(await p.evaluate(() => document.fonts.check('700 16px Cinzel') && [...document.fonts].some(f => f.family.replace(/"/g, '') === 'Cinzel' && f.status === 'loaded')), 'offline: Cinzel is loaded');
    await p.goto(url + 'nl/classic/?sw#easy-12');
    await p.waitForFunction(() => document.querySelectorAll('#cards > *').length > 0, null, { timeout: 30000 });
    ok(true, 'offline: the Dutch classic page loads');
    ok(errs.length === 0, 'offline: no errors ' + errs.join(' | '));
    await ctx.close();
  }

  console.log('== language choice');
  {
    const { ctx, p } = await page(undefined, 'nl-NL');
    await p.goto(url + '3d/#easy-12');
    await p.waitForURL(/\/nl\/3d\/#easy-12$/);
    ok(true, 'Dutch browser is sent to /nl/, keeping the case');
    await p.evaluate(() => switchLang('en'));
    await p.waitForURL(u => /\/3d\/#easy-12$/.test(u) && !/\/nl\//.test(u));
    await p.goto(url); await p.waitForTimeout(300);
    ok(!/\/nl\//.test(p.url()), 'a chosen language sticks');
    await ctx.close();
  }

  for (const [lang, pre] of Object.entries(LANGS)) {
    console.log(`== classic (${lang})`);
    const { ctx, p, errs, ext } = await page(undefined, lang);
    await p.goto(url + pre + 'classic/#easy-12');
    await p.waitForFunction(() => document.querySelectorAll('#cards > *').length > 0, null, { timeout: 30000 });
    ok(await p.getAttribute('html', 'lang') === lang, `${lang}: case renders, html lang`);
    ok(leftovers(await p.content()).length === 0, `${lang}: placeholders replaced`);
    ok(await p.locator('[data-feedback]').count() >= 1, `${lang}: feedback link present`);
    if (lang === 'en') ok(!DUTCH.test(await p.locator('body').innerText()), 'en: no Dutch on the page ' + ((await p.locator('body').innerText()).match(DUTCH) || [''])[0]);
    ok(errs.length === 0, `${lang}: no errors ` + errs.join(' | '));
    ok(ext.length === 0, `${lang}: no requests to other hosts ` + ext.join(' '));
    await ctx.close();
  }

  console.log('== old addresses');
  {
    const { ctx, p } = await page();
    await p.goto(url + 'v2/#easy-12');
    await p.waitForURL(/\/3d\/#easy-12$/);
    ok(true, '/v2/ redirects to /3d/');
    await p.goto(url + 'klassiek/#easy-12');
    await p.waitForURL(/\/nl\/classic\/#easy-12$/);
    ok(true, '/klassiek/ redirects to /nl/classic/');
    await ctx.close();
  }

  console.log('== 3d settings');
  for (const [lang, pre] of Object.entries(LANGS)) for (const id of THEMES) {
    if (lang !== 'en' && id !== 'castle') continue; // Dutch is the source text; one setting is enough
    const { ctx, p, errs, ext } = await page(undefined, lang);
    await p.addInitScript(() => localStorage.setItem('murdoku2:seen', '1'));
    await p.goto(`${url}${pre}3d/?theme=${id}#easy-12`);
    await ready3d(p);
    await p.waitForTimeout(800);
    const info = await p.evaluate(() => ({ th: __dbg.TH.id, names: __dbg.P.sus.map(s => s.name) }));
    ok(info.th === id, `${lang} ${id}: loads`);
    ok(info.names.every((n, i) => n[0] === 'ABCDEFGH'[i]), `${lang} ${id}: names start with their letter`);
    ok(leftovers(await p.content()).length === 0, `${lang} ${id}: placeholders replaced`);
    if (lang === 'en') {
      await p.locator('#dossier').evaluate(d => d.classList.add('open'));
      const text = await p.locator('body').innerText();
      ok(!DUTCH.test(text), `en ${id}: no Dutch in the interface ` + (text.match(DUTCH) || [''])[0]);
    }
    if (id === 'castle') {
      await p.click('#moreBtn'); await p.click('#fbBtn'); await p.waitForTimeout(200);
      ok(await p.locator('.fb-back.on').isVisible(), `${lang} castle: feedback opens from the menu`);
      await p.keyboard.press('n');
      ok(await p.evaluate(() => __dbg.mode) === 'pen', `${lang} castle: typing in feedback does not trigger game shortcuts`);
      await p.locator('.fb details summary').click(); await p.waitForTimeout(150);
      const prev = await p.locator('#fb-p').textContent();
      ok(new RegExp(`${lang === 'nl' ? 'Zaak' : 'Case'}:\\*\\* easy-12`).test(prev), `${lang} castle: feedback includes the case number`);
    }
    ok(errs.length === 0, `${lang} ${id}: no errors ` + errs.join(' | '));
    ok(ext.length === 0, `${lang} ${id}: no requests to other hosts ` + ext.join(' '));
    if (id === 'castle') ok(/Murder Sudoku 3D/.test(await p.title()), `${lang} castle: title mentions Murder Sudoku 3D`);
    await ctx.close();
  }
} catch (e) { console.error(e); fails++ }
await stop();
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
process.exit(fails ? 1 : 0);
