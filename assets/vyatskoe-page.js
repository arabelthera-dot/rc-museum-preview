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
            overlay: "landscape",
            kicker: "1 · Село",
            title: "Сначала увидь целое",
            copy: "На общем виде декор ещё не читается: архитектура начинается со связи домов, дороги, храма и ландшафта.",
            caption: "Село: дома, дорога и храм читаются как связанная среда.",
            result: "Проявлена связь поселения: дорога ведёт взгляд между домами к общей вертикали храма.",
          },
          {
            image: "media/vyatskoe/street.webp",
            alt: "Дома 9 и 11 на улице Клюшниково",
            overlay: "street",
            kicker: "2 · Улица",
            title: "Проведи линию фасадов",
            copy: "Кадр домов 9 и 11 показывает, как фасады обращаются к улице. Для вывода о всём фронте нужен уже ряд документальных видов.",
            caption: "Улица Клюшниково: дома 9 и 11 — одна точка внутри более длинного ряда.",
            result: "Проявлена граница улицы. Это схема музейного чтения кадра, не обмер и не доказательство непрерывности всей улицы.",
          },
          {
            image: "media/vyatskoe/house-16.webp",
            alt: "Парадный фасад дома 16 на улице Клюшниково",
            overlay: "house",
            kicker: "3 · Дом",
            title: "Собери парадное лицо",
            copy: "Карниз завершает стену, вертикали делят её, а проёмы задают повторяемый ритм.",
            caption: "Дом: карниз, вертикали и окна образуют композицию.",
            result: "Проявлена схема фасада: верхняя горизонталь и вертикальные оси связывают окна в одно целое.",
          },
          {
            image: "media/vyatskoe/facade-detail.webp",
            alt: "Карниз и проёмы дома 16 на улице Клюшниково крупным планом",
            overlay: "detail",
            kicker: "4 · Деталь",
            title: "Назови части фасада",
            copy: "На том же доме теперь можно различить карниз, оконные обрамления и простенки — участки стены между проёмами.",
            caption: "Деталь того же дома № 16: карниз, обрамления окон и простенки.",
            result: "Проявлены части фасада: карниз завершает стену, обрамления выделяют окна, простенки задают паузы между ними.",
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
        labModeButtons = [].slice.call(lab.querySelectorAll("[data-lab-mode]")),
        labProgress = lab.querySelector("[data-lab-progress]"),
        labComplete = lab.querySelector("[data-lab-complete]"),
        labReset = lab.querySelector("[data-lab-reset]"),
        overlayGroups = [].slice.call(lab.querySelectorAll("[data-overlay]")),
        labIndex = 0,
        labMode = "guided",
        visited = [false, false, false, false];
      function updateLabControls() {
        var count = visited.filter(Boolean).length;
        labProgress.textContent = "Шаг " + (labIndex + 1) + " из 4 · пройдено " + count;
        labButtons.forEach(function (button, i) {
          button.setAttribute("aria-pressed", String(i === labIndex));
          button.classList.toggle("is-done", visited[i]);
          button.disabled = labMode === "guided" && i > count;
        });
        labModeButtons.forEach(function (button) {
          button.setAttribute("aria-pressed", String(button.dataset.labMode === labMode));
        });
      }
      function drawLab(index) {
        var item = labData[index];
        labIndex = index;
        lab.classList.remove("is-revealed");
        labImage.src = item.image;
        labImage.alt = item.alt;
        labCaption.textContent = item.caption;
        labKicker.textContent = item.kicker;
        labTitle.textContent = item.title;
        labCopy.textContent = item.copy;
        labResult.textContent = "Нажми «Провести схему», чтобы проверить признак на кадре.";
        labReveal.textContent = "Провести схему по кадру";
        labReveal.disabled = false;
        overlayGroups.forEach(function (group) {
          group.classList.toggle("is-active", group.dataset.overlay === item.overlay);
        });
        updateLabControls();
      }
      labButtons.forEach(function (button) {
        button.addEventListener("click", function () {
          if (!button.disabled) drawLab(Number(button.dataset.labStep));
        });
      });
      labModeButtons.forEach(function (button) {
        button.addEventListener("click", function () {
          labMode = button.dataset.labMode;
          updateLabControls();
          labResult.textContent = labMode === "guided"
            ? "Управляемый режим: проявляй масштабы по порядку."
            : "Свободный режим: можно сравнить любой масштаб; завершение всё равно требует всех четырёх.";
        });
      });
      labReveal.addEventListener("click", function () {
        if (labMode === "guided" && lab.classList.contains("is-revealed")) return;
        lab.classList.toggle("is-revealed");
        var revealed = lab.classList.contains("is-revealed");
        labResult.textContent = revealed
          ? labData[labIndex].result
          : "Схема скрыта. Можно выбрать другое расстояние.";
        labReveal.textContent = revealed ? "Скрыть схему" : "Провести схему по кадру";
        if (revealed) visited[labIndex] = true;
        updateLabControls();
        if (revealed && visited.every(Boolean)) {
          var saved = state();
          saved.vyatskoe = { completedAt: new Date().toISOString() };
          try {
            localStorage.setItem(storageKey, JSON.stringify(saved));
          } catch (error) {}
          paint();
          document.dispatchEvent(new CustomEvent("museum:route-success"));
          labComplete.hidden = false;
          labComplete.focus({ preventScroll: true });
        } else if (revealed && labMode === "guided" && labIndex < labData.length - 1) {
          labButtons[labIndex + 1].focus({ preventScroll: true });
        }
      });
      labReset.addEventListener("click", function () {
        visited = [false, false, false, false];
        labComplete.hidden = true;
        labMode = "guided";
        drawLab(0);
        labButtons[0].focus({ preventScroll: true });
        document.dispatchEvent(new CustomEvent("museum:route-reset"));
      });
      drawLab(0);
    }
    var game = document.querySelector("[data-feature-game]");
    if (game) {
      var data = [
          {
            q: "Какая подпись к архивному снимку честная?",
            a: [
              [
                "bad",
                "Так выглядел дом во Вятском",
                "Книжная подпись указывает Некрасовский район, но не Вятское.",
              ],
              [
                "good",
                "Дом Саловых, Некрасовский район, 1984",
                "Да: именно место, семья и год названы в книжной подписи.",
              ],
              [
                "bad",
                "Весь декор Вятского сделан из гипса",
                "Один региональный снимок не доказывает материал фасадов Вятского.",
              ],
            ],
          },
          {
            q: "Что снимок позволяет сказать о материале?",
            a: [
              ["good", "На этой избе подпись называет лепнину гипсовой", "Да. Это точная граница одного документированного дома."],
              ["bad", "Вся лепнина Ярославской области гипсовая", "Один снимок не описывает весь региональный корпус."],
              ["bad", "Материал фасадов Вятского установлен", "Дом Саловых не находится во Вятском, а материал его фасада нельзя переносить на другой объект."],
            ],
          },
          {
            q: "Какой более широкий вывод требует уже текста исследования?",
            a: [
              ["bad", "На фотографии виден деревянный дом", "Это видно непосредственно и не требует отдельной региональной теории."],
              ["bad", "Снимок сделан в 1984 году", "Год уже дан в подписи."],
              ["good", "Такой декор связан с отходным лепным промыслом", "Да. Связь с промыслом опирается на текст исследования, а не выводится из одного кадра."],
            ],
          },
        ],
        i = 0,
        score = 0,
        counter = game.querySelector("[data-game-counter]"),
        q = game.querySelector("[data-game-question]"),
        actions = game.querySelector("[data-game-actions]"),
        feedback = game.querySelector("[data-game-feedback]"),
        reset = game.querySelector("[data-game-reset]");
      function draw() {
        var item = data[i];
        counter.textContent = "Вопрос " + (i + 1) + " из " + data.length;
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
            reset.focus({ preventScroll: true });
          } else {
            draw();
            actions.querySelector("button").focus({ preventScroll: true });
          }
        }, 300);
      });
      reset.addEventListener("click", function () {
        i = 0;
        score = 0;
        reset.hidden = true;
        draw();
        actions.querySelector("button").focus({ preventScroll: true });
      });
      draw();
    }
    var progress = document.querySelector("[data-page-progress]");
    if (progress && "IntersectionObserver" in window) {
      var acts = [].slice.call(document.querySelectorAll("[data-museum-act]")),
        progressCount = progress.querySelector("[data-page-progress-count]"),
        progressTitle = progress.querySelector("[data-page-progress-title]");
      var actObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var index = acts.indexOf(entry.target);
          progressCount.textContent = (index + 1) + "/" + acts.length;
          progressTitle.textContent = entry.target.dataset.museumActTitle;
        });
      }, { rootMargin: "-30% 0px -60%" });
      acts.forEach(function (act) { actObserver.observe(act); });
    }
  });
})();
