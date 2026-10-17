/* museum-video.js — адрес ролика на странице подставляется из реестра, а не пишется руками.
 *
 * Зачем: ролики рано или поздно уезжают с GitHub Pages на платное хранилище (лимит Pages —
 * 1 ГБ на сайт и 100 ГБ трафика в месяц, один день музея весит ~35 МБ). Если адрес лежит
 * в HTML, переезд стоит правки каждой страницы с роликом. Здесь он лежит в одном файле:
 * video/registry.json, поле hosting.base. Переезд = одна строка, страницы не трогаются.
 * Та же логика, что у rc-paths.js (ARCHITECTURE.md, правило 3: идентификатор ≠ путь).
 *
 * Разметка страницы (адрес не пишется, пишется ключ выпуска):
 *   <video controls playsinline preload="none"
 *          data-rc-video="izobreteniya/05jan-shukhov" data-rc-format="horizontal">
 *     <source src="video/day-05jan-shukhov.mp4" type="video/mp4">   ← запасной путь без JS
 *   </video>
 *   <span data-rc-video-field="izobreteniya/05jan-shukhov:sec">82 сек</span>
 *
 * Запасной путь в HTML остаётся рабочим, пока файлы лежат в репозитории: движок его
 * перезаписывает, а не создаёт плеер с нуля. Ролик грузится только по клику (preload="none"),
 * поэтому подмена всегда успевает произойти раньше первого байта видео.
 */
(function () {
  'use strict';

  var script = document.currentScript || (function () {
    var all = document.getElementsByTagName('script');
    return all[all.length - 1];
  })();

  // Корень сайта выводится из адреса самого движка: .../assets/museum-video.js → .../
  var ROOT = String((script && script.src) || '').replace(/assets\/museum-video\.js.*$/, '');
  var REGISTRY = ROOT + 'video/registry.json';

  function warn(msg) { try { console.warn('[museum-video] ' + msg); } catch (e) {} }

  function fileUrl(reg, entry) {
    if (!entry) return null;
    var base = (reg.hosting && reg.hosting.base) || '';
    if (base) return base.replace(/\/+$/, '') + '/' + entry.file;
    return ROOT + entry.local + (entry.v ? '?v=' + entry.v : '');
  }

  function applyPlayer(el, reg) {
    var key = el.getAttribute('data-rc-video');
    var rel = reg.releases && reg.releases[key];
    if (!rel) { warn('в реестре нет выпуска ' + key); return; }

    var fmt = el.getAttribute('data-rc-format') || 'horizontal';
    var media = rel[fmt];
    if (!media) { warn('у выпуска ' + key + ' нет формата ' + fmt); return; }

    var video = el.tagName === 'VIDEO' ? el : el.querySelector('video');
    if (!video) { warn('не найден <video> для ' + key); return; }

    var src = fileUrl(reg, media);
    var poster = fileUrl(reg, rel[fmt === 'vertical' ? 'poster_vertical' : 'poster']);
    var source = video.querySelector('source');

    if (poster && video.getAttribute('poster') !== poster) video.setAttribute('poster', poster);

    if (!source) {
      source = document.createElement('source');
      source.type = 'video/mp4';
      video.appendChild(source);
    }
    // Абсолютный адрес из HTML сравниваем с новым: одинаковые — плеер не трогаем.
    // Новый адрес назначаем только при намерении запустить ролик. Вызов load() во время
    // инициализации заставляет Chromium скачать MP4 даже при preload="none".
    if (source.src !== src) {
      var activate = function () {
        if (source.src !== src) {
          source.setAttribute('src', src);
          source.setAttribute('type', 'video/mp4');
          video.load();
        }
        video.removeEventListener('pointerdown', activate);
        video.removeEventListener('click', activate);
        video.removeEventListener('keydown', activate);
      };
      video.addEventListener('pointerdown', activate, { once: true });
      video.addEventListener('click', activate, { once: true });
      video.addEventListener('keydown', activate, { once: true });
    }
    video.setAttribute('data-rc-video-src', src);
  }

  // Подписи, которые иначе пришлось бы править руками в каждом выпуске: длительность, вес.
  function applyFields(reg) {
    var nodes = document.querySelectorAll('[data-rc-video-field]');
    for (var i = 0; i < nodes.length; i++) {
      var spec = String(nodes[i].getAttribute('data-rc-video-field') || '').split(':');
      var rel = reg.releases && reg.releases[spec[0]];
      if (!rel || spec.length < 2) continue;
      var path = spec[1].split('.');          // sec | horizontal.sec | vertical.mb
      var val = path.length > 1 ? (rel[path[0]] || {})[path[1]] : (rel.horizontal || {})[path[0]];
      if (val === undefined || val === null) continue;
      var suffix = nodes[i].getAttribute('data-rc-video-suffix');
      nodes[i].textContent = suffix ? Math.round(val) + ' ' + suffix : String(val);
    }
  }

  function init() {
    var players = document.querySelectorAll('[data-rc-video]');
    var fields = document.querySelectorAll('[data-rc-video-field]');
    if (!players.length && !fields.length) return;

    fetch(REGISTRY, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (reg) {
        for (var i = 0; i < players.length; i++) applyPlayer(players[i], reg);
        applyFields(reg);
      })
      .catch(function (e) {
        // Реестр недоступен — на странице остаётся путь из HTML. Пока файлы в репозитории,
        // это рабочий ролик; после переезда здесь будет видно причину в консоли.
        warn('реестр не прочитан (' + e.message + '), остаётся путь из HTML');
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
