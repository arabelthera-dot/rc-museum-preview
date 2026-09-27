import { chromium } from 'playwright';
import fs from 'node:fs';
const root = process.argv[2], page_path = process.argv[3], out = process.argv[4];
const b = await chromium.connectOverCDP(process.env.PLAYWRIGHT_CDP || 'http://chrome:9222');
const ctx = b.contexts()[0] || await b.newContext();
const p = await ctx.newPage();
await p.goto('file://' + root + '/' + page_path, { waitUntil: 'domcontentloaded' });
const r = await p.evaluate(async () => {
  const v = document.querySelector('#film video');
  if (!v) return { error: 'video not found' };
  v.preload = 'metadata'; v.load();
  await new Promise((res, rej) => {
    if (v.readyState >= 1) return res();
    v.addEventListener('loadedmetadata', res, { once: true });
    v.addEventListener('error', () => rej(new Error('media error')), { once: true });
    setTimeout(() => rej(new Error('timeout 20s')), 20000);
  });
  const src = v.querySelector('source')?.getAttribute('src');
  const dl = [...document.querySelectorAll('#film a[download]')].map(a => a.getAttribute('href'));
  const img = new Image(); img.src = v.getAttribute('poster');
  await new Promise(res => { img.onload = res; img.onerror = res; });
  return { duration: v.duration, readyState: v.readyState, currentSrc: v.currentSrc.split('/').pop(),
           source_attr: src, download: dl, poster: v.getAttribute('poster'), poster_w: img.naturalWidth,
           actno: document.querySelector('#film .actno')?.textContent, aborted: v.error?.message || null };
});
r.duration_rounded = r.duration != null ? Math.round(r.duration * 100) / 100 : null;
r.duration_ok_65_33 = r.duration != null && Math.abs(r.duration - 65.33) <= 0.05;
fs.writeFileSync(out, JSON.stringify(r, null, 2) + '\n');
console.log(JSON.stringify(r, null, 2));
await p.close(); await b.close();
