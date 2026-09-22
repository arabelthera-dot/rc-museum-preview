/* RC laboratory. Arithmetic is parsed; config strings never execute as JavaScript. */
(function (global) {
  'use strict';
  function expression(source, key) {
    if (typeof source !== 'string' || source.length > 512) throw Error('Некорректная формула');
    var tokens = source.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[A-Za-z_][A-Za-z_0-9]*|[()+*/-]/g) || [];
    if (tokens.join('') !== source.replace(/\s/g, '') || !tokens.length || tokens.length > 128) throw Error('Недопустимая формула');
    var i = 0;
    function atom() {
      var t = tokens[i++];
      if (t === '+' || t === '-') { var a = atom(); return function (v) { return (t === '-' ? -1 : 1) * a(v); }; }
      if (t === '(') { var b = sum(); if (tokens[i++] !== ')') throw Error('Нет закрывающей скобки'); return b; }
      if (t === key) return function (v) { return v; };
      if (t && /^(?:\d|\.)/.test(t) && Number.isFinite(Number(t))) return function () { return Number(t); };
      throw Error('Неизвестный параметр или операция');
    }
    function product() {
      var a = atom();
      while (tokens[i] === '*' || tokens[i] === '/') {
        var op = tokens[i++], b = atom();
        a = (function (left, right, operator) { return function (v) { return operator === '*' ? left(v) * right(v) : left(v) / right(v); }; })(a, b, op);
      }
      return a;
    }
    function sum() {
      var a = product();
      while (tokens[i] === '+' || tokens[i] === '-') {
        var op = tokens[i++], b = product();
        a = (function (left, right, operator) { return function (v) { return operator === '+' ? left(v) + right(v) : left(v) - right(v); }; })(a, b, op);
      }
      return a;
    }
    var result = sum(); if (i !== tokens.length) throw Error('Лишний символ в формуле');
    return result;
  }
  function predicate(source, key) {
    if (typeof source !== 'string') throw Error('Нет условия');
    var m = source.match(/^(.+?)(<=|>=|==|!=|<|>)(.+)$/);
    if (!m) throw Error('Неподдерживаемое условие');
    var a = expression(m[1], key), b = expression(m[3], key);
    return function (v) { var x = a(v), y = b(v); if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
      switch (m[2]) { case '<': return x < y; case '>': return x > y; case '<=': return x <= y; case '>=': return x >= y; case '==': return x === y; default: return x !== y; }
    };
  }
  function label(s) { return typeof s === 'string' && s.trim().length > 0; }
  var adapters = new Map();
  function register(name, adapter) {
    if (!/^[a-z][a-z0-9-]*$/.test(name) || !adapter || typeof adapter.compile !== 'function' || typeof adapter.scene !== 'function' || adapters.has(name)) throw Error('Некорректный или повторный адаптер');
    adapters.set(name, adapter);
  }
  function table(points, p) {
    if (!Array.isArray(points) || points.length < 2 || points.length > 10000 || points.some(function (r,i) { return !Array.isArray(r) || r.length !== 2 || !r.every(Number.isFinite) || (i && r[0] <= points[i-1][0]); }) || points[0][0] > p.min || points[points.length-1][0] < p.max) throw Error('Некорректная таблица измерений');
    return function (v) { if (!Number.isFinite(v) || v < p.min || v > p.max) throw Error('Значение вне измеренного диапазона'); var i = 1; while (i < points.length-1 && points[i][0] < v) i++; var a = points[i-1], b = points[i]; return a[1] + (v-a[0])/(b[0]-a[0])*(b[1]-a[1]); };
  }
  function compile(c) {
    if (!c || !label(c.title) || !label(c.source)) throw Error('Нужны заголовок и источник формулы');
    var p = c.param;
    if (!p || typeof p.key !== 'string' || !/^[A-Za-z_][A-Za-z_0-9]*$/.test(p.key) || !label(p.label) || !['min','max','step','start'].every(function (k) { return Number.isFinite(p[k]); }) || p.max <= p.min || p.step <= 0 || p.start < p.min || p.start > p.max || !Number.isFinite(p.max - p.min)) throw Error('Некорректный параметр');
    if (Math.abs((p.start - p.min) / p.step - Math.round((p.start - p.min) / p.step)) > 1e-7) throw Error('Старт должен совпадать с шагом');
    if (!Array.isArray(c.outputs) || c.outputs.length < 1 || c.outputs.length > 3 || c.outputs.some(function (o) { return !o || !label(o.key) || !label(o.label); }) || new Set(c.outputs.map(function (o) { return o.key; })).size !== c.outputs.length) throw Error('Нужны от одного до трёх разных выходов');
    if (!Array.isArray(c.marks) || !c.marks.length || c.marks.some(function (m) { return !m || !Number.isFinite(m.at) || m.at < p.min || m.at > p.max || !label(m.note); }) || !c.marks.some(function (m) { return m.at === p.start; })) throw Error('Нужна поясняющая метка на старте');
    if (c.verdict !== undefined && !Array.isArray(c.verdict)) throw Error('Некорректные пояснения');
    var adapter = c.model === undefined ? null : adapters.get(c.model);
    if (c.model !== undefined && !adapter) throw Error('Неизвестная предметная модель');
    var evaluate = adapter ? adapter.compile(c) : null;
    var formulas = evaluate ? null : c.outputs.map(function (o) { return o.table ? table(o.table, p) : expression(o.calc, p.key); });
    var rules = (c.verdict || []).map(function (r) { if (!r || !label(r.text)) throw Error('Нет пояснения'); return { test: predicate(r.when, p.key), text: r.text }; });
    return { config: c, adapter: adapter, calculate: function (raw) {
      var n = Number(raw); if (!Number.isFinite(n)) n = p.start;
      n = Math.max(p.min, Math.min(p.max, n));
      n = Math.max(p.min, Math.min(p.max, p.min + Math.round((n - p.min) / p.step) * p.step));
      n = Number(n.toPrecision(12));
      if (evaluate) {
        var result = evaluate(n);
        if (!result || !Array.isArray(result.values) || result.values.length !== c.outputs.length || result.values.some(function (v) { return v !== null && !Number.isFinite(v); }) || typeof result.verdict !== 'string') throw Error('Некорректный результат модели');
        return Object.assign({}, result, { value: n });
      }
      return { value: n, values: formulas.map(function (f) { var v = f(n); return Number.isFinite(v) ? v : null; }), verdict: rules.filter(function (r) { return r.test(n); }).map(function (r) { return r.text; }).join(' ') };
    } };
  }
  var counter = 0, seen = new Set();
  function mount(root, config, name) {
    if (root.dataset.rcLabReady) return;
    var doc = root.ownerDocument, win = doc.defaultView;
    var panel = doc.createElement('div'); panel.className = 'rc-lab'; panel.style.cssText = 'max-width:100%;overflow-wrap:anywhere';
    function el(tag, text, parent) { var n = doc.createElement(tag); if (text !== undefined) n.textContent = text; (parent || panel).appendChild(n); return n; }
    try {
      var model = compile(config), p = config.param, id = 'rc-lab-' + (++counter);
      el('h3', config.title);
      var lab = el('label', p.label + (p.unit ? ' (' + p.unit + ')' : '')); lab.htmlFor = id;
      var input = el('input'); input.type = 'range'; input.id = id; input.min = p.min; input.max = p.max; input.step = p.step; input.value = p.start; input.style.cssText = 'display:block;width:100%;min-height:44px';
      var current = el('p');
      var scene = model.adapter ? model.adapter.scene(panel, config) : null;
      var svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox','0 0 320 60'); svg.setAttribute('aria-hidden','true'); svg.style.cssText = 'display:block;width:100%;max-height:90px'; panel.appendChild(svg);
      var bar = doc.createElementNS(svg.namespaceURI,'rect'); bar.setAttribute('x','0'); bar.setAttribute('y','10'); bar.setAttribute('height','40'); bar.setAttribute('fill','currentColor'); svg.appendChild(bar);
      if (scene) svg.remove(); else el('p','Учебная схема: положение параметра в выбранном диапазоне.');
      var output = el('div'); output.setAttribute('aria-live','polite'); output.setAttribute('aria-atomic','true');
      var rows = config.outputs.map(function () { return el('p','',output); });
      var verdict = el('p','',output);
      config.marks.forEach(function (m) {
        if (config.selectMarks) { var pick = el('button', 'Показать ' + m.at.toLocaleString('ru-RU') + ' ' + (p.unit || '')); pick.type = 'button'; pick.style.minHeight = '44px'; pick.addEventListener('click', function () { input.value = m.at; input.dispatchEvent(new win.Event('input')); }); }
        el('p', m.at + ' ' + (p.unit || '') + ' — ' + m.note + (m.at === p.start ? (config.startKind === 'historical' ? ' · историческое значение' : ' · начальные условия') : '')); });
      el('p','Источник модели: ' + config.source);
      var reset = el('button',config.resetLabel || 'Вернуть начальные условия'); reset.type = 'button'; reset.dataset.rcReset = 'lab'; reset.style.minHeight = '44px';
      function render(raw) {
        var state = model.calculate(raw); input.value = state.value;
        var text = state.value.toLocaleString('ru-RU') + ' ' + (p.unit || '');
        input.setAttribute('aria-valuenow',state.value); input.setAttribute('aria-valuetext',text); current.textContent = p.label + ': ' + text;
        if (scene) scene.render(state);
        bar.setAttribute('width',320 * (state.value-p.min)/(p.max-p.min));
        rows.forEach(function (row,i) { row.textContent = config.outputs[i].label + ': ' + (state.values[i] === null ? 'не определено при этом значении' : state.values[i].toLocaleString('ru-RU',{maximumSignificantDigits:6}) + ' ' + (config.outputs[i].unit || '')); });
        verdict.textContent = state.verdict; return state;
      }
      input.addEventListener('input',function () {
        render(input.value); var key = 'rc-lab:' + name, done = seen.has(key);
        try { done = done || win.sessionStorage.getItem(key) === '1'; } catch (_) {}
        if (!done && typeof win.rcGoal === 'function') { seen.add(key); try { win.sessionStorage.setItem(key,'1'); } catch (_) {} try { win.rcGoal('rc_game',{lab:name}); } catch (_) {} }
      });
      reset.addEventListener('click',function () { render(p.start); });
      render(p.start); root.appendChild(panel); root.dataset.rcLabReady = '1';
      return { render: render, reset: function () { return render(p.start); } };
    } catch (error) { panel.replaceChildren(); el('p','Лаборатория недоступна: ' + error.message).setAttribute('role','alert'); root.appendChild(panel); root.dataset.rcLabReady = 'error'; }
  }
  function init() { global.document.querySelectorAll('[data-rc-lab]').forEach(function (root) { var name = root.dataset.rcLab; mount(root,(global.RC_LAB || {})[name],name); }); }
  var api = { register: register, table: table, expression: expression, compile: compile, mount: mount, init: init };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.RCMuseumLab = api;
  if (global.document) { if (global.document.readyState === 'loading') global.document.addEventListener('DOMContentLoaded',init); else init(); }
})(typeof window !== 'undefined' ? window : globalThis);
