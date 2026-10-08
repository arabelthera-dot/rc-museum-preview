// B6 acceptance plan for day 11 — «Иван Теребенев: художник после события».
// Self-contained: shared assertions cover only the shared quiz/score contracts.
export const dependencies = [];
const QUIZ = '#gcQuiz';
const ANSWERS = [1, 1, 0];
const CHAIN = ['sobytie', 'rasskaz', 'eskiz', 'list', 'pamyat']; // five real links, in order
const MAIN_SCORE = 65; // three first links (3×5) + assembled chain (20) + three dossiers (3×10)
const score = async (p) => Number(await p.locator('#headScore').innerText());
const ready = async (p) => { await p.emulateMedia({ reducedMotion: 'reduce' }); };
async function quiz(p, answers) {
  for (const [i, a] of answers.entries()) {
    await p.locator(QUIZ + ' .q').nth(i).locator('.quizopt').nth(a).click();
  }
}
async function main(p, c) {
  await p.locator('.key-btn[data-k="' + CHAIN[0] + '"]').click();
  if (c) {
    c('Chain starts with the event', (await p.locator('#chRead').innerText()).includes('Событие'), true);
  }
  for (const k of CHAIN.slice(1)) {
    await p.locator('.key-btn[data-k="' + k + '"]').click();
  }
  if (c) {
    c('Five links placed in order', await p.locator('#chSlots .ch-slot.on').count(), 5);
    c('Five link notes shown', await p.locator('#chNotes .key-note').count(), 5);
    c('Chain-complete badge shown', await p.locator('#chDone').isVisible(), true);
    c('Verdict names where the legend appeared', await p.locator('#gcVerdictText').innerText().then((s) => s.includes('память')), true);
  }
  const d = p.locator('#gcDossier button');
  for (let i = 0; i < 3; i++) await d.nth(i).click();
  if (c) {
    c('Three dossiers opened', await p.locator('#gcDossier .gc-doc').count(), 3);
  }
}
async function share(p, c) {
  await p.evaluate(() => Object.defineProperty(navigator, 'share', { configurable: true, value: async () => { throw new DOMException('Cancelled', 'AbortError'); } }));
  await p.locator('#gcShare').click();
  c('Cancelled share earns nothing', await score(p), MAIN_SCORE + 30);
  await p.evaluate(() => Object.defineProperty(navigator, 'share', { configurable: true, value: async () => {} }));
  await p.locator('#gcShare').click();
  await p.waitForTimeout(50);
  await p.locator('#gcShare').click();
}
const earn = async (p, c) => { await main(p, c); await quiz(p, ANSWERS); await share(p, c); };
const repeatQuiz = (p) => p.locator(QUIZ + ' .q').first().locator('.quizopt').nth(ANSWERS[0]).click();

export const scenarios = {
  entry: async ({ page: p, step, check: c }) => {
    await ready(p);
    c('Fresh score', await score(p), 0);
    await step('Choose correct first answer', () => p.locator(QUIZ + ' .q').first().locator('.quizopt').nth(ANSWERS[0]).click());
    await p.waitForTimeout(100);
    await p.reload();
    c('Session-only answer cleared on reload', await score(p), 0);
  },
  wrong: async ({ page: p, step, check: c }) => {
    await ready(p);
    const q = p.locator(QUIZ + ' .q').first();
    await step('Choose wrong answer', () => q.locator('.quizopt').nth(0).click());
    c('Wrong answer earns nothing', await score(p), 0);
    c('Explanation available', (await q.innerText()).includes('Не совсем'), true);
    await p.waitForTimeout(50);
    const b = q.locator('.quizopt').nth(ANSWERS[0]);
    await b.scrollIntoViewIfNeeded();
    const r = await b.boundingBox();
    await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
    c('Repeated answer earns nothing', await score(p), 0);
  },
  reset: async ({ page: p, step, check: c }) => {
    await ready(p);
    await step('Complete main action', () => main(p, c));
    c('Main action reward', await score(p), MAIN_SCORE);
    await step('Reset using browser new visit', () => p.reload());
    await main(p, c);
    c('Repeating after reset earns once', await score(p), MAIN_SCORE);
  },
  mobile: async ({ page: p, step, check: c, width }) => {
    await ready(p);
    await step('Complete page-specific action and quiz', () => earn(p, c));
    c('Maximum at ' + width, await score(p), 100);
    c('No horizontal overflow', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  },
  nojs: async ({ page: p, step, check: c }) => {
    await step('Read no-JavaScript explanation', () => p.locator('noscript p').first().scrollIntoViewIfNeeded());
    c('Static explanation visible', await p.locator('noscript p').first().isVisible(), true);
    c('Originals available without JavaScript', await p.locator('figure img').count() > 0, true);
  },
  score: async ({ page: p, step, check: c }) => {
    await ready(p);
    await step('Earn all stated rewards', () => earn(p, c));
    c('Reachable maximum', await score(p), 100);
    await repeatQuiz(p);
    c('Repeat does not exceed maximum', await score(p), 100);
  },
  main: async ({ page: p, step, check: c }) => {
    await ready(p);
    await step('Run subject-specific main action', () => main(p, c));
    c('Main action reward', await score(p), MAIN_SCORE);
    c('Placed link buttons are disabled', await p.locator('.key-btn:disabled').count(), 5);
    c('Used dossier controls are disabled', await p.locator('#gcDossier button:disabled').count(), 3);
    c('No duplicate main reward', await score(p), MAIN_SCORE);
  },
  empty: async ({ page: p, step, check: c }) => {
    await ready(p);
    await step('Inspect concrete activity contents', async () => {
      c('Eight links offered', await p.locator('.key-btn').count(), 8);
      c('Chain is empty at start', (await p.locator('#chRead').innerText()).includes('Цепочка пуста'), true);
      c('No link placed yet', await p.locator('#chSlots .ch-slot.on').count(), 0);
      c('Three dossiers offered', await p.locator('#gcDossier button').count(), 3);
      c('No verdict yet', await p.locator('#gcVerdict').isVisible(), false);
    });
    c('Promised quiz count', await p.locator(QUIZ + ' .q').count(), ANSWERS.length);
    await step('Try an extra link of the chain', () => p.locator('.key-btn[data-k="sluh"]').click());
    c('An extra link earns nothing', await score(p), 0);
    c('Extra link is marked as a dead end', await p.locator('#chNotes .key-note.miss').count(), 1);
  },
};
