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
const page = async (vp = { width: 1280, height: 800 }, locale = 'en-US') => { const ctx = await browser.newContext({ viewport: vp, locale }); const p = await ctx.newPage(); return { ctx, p, errs: watchErrors(p) } };
const leftovers = html => (html.match(/__[A-Z]+__|\{\{t:[\w.]+\}\}|<!--(CORE|FEEDBACK|HREFLANG)-->|\/\*@(LANG|THEMES)\*\//g) || []);

try {
  for (const [lang, pre] of Object.entries(LANGS)) {
    console.log(`== landing (${lang})`);
    const { ctx, p, errs } = await page(undefined, lang);
    await p.goto(url + pre);
    ok(/Murder Sudoku/.test(await p.title()), `${lang}: title mentions Murder Sudoku`);
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
    const { ctx, p, errs } = await page(undefined, lang);
    await p.goto(url + pre + 'classic/#easy-12');
    await p.waitForFunction(() => document.querySelectorAll('#cards > *').length > 0, null, { timeout: 30000 });
    ok(await p.getAttribute('html', 'lang') === lang, `${lang}: case renders, html lang`);
    ok(leftovers(await p.content()).length === 0, `${lang}: placeholders replaced`);
    ok(await p.locator('[data-feedback]').count() >= 1, `${lang}: feedback link present`);
    if (lang === 'en') ok(!DUTCH.test(await p.locator('body').innerText()), 'en: no Dutch on the page ' + ((await p.locator('body').innerText()).match(DUTCH) || [''])[0]);
    ok(errs.length === 0, `${lang}: no errors ` + errs.join(' | '));
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
    const { ctx, p, errs } = await page(undefined, lang);
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
    await ctx.close();
  }
} catch (e) { console.error(e); fails++ }
await stop();
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
process.exit(fails ? 1 : 0);
