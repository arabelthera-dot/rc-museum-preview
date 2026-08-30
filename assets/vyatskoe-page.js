(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", function () {
    var storageKey = "rc:museum:arhitektura:routes:v1";
    function state() {
      try {
        return JSON.parse(localStorage.getItem(storageKey) || "{}");
      } catch (error) {
        return {};
      }
    }
    function paint() {
      var saved = state();
      document
        .querySelectorAll("[data-personal-route] [data-route-slug]")
        .forEach(function (card) {
          var done = Boolean(saved[card.dataset.routeSlug]),
            label = card.querySelector("[data-personal-status]");
          card.classList.toggle("is-complete", done);
          if (label)
            label.textContent = done
              ? "Пройдено на этом устройстве"
              : "Не пройдено";
        });
    }
    paint();
    document.addEventListener("museum:route-success", paint);
    document
      .querySelectorAll("[data-speech-controls]")
      .forEach(function (controls) {
        var play = controls.querySelector("[data-speak]"),
          stop = controls.querySelector("[data-speech-stop]"),
          status = controls.querySelector('[role="status"]');
        if (!("speechSynthesis" in window)) {
          play.disabled = true;
          stop.disabled = true;
          status.textContent =
            "Системное чтение недоступно; используй расшифровку.";
          return;
        }
        play.addEventListener("click", function () {
          window.speechSynthesis.cancel();
          var target = document.querySelector(play.dataset.speak);
          if (!target) return;
          var utterance = new SpeechSynthesisUtterance(
            target.textContent.trim(),
          );
          utterance.lang = "ru-RU";
          utterance.rate = 0.94;
          utterance.onstart = function () {
            status.textContent = "Чтение началось.";
          };
          utterance.onend = function () {
            status.textContent = "Чтение завершено.";
          };
          window.speechSynthesis.speak(utterance);
        });
        stop.addEventListener("click", function () {
          window.speechSynthesis.cancel();
          status.textContent = "Чтение остановлено.";
        });
      });
    document
      .querySelectorAll("audio[data-guide-audio]")
      .forEach(function (audio) {
        function ensureAudio() {
          if (!audio.getAttribute("src") && audio.dataset.src) {
            audio.setAttribute("src", audio.dataset.src);
            audio.load();
          }
        }
        audio.addEventListener("pointerdown", ensureAudio, { once: true });
        audio.addEventListener("keydown", ensureAudio, { once: true });
        audio.addEventListener("play", function () {
          if (window.rcGoal) window.rcGoal("rc_audio_start");
        });
        audio.addEventListener("ended", function () {
          if (window.rcGoal) window.rcGoal("rc_audio_complete");
        });
      });
    var quick = document.querySelector("[data-quick-route]");
    if (quick) {
      var index = 0,
        steps = [].slice.call(quick.querySelectorAll("[data-quick-step]")),
        dots = [].slice.call(quick.querySelectorAll(".quick-progress i")),
        back = quick.querySelector("[data-quick-back]"),
        next = quick.querySelector("[data-quick-next]"),
        finish = quick.querySelector("[data-quick-finish]"),
        title = quick.querySelector("#quick-title");
      function render(focus) {
        steps.forEach(function (step, i) {
          step.hidden = i !== index;
          step.querySelectorAll("[data-answer]").forEach(function (button) {
            button.disabled = false;
            button.classList.remove("good", "bad");
          });
        });
        dots.forEach(function (dot, i) {
          dot.classList.toggle("is-current", i === index);
          dot.classList.toggle("is-done", i < index);
        });
        back.disabled = index === 0;
        next.hidden = index === steps.length - 1;
        next.disabled = true;
        finish.hidden = true;
        quick.scrollTop = 0;
        if (focus) {
          var heading = index ? steps[index].querySelector("h3") : title;
          requestAnimationFrame(function () {
            heading.focus({ preventScroll: true });
            quick.scrollTop = 0;
          });
        }
      }
      document.querySelectorAll("[data-route-start]").forEach(function (start) {
        start.addEventListener("click", function () {
          index = 0;
          if (window.MuseumPageRuntime) {
            window.MuseumPageRuntime.loadMedia(quick);
          }
          render(false);
          quick.showModal();
          title.focus();
        });
      });
      quick
        .querySelector("[data-quick-close]")
        .addEventListener("click", function () {
          quick.close();
        });
      quick.addEventListener("click", function (event) {
        if (event.target === quick) {
          quick.close();
          return;
        }
        var button = event.target.closest("[data-answer]");
        if (!button) return;
        var section = button.closest("[data-quick-step]"),
          good = button.dataset.answer === "good";
        section.querySelectorAll("[data-answer]").forEach(function (item) {
          item.classList.remove("good", "bad");
        });
        button.classList.add(good ? "good" : "bad");
        section.querySelector('[role="status"]').textContent =
          button.dataset.feedback;
        if (good) {
          section.querySelectorAll("[data-answer]").forEach(function (item) {
            item.disabled = true;
          });
          next.disabled = false;
          if (index === steps.length - 1) {
            finish.hidden = false;
            var saved = state();
            saved.vyatskoe = { completedAt: new Date().toISOString() };
            try {
              localStorage.setItem(storageKey, JSON.stringify(saved));
            } catch (error) {}
            paint();
            document.dispatchEvent(new CustomEvent("museum:route-success"));
          }
        }
      });
      back.addEventListener("click", function () {
        if (index) {
          index -= 1;
          render(true);
        }
      });
      next.addEventListener("click", function () {
        if (index < steps.length - 1) {
          index += 1;
          render(true);
        }
      });
      finish.addEventListener("click", function () {
        quick.close();
      });
      render(false);
    }
    var film = document.querySelector("[data-film]");
    if (film) {
      var frames = [].slice.call(film.querySelectorAll(".film-stage img")),
        buttons = [].slice.call(film.querySelectorAll("[data-film-step]")),
        caption = film.querySelector("[data-film-caption]"),
        current = 0;
      function show(i) {
        current = i;
        if (frames[i].dataset.src && !frames[i].getAttribute("src")) {
          frames[i].setAttribute("src", frames[i].dataset.src);
        }
        frames.forEach(function (frame, j) {
          frame.classList.toggle("is-active", j === i);
        });
        buttons.forEach(function (button, j) {
          button.classList.toggle("is-active", j === i);
          button.setAttribute("aria-pressed", String(j === i));
        });
        caption.textContent = frames[i].dataset.caption;
      }
      film.addEventListener("click", function (event) {
        var button = event.target.closest("[data-film-step]");
        if (button) show(Number(button.dataset.filmStep));
        if (event.target.closest("[data-film-next]"))
          show((current + 1) % frames.length);
      });
    }
    var game = document.querySelector("[data-feature-game]");
    if (game) {
      var data = [
          {
            image: "media/vyatskoe/street.webp",
            alt: "Улица Клюшниково",
            q: "Какой признак связывает несколько домов?",
            a: [
              [
                "good",
                "Непрерывная линия фасадов",
                "Да: она превращает отдельные дома в уличный фронт.",
              ],
              [
                "bad",
                "Один цвет",
                "Цвет различается; связь создаёт положение фасадов.",
              ],
              [
                "bad",
                "Высота колокольни",
                "Колокольня — ориентир, но не принцип жилой улицы.",
              ],
            ],
          },
          {
            image: "media/vyatskoe/house-16.webp",
            alt: "Фасад дома 16",
            q: "Что делает фасад парадным?",
            a: [
              ["bad", "Только камень", "Материал не заменяет композицию."],
              [
                "good",
                "Карниз, вертикали, ритм",
                "Верно: три элемента работают вместе.",
              ],
              ["bad", "Много окон", "Важно не число, а порядок."],
            ],
          },
          {
            image: "media/vyatskoe/lion-detail.webp",
            alt: "Лепная львиная маска",
            q: "Что доказывает деталь?",
            a: [
              ["bad", "Авторство Телушкина", "Такого документа нет."],
              [
                "bad",
                "Что всё сделано из гипса",
                "Материал всего декора не установлен.",
              ],
              [
                "good",
                "Мастерство лепщиков",
                "Точно: это честная граница источников.",
              ],
            ],
          },
        ],
        i = 0,
        score = 0,
        img = game.querySelector("[data-game-image]"),
        counter = game.querySelector("[data-game-counter]"),
        q = game.querySelector("[data-game-question]"),
        actions = game.querySelector("[data-game-actions]"),
        feedback = game.querySelector("[data-game-feedback]"),
        reset = game.querySelector("[data-game-reset]");
      function draw() {
        var item = data[i];
        img.src = item.image;
        img.alt = item.alt;
        counter.textContent = "Кадр " + (i + 1) + " из " + data.length;
        q.textContent = item.q;
        actions.innerHTML = "";
        item.a.forEach(function (answer) {
          var button = document.createElement("button");
          button.type = "button";
          button.dataset.kind = answer[0];
          button.dataset.feedback = answer[2];
          button.textContent = answer[1];
          actions.appendChild(button);
        });
        feedback.textContent = "Выбери наблюдаемый признак.";
      }
      actions.addEventListener("click", function (event) {
        var button = event.target.closest("button");
        if (!button) return;
        var good = button.dataset.kind === "good";
        feedback.textContent = button.dataset.feedback;
        button.classList.add(good ? "good" : "bad");
        if (!good) return;
        score += 1;
        actions.querySelectorAll("button").forEach(function (item) {
          item.disabled = true;
        });
        window.setTimeout(function () {
          i += 1;
          if (i === data.length) {
            counter.textContent = "Результат";
            q.textContent = score + " из 3 признаков найдены";
            feedback.textContent =
              "Ты связал деталь, фасад и улицу. Ошибки можно пройти заново без штрафа.";
            actions.innerHTML = "";
            reset.hidden = false;
          } else draw();
        }, 300);
      });
      reset.addEventListener("click", function () {
        i = 0;
        score = 0;
        reset.hidden = true;
        draw();
      });
      draw();
    }
  });
})();
