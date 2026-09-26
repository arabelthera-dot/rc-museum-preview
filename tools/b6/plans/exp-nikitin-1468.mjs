/* План B6 для чужой живой страницы — muzei/pervoprohodcy/exp-nikitin-1468.html.
   Музей «Русские первопроходцы» (владелец — Дипсик 1). Страница НЕ правится:
   это доказательство работы общего прогонщика на чужой странице, а не сдача музея.

   Механики страницы (muzei/pervoprohodcy/nikitin/page.js):
     #pohod  — «поход по решениям», 6 развилок × 10 = 60
     #order  — порядок трёх морей, 20
     #quiz   — два вопроса × 10 = 20
     #result — progress max=100
   Объявленный максимум: 60 + 20 + 20 = 100.

   Честные границы (см. omissions): у страницы нет <noscript> и нет текстового
   эквивалента вместо игры, поэтому код nojs объявлен нарочно падающим —
   это настоящий дефект страницы, а не пробел доказательства. */

export const omissions = {
  nojs: 'У страницы нет <noscript> и текстового эквивалента вместо обещанной игры: ' +
        'без JavaScript #pohodbox, #sea-buttons и #quiz-box пусты. Сценарий оставлен ' +
        'и падает на этом утверждении нарочно — код не закрыт, а предъявлен дефект.',
};

const score = async page => Number(await page.locator('#score').innerText());

const journey = async (page, decisions = 6) => {
  for (let i = 0; i < decisions; i++) {
    await page.locator('#pohodbox .journey-option').first().click();
    await page.locator('#pohodbox button.gbtn').first().click();
  }
};
const seas = async page => {
  for (const n of [0, 1, 2]) await page.locator(`#sea-buttons button[data-sea="${n}"]`).click();
};
const quiz = async page => {
  await page.locator('#quiz-box .quiz-question').nth(0).locator('.quiz-options button').nth(1).click();
  await page.locator('#quiz-box .quiz-question').nth(1).locator('.quiz-options button').nth(2).click();
};
const earnAll = async page => { await journey(page); await seas(page); await quiz(page); };

export const scenarios = {
  async entry({page, check, step}) {
    check('Первый вход: счёт 0', await score(page), 0);
    check('Итог тоже 0', Number(await page.locator('#result-score').innerText()), 0);
    check('Звание первого входа', await page.locator('#rank').innerText(), 'Читатель дороги');
    check('Поход стоит на первом решении',
      (await page.locator('#pohodbox .journey-header').innerText()).includes('Решение 1 / 6'), true);
    check('Три варианта на развилке', await page.locator('#pohodbox .journey-option').count(), 3);
    await step('Пройти первую развилку', () => page.locator('#pohodbox .journey-option').first().click());
    check('Награда за пройденную развилку', await score(page), 10);
    await step('Новый вход в браузере', () => page.reload());
    check('Непройденное не выдаётся за пройденное', await score(page), 0);
  },

  async wrong({page, check, step}) {
    await step('Назвать море не первым', () => page.locator('#sea-buttons button[data-sea="2"]').click());
    check('Ошибка объяснена', await page.locator('#sea-feedback').innerText(),
      'Пока не так. Начни с моря у устья Волги; Чёрное будет на обратном пути.');
    check('Неверный порядок не даёт очков', await score(page), 0);
    await step('Неверный ответ в викторине',
      () => page.locator('#quiz-box .quiz-question').nth(0).locator('.quiz-options button').nth(0).click());
    check('Объяснение предлагает подумать',
      (await page.locator('#quiz-box .quiz-question').nth(0).locator('.feedback').innerText())
        .startsWith('Попробуй ещё раз.'), true);
    check('Неверный ответ не даёт очков', await score(page), 0);
    check('Верный вариант не объявлен ошибочным',
      await page.locator('#quiz-box .quiz-question').nth(0).locator('.quiz-options button').nth(1).isDisabled(), false);
    await step('Повтор неверного ответа',
      () => page.locator('#quiz-box .quiz-question').nth(0).locator('.quiz-options button').nth(0).click());
    check('Повтор неверного ответа не даёт очков', await score(page), 0);
  },

  async reset({page, check, step}) {
    await step('Собрать порядок морей', () => seas(page));
    check('Порядок морей даёт 20', await score(page), 20);
    await step('Начать порядок заново', () => page.locator('#sea-reset').click());
    check('Кнопки снова доступны',
      await page.locator('#sea-buttons button[data-sea="0"]').isDisabled(), false);
    check('Подсказка вернулась к началу', await page.locator('#sea-feedback').innerText(),
      'Первое море → второе → третье');
    await step('Повторить порядок после сброса', () => seas(page));
    check('Сброс не накапливает награду', await score(page), 20);
  },

  async mobile({page, check, step, width}) {
    await step('Полный набор действий', () => earnAll(page));
    check(`Максимум на ${width}`, await score(page), 100);
    check('Нет горизонтального переполнения',
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  },

  async nojs({page, check, step}) {
    check('Предметный рассказ читается без JavaScript',
      (await page.locator('#story').innerText()).length > 500, true);
    check('Источники читаются без JavaScript',
      (await page.locator('#sources').innerText()).length > 100, true);
    await step('Найти текстовый эквивалент вместо игры',
      () => page.locator('#pohodbox noscript, #quiz noscript, #order noscript').first().scrollIntoViewIfNeeded());
    check('Есть текстовый эквивалент вместо пустой обещанной игры',
      await page.locator('#pohodbox noscript, #quiz noscript, #order noscript').count(), 1);
  },

  async score({page, check, step}) {
    await step('Полный набор уникальных наград', () => earnAll(page));
    check('Объявленный максимум 100 достижим', await score(page), 100);
    check('Шкала заполнена', await page.locator('#progress').evaluate(e => e.value), 100);
    check('Звание за максимум', await page.locator('#rank').innerText(), 'Хранитель дорожных записок');
    await step('Повторить развилку сверх максимума',
      () => page.locator('#pohodbox button.gbtn').first().click());
    check('Повтор не переполняет максимум', await score(page), 100);
  },

  async main({page, check, step}) {
    await step('Пройти первую развилку', () => page.locator('#pohodbox .journey-option').first().click());
    check('Главное действие даёт 10', await score(page), 10);
    await step('Повторить выбор на той же развилке',
      () => page.locator('#pohodbox button.gbtn').first().click());
    check('Повтор не начисляет дважды', await score(page), 10);
    await step('Дойти до итога похода', () => journey(page, 5));
    check('Шесть решений засчитаны по одному разу', await score(page), 60);
    check('Итог похода назван',
      (await page.locator('#pohodbox').innerText()).includes('Путь пройден · 6 решений'), true);
  },

  async empty({page, check, step}) {
    check('Развилка обещает три варианта', await page.locator('#pohodbox .journey-option').count(), 3);
    check('Обещаны три моря', await page.locator('#sea-buttons button[data-sea]').count(), 3);
    check('Обещаны два вопроса', await page.locator('#quiz-box .quiz-question').count(), 2);
    check('У каждого вопроса есть варианты',
      await page.locator('#quiz-box .quiz-question').nth(0).locator('.quiz-options button').count(), 3);
    await step('Осмотреть итоговый блок', async () => {
      check('Знаменатель итога 100', await page.locator('#progress').getAttribute('max'), '100');
      check('Итог объясняет состав очков',
        (await page.locator('#result').innerText()).includes('Игра — 60, порядок морей — 20, два вопроса — 20'), true);
    });
    check('Подпись об источниках называет основу рассказа',
      (await page.locator('#sources').innerText()).includes('Хождения за три моря'), true);
  }
};
