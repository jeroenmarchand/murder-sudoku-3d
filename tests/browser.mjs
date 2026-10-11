// Shared Playwright setup: serves dist/ and launches Chromium.
// Uses Playwright's own Chromium when installed (CI, Codespaces), otherwise your installed Google Chrome.
import { chromium, devices } from 'playwright';
import { serve } from '../scripts/serve.mjs';

export { devices };
export async function start() {
  const { server, url } = await serve(0);
  const args = ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
  let browser;
  try { browser = await chromium.launch({ args }) }
  catch { browser = await chromium.launch({ channel: 'chrome', args }) }
  return { browser, url, async stop() { await browser.close(); server.close() } };
}

// Collects page errors, ignoring failed network requests for optional assets.
export function watchErrors(page) {
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => m.type() === 'error' && !/404|Failed to load resource/.test(m.text()) && errs.push(m.text()));
  return errs;
}

export const ready3d = (page, timeout = 60000) => page.waitForFunction(() => window.__dbg && __dbg.P && document.querySelector('#loader.off') && __dbg.busy === 0, null, { timeout });
