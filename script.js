(() => {
'use strict';

/* ===== Настройки ===== */
const CORRECT_NAME = 'Барсбек';
const CORRECT_DATE = '03/11/2011';
const PAGE_DURATION = 6000;   // сколько мс показывается каждая страница
const FLIP_MS = 1300;         // длительность перелистывания (как в CSS)
const MAX_HEARTS = 14;

const PAGES = [
  { img: 'images/your-foto-1.jpg', title: 'Всё с чего-то начинается...', text: 'Иногда одна встреча становится началом истории, которую совсем не хочется заканчивать.', mini: '♥' },
  { img: 'images/your-foto-2.jpg', title: 'А потом появляются моменты...', text: 'Обычные дни постепенно превращаются в воспоминания, которые хочется хранить.' },
  { img: 'images/your-foto-3.jpg', type: 'date' },
  { img: 'images/your-foto-4.jpg', title: 'Спасибо тебе', text: 'Спасибо за улыбки, разговоры, моменты и всё то тепло, которое ты приносишь в мою жизнь.' },
  { img: 'images/your-foto-5.jpg', title: 'Если бы это была книга...', text: 'Я бы не хотел закрывать её. Потому что самые красивые страницы хочется перечитывать снова и снова.' },
  { img: 'images/your-foto-6.jpg', type: 'end' }
];

const NAME_ERRORS = ['Хм... что-то тут не сходится...', 'Нет-нет, я ждала совсем другое имя >:(', 'Я вообще-то знаю, кого ждала...', 'Барсбек где? 🥺', 'Ты точно Барсбек? 🤨', 'Хм... Я не верю...'];
const DATE_ERRORS = [
  ['Х-хмк...', 'Ппочемуу ты ввееел нЕ пРрааавильно?! >///<'],
  ['Эй! Это неправильная дата! >:('],
  ['Я эту дату точно помню...'],
  ['Ну нееет... попробуй ещё раз...'],
  ['Ты сейчас серьёзно? Это же не та дата!']
];

/* ===== Утилиты ===== */
const $ = s => document.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

async function typeText(el, text, speed = 38) {
  const id = el._tid = (el._tid || 0) + 1;
  el.textContent = '';
  for (const ch of text) {
    if (el._tid !== id) return false;
    el.textContent += ch;
    await sleep(speed);
  }
  return true;
}

/* ===== Состояния ===== */
const FLOW = { WELCOME: ['NAME_CHECK'], NAME_CHECK: ['DATE_CHECK'], DATE_CHECK: ['BOOK_INTRO'], BOOK_INTRO: ['BOOK'], BOOK: ['FINAL'], FINAL: [] };
let state = 'WELCOME';
function setState(next) {
  if (!FLOW[state].includes(next)) return false;
  state = next;
  return true;
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
}

/* ===== Сердечки ===== */
const heartsEl = $('#hearts');
function createHeart(opts = {}) {
  if (heartsEl.childElementCount >= (opts.force ? MAX_HEARTS * 2 : MAX_HEARTS)) return;
  const h = document.createElement('span');
  h.className = 'heart';
  h.textContent = '♥';
  h.style.left = (opts.x ?? rand(2, 96)) + 'vw';
  h.style.fontSize = rand(10, opts.big ? 34 : 24) + 'px';
  h.style.setProperty('--d', (opts.fast ? rand(2.4, 4) : rand(8, 14)) + 's');
  h.style.setProperty('--o', rand(.25, .8).toFixed(2));
  h.style.setProperty('--dx', rand(-60, 60) + 'px');
  h.style.setProperty('--rot', rand(-40, 40) + 'deg');
  h.addEventListener('animationend', () => h.remove());
  heartsEl.appendChild(h);
}
function burst(n, fast = true) {
  for (let i = 0; i < n; i++) setTimeout(() => createHeart({ fast, force: true, x: rand(15, 85) }), i * 90);
}
setInterval(() => { if (!document.hidden) createHeart(); }, 1800);

/* ===== Ripple ===== */
document.addEventListener('pointerdown', e => {
  const b = e.target.closest('.btn');
  if (!b) return;
  const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height);
  const s = document.createElement('span');
  s.className = 'ripple';
  s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  b.appendChild(s);
  setTimeout(() => s.remove(), 650);
});

/* ===== Общая ошибка / успех ===== */
function shakeCard(form) {
  const field = form.querySelector('.field');
  form.classList.remove('shake'); field.classList.remove('bounce'); void form.offsetWidth;
  form.classList.add('shake');
  setTimeout(() => form.classList.remove('shake'), 550);
  return field;
}
async function showError(form, msgEl, sequence, withBounce) {
  const field = shakeCard(form);
  field.classList.add('bad');
  if (withBounce) field.classList.add('bounce');
  msgEl.classList.remove('ok');
  burst(withBounce ? 7 : 4);
  for (let i = 0; i < sequence.length; i++) {
    const done = await typeText(msgEl, sequence[i], withBounce ? 45 : 32);
    if (!done) return;
    if (i < sequence.length - 1) await sleep(700);
  }
  await sleep(1400);
  field.classList.remove('bad', 'bounce');
}
async function showSuccess(form, msgEl, text) {
  const field = form.querySelector('.field');
  field.classList.remove('bad'); field.classList.add('good');
  msgEl.classList.add('ok');
  form.querySelector('input').blur();
  form.querySelector('.btn').disabled = true;
  burst(6, false);
  await typeText(msgEl, text, 40);
  await sleep(1100);
}

/* ===== Экран 1: имя ===== */
const nameForm = $('#name-form'), nameInput = $('#name-input'), nameMsg = $('#name-msg');
function checkName(e) {
  e.preventDefault();
  if (state !== 'NAME_CHECK') return;
  const v = nameInput.value.trim().toLowerCase();
  if (v === CORRECT_NAME) {
    if (!setState('DATE_CHECK')) return;
    showSuccess(nameForm, nameMsg, 'Вот теперь правильно... ♥').then(() => {
      showScreen('screen-date');
      setTimeout(() => $('#date-input').focus({ preventScroll: true }), 1000);
    });
  } else {
    showError(nameForm, nameMsg, [pick(NAME_ERRORS)], false);
  }
}
nameForm.addEventListener('submit', checkName);

/* ===== Экран 2: дата ===== */
const dateForm = $('#date-form'), dateInput = $('#date-input'), dateMsg = $('#date-msg');
dateInput.addEventListener('input', () => {
  const d = dateInput.value.replace(/\D/g, '').slice(0, 8);
  let out = d.slice(0, 2);
  if (d.length > 2) out += '/' + d.slice(2, 4);
  if (d.length > 4) out += '/' + d.slice(4);
  dateInput.value = out;
});
function checkDate(e) {
  e.preventDefault();
  if (state !== 'DATE_CHECK') return;
  const v = dateInput.value.trim().replace(/[.\-\s]/g, '/');
  if (v === CORRECT_DATE) {
    if (!setState('BOOK_INTRO')) return;
    showSuccess(dateForm, dateMsg, 'Вот теперь правильно... ♥').then(() => {
      document.body.classList.add('dim');
      burst(10, false);
      openBook();
    });
  } else {
    showError(dateForm, dateMsg, pick(DATE_ERRORS), true);
  }
}
dateForm.addEventListener('submit', checkDate);

/* ===== Переход к книге ===== */
async function openBook() {
  showScreen('screen-intro');
  buildBook();
  await sleep(4200);
  if (!setState('BOOK')) return;
  showScreen('screen-book');
  startBook();
}

/* ===== Книга ===== */
const book = $('#book');
let leaves = [];

function photoHTML(p, i) {
  return `<div class="photo" style="--r:${i % 2 ? 1.2 : -1.2}deg"><img src="${p.img}" alt="Наше фото ${i + 1}"></div>`;
}
function textHTML(p) {
  if (p.type === 'date') return `<div class="reveal"><div class="mini">♥</div><div class="date">23.09.2011</div><div class="line"></div><p>Дата, которую я хочу помнить.</p><div class="mini">♥ ♥ ♥</div></div>`;
  if (p.type === 'end') return `<div class="big-heart reveal">♥</div><p class="reveal">И это только одна маленькая глава...</p><p class="later" id="later">Продолжение ещё впереди. ♥</p>`;
  return `<div class="reveal"><h2>${p.title}</h2><p>${p.text}</p>${p.mini ? `<div class="mini">${p.mini}</div>` : ''}</div>`;
}
function buildBook() {
  if (book.childElementCount) return;
  let html = `<div class="leaf" data-i="0"><div class="face front cover-front"><div class="cover-title">Наша история</div><div class="cover-heart">♥</div></div><div class="face back page left">${photoHTML(PAGES[0], 0)}</div></div>`;
  PAGES.forEach((p, k) => {
    const back = k < PAGES.length - 1 ? photoHTML(PAGES[k + 1], k + 1) : '<div class="mini">♥</div>';
    html += `<div class="leaf" data-i="${k + 1}"><div class="face front page right">${textHTML(p)}</div><div class="face back page left">${back}</div></div>`;
  });
  book.innerHTML = html;
  leaves = [...book.querySelectorAll('.leaf')];
  leaves.forEach((l, i) => { l.style.zIndex = 20 + (leaves.length - i); });
  book.querySelectorAll('img').forEach(img => img.addEventListener('error', () => img.parentNode.classList.add('nophoto')));
}

function flipPage(idx, forward) {
  const l = leaves[idx];
  l.style.zIndex = forward ? 100 + idx : 20 + (leaves.length - idx);
  l.classList.toggle('flipped', forward);
}
function revealPage(p) {
  leaves[p].querySelector('.face.back').classList.add('seen');
  leaves[p + 1].querySelector('.face.front').classList.add('seen');
  if (PAGES[p].type === 'end') setTimeout(() => $('#later')?.classList.add('on'), 3000);
}

async function startBook() {
  await sleep(300);
  book.classList.add('show');
  await sleep(1800);                     // закрытая книга
  book.classList.add('open');
  flipPage(0, true);                     // обложка открывается
  await sleep(FLIP_MS + 300);
  revealPage(0);
  for (let p = 1; p < PAGES.length; p++) {
    await sleep(PAGE_DURATION);
    flipPage(p, true);                   // листаем: слева фото p, справа текст p
    await sleep(FLIP_MS * 0.6);
    revealPage(p);
    await sleep(FLIP_MS * 0.4);
  }
  await sleep(PAGE_DURATION);
  closeBook();
}

async function closeBook() {
  for (let i = leaves.length - 2; i >= 0; i--) {   // последний лист не перевёрнут
    flipPage(i, false);
    await sleep(i === 0 ? FLIP_MS : 420);
  }
  book.classList.remove('open');                    // закрытая книга по центру
  await sleep(2200);
  book.style.opacity = '0';
  await sleep(1200);
  showFinal();
}

/* ===== Финал ===== */
async function showFinal() {
  if (!setState('FINAL')) return;
  showScreen('screen-final');
  await sleep(1200);
  $('#final-name').classList.add('on');
  await sleep(2600);
  $('#final-love').classList.add('on');
  burst(8, false);
  await sleep(2500);
  $('#final-sub').classList.add('on');
  setInterval(() => createHeart({ big: true }), 1100);
}

/* ===== Музыка (по желанию) ===== */
const bgm = $('#bgm'), musicBtn = $('#music');
musicBtn.hidden = false;
bgm.addEventListener('error', () => { musicBtn.hidden = true; });
musicBtn.addEventListener('click', () => {
  if (bgm.paused) {
    bgm.volume = .5;
    bgm.play().then(() => musicBtn.classList.add('playing')).catch(() => { musicBtn.hidden = true; });
  } else { bgm.pause(); musicBtn.classList.remove('playing'); }
});

/* ===== Старт ===== */
// Служебный обход только для проверки: откройте сайт с #dev в адресе
if (location.hash === '#dev') {
  const d = $('#dev'); d.hidden = false;
  d.addEventListener('click', () => { d.hidden = true; state = 'DATE_CHECK'; setState('BOOK_INTRO'); openBook(); });
}
setState('NAME_CHECK');
showScreen('screen-name');
})();
