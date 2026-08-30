(function () {
  "use strict";
  function init(root, config) {
    if (!root || !config || !Array.isArray(config.steps)) return;
    var image = root.querySelector("[data-observe-image]"),
      caption = root.querySelector("[data-observe-caption]"),
      kicker = root.querySelector("[data-observe-kicker]"),
      question = root.querySelector("[data-observe-question]"),
      context = root.querySelector("[data-observe-context]"),
      actions = root.querySelector("[data-observe-actions]"),
      feedback = root.querySelector("[data-observe-feedback]"),
      result = root.querySelector("[data-observe-result]"),
      bars = [].slice.call(root.querySelectorAll(".observe-progress i")),
      index = 0;
    function render(focus) {
      var step = config.steps[index];
      image.src = step.image;
      image.alt = step.alt;
      caption.textContent = step.caption;
      kicker.textContent =
        "Расстояние " + (index + 1) + " из " + config.steps.length;
      question.textContent = step.question;
      context.textContent = step.context;
      actions.innerHTML = "";
      step.answers.forEach(function (answer) {
        var button = document.createElement("button");
        button.type = "button";
        button.dataset.kind = answer[0];
        button.dataset.feedback = answer[2];
        button.textContent = answer[1];
        actions.appendChild(button);
      });
      bars.forEach(function (bar, i) {
        bar.classList.toggle("is-done", i < index);
        bar.classList.toggle("is-current", i === index);
      });
      feedback.textContent = "Сначала рассмотри кадр, затем выбери признак.";
      if (focus) question.focus();
    }
    actions.addEventListener("click", function (event) {
      var button = event.target.closest("button");
      if (!button) return;
      var good = button.dataset.kind === "good";
      actions.querySelectorAll("button").forEach(function (item) {
        item.classList.remove("good", "bad");
      });
      button.classList.add(good ? "good" : "bad");
      feedback.textContent = button.dataset.feedback;
      if (!good) return;
      actions.querySelectorAll("button").forEach(function (item) {
        item.disabled = true;
      });
      bars[index].classList.add("is-done");
      window.setTimeout(function () {
        index += 1;
        if (index >= config.steps.length) {
          actions.innerHTML = "";
          kicker.textContent = "Четыре расстояния пройдены";
          question.textContent = "Городской характер создаёт система";
          context.textContent =
            "Ремесло видно в детали, композиция — в доме, городской принцип — в улице, а смысл — в живом селе.";
          result.hidden = false;
          result.focus();
          document.dispatchEvent(new CustomEvent("museum:route-success"));
          try {
            var state = JSON.parse(
              localStorage.getItem("rc:museum:arhitektura:routes:v1") || "{}",
            );
            state.vyatskoe = { completedAt: new Date().toISOString() };
            localStorage.setItem(
              "rc:museum:arhitektura:routes:v1",
              JSON.stringify(state),
            );
          } catch (error) {}
          return;
        }
        render(true);
      }, 350);
    });
    root
      .querySelector("[data-observe-reset]")
      .addEventListener("click", function () {
        index = 0;
        result.hidden = true;
        document.dispatchEvent(new CustomEvent("museum:route-reset"));
        render(true);
      });
    render(false);
  }
  document.addEventListener("DOMContentLoaded", function () {
    init(
      document.querySelector("[data-architecture-observe]"),
      window.VYATSKOE_OBSERVE,
    );
  });
  window.MuseumArchitectureObserve = { init: init };
})();
