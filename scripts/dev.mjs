// npm run dev: serves the site and rebuilds on every page load, so you only refresh the browser.
import { build } from './build.mjs';
import { serve } from './serve.mjs';

const port = Number(process.env.PORT) || 5173;
build();
const { url } = await serve(port, req => {
  if (/\/$|\.html$/.test(new URL(req.url, 'http://x').pathname)) {
    try { build() } catch (e) { console.error(e) }
  }
});
console.log(`Murder Sudoku dev server: ${url}\n  3D:      ${url}3d/   (Dutch: ${url}nl/3d/)\n  Classic: ${url}classic/\n  Tip: ${url}3d/?theme=space#medium-75 forces a setting and a case.`);
