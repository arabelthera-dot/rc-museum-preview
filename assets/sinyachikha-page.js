(function () {
  "use strict";
  var lab = document.querySelector("[data-room-lab]");
  if (lab) {
    var order = ["wall", "corner", "ceiling", "objects"],
      done = [],
      copy = {
        wall: [
          "Стена",
          "Крупная плоскость задаёт ритм: сначала глаз видит поле, потом мотив.",
        ],
        corner: [
          "Угол",
          "Поворот связывает две стены и превращает узор в пространственное действие.",
        ],
        ceiling: [
          "Потолок",
          "Верхняя плоскость замыкает комнату и возвращает взгляд вниз.",
        ],
        objects: [
          "Предметы",
          "Мотив переходит на вещи и входит в человеческий масштаб.",
        ],
      },
      result = lab.querySelector("[data-lab-result]"),
      progress = lab.querySelector("[data-lab-progress]");
    lab.addEventListener("click", function (e) {
      var b = e.target.closest("[data-zone]");
      if (!b) return;
      var z = b.dataset.zone;
      if (done.indexOf(z) < 0) done.push(z);
      b.setAttribute("aria-pressed", "true");
      result.innerHTML = "<b>" + copy[z][0] + "</b><p>" + copy[z][1] + "</p>";
      progress.value = done.length;
    });
    lab.querySelector("[data-lab-reset]").onclick = function () {
      done = [];
      progress.value = 0;
      lab.querySelectorAll("[data-zone]").forEach(function (b) {
        b.setAttribute("aria-pressed", "false");
      });
      result.innerHTML =
        "<b>Первый шаг: выбери стену.</b><p>Смотри, как крупная поверхность задаёт ритм всей комнате.</p>";
    };
  }
  var layers = {
    document: [
      "Документальная фотография",
      "Панорама фиксирует интерьер музейной экспозиции в 2012 году. Она показывает пространство, но не служит доказательством авторства Варлама Рябкова.",
    ],
    scheme: [
      "Учебная схема",
      "Разметка объясняет четыре зоны наблюдения. Это не обмер, не исторический вид и не реконструкция конкретной горницы.",
    ],
    limit: [
      "Граница знания",
      "Фрагменты из Камельской атрибутированы Рябкову официальной музейной карточкой, но их изображения пока не используются: открытая лицензия не указана.",
    ],
  };
  document.querySelectorAll("[data-layer]").forEach(function (b) {
    b.onclick = function () {
      document.querySelectorAll("[data-layer]").forEach(function (x) {
        x.setAttribute("aria-selected", x === b ? "true" : "false");
      });
      var x = layers[b.dataset.layer];
      document.querySelector("[data-layer-panel]").innerHTML =
        "<b>" + x[0] + "</b><p>" + x[1] + "</p>";
    };
  });
  function wire(root, feedback) {
    if (!root) return;
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-answer]");
      if (!b) return;
      var good = b.dataset.answer === "good";
      root.querySelector(feedback).textContent = good
        ? "Точно. Ты отделил наблюдение от недоказанного вывода."
        : "Не совсем: похожесть и яркость не заменяют документ. Попробуй ещё.";
      root.querySelector(feedback).classList.toggle("feedback-good", good);
    });
  }
  wire(document.querySelector("[data-game]"), "[data-game-feedback]");
  wire(document.querySelector("[data-quiz]"), "[data-quiz-feedback]");
})();
