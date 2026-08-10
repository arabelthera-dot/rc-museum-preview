/* «Русская цивилизация» — обезличенный адаптер аналитики музейного маршрута.
 * По умолчанию ничего не отправляет в сеть и ничего не сохраняет.
 * Внешний поставщик может быть подключён только через функцию
 * window.RC_ANALYTICS_PROVIDER после отдельного решения о согласии и хранении.
 */
(function () {
  'use strict';

  var config = window.RC_ANALYTICS_CONFIG || {};
  if (!config.museum_id || !config.issue_id) return;

  var allowedEvents = new Set([
    'issue_open', 'depth_select', 'section_view', 'interactive_start',
    'interactive_complete', 'media_progress', 'source_open', 'next_route',
    'share_open', 'support_open'
  ]);
  var allowedFields = new Set([
    'depth', 'section', 'media_kind', 'progress', 'source_id', 'target_id',
    'support_kind', 'details_opened', 'headline_id', 'impression_changed'
  ]);
  var fired = new Set();

  function deviceClass() {
    if (matchMedia('(max-width: 520px)').matches) return 'phone';
    if (matchMedia('(max-width: 900px)').matches) return 'tablet';
    return 'desktop';
  }

  function referrerGroup() {
    if (!document.referrer) return 'direct';
    try {
      var origin = new URL(document.referrer).origin;
      return origin === location.origin ? 'internal' : 'external';
    } catch (_) {
      return 'unknown';
    }
  }

  function cleanDetails(details) {
    var result = {};
    Object.keys(details || {}).forEach(function (key) {
      if (!allowedFields.has(key)) return;
      var value = details[key];
      if (typeof value === 'string') result[key] = value.slice(0, 80);
      else if (typeof value === 'number' || typeof value === 'boolean') result[key] = value;
    });
    return result;
  }

  window.rcTrack = function (eventName, details) {
    if (!allowedEvents.has(eventName)) return false;
    var event = Object.assign({
      museum_id: config.museum_id,
      issue_id: config.issue_id,
      issue_version: config.issue_version || 'unknown',
      build_version: config.build_version || 'work',
      platform: 'web',
      device_class: deviceClass(),
      referrer_group: referrerGroup(),
      event_name: eventName,
      occurred_at: new Date().toISOString()
    }, cleanDetails(details));

    window.dispatchEvent(new CustomEvent('rc:analytics', { detail: event }));
    if (typeof window.RC_ANALYTICS_PROVIDER === 'function') {
      try { window.RC_ANALYTICS_PROVIDER(event); } catch (_) { /* аналитика не ломает страницу */ }
    }
    return true;
  };

  function once(key, eventName, details) {
    if (fired.has(key)) return;
    fired.add(key);
    window.rcTrack(eventName, details);
  }

  function init() {
    window.rcTrack('issue_open');

    document.addEventListener('click', function (event) {
      var target = event.target.closest('a,button');
      if (!target) return;
      if (target.matches('[data-route]')) window.rcTrack('depth_select', { depth: target.dataset.route });
      if (target.matches('[data-first]')) once('interactive-start', 'interactive_start');
      if (target.matches('#publish')) window.rcTrack('interactive_complete', {
        details_opened: document.querySelectorAll('.lens.on').length,
        headline_id: document.querySelector('.headline.on')?.dataset.head || 'unknown',
        impression_changed: true
      });
      if (target.closest('#sources-rights')) window.rcTrack('source_open', {
        source_id: target.dataset.sourceId || 'source-link'
      });
      if (target.closest('#next-links, #kuda-dalshe')) window.rcTrack('next_route', {
        target_id: target.getAttribute('href') || 'next'
      });
      if (target.matches('#shareTop, #shareResult')) window.rcTrack('share_open');
      if (target.closest('.support, .keeper, #heart')) window.rcTrack('support_open', {
        support_kind: target.dataset.supportKind || 'support'
      });
    }, true);

    document.querySelectorAll('video,audio').forEach(function (media) {
      var marks = new Set();
      media.addEventListener('timeupdate', function () {
        if (!media.duration) return;
        [25, 50, 75, 100].forEach(function (mark) {
          if (marks.has(mark) || media.currentTime / media.duration * 100 < mark) return;
          marks.add(mark);
          window.rcTrack('media_progress', {
            media_kind: media.tagName.toLowerCase(),
            progress: mark
          });
        });
      });
    });

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var section = entry.target.dataset.analyticsSection;
          once('section-' + section, 'section_view', { section: section });
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.35 });
      document.querySelectorAll('[data-analytics-section]').forEach(function (section) {
        observer.observe(section);
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
