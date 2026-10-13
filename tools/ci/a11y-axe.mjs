#!/usr/bin/env node
/* Доступность страниц по WCAG 2.2 AA — axe-core (Deque) через Playwright, мировой стандарт
   из руководства Playwright «Accessibility testing». Замена самодельного tools/a11y.py
   (опись самоделок 12.10): та видит только статику, axe — живую страницу, контраст поверх
   картинок и то, что навешано из JS.
   Своё здесь одно: страницу прокручиваем до конца и ждём — блоки на сайте проявляются
   при прокрутке, без этого axe ловит текст полупрозрачным (на пробе 26 ложных из 33).
   Запуск: node tools/ci/a11y-axe.mjs стр1.html [стр2.html …]  → код 1, если есть нарушения. */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const pages = process.argv.slice(2);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
const rows = [];
let total = 0;

for (const p of pages) {
  const page = await ctx.newPage();
  try {
    await page.goto('file://' + resolve(p), { waitUntil: 'load', timeout: 60000 });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        scrollTo(0, y); await new Promise(r => setTimeout(r, 80));
      }
      scrollTo(0, 0);
    });
    await page.waitForTimeout(1500);
    const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const n = r.violations.reduce((s, v) => s + v.nodes.length, 0);
    total += n;
    console.log(`${n ? '✗' : '✓'} ${p}: нарушений ${n}`);
    for (const v of r.violations) {
      console.log(`   ${v.id} ×${v.nodes.length} — ${v.help}`);
      const x = v.nodes[0];
      console.log(`     напр.: ${x.target.join(' ')}  ${x.html.slice(0, 90).replace(/\s+/g, ' ')}`);
    }
    rows.push(`| ${p} | ${n} | ${r.violations.map(v => `${v.id} ×${v.nodes.length}`).join(', ') || '—'} |`);
  } catch (e) {
    total += 1;
    console.log(`✗ ${p}: не открылась — ${e.message.split('\n')[0]}`);
    rows.push(`| ${p} | ошибка | ${e.message.split('\n')[0]} |`);
  }
  await page.close();
}
await browser.close();

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    `### Доступность (axe-core, WCAG 2.2 AA): страниц ${pages.length}, нарушений ${total}\n\n` +
    `| Страница | Нарушений | Правила |\n|---|---|---|\n${rows.join('\n')}\n`);
}
console.log(`\nИТОГ: страниц ${pages.length}, нарушений ${total}`);
process.exit(total ? 1 : 0);
