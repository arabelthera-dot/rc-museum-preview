// B6 acceptance plan for day 12 — «Одна картинка — три противоположные подписи».
// Self-contained: shared assertions cover only the shared quiz/score contracts.
export const dependencies = [];
const QUIZ = '#gcQuiz';
const ANSWERS = [1, 2, 0];
const VERS = { praise: ['hp', 'rp'], joke: ['hj', 'rj'], accuse: ['ha', 'ra'] }; // two phrases per version, in order
const MAIN_SCORE = 65; // three first phrases (3×5) + three assembled versions (20) + three dossiers (3×10)
const score = async (p) => Number(await p.locator('#headScore').innerText());
const ready = async (p) => { await p.emulateMedia({ reducedMotion: 'reduce' }); };
async function quiz(p, answers) {
  for (const [i, a] of answers.entries()) {
    await p.locator(QUIZ + ' .q').nth(i).locator('.quizopt').nth(a).click();
  }
}
async function main(p, c) {
  for (const v of Object.keys(VERS)) {
    await p.locator('.vd-tab[data-v="' + v + '"]').click();
    for (const k of VERS[v]) await p.locator('.key-btn[data-k="' + k + '"]').click();
  }
  if (c) {
    c('Three versions assembled', await p.locator('.vd-card.on').count(), 3);
    c('Six phrases placed and locked', await p.locator('.key-btn:disabled').count(), 6);
    c('Six phrase notes shown', await p.locator('#vdNotes .key-note').count(), 6);
    c('All-versions badge shown', await p.locator('#vdDone').isVisible(), true);
    c('Verdict names the caption as the verdict', await p.locator('#gcVerdictText').innerText().then((s) => s.includes('подпись')), true);
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
    c('Placed phrases are disabled', await p.locator('.key-btn:disabled').count(), 6);
    c('Used dossier controls are disabled', await p.locator('#gcDossier button:disabled').count(), 3);
    c('No duplicate main reward', await score(p), MAIN_SCORE);
  },
  empty: async ({ page: p, step, check: c }) => {
    await ready(p);
    await step('Inspect concrete activity contents', async () => {
      c('Six phrases offered', await p.locator('.key-btn').count(), 6);
      c('Sheet waits without a caption', (await p.locator('#vdRead').innerText()).includes('без подписи'), true);
      c('No phrase placed yet', await p.locator('.vd-slot.on').count(), 0);
      c('Three versions offered', await p.locator('.vd-card').count(), 3);
      c('No verdict yet', await p.locator('#gcVerdict').isVisible(), false);
    });
    c('Promised quiz count', await p.locator(QUIZ + ' .q').count(), ANSWERS.length);
    await step('Try a phrase from a foreign version', () => p.locator('.key-btn[data-k="hj"]').click());
    c('A foreign phrase earns nothing', await score(p), 0);
    c('Foreign phrase is marked as a dead end', await p.locator('#vdNotes .key-note.miss').count(), 1);
  },
};
