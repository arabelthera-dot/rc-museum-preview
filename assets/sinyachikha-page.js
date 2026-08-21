(function () {
  "use strict";
  var lab = document.querySelector("[data-sinyachikha-paint-lab]");
  if (lab) {
    var state = {
        palette: null,
        stroke: false,
        anchor: null,
        cross: false,
        fold: false,
      },
      history = [];
    var stage = lab.querySelector("[data-stage]"),
      art = lab.querySelector("[data-art]"),
      feedback = lab.querySelector("[data-feedback]"),
      step = lab.querySelector("[data-step]"),
      caption = lab.querySelector("[data-stage-caption]"),
      anchorBox = lab.querySelector("[data-anchor]"),
      cross = lab.querySelector('[data-action="cross"]'),
      fold = lab.querySelector('[data-action="fold"]'),
      tools = document.querySelector("[data-result-tools]");
    function announce(s) {
      feedback.textContent = s;
    }
    function paint() {
      var p = state.anchor === "door" ? "330" : "215";
      art.innerHTML =
        '<path class="stem" d="M' +
        p +
        ' 330 C330 245 430 280 500 225 S650 120 755 72"/><g transform="translate(' +
        p +
        ' 315)"><ellipse class="petal-a" rx="54" ry="23" transform="rotate(-28)"/><ellipse class="petal-b" rx="47" ry="18" transform="rotate(25)"/></g><g transform="translate(500 220) scale(.7)"><ellipse class="petal-a" rx="54" ry="23" transform="rotate(-28)"/><ellipse class="petal-b" rx="47" ry="18" transform="rotate(25)"/></g><g transform="translate(710 95) scale(.5)"><ellipse class="petal-a" rx="54" ry="23" transform="rotate(-28)"/><ellipse class="petal-b" rx="47" ry="18" transform="rotate(25)"/></g>';
      art.classList.toggle("ochre", state.palette === "ochre-green");
      art.style.opacity = state.stroke ? 1 : 0;
      art.querySelector(".stem").style.opacity = state.cross ? 1 : 0;
      Array.from(art.querySelectorAll("g")).forEach(function (g, i) {
        g.style.opacity = i === 0 || state.cross ? 1 : 0;
      });
    }
    function render() {
      lab.querySelectorAll('input[name="palette"]').forEach(function (input) {
        input.checked = input.value === state.palette;
      });
      lab.querySelectorAll('input[name="anchor"]').forEach(function (input) {
        input.checked = input.value === state.anchor;
      });
      anchorBox.disabled = !state.stroke;
      cross.disabled = !state.anchor;
      fold.disabled = !state.cross;
      stage.classList.toggle("complete", state.fold);
      stage.classList.toggle("room", state.fold);
      tools.hidden = !state.fold;
      caption.textContent = state.fold
        ? "Учебная горница: мотив связывает три плоскости."
        : "Пустая учебная развертка.";
      paint();
      var n = !state.palette
        ? 1
        : !state.stroke
          ? 2
          : !state.anchor
            ? 3
            : !state.cross
              ? 4
              : 5;
      step.textContent =
        "Шаг " +
        n +
        " из 5 · " +
        [
          "набери кисть",
          "сделай мазок",
          "задай опору",
          "проведи через сгиб",
          "собери горницу",
        ][n - 1];
    }
    function save() {
      history.push(JSON.stringify(state));
    }
    lab.addEventListener("change", function (e) {
      if (e.target.name === "palette") {
        save();
        state.palette = e.target.value;
        announce(
          state.palette === "single"
            ? "Однотонный след получился, но двухцветный принцип ещё не виден. Выбери пару красок."
            : "Два края кисти набраны. Один жест сможет оставить переход цвета.",
        );
        render();
      }
      if (e.target.name === "anchor") {
        save();
        state.anchor = e.target.value;
        announce(
          "Крупный мотив стал опорой. Теперь продолжи ветвь через сгиб.",
        );
        render();
      }
    });
    lab.addEventListener("click", function (e) {
      var b = e.target.closest("[data-action]");
      if (!b) return;
      var a = b.dataset.action;
      if (a === "stroke") {
        if (!state.palette || state.palette === "single") {
          announce(
            "Сначала выбери две разные краски: один цвет оставляет плоский след.",
          );
          return;
        }
        save();
        state.stroke = true;
        announce(
          "Двуцветный мазок появился сразу. Теперь выбери место крупного мотива.",
        );
      }
      if (a === "cross") {
        save();
        state.cross = true;
        announce(
          "Ветвь прошла через угол к верхней плоскости. На развертке это линия, в комнате — маршрут взгляда.",
        );
      }
      if (a === "fold") {
        save();
        state.fold = true;
        announce(
          "Ты связал не отдельные картинки, а поверхности. Сравни развертку, горницу и слои доказательства.",
        );
      }
      if (a === "undo") {
        var old = history.pop();
        if (old) state = JSON.parse(old);
        else announce("Отменять пока нечего.");
      }
      if (a === "reset") {
        state = {
          palette: null,
          stroke: false,
          anchor: null,
          cross: false,
          fold: false,
        };
        history = [];
        lab.querySelectorAll("input").forEach(function (x) {
          x.checked = false;
        });
        stage.className = "";
        tools.hidden = true;
        announce("Модель очищена. Набери два края кисти разными красками.");
      }
      render();
    });
    render();
    document.querySelectorAll("[data-view]").forEach(function (b) {
      b.onclick = function () {
        document.querySelectorAll("[data-view]").forEach(function (x) {
          x.setAttribute("aria-pressed", String(x === b));
        });
        stage.classList.toggle("room", b.dataset.view === "room");
      };
    });
    var ev = document.querySelectorAll("[data-evidence]");
    ev.forEach(function (b, i) {
      b.onclick = function () {
        ev.forEach(function (x) {
          x.setAttribute("aria-checked", String(x === b));
        });
        stage.classList.remove("evidence-document", "evidence-limit");
        if (b.dataset.evidence !== "model")
          stage.classList.add("evidence-" + b.dataset.evidence);
        announce(
          b.dataset.evidence === "document"
            ? "Документ подтверждает музейный контекст и атрибуцию двух отдельных фрагментов, не эту модель целиком."
            : b.dataset.evidence === "limit"
              ? "Серым отмечено неизвестное: модель нельзя приписывать Рябкову или считать реконструкцией."
              : "Показана яркая учебная модель пространственного принципа.",
        );
      };
      b.onkeydown = function (e) {
        var k = e.key,
          ni = i;
        if (k === "ArrowRight" || k === "ArrowDown") ni = (i + 1) % ev.length;
        else if (k === "ArrowLeft" || k === "ArrowUp")
          ni = (i + ev.length - 1) % ev.length;
        else if (k === "Home") ni = 0;
        else if (k === "End") ni = ev.length - 1;
        else return;
        e.preventDefault();
        ev[ni].focus();
        ev[ni].click();
      };
    });
  }
  function wire(root, sel) {
    if (!root) return;
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-answer]");
      if (!b) return;
      var good = b.dataset.answer === "good",
        out = root.querySelector(sel);
      out.textContent = good
        ? "Точно. Контекст сохраняют фиксация, маркировка и документальная связь."
        : "Этот ход обрывает происхождение фрагмента. Попробуй ещё.";
      if (root.hasAttribute("data-quiz"))
        out.textContent = good
          ? "Верно: панорама документирует экспозицию 2012 года, но не автора всей горницы."
          : "Нет: атрибуция двух фрагментов и панорама экспозиции — разные свидетельства.";
      out.classList.toggle("feedback-good", good);
    });
  }
  wire(document.querySelector("[data-game]"), "[data-game-feedback]");
  wire(document.querySelector("[data-quiz]"), "[data-quiz-feedback]");
})();
