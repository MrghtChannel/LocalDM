/* Меню выбора персонажа — CEF для RAGE:MP
 * Без ?. и ?? — совместимо со старым Chromium в RAGE:MP.
 *
 * API (вызывает client.js через browser.execute):
 *   charSelect.init({login, balance, maxSlots, selectedId, characters:[...]})
 *   charSelect.setCharacters({balance?, selectedId?, characters:[...]})
 *   charSelect.error('текст'), charSelect.notify('текст'), charSelect.unlock()
 *
 * События в client.js (mp.trigger):
 *   charselect:select(id|0)  charselect:play(id)
 *   charselect:create(json)  charselect:back
 */
(function () {
  'use strict';

  var DESIGN_W = 1536, DESIGN_H = 864, VISIBLE = 3;
  var inMp = typeof mp !== 'undefined' && typeof mp.trigger === 'function';

  function $(id) { return document.getElementById(id); }
  function emit(name) {
    var args = Array.prototype.slice.call(arguments, 1);
    if (inMp) { mp.trigger.apply(mp, [name].concat(args)); }
    else { console.log('[mp.trigger]', name, args); }
  }

  /* ---------- масштаб под любое разрешение ---------- */
  function rescale() {
    var s = Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H);
    document.documentElement.style.fontSize = (s * 10) + 'px'; // 1rem = 10 дизайн-пикселей
  }
  window.addEventListener('resize', rescale);
  rescale();

  if (!inMp) { document.body.classList.add('preview'); }

  /* ---------- состояние ---------- */
  var S = { login: '', balance: 0, max: 3, chars: [], idx: 0, start: 0, locked: false, muted: true, lockTimer: null };

  function total() { return Math.max(S.max, S.chars.length); }
  function cur() { return S.chars[S.idx] || null; }
  function fmt(n) { return String(Math.floor(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

  var SILHOUETTE = '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><use href="#sil" width="100" height="100"/></svg>';
  var GEM = '<svg width="11" height="10" style="color:#fff;--gem-cut:#367fd1"><use href="#gem"/></svg>';

  function setFace(el, avatarUrl) {
    el.textContent = '';
    if (avatarUrl) {
      var img = document.createElement('img');
      img.src = avatarUrl;
      el.appendChild(img);
    } else {
      el.innerHTML = SILHOUETTE; // статичная разметка, без пользовательских данных
    }
  }

  /* ---------- отрисовка ---------- */
  function renderSlots() {
    var list = $('slotList');
    list.textContent = '';
    var t = total();
    if (S.idx < S.start) { S.start = S.idx; }
    if (S.idx >= S.start + VISIBLE) { S.start = S.idx - VISIBLE + 1; }
    S.start = Math.max(0, Math.min(S.start, Math.max(0, t - VISIBLE)));

    var end = Math.min(t, S.start + VISIBLE);
    for (var i = S.start; i < end; i++) {
      (function (i) {
        var c = S.chars[i] || null;
        var b = document.createElement('button');
        b.className = 'slot' + (i === S.idx ? ' sel' : '') + (c ? '' : ' empty');
        b.title = c ? (c.name + ' ' + c.surname) : 'Свободный слот';
        if (c) {
          var face = document.createElement('div');
          face.className = 'face';
          setFace(face, c.avatar);
          b.appendChild(face);
          if (c.vip) {
            var g = document.createElement('div');
            g.className = 'gem';
            g.innerHTML = GEM;
            b.appendChild(g);
          }
        } else {
          var p = document.createElement('span');
          p.className = 'plus';
          p.textContent = '+';
          b.appendChild(p);
        }
        b.addEventListener('click', function () { select(i); });
        list.appendChild(b);
      })(i);
    }
    var multi = t > 1;
    $('prevBtn').style.visibility = multi ? 'visible' : 'hidden';
    $('nextBtn').style.visibility = multi ? 'visible' : 'hidden';
  }

  function renderInfo() {
    var c = cur();
    $('info').classList.toggle('empty', !c);
    $('charName').textContent = c ? (c.name + ' ' + c.surname) : 'Свободный слот';
    setFace($('avatar'), c ? c.avatar : null);

    var vip = c && c.vip ? c.vip : null;
    $('vipRow').style.visibility = vip ? 'visible' : 'hidden';
    if (vip) {
      $('vipName').textContent = vip.name || 'VIP';
      $('vipUntil').textContent = vip.until ? ('До ' + vip.until) : '';
    }

    var lvl = c ? c.level : 0, exp = c ? c.exp : 0, max = c ? c.expMax : 0;
    $('lvl').textContent = c ? lvl : '—';
    $('exp').textContent = c ? exp : '0';
    $('expMax').textContent = c ? max : '0';
    var pct = max > 0 ? Math.max(0, Math.min(1, exp / max)) : 0;
    $('ringBar').setAttribute('stroke-dashoffset', String(51.84 * (1 - pct)));

    $('age').textContent = c ? (c.age + ' лет') : '—';
    $('org').textContent = c && c.org ? c.org : '';
    $('org').classList.toggle('none', !(c && c.org));
    $('faction').textContent = c && c.faction ? c.faction : '—';
    $('created').textContent = c && c.created ? c.created : '—';
    $('cash').textContent = '$' + fmt(c ? c.cash : 0);
    $('bank').textContent = '$' + fmt(c ? c.bank : 0);

    $('playTxt').textContent = c ? 'Начать игру' : 'Создать персонажа';
    $('balance').textContent = fmt(S.balance);
    $('login').textContent = S.login || '—';
  }

  function render() { renderSlots(); renderInfo(); }

  /* ---------- выбор / действия ---------- */
  function select(i, silent) {
    var t = total();
    if (t < 1) { return; }
    i = ((i % t) + t) % t;
    var changed = i !== S.idx;
    S.idx = i;
    render();
    if (changed || silent === false) {
      var c = cur();
      emit('charselect:select', c ? c.id : 0);
    }
  }

  function lock() {
    S.locked = true;
    $('playBtn').classList.add('busy');
    clearTimeout(S.lockTimer);
    S.lockTimer = setTimeout(unlock, 5000);
  }
  function unlock() {
    S.locked = false;
    clearTimeout(S.lockTimer);
    $('playBtn').classList.remove('busy');
  }

  function primary() {
    if (S.locked) { return; }
    var c = cur();
    if (!c) { submitCreate(); return; }
    lock();
    emit('charselect:play', c.id);
  }

  /* ---------- тосты ---------- */
  var toastTimer = null;
  function toast(msg, type) {
    var t = $('toast');
    t.textContent = msg;
    t.className = 'toast ' + (type || '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.add('hidden'); }, 3600);
  }

  /* ---------- создание ---------- */
  function submitCreate() {
    lock();
    emit('charselect:create', JSON.stringify({ slot: S.idx }));
  }

  /* ---------- события интерфейса ---------- */
  document.addEventListener('mousedown', function (e) {
    // кнопки не забирают фокус, чтобы Enter/пробел не дублировали клик
    var el = e.target;
    while (el && el !== document) {
      if (el.tagName === 'BUTTON') { e.preventDefault(); return; }
      el = el.parentNode;
    }
  });
  $('prevBtn').addEventListener('click', function () { select(S.idx - 1); });
  $('nextBtn').addEventListener('click', function () { select(S.idx + 1); });
  $('playBtn').addEventListener('click', primary);
  document.addEventListener('keydown', function (e) {
    var typing = e.target && e.target.tagName === 'INPUT';
    if (e.code === 'Escape') {
      e.preventDefault();
      emit('charselect:back');
      return;
    }
    if (e.code === 'Enter' || e.code === 'NumpadEnter') {
      e.preventDefault();
      primary();
      return;
    }
    if (typing) { return; }
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') { select(S.idx - 1); }
    else if (e.code === 'KeyD' || e.code === 'ArrowRight') { select(S.idx + 1); }
  });

  /* ---------- публичный API ---------- */
  function applyData(d, isInit) {
    if (typeof d === 'string') { d = JSON.parse(d); }
    if (d.login !== undefined) { S.login = d.login; }
    if (d.balance !== undefined) { S.balance = d.balance; }
    if (d.maxSlots) { S.max = d.maxSlots; }
    if (d.characters) { S.chars = d.characters; }
    if (d.selectedId !== undefined && d.selectedId !== null) {
      var found = -1;
      for (var i = 0; i < S.chars.length; i++) { if (S.chars[i].id === d.selectedId) { found = i; break; } }
      if (found >= 0) { S.idx = found; }
    }
    if (S.idx >= total()) { S.idx = Math.max(0, total() - 1); }
    unlock();
    render();
    var c = cur();
    emit('charselect:select', c ? c.id : 0); // выбор активного персонажа
  }

  window.charSelect = {
    init: function (d) { S.start = 0; S.idx = 0; applyData(d, true); },
    setCharacters: function (d) { applyData(d, false); },
    setBalance: function (n) { S.balance = n; $('balance').textContent = fmt(n); },
    error: function (m) { unlock(); toast(m, 'err'); },
    notify: function (m) { toast(m, 'ok'); },
    unlock: unlock
  };

  /* ---------- демо для открытия в обычном браузере ---------- */
  if (!inMp) {
    window.charSelect.init({
      login: 'gta5rp',
      balance: 3569,
      maxSlots: 3,
      selectedId: 3,
      characters: [
        { id: 1, name: 'Alex', surname: 'Morgan', age: 31, org: null, faction: 'Безработный', created: '12.08.2026', cash: 1200, bank: 54000, level: 4, exp: 12, expMax: 16, vip: { name: 'Platinum VIP', until: '12.10 10:31' } },
        { id: 2, name: 'Nick', surname: 'Harper', age: 27, org: null, faction: 'Безработный', created: '20.08.2026', cash: 350, bank: 0, level: 1, exp: 1, expMax: 4, vip: null },
        { id: 3, name: 'GTA5RP', surname: 'Test', age: 25, org: null, faction: 'Безработный', created: '01.09.2026', cash: 8568459, bank: 0, level: 10, exp: 0, expMax: 40, vip: { name: 'Platinum VIP', until: '12.10 10:31' } }
      ]
    });
  }
})();
