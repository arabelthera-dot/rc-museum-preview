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
          frame.setAttribute("aria-hidden", String(j !== i));
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
    var lab = document.querySelector("[data-distance-lab]");
    if (lab) {
      var labData = [
          {
            image: "media/vyatskoe/landscape.webp",
            alt: "Общий вид Вятского",
            kicker: "1 · Село",
            title: "Сначала увидь целое",
            copy: "На общем виде декор ещё не читается: архитектура начинается со связи домов, дороги, храма и ландшафта.",
            caption: "Село: дома, дорога и храм читаются как связанная среда.",
            result: "Проявлена связь поселения: дорога ведёт взгляд между домами к общей вертикали храма.",
          },
          {
            image: "media/vyatskoe/street.webp",
            alt: "Дома на улице Клюшниково стоят вдоль общей линии",
            kicker: "2 · Улица",
            title: "Проведи линию фасадов",
            copy: "Соседние дома обращены к улице парадной стороной, а проезды не разрушают общий фронт.",
            caption: "Улица: отдельные дома удерживают общую границу пространства.",
            result: "Проявлена линия фасадов: городской характер создаёт взаимное положение домов, а не одинаковый цвет.",
          },
          {
            image: "media/vyatskoe/house-16.webp",
            alt: "Парадный фасад дома 16 на улице Клюшниково",
            kicker: "3 · Дом",
            title: "Собери парадное лицо",
            copy: "Карниз завершает стену, вертикали делят её, а проёмы задают повторяемый ритм.",
            caption: "Дом: карниз, вертикали и окна образуют композицию.",
            result: "Проявлена схема фасада: верхняя горизонталь и вертикальные оси связывают окна в одно целое.",
          },
          {
            image: "media/vyatskoe/lion-detail.webp",
            alt: "Лепная львиная маска на фасаде дома во Вятском",
            kicker: "4 · Деталь",
            title: "Отдели ремесло от атрибуции",
            copy: "Рельеф показывает мастерство лепщика, но сам не называет автора и не доказывает состав всей отделки.",
            caption: "Деталь: видимый след лепного ремесла внутри большого целого.",
            result: "Проявлен рельеф. Честный вывод: перед нами лепная деталь; имя мастера и материал всего фасада не установлены.",
          },
        ],
        labImage = lab.querySelector("[data-lab-image]"),
        labCaption = lab.querySelector("[data-lab-caption]"),
        labKicker = lab.querySelector("[data-lab-kicker]"),
        labTitle = lab.querySelector("[data-lab-title]"),
        labCopy = lab.querySelector("[data-lab-copy]"),
        labResult = lab.querySelector("[data-lab-result]"),
        labReveal = lab.querySelector("[data-lab-reveal]"),
        labButtons = [].slice.call(lab.querySelectorAll("[data-lab-step]")),
        labIndex = 0;
      function drawLab(index, focus) {
        var item = labData[index];
        labIndex = index;
        lab.classList.remove("is-revealed");
        labImage.src = item.image;
        labImage.alt = item.alt;
        labCaption.textContent = item.caption;
        labKicker.textContent = item.kicker;
        labTitle.textContent = item.title;
        labCopy.textContent = item.copy;
        labResult.textContent = "Нажми «Проявить признак», чтобы увидеть схему на кадре.";
        labReveal.textContent = "Проявить признак на кадре";
        labButtons.forEach(function (button, i) {
          button.setAttribute("aria-pressed", String(i === index));
        });
        if (focus) labTitle.focus();
      }
      labButtons.forEach(function (button) {
        button.addEventListener("click", function () {
          drawLab(Number(button.dataset.labStep), true);
        });
      });
      labReveal.addEventListener("click", function () {
        lab.classList.toggle("is-revealed");
        var revealed = lab.classList.contains("is-revealed");
        labResult.textContent = revealed
          ? labData[labIndex].result
          : "Схема скрыта. Можно выбрать другое расстояние.";
        labReveal.textContent = revealed ? "Скрыть схему" : "Проявить признак на кадре";
        if (revealed && labIndex === labData.length - 1) {
          var saved = state();
          saved.vyatskoe = { completedAt: new Date().toISOString() };
          try {
            localStorage.setItem(storageKey, JSON.stringify(saved));
          } catch (error) {}
          paint();
          document.dispatchEvent(new CustomEvent("museum:route-success"));
        }
      });
      drawLab(0, false);
    }
    var game = document.querySelector("[data-feature-game]");
    if (game) {
      var data = [
          {
            image: "media/vyatskoe/salov-house-1984.png",
            alt: "Дом лепщиков Саловых с гипсовой лепниной, Некрасовский район, 1984 год",
            q: "Какая подпись к архивному снимку честная?",
            a: [
              [
                "bad",
                "Так выглядел дом во Вятском",
                "Книжная подпись указывает Некрасовский район, но не Вятское.",
              ],
              [
                "good",
                "Региональная практика лепного промысла",
                "Да: снимок подтверждает лепнину на крестьянской избе в регионе, не конкретный фасад Вятского.",
              ],
              [
                "bad",
                "Весь декор Вятского сделан из гипса",
                "Один региональный снимок не доказывает материал фасадов Вятского.",
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
        game.classList.toggle("is-archive", item.image.indexOf("salov-house") !== -1);
        counter.textContent = data.length === 1 ? "Один документ" : "Кадр " + (i + 1) + " из " + data.length;
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
        feedback.textContent = "Проверь место, материал и границу вывода.";
      }
      actions.addEventListener("click", function (event) {
        var button = event.target.closest("button");
        if (!button) return;
        var good = button.dataset.kind === "good";
        feedback.textContent = button.dataset.feedback;
        button.classList.add(good ? "good" : "bad");
        feedback.focus({ preventScroll: true });
        if (!good) return;
        score += 1;
        actions.querySelectorAll("button").forEach(function (item) {
          item.disabled = true;
        });
        window.setTimeout(function () {
          i += 1;
          if (i === data.length) {
            counter.textContent = "Вывод документа";
            q.textContent = "Граница доказательства найдена";
            feedback.textContent =
              "Снимок подтверждает региональную практику лепного промысла, но не место во Вятском и не материал всех его фасадов.";
            actions.innerHTML = "";
            reset.hidden = false;
            q.focus();
          } else {
            draw();
            q.focus();
          }
        }, 300);
      });
      reset.addEventListener("click", function () {
        i = 0;
        score = 0;
        reset.hidden = true;
        draw();
        q.focus();
      });
      draw();
    }
  });
})();
