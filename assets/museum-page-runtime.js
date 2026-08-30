/* Общие состояния музейной страницы: маршрут, медиа по действию, мобильный корпус. */
(function () {
  'use strict';

  function lockGate(gate) {
    var href = gate.getAttribute('href') || gate.dataset.routeHref;
    if (href) gate.dataset.routeHref = href;
    gate.removeAttribute('href');
    gate.setAttribute('aria-disabled', 'true');
    gate.setAttribute('tabindex', '-1');
    gate.classList.add('is-locked');
  }

  function unlockGate(gate) {
    if (!gate.dataset.routeHref) return;
    gate.setAttribute('href', gate.dataset.routeHref);
    gate.removeAttribute('aria-disabled');
    gate.removeAttribute('tabindex');
    gate.classList.remove('is-locked');
  }

  function loadMedia(root) {
    root.querySelectorAll('[data-src],[data-srcset]').forEach(function (node) {
      if (node.dataset.src) {
        node.setAttribute('src', node.dataset.src);
        delete node.dataset.src;
      }
      if (node.dataset.srcset) {
        node.setAttribute('srcset', node.dataset.srcset);
        delete node.dataset.srcset;
      }
    });
    root.classList.add('is-loaded');
    root.dispatchEvent(new CustomEvent('museum:media-loaded', { bubbles: true }));
  }

  function initGate(gate) {
    lockGate(gate);
    gate.addEventListener('click', function (event) {
      if (gate.getAttribute('aria-disabled') === 'true') event.preventDefault();
    });
    document.addEventListener(gate.dataset.unlockEvent || 'museum:route-success', function () {
      unlockGate(gate);
    });
    document.addEventListener(gate.dataset.resetEvent || 'museum:route-reset', function () {
      lockGate(gate);
    });
  }

  function initLazyMedia(root) {
    root.addEventListener('click', function (event) {
      if (event.target.closest('[data-load-media]')) loadMedia(root);
    });
    root.addEventListener('museum:load-media', function () { loadMedia(root); });
  }

  function initVisualCorpus(details) {
    if (details.tagName !== 'DETAILS') return;
    var query = window.matchMedia('(max-width: 820px)');
    var mobileState = details.hasAttribute('open');
    function apply() {
      details.open = query.matches ? mobileState : true;
    }
    details.addEventListener('toggle', function () {
      if (query.matches) mobileState = details.open;
    });
    if (query.addEventListener) query.addEventListener('change', apply);
    else query.addListener(apply);
    apply();
  }

  function initNarrativeAct(section) {
    var label = section.dataset.museumAct;
    var title = section.dataset.museumActTitle;
    if (!label || !title) return;
    var wrap = section.querySelector(':scope > .wrap, :scope > .reading');
    if (!wrap) return;
    if (wrap.querySelector(':scope > .act-label')) return;
    var marker = document.createElement('div');
    marker.className = 'act-label';
    var step = document.createElement('span');
    step.textContent = label;
    var heading = document.createElement('b');
    heading.textContent = title;
    marker.append(step, heading);
    wrap.insertBefore(marker, wrap.firstChild);
  }

  function init(root) {
    (root || document).querySelectorAll('[data-route-gate]').forEach(initGate);
    (root || document).querySelectorAll('[data-lazy-media]').forEach(initLazyMedia);
    (root || document).querySelectorAll('details[data-visual-corpus]').forEach(initVisualCorpus);
    (root || document).querySelectorAll('[data-museum-act]').forEach(initNarrativeAct);
  }

  window.MuseumPageRuntime = {
    init: init,
    loadMedia: loadMedia,
    lockGate: lockGate,
    unlockGate: unlockGate
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(document); });
  else init(document);
}());
