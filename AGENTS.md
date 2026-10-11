# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, Copilot, Cursor, and others) working in this repository.

## What this is

Murder Sudoku 3D is a static web game: a murder-mystery logic puzzle. Players place suspects on a floor plan (one person per row and column, like sudoku), follow one clue per suspect, and accuse the person who was alone with the victim. The interface is multilingual (English at the root, Dutch under `/nl/`). There is no framework, no bundler, and no server. The site is an installable, offline-capable web app (service worker), and it is also wrapped as an iOS and Android app.

Live site: https://jeroenmarchand.github.io/murder-sudoku-3d/

## Commands

```sh
npm install                    # once; installs Playwright for the browser tests
npm run dev                    # http://localhost:5173, rebuilds dist/ on every page load
npm run build                  # writes dist/ (node scripts/build.mjs [--only <theme>])
npm test                       # build + all tests; must pass before you finish
npm run test:core              # generator unit tests only (fast, no browser)
npm run test:smoke             # every page, language, and 3D theme loads without console errors
npm run test:e2e               # full play-through of the 3D app on phone and tablet viewports
npm run screenshots            # regenerate landing-page images (needs a real GPU; not in CI)
```

Browser tests use Playwright's Chromium if installed (`npx playwright install chromium`), otherwise the local Google Chrome.

## Layout

| Path | What it is |
|---|---|
| `src/core.js` | Puzzle generator and solver. Plain script, also runs inside a Web Worker. Inlined as `<script id="core">`. |
| `src/3d/i18n/<lang>.js` | 3D app text and clue grammar per language (`const L={...}`). |
| `src/3d/index.html` | 3D app (three.js r169 via importmap, served from `vendor/`). Engine, UI, input, save state. `/*@THEMES*/` is replaced by the theme files. |
| `src/3d/themes/*.js` | One file per setting, each calling `registerTheme({...})`. Dutch text inline, other languages in `i18n.<lang>`. Castle is the reference. |
| `src/classic/index.html` | 2D SVG version with print layout. Text in `src/classic/i18n/<lang>.js`. |
| `src/site/` | Landing pages (`index.html` English, `nl/index.html` Dutch), images, favicon, app icons (`img/icons/`), manifest, service worker (`sw.js`), 404. Copied to the root of `dist/`. |
| `scripts/icons.mjs` | Renders the web app icons (`src/site/img/icons/`) with Playwright. Run it after changing the icon design. |
| `src/shared/feedback.js` | Feedback dialog (English and Dutch). Opens a prefilled GitHub issue form from `.github/ISSUE_TEMPLATE/`. |
| `scripts/build.mjs` | Builds every page once per language (`LANGS`). Inlines core, themes, feedback, and `i18n/<lang>.js` at `/*@LANG*/`; replaces `{{t:key}}` at build time, plus `__LANG__`, `__ROOT__`, `__URL__`, `__SITE__`, `__REPO__`, `<!--HREFLANG-->`, and `<!--SW-->` (service worker registration); copies three.js and the fonts from `node_modules` to `dist/vendor/`; writes `sw.js` with the precache list and a cache version hash, sitemap, and robots. |
| `tests/` | `core.test.mjs` (node:test), `smoke.mjs` and `e2e.mjs` (Playwright, served from `dist/`). |
| `docs/THEMES.md` | Full guide and API for writing a new 3D setting. Read it before touching themes. |

Never edit `dist/`; it is generated.

## Rules

- **Run `npm test` before you finish** and report the result. For visual changes, also look at the result: run the dev server and take a screenshot with Playwright, then check it.
- **Every player-facing string is translated** in every language in `LANGS` (English and Dutch). Never hard-code UI text in the engine: add it to the `i18n/<lang>.js` files and, for themes, to `i18n.en` next to the inline Dutch. Clues are built from fragments, so check grammar in the browser in each language. Code and comments in English.
- **Do not change puzzle output casually.** Any change to `src/core.js` that alters RNG use changes the puzzle behind every shared case link (`#medium-75`). If you must, say so in the pull request.
- **Theme names:** suspect names must start with their letter A to H (one female, one male per letter); the victim is V. The smoke test checks this.
- **No external assets and no network loads at runtime.** Everything is procedural (geometry and canvas textures). three.js and the fonts (Cinzel, EB Garamond, Inter) are self-hosted under `vendor/`, so the game works offline and in the app. The smoke test fails if a page requests another host.
- **Service worker:** `src/site/sw.js` precaches the 3D and classic pages and the vendor files. It is not registered on `localhost` / `127.0.0.1` (dev server and tests), unless the URL has `?sw`. If you add a file the 3D app needs offline, check that it ends up in the precache list in `scripts/build.mjs`.
- **Performance:** keep draw calls low (aim under ~350 per theme), scale particles with `HQ`, use `mergeStatic` and the automatic per-object baking (`bakeObj`, disable with `?nobake` to debug).
- **Debug hooks:** the 3D app exposes `window.__dbg` (puzzle `P`, `state`, `tapCell(i)`, `TH`, renderer, camera). Tests rely on it; keep it working.
- **Save keys** in `localStorage` start with `murdoku2:` / `murdoku:` (the old working name; the product is called Murder Sudoku 3D). Do not rename them: that would wipe players' progress.
- **Originality:** do not copy names, puzzles, text, or art from existing puzzle books or games, and do not use third-party trademarks in names or copy.
- Keep the code style of the surrounding file (the engine is dense, compact JavaScript).

## Useful URLs while developing

- `/3d/?theme=space#medium-75` forces a theme and a case. Cases are `easy|medium|hard` plus a seed.
- `/3d/?nobake` disables mesh merging.
- `/classic/#easy-12` opens a case in the 2D version.
- `/?sw` registers the service worker on localhost, to test offline play.
- Prefix any path with `/nl/` for Dutch. Language choice is stored in `localStorage` (`murdoku2:lang`); until a visitor picks one, a browser that prefers Dutch is sent to `/nl/`.

## Pull requests

Small, focused changes. Reference the issue (`Fixes #12`). Fill in `.github/pull_request_template.md`. CI runs `npm test`; merging to `main` deploys to GitHub Pages.
