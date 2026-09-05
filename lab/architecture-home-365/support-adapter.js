/* Compatibility adapter for the existing museum-support engine.
   Scope: architecture home preview. Proposed upstream fixes: HANDOFF task 136. */
(() => {
  const blocks = [...document.querySelectorAll('.support')];
  const main = blocks[0], last = blocks.at(-1), heart = document.querySelector('#heart');
  if (!main || !last || !heart) return;
  main.id = 'support';
  last.id = 'support-details';
  main.querySelector('p').textContent = 'Музей открыт для всех бесплатно. Расскажи о нём, предложи источник, сообщи об ошибке или помоги своими знаниями и работой.';
  main.querySelector('[data-sup-more]').textContent = 'Все способы помощи →';
  last.querySelector('p').textContent = 'Выбери, как помочь музею.';
  const list = document.createElement('ul');
  list.className = 'support-options';
  const mail = 'mailto:arabelthera@gmail.com?subject=';
  const options = [
    ['Рассказать о музее', null],
    ['Предложить источник', 'Источник для Музея русской архитектуры'],
    ['Сообщить об ошибке', 'Ошибка на главной Музея русской архитектуры'],
    ['Помочь профессионально', 'Профессиональная помощь Музею русской архитектуры']
  ];
  for (const [label, subject] of options) {
    const li = document.createElement('li');
    const el = document.createElement(subject ? 'a' : 'button');
    el.textContent = label;
    if (subject) el.href = mail + encodeURIComponent(subject);
    else { el.type = 'button'; el.dataset.supShare = ''; }
    li.append(el); list.append(li);
  }
  const money = document.createElement('li');
  money.textContent = 'Поддержать проект рублём — приём пожертвований пока не подключён.';
  list.append(money); last.append(list);
  heart.setAttribute('role', 'button'); heart.tabIndex = 0;
  heart.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); heart.click(); }
  });
  const visibility = new Map();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => visibility.set(entry.target, entry.isIntersecting));
    const visible = [...visibility.values()].some(Boolean);
    heart.classList.toggle('support-visible', visible);
    heart.tabIndex = visible ? -1 : 0;
  });
  blocks.forEach(block => observer.observe(block));
})();
