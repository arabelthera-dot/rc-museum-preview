(() => {
  const grid = document.querySelector('#museum-grid');
  const count = document.querySelector('#result-count');
  const empty = document.querySelector('#empty');
  const query = document.querySelector('#query');
  const category = document.querySelector('#category');
  const availability = document.querySelector('#availability');
  let museums = [];
  let routes = [];
  let lastResultCount = null;
  const museumsUrl = document.body.dataset.museumsUrl || 'assets/portal-museums.json';
  const routesUrl = document.body.dataset.routesUrl || 'assets/portal-routes.json';
  const targetPrefix = document.body.dataset.targetPrefix || '../';

  const normalize = value => value.toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').replace(/[^а-яa-z0-9]+/g, ' ').trim();
  const escape = value => String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);

  function render() {
    const words = normalize(query.value).split(' ').filter(Boolean);
    const selectedCategory = category.value;
    const selectedAvailability = availability.value;
    const filtered = museums.filter(museum => {
      const haystack = normalize(`${museum.title_ru} ${museum.promise_ru} ${museum.category_title_ru} ${museum.search_terms_ru.join(' ')}`);
      return (!words.length || words.every(word => haystack.includes(word)))
        && (!selectedCategory || museum.category_id === selectedCategory)
        && (!selectedAvailability || museum.status === selectedAvailability);
    });

    grid.innerHTML = filtered.map(museum => `<article class="museum ${museum.status}">
      <div class="museum-top"><span class="number">${String(museum.number).padStart(2, '0')}</span><span>${escape(museum.category_title_ru)}</span></div>
      <h3>${escape(museum.title_ru)}</h3>
      <p>${escape(museum.promise_ru)}</p>
      ${museum.status === 'open'
        ? `<a href="${escape(targetPrefix + museum.public_path)}">Войти в музей →</a>`
        : '<span class="planned-note">Создаётся · содержание ещё не открыто</span>'}
    </article>`).join('');
    count.textContent = `Найдено: ${filtered.length} из ${museums.length}`;
    empty.hidden = filtered.length > 0;
    lastResultCount = filtered.length;
  }

  function renderRoutes() {
    const routeGrid = document.querySelector('#route-grid');
    routeGrid.innerHTML = routes.map(route => `<article class="route-card ${route.status === 'review_required' ? 'review' : ''}">
      <span class="route-meta">${escape(route.entry_label_ru)}${route.estimated_minutes ? ` · около ${route.estimated_minutes} минут` : ' · готовится'}</span>
      <h3>${escape(route.title_ru)}</h3>
      <p>${escape(route.promise_ru)}</p>
      ${route.status === 'work' ? `<a class="route-start" href="route.html?id=${encodeURIComponent(route.route_id)}" data-route-start="${escape(route.route_id)}">Пройти маршрут по шагам →</a>` : ''}
      ${route.status === 'work' ? `<ol>${route.stops.map((stop, index) => `<li><a href="${escape(targetPrefix + stop.path)}" data-route-id="${escape(route.route_id)}" data-stop-index="${index + 1}" data-museum-id="${escape(stop.museum_id)}">${escape(stop.title_ru)} →</a><span>${escape(stop.reason_ru)}</span></li>`).join('')}</ol>` : '<p><strong>Пока без ссылки.</strong> Наличие игры ещё не доказывает, что материал подходит ребёнку.</p>'}
      <p class="route-result"><strong>После маршрута:</strong> ${escape(route.visitor_result_ru)}</p>
    </article>`).join('');
  }

  document.querySelector('#search-form').addEventListener('submit', event => {
    event.preventDefault();
    render();
    window.rcPortalTrack?.('portal_search', { query_length: query.value.trim().length, result_count: lastResultCount });
    if (lastResultCount === 0) window.rcPortalTrack?.('portal_search_zero', { query_length: query.value.trim().length });
    document.querySelector('#results-title').focus?.();
  });
  query.addEventListener('input', render);
  category.addEventListener('change', () => { render(); window.rcPortalTrack?.('portal_filter', { filter_name: 'category', filter_value: category.value || 'all', result_count: lastResultCount }); });
  availability.addEventListener('change', () => { render(); window.rcPortalTrack?.('portal_filter', { filter_name: 'availability', filter_value: availability.value || 'all', result_count: lastResultCount }); });
  document.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => { query.value = button.dataset.query; render(); query.focus(); }));
  document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => { query.value = ''; category.value = button.dataset.category; render(); category.focus(); }));
  document.querySelector('#reset').addEventListener('click', () => { query.value = ''; category.value = ''; availability.value = ''; render(); query.focus(); });
  document.querySelector('#route-grid').addEventListener('click', event => {
    const start = event.target.closest('[data-route-start]');
    if (start) window.rcPortalTrack?.('portal_route_start', { route_id: start.dataset.routeStart });
    const link = event.target.closest('[data-route-id]');
    if (!link) return;
    window.rcPortalTrack?.('portal_route_open', { route_id: link.dataset.routeId, stop_index: Number(link.dataset.stopIndex), museum_id: link.dataset.museumId });
  });

  const questionForm = document.querySelector('#question-form');
  const questionInput = document.querySelector('#question');
  const questionStatus = document.querySelector('#question-status');
  questionInput.addEventListener('input', () => { document.querySelector('#question-count').textContent = `${questionInput.value.length} / 1000`; });
  questionForm.addEventListener('submit', event => {
    event.preventDefault();
    const text = questionInput.value.trim();
    const errors = [];
    if (document.querySelector('#website').value) errors.push('Сработала защита от автоматической отправки.');
    if (text.length < 20 || text.length > 1000) errors.push('Нужно от 20 до 1000 знаков.');
    if ((text.match(/https?:\/\/|www\./gi) || []).length > 1) errors.push('Допустима только одна ссылка.');
    if (/\b[\w.+-]+@[\w.-]+\.[a-zа-я]{2,}\b/iu.test(text)) errors.push('Удали электронную почту.');
    if (/(?:\+?7|8)[\s()\-]*\d{3}[\s()\-]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}/.test(text)) errors.push('Удали номер телефона.');
    if (!document.querySelector('#question-confirm').checked) errors.push('Подтверди отсутствие персональных данных и отложенный режим ответа.');
    questionStatus.className = `form-status ${errors.length ? 'error' : 'success'}`;
    questionStatus.textContent = errors.length ? errors.join(' ') : 'Локальная проверка пройдена. Вопрос не отправлен и не сохранён: очередь ещё не подключена.';
    questionStatus.focus?.();
  });

  Promise.all([museumsUrl, routesUrl].map(url => fetch(url).then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })))
    .then(([museumData, routeData]) => {
      museums = museumData.museums;
      routes = routeData.routes;
      const categories = [...new Map(museums.map(museum => [museum.category_id, museum.category_title_ru])).entries()];
      category.insertAdjacentHTML('beforeend', categories.map(([id, title]) => `<option value="${escape(id)}">${escape(title)}</option>`).join(''));
      render();
      renderRoutes();
    })
    .catch(() => {
      count.textContent = 'Каталог временно недоступен.';
      document.querySelector('#route-grid').innerHTML = '<p>Маршруты временно недоступны: рабочая сборка не показывает неполные данные.</p>';
      empty.hidden = false;
      empty.querySelector('h3').textContent = 'Каталог не загрузился';
      empty.querySelector('p').textContent = 'Рабочая сборка остановлена, чтобы не показывать неполный список.';
    });
})();
