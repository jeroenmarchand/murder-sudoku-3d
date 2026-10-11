// Builds the static site into dist/. No dependencies, runs in well under a second.
//   node scripts/build.mjs               full build
//   node scripts/build.mjs --only space  3D app with castle + one theme (faster to iterate)
//
// Every page is built once per language. English lives at the root, other languages under /<code>/:
//   /  /3d/  /classic/        English
//   /nl/  /nl/3d/  /nl/classic/  Dutch
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const SITE = pkg.homepage.replace(/\/?$/, '/');
const REPO = pkg.repository.replace(/^github:/, '');
export const LANGS = { en: 'English', nl: 'Nederlands' }; // first one is the default, served at the root
const DEFAULT = Object.keys(LANGS)[0];
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const out = path.join(ROOT, 'dist');
const prefix = lang => lang === DEFAULT ? '' : lang + '/';

// <link rel=alternate> tags plus a tiny script: window.PAGE_LANGS for language switchers,
// window.switchLang(code), and a one-time redirect for visitors whose browser prefers another language.
function hreflang(page, lang, root) {
  const urls = Object.fromEntries(Object.keys(LANGS).map(l => [l, prefix(l) + page]));
  const links = Object.entries(urls).map(([l, u]) => `<link rel="alternate" hreflang="${l}" href="${SITE}${u}">`).join('\n')
    + `\n<link rel="alternate" hreflang="x-default" href="${SITE}${urls[DEFAULT]}">`;
  const rel = Object.fromEntries(Object.entries(urls).map(([l, u]) => [l, root + u]));
  const script = `<script>(()=>{const P=window.PAGE_LANGS=${JSON.stringify(rel)},N=window.LANG_NAMES=${JSON.stringify(LANGS)},K='murdoku2:lang',go=l=>location.href=P[l]+location.search+location.hash;
window.switchLang=l=>{try{localStorage.setItem(K,l)}catch(e){}go(l)};
let s=null;try{s=localStorage.getItem(K)}catch(e){}
const want=s||(navigator.languages||[navigator.language]).map(x=>String(x).slice(0,2).toLowerCase()).find(x=>x in N);
if(want&&want!=='${lang}'&&P[want]&&(s||'${lang}'==='${DEFAULT}'))go(want)})()</script>`;
  return links + '\n' + script;
}

export function build() {
  fs.rmSync(out, { recursive: true, force: true });
  const write = (f, s) => { const p = path.join(out, f); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s) };

  const core = `<script id="core">\n${read('src/core.js')}</script>`;
  const feedback = `<script>\n${read('src/shared/feedback.js')}</script>`;
  // page: path of the page relative to its language root, for example '3d/' or '' for the landing page
  const fill = (s, lang, page) => {
    const depth = (prefix(lang) + page).split('/').filter(Boolean).length;
    const root = '../'.repeat(depth);
    return s
      .replaceAll('<!--CORE-->', () => core)
      .replaceAll('<!--FEEDBACK-->', () => feedback)
      .replaceAll('<!--HREFLANG-->', () => hreflang(page, lang, root))
      .replaceAll('__URL__', SITE + prefix(lang) + page)
      .replaceAll('__SITE__', SITE)
      .replaceAll('__REPO__', REPO)
      .replaceAll('__LANG__', lang)
      .replaceAll('__ROOT__', root);
  };
  // src/<app>/i18n/<lang>.js defines `const L={...}`. It is inlined at /*@LANG*/ for runtime text,
  // and {{t:some.key}} in the HTML is replaced at build time (titles, meta tags, static markup).
  const langFile = (dir, lang) => read(`${dir}/i18n/${lang}.js`);
  const translate = (html, dir, lang) => {
    const src = langFile(dir, lang);
    const L = vm.runInNewContext(src + '\n;typeof L==="undefined"?{}:L', {}, { filename: `${dir}/i18n/${lang}.js` });
    return html.replace(/\{\{t:([\w.]+)\}\}/g, (m, key) => {
      const v = key.split('.').reduce((o, k) => o?.[k], L);
      if (typeof v !== 'string') throw new Error(`${dir}/i18n/${lang}.js: missing string "${key}"`);
      return v;
    }).replace('/*@LANG*/', () => src);
  };

  // 3D app: castle first, then the other themes alphabetically
  const dir = path.join(ROOT, 'src/3d/themes');
  let themes = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort((a, b) => (a !== 'castle.js') - (b !== 'castle.js') || a.localeCompare(b));
  if (only) themes = themes.filter(f => f === 'castle.js' || f === only + '.js');
  const themeSrc = themes.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');

  for (const lang of Object.keys(LANGS)) {
    const p = prefix(lang);
    write(p + '3d/index.html', translate(fill(read('src/3d/index.html'), lang, '3d/'), 'src/3d', lang).replace('/*@THEMES*/', () => themeSrc));
    write(p + 'classic/index.html', translate(fill(read('src/classic/index.html'), lang, 'classic/'), 'src/classic', lang));
  }

  // landing pages and static files; src/site/<lang>/ holds the translated landing pages
  for (const f of fs.readdirSync(path.join(ROOT, 'src/site'), { recursive: true })) {
    const src = path.join(ROOT, 'src/site', f);
    if (fs.statSync(src).isDirectory()) continue;
    const seg = f.split(path.sep);
    const lang = seg.length > 1 && seg[0] in LANGS ? seg[0] : DEFAULT;
    const page = seg.slice(lang === DEFAULT ? 0 : 1, -1).map(x => x + '/').join('');
    if (/\.(html|txt|xml|webmanifest|svg)$/.test(f)) write(f, fill(fs.readFileSync(src, 'utf8'), lang, page));
    else { fs.mkdirSync(path.dirname(path.join(out, f)), { recursive: true }); fs.copyFileSync(src, path.join(out, f)) }
  }

  // old addresses
  const redirect = (from, to, title) => write(from + 'index.html', `<!doctype html><meta charset="utf-8"><title>${title}</title><link rel="canonical" href="${SITE}${to}"><script>location.replace('${'../'.repeat(from.split('/').filter(Boolean).length)}${to}'+location.search+location.hash)</script><a href="${SITE}${to}">${title}</a>`);
  redirect('v2/', '3d/', 'Murder Sudoku 3D');
  redirect('klassiek/', 'nl/classic/', 'Murder Sudoku klassiek');

  const today = new Date().toISOString().slice(0, 10);
  const pages = ['', '3d/', 'classic/'];
  const entry = page => `  <url><loc>${SITE}${prefix(DEFAULT)}${page}</loc><lastmod>${today}</lastmod>\n${Object.keys(LANGS).map(l => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE}${prefix(l)}${page}"/>`).join('\n')}\n  </url>`;
  const entries = pages.flatMap(page => Object.keys(LANGS).map(l => entry(page).replace(`<loc>${SITE}${prefix(DEFAULT)}${page}</loc>`, `<loc>${SITE}${prefix(l)}${page}</loc>`)));
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`);
  write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE}sitemap.xml\n`);
  write('.nojekyll', '');
  return themes.map(f => f.replace('.js', ''));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const t = build();
  console.log(`dist/ built (languages: ${Object.keys(LANGS).join(', ')}; themes: ${t.join(', ')})`);
}
