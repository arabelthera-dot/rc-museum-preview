/* Шаблон плана B6. Копируй в plans/<слаг>.mjs и заполняй под свою страницу.
   Ничего не выдумывать: каждое утверждение обязано быть проверкой настоящего
   поведения страницы. Незаполненный сценарий лучше удалить — он останется
   НЕ ПРОВЕРЕНО и это честнее зелёного на пустом месте.

   Восемь кодов договора и что каждый обязан доказать (формулировки — из
   tools/audit-pages.py, B6_CODES):
     entry  — первый вход: чистый контекст без наград за непройденное,
              восстановленный прогресс соответствует пройденным действиям
     wrong  — неверный ответ: понятное объяснение, верный ответ не объявлен
              ошибочным, повтор не добавляет очков
     reset  — начать заново: повтор без ручной очистки браузера,
              сброс не накапливает повторные награды
     mobile — 390 и 1440 px: одинаковые действия дают одинаковый результат и очки
     nojs   — JavaScript отключён: предметный смысл читается, есть текстовый
              эквивалент вместо пустой обещанной игры
     score  — знаменатель счёта 100, объявленный максимум достижим полным
              набором уникальных наград без переполнения
     main   — главный предметный интерактив даёт очки и не начисляет их повторно
     empty  — каждый обещанный интерактив содержателен, подпись об источниках
              соответствует фактической базе

   Импортируемые помощники перечисли в dependencies — они войдут в SHA конверта. */

// export const dependencies = ['./helpers.mjs'];

// Свои читатели состояния страницы. Держи их рядом с планом: они тоже часть доказательства.
const score = async page => Number(await page.locator('#score').innerText());

// Действие, дающее максимальную награду. Им пользуются mobile/score/reset —
// так один и тот же путь проверяется на всех ширинах одинаково.
const earnAll = async (page, check) => { /* … */ };

export const omissions = {
  // Оставь здесь причину для каждого кода, который на странице проверять нечем.
  // Пример: wrong: 'У страницы нет викторины и дистракторов — договор B6 не к чему приложить.',
};

export const scenarios = {
  async entry({page, check, step}) {
    check('Пустой контекст: счёт 0', await score(page), 0);
    await step('Первый шаг главного интерактива', () => page.locator('#main-action').click());
    check('Награда за пройденное', await score(page), 10);
    await page.reload();
    check('Перезагрузка не сохраняет непройденное', await score(page), 0);
  },

  async wrong({page, check, step}) {
    await step('Неверный выбор', () => page.locator('#wrong-option').click());
    check('Объяснение показано', (await page.locator('#feedback').innerText()).length > 0, true);
    check('Неверный ответ не даёт очков', await score(page), 0);
    await step('Повтор неверного ответа', () => page.locator('#wrong-option').click());
    check('Повтор не даёт очков', await score(page), 0);
  },

  async reset({page, check, step}) {
    await step('Набрать награду', () => page.locator('#main-action').click());
    check('Награда набрана', await score(page), 10);
    await step('Штатный сброс страницы', () => page.locator('#reset').click());
    await step('Повторить то же действие', () => page.locator('#main-action').click());
    check('Сброс не удваивает награду', await score(page), 10);
  },

  async mobile({page, check, step, width}) {
    await step('Полный набор действий', () => earnAll(page, check));
    check(`Максимум на ${width}`, await score(page), 100);
    check('Нет горизонтального переполнения',
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  },

  async nojs({page, check}) {
    check('Предметный текст читается без JavaScript',
      (await page.locator('#story').innerText()).length > 200, true);
    check('Есть текстовый эквивалент вместо пустой игры',
      await page.locator('#game noscript').count(), 1);
  },

  async score({page, check, step}) {
    await step('Полный набор уникальных наград', () => earnAll(page, check));
    check('Объявленный максимум достижим', await score(page), 100);
    await step('Повтор главного действия', () => page.locator('#main-action').click());
    check('Повтор не переполняет максимум', await score(page), 100);
  },

  async main({page, check, step}) {
    await step('Главное предметное действие', () => page.locator('#main-action').click());
    check('Главное действие даёт очки', await score(page), 10);
    await step('Повтор главного действия', () => page.locator('#main-action').click());
    check('Повтор не начисляет дважды', await score(page), 10);
  },

  async empty({page, check, step}) {
    await step('Осмотреть обещанное содержимое', async () => {
      check('Обещанные элементы на месте', await page.locator('#game .item').count() > 0, true);
      check('Знаменатель счёта 100',
        await page.locator('#progress').getAttribute('max'), '100');
    });
    check('Подпись об источниках непустая',
      (await page.locator('#sources').innerText()).length > 100, true);
  }
};
