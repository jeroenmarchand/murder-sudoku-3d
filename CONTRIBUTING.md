# Contributing to Murder Sudoku 3D

Thanks for helping. This guide explains how a contribution goes from idea to live. Issues and pull requests are welcome in English or Dutch.

## Workflow

1. **Pick or open an issue.** Comment on the issue you take, so nobody does the same work twice. For bigger changes, discuss first in the issue.
2. **Create a branch** from `main`, for example `fix/hint-on-phone` or `setting/circus`.
3. **Work locally** with `npm run dev`. The server rebuilds the site on every page load, so you only refresh.
4. **Test** with `npm test`. It runs:
   - `tests/core.test.mjs`: the generator makes valid puzzles with exactly one solution.
   - `tests/smoke.mjs`: every page, language, and setting loads without errors, and the feedback button works.
   - `tests/e2e.mjs`: a full play session at phone and tablet sizes.
5. **Open a pull request** and fill in the template. Add a screenshot for visual changes. The tests run automatically.
6. After review and merge, your change is live within a few minutes.

The browser tests use Playwright. Run `npx playwright install chromium` once, or skip it if Google Chrome is installed: the tests then use that.

## Translations

All player-facing text lives in a few places per language:

| File | What it holds |
|---|---|
| `src/3d/i18n/<lang>.js` | 3D game interface and clue grammar |
| `src/3d/themes/<id>.js` → `i18n.<lang>` | Names of rooms, objects, and victims, and story lines per setting |
| `src/classic/i18n/<lang>.js` | Classic 2D version and print layout |
| `src/site/<lang>/index.html` | Landing page |
| `src/shared/feedback.js` | Feedback dialog |

To add a language, copy the English files, translate them, and add the language code to `LANGS` in `scripts/build.mjs`. The build then creates `/<lang>/`, `/<lang>/3d/`, and `/<lang>/classic/`. Clues are built from sentence fragments, so check the grammar in the game itself: articles, word order, and gendered pronouns differ per language.

## Agreements

- **Language:** every player-facing string goes through the translation files, in every supported language. Code, comments, and commit messages are in English.
- **No external assets:** models and textures are procedural (geometry and canvas). Don't load anything from other sites at runtime: three.js and the fonts are served from `vendor/`, so the game also works offline and in the app.
- **Puzzle logic:** changes to `src/core.js` change the puzzle behind every case number. Only do this when needed, and mention it in your pull request.
- **Performance:** the game must run smoothly on an ordinary phone. Keep the number of draw calls low (see [docs/THEMES.md](docs/THEMES.md)).
- **Originality:** don't use names, puzzles, text, or images from existing puzzle books or games. All puzzles come from the project's own generator.

## Work with an AI agent

Agents read [AGENTS.md](AGENTS.md) automatically. Check the result in the browser yourself before you open a pull request: tests catch errors, but not whether something looks right.

## License

By contributing, you agree that your contribution is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE), like the rest of the project. You also grant Jeroen Marchand a perpetual, worldwide, royalty-free, irrevocable license to use, change, sublicense, and distribute your contribution under any terms, including commercial ones. You confirm that the contribution is your own work and that you have the right to grant this.
