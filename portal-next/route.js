(() => {
  const routesUrl = document.body.dataset.routesUrl || 'assets/portal-routes.json';
  const targetPrefix = document.body.dataset.targetPrefix || '../';
  const routeId = new URLSearchParams(location.search).get('id');
  const escape = value => String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  const stateKey = `rc-route:${routeId || 'unknown'}`;
  let route;
  let state = { opened: [], completed: [], completionTracked: false };

  try { state = { ...state, ...JSON.parse(sessionStorage.getItem(stateKey) || '{}') }; } catch { /* Начинаем маршрут заново при повреждённом локальном состоянии. */ }
  const save = () => sessionStorage.setItem(stateKey, JSON.stringify(state));

  function render() {
    const steps = document.querySelector('#route-steps');
    const chooseOne = route.mode === 'choose_one';
    const completionTarget = chooseOne ? 1 : route.stops.length;
    const finished = state.completed.length >= completionTarget;
    steps.innerHTML = route.stops.map((stop, index) => {
      const opened = state.opened.includes(index);
      const done = state.completed.includes(index);
      return `<article class="route-step ${done ? 'done' : ''}" data-step="${index}">
        <p class="eyebrow">${chooseOne ? 'Вариант' : 'Остановка'} ${index + 1} из ${route.stops.length}${done ? ' · пройден' : ''}</p>
        <h2>${escape(stop.title_ru)}</h2>
        <p>${escape(stop.reason_ru)}</p>
        <div class="route-actions">
          <a href="${escape(targetPrefix + stop.path)}" target="_blank" rel="noopener" data-open-step="${index}">Открыть материал в новой вкладке →</a>
          <button type="button" data-complete-step="${index}" ${((opened || done) && (!finished || done)) ? '' : 'disabled'}>${done ? 'История пройдена ✓' : 'Отметить как пройденную'}</button>
        </div>
      </article>`;
    }).join('');
    const completeCount = Math.min(state.completed.length, completionTarget);
    document.querySelector('#route-progress').max = completionTarget;
    document.querySelector('#route-progress').value = completeCount;
    document.querySelector('#route-progress-text').textContent = chooseOne ? `Выбрано историй: ${completeCount} из 1` : `Пройдено: ${completeCount} из ${route.stops.length}`;
    document.querySelector('#route-finish-title').textContent = chooseOne ? 'Одно открытие завершено' : 'Ты прошёл все остановки';
    document.querySelector('#route-finish').hidden = !finished;
    if (finished && !state.completionTracked) {
      window.rcPortalTrack?.('portal_route_complete', { route_id: route.route_id, stop_count: completionTarget, route_mode: route.mode, completion_mode: 'visitor_confirmed' });
      state.completionTracked = true;
      save();
      document.querySelector('#route-finish').focus();
    }
  }

  document.querySelector('#route-steps').addEventListener('click', event => {
    const open = event.target.closest('[data-open-step]');
    if (open) {
      const index = Number(open.dataset.openStep);
      if (!state.opened.includes(index)) state.opened.push(index);
      window.rcPortalTrack?.('portal_route_stop_open', { route_id: route.route_id, stop_index: index + 1, museum_id: route.stops[index].museum_id });
      save();
      render();
      return;
    }
    const complete = event.target.closest('[data-complete-step]');
    if (!complete) return;
    const index = Number(complete.dataset.completeStep);
    if (!state.opened.includes(index) || state.completed.includes(index)) return;
    state.completed.push(index);
    window.rcPortalTrack?.('portal_route_stop_complete', { route_id: route.route_id, stop_index: index + 1, museum_id: route.stops[index].museum_id, completion_mode: 'visitor_confirmed' });
    save();
    render();
  });

  document.querySelector('#route-reset').addEventListener('click', () => {
    state = { opened: [], completed: [], completionTracked: false };
    save();
    window.rcPortalTrack?.('portal_route_reset', { route_id: route.route_id });
    render();
    document.querySelector('#route-title').focus();
  });

  fetch(routesUrl).then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); }).then(data => {
    route = data.routes.find(item => item.route_id === routeId && item.status === 'work');
    if (!route) throw new Error('Маршрут не найден или ещё не прошёл проверку.');
    document.title = `${route.title_ru} — Русская цивилизация`;
    document.querySelector('#route-label').textContent = `${route.entry_label_ru} · около ${route.estimated_minutes} минут`;
    document.querySelector('#route-title').textContent = route.title_ru;
    document.querySelector('#route-title').tabIndex = -1;
    document.querySelector('#route-promise').textContent = route.promise_ru;
    document.querySelector('#route-result').textContent = route.visitor_result_ru;
    window.rcPortalTrack?.('portal_route_sheet_open', { route_id: route.route_id, stop_count: route.stops.length });
    render();
  }).catch(error => {
    document.querySelector('#route-title').textContent = 'Маршрут пока недоступен';
    document.querySelector('#route-promise').textContent = error.message;
    document.querySelector('#route-progress-text').textContent = 'Рабочая сборка остановлена, чтобы не показывать непроверенный путь.';
  });
})();
