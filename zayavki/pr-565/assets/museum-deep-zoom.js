/*
 * museum-deep-zoom.js — глубокое приближение картины «до мазка» (стандарт №12, IIIF).
 * Наряд iiif-dvizhok-2709, 27.09.2026. Механика реестра M-09 «Лупа на деталь».
 *
 * Разметка (всё остальное движок делает сам):
 *
 *   <figure class="dz" data-deep-zoom data-iiif="media/<картина>/info.json"
 *           data-alt="Что изображено — для чтеца экрана">
 *     <img src="media/<картина>-preview.jpg" alt="…">      ← без JS видна обычная картинка
 *     <figcaption>Автор, «Название», год. Держатель. Основание прав.</figcaption>
 *   </figure>
 *
 *   data-iiif  — info.json IIIF Image API 2 или 3 (статические тайлы уровня 0 режет
 *                tools/iiif-tiles.mjs проекта; сервер не нужен, GitHub Pages отдаёт файлы);
 *   data-image — вместо data-iiif: один большой файл без тайлов (запасной путь).
 *
 * Библиотека — OpenSeadragon (BSD-3, assets/vendor/openseadragon.min.js), грузится
 * сама рядом с движком, если её на странице ещё нет. Щипок, двойной тап, колесо и
 * перетаскивание — её штатные жесты; свои кнопки + − ⌂ и клавиши + − 0 добавляет движок.
 * Поле id в info.json подменяется адресом папки info.json: тайлы можно переносить.
 *
 * Для проверок: window.MuseumDeepZoom.viewers — Map(элемент → viewer OpenSeadragon).
 */
(function () {
  'use strict';
  var HERE = (document.currentScript && document.currentScript.src) || '';
  var OSD_URL = HERE ? new URL('vendor/openseadragon.min.js', HERE).href : 'assets/vendor/openseadragon.min.js';
  var viewers = new Map();
  var loading = null;

  function loadLibrary() {
    if (window.OpenSeadragon) return Promise.resolve(window.OpenSeadragon);
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = OSD_URL;
      s.onload = function () { resolve(window.OpenSeadragon); };
      s.onerror = function () { reject(new Error('не загрузилась библиотека ' + OSD_URL)); };
      document.head.appendChild(s);
    });
    return loading;
  }

  function style() {
    if (document.getElementById('dz-style')) return;
    var css = document.createElement('style');
    css.id = 'dz-style';
    css.textContent =
      '[data-deep-zoom]{position:relative;margin:0}' +
      '[data-deep-zoom] .dz-stage{position:relative;width:100%;height:min(80vh,900px);background:#111;touch-action:none;border-radius:6px;overflow:hidden}' +
      '[data-deep-zoom] .dz-stage:focus-visible{outline:3px solid #e8c56b;outline-offset:2px}' +
      '[data-deep-zoom] .dz-bar{position:absolute;right:12px;bottom:12px;display:flex;gap:8px;z-index:2}' +
      '[data-deep-zoom] .dz-bar button{min-width:44px;min-height:44px;border:0;border-radius:22px;background:rgba(20,16,14,.78);color:#f0e8d8;font:600 20px/1 system-ui,sans-serif;cursor:pointer}' +
      '[data-deep-zoom] .dz-hint{position:absolute;left:12px;bottom:12px;z-index:2;padding:6px 10px;border-radius:14px;background:rgba(20,16,14,.7);color:#f0e8d8;font:14px/1.3 system-ui,sans-serif;pointer-events:none;transition:opacity .6s}' +
      '[data-deep-zoom].dz-ready>img{display:none}';
    document.head.appendChild(css);
  }

  function tileSource(el) {
    var iiif = el.getAttribute('data-iiif');
    if (iiif) {
      var url = new URL(iiif, document.baseURI).href;
      return fetch(url).then(function (r) {
        if (!r.ok) throw new Error('info.json ' + r.status + ': ' + url);
        return r.json();
      }).then(function (info) {
        var base = url.replace(/\/info\.json(?:\?.*)?$/, '');
        if (info.id !== undefined) info.id = base; else info['@id'] = base;
        return info;
      });
    }
    var image = el.getAttribute('data-image');
    if (image) return Promise.resolve({ type: 'image', url: new URL(image, document.baseURI).href });
    return Promise.reject(new Error('нет data-iiif и data-image'));
  }

  function button(label, title, fn) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.title = title;
    b.setAttribute('aria-label', title);
    b.addEventListener('click', fn);
    return b;
  }

  function init(el) {
    if (viewers.has(el) || el.dataset.dzState === 'loading') return Promise.resolve(viewers.get(el));
    el.dataset.dzState = 'loading';
    style();
    var stage = document.createElement('div');
    stage.className = 'dz-stage';
    stage.tabIndex = 0;
    stage.setAttribute('role', 'img');
    stage.setAttribute('aria-label', (el.getAttribute('data-alt') || 'Картина') +
      '. Приближение: щипок, двойной тап, колесо, клавиши плюс и минус, ноль — целиком.');
    el.insertBefore(stage, el.firstChild);
    return Promise.all([loadLibrary(), tileSource(el)]).then(function (res) {
      var OSD = res[0];
      var viewer = OSD({
        element: stage,
        tileSources: res[1],
        showNavigationControl: false,
        showNavigator: false,
        maxZoomPixelRatio: 2,          // «до мазка»: вдвое крупнее пикселя оригинала
        visibilityRatio: 1,
        constrainDuringPan: true,
        animationTime: 0.6,
        springStiffness: 8,
        gestureSettingsTouch: { pinchToZoom: true, flickEnabled: true, dblClickToZoom: true, clickToZoom: false },
        gestureSettingsMouse: { clickToZoom: false, dblClickToZoom: true, scrollToZoom: true },
        crossOriginPolicy: false,
        preserveImageSizeOnResize: true
      });
      var bar = document.createElement('div');
      bar.className = 'dz-bar';
      bar.appendChild(button('+', 'Приблизить', function () { viewer.viewport.zoomBy(1.6); viewer.viewport.applyConstraints(); }));
      bar.appendChild(button('−', 'Отдалить', function () { viewer.viewport.zoomBy(1 / 1.6); viewer.viewport.applyConstraints(); }));
      bar.appendChild(button('⌂', 'Картина целиком', function () { viewer.viewport.goHome(); }));
      stage.appendChild(bar);
      var hint = document.createElement('div');
      hint.className = 'dz-hint';
      hint.textContent = ('ontouchstart' in window) ? 'Разведите пальцы — до мазка' : 'Колесо или двойной щелчок — до мазка';
      stage.appendChild(hint);
      viewer.addOnceHandler('zoom', function () { hint.style.opacity = '0'; });
      stage.addEventListener('keydown', function (e) {
        if (e.key === '+' || e.key === '=') viewer.viewport.zoomBy(1.6);
        else if (e.key === '-' || e.key === '_') viewer.viewport.zoomBy(1 / 1.6);
        else if (e.key === '0') viewer.viewport.goHome();
        else return;
        viewer.viewport.applyConstraints();
        e.preventDefault();
      });
      viewer.addOnceHandler('open', function () { el.classList.add('dz-ready'); el.dataset.dzState = 'ready'; });
      viewer.addOnceHandler('open-failed', function (e) { el.dataset.dzState = 'failed'; stage.remove(); console.warn('deep-zoom:', e.message); });
      viewers.set(el, viewer);
      return viewer;
    }).catch(function (err) {
      el.dataset.dzState = 'failed';   // остаётся обычная картинка — страница не ломается
      stage.remove();
      console.warn('deep-zoom:', err.message);
    });
  }

  function initAll(root) {
    var els = (root || document).querySelectorAll('[data-deep-zoom]');
    return Promise.all(Array.prototype.map.call(els, init));
  }

  window.MuseumDeepZoom = { init: init, initAll: initAll, viewers: viewers };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { initAll(); });
  else initAll();
})();
