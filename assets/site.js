(function () {
  'use strict';

  var CONFIG = {
    // Optional. Paste a form endpoint (Formspree, Getform, a Make or Zapier webhook)
    // to receive applications and bookings as JSON. Leave empty to run without one.
    endpoint: '',
    coachTimeZone: 'Asia/Kolkata',
    callMinutes: 45,
    daysAhead: 21,
    minNoticeHours: 12,
    // Call start hours in the coach's time zone, by weekday (0 = Sunday). [first, last + 1]
    hours: { 1: [10, 20], 2: [10, 20], 3: [10, 20], 4: [10, 20], 5: [10, 20], 6: [10, 14] }
  };

  var FOCUS = {
    career: 'Career Coaching',
    leadership: 'Leadership Coaching',
    business: 'Business Coaching',
    health: 'Health Coaching',
    finance: 'Finance Coaching',
    life: 'Life Coaching'
  };

  var PROGRAMS = {
    clarity: 'Clarity Session',
    '90day': '90-Day Coaching',
    leadership: 'Leadership Program',
    unsure: 'Not sure yet'
  };

  var KEY_DRAFT = 'devia.draft';
  var KEY_APP = 'devia.application';
  var KEY_BOOKING = 'devia.booking';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var store = {
    get: function (k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { sessionStorage.removeItem(k); } catch (e) {} }
  };

  // Personal data is never shown in full: emails become XXXX@domain, phones keep the last 2 digits.
  function maskEmail(email) {
    email = String(email || '');
    var at = email.lastIndexOf('@');
    return at > 0 ? 'XXXX' + email.slice(at) : 'XXXX@XXXX.com';
  }
  function maskPhone(code, number) {
    var d = String(number || '').replace(/\D/g, '');
    if (!d) return '';
    return (code ? code + ' ' : '') + new Array(Math.max(d.length - 1, 5)).join('X') + d.slice(-2);
  }

  function send(type, data) {
    if (!CONFIG.endpoint || !window.fetch) return Promise.resolve();
    var body = Object.assign({ type: type, sentAt: new Date().toISOString(), page: location.pathname }, data);
    var req = fetch(CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      keepalive: true
    }).catch(function () {});
    return Promise.race([req, wait(4000)]);
  }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function makeRef() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', out = 'DC-';
    for (var i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  function showOverlay() {
    var o = $('[data-overlay]');
    if (o) o.hidden = false;
  }

  /* ---------- shared ---------- */

  function initCommon() {
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

    var month = $('[data-intake-month]');
    if (month) {
      var d = new Date();
      if (d.getDate() > 15) d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      month.textContent = d.toLocaleString('en-US', { month: 'long' });
    }
  }

  /* ---------- landing page ---------- */

  function initHome() {
    var header = $('[data-header]');
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var toggle = $('[data-nav-toggle]');
    var menu = $('[data-mobile-nav]');
    var setMenu = function (open) {
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      toggle.querySelector('use').setAttribute('href', open ? '#i-x' : '#i-menu');
    };
    toggle.addEventListener('click', function () { setMenu(menu.hidden); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 920 && !menu.hidden) setMenu(false); });

    var clip = $('[data-hero-video]');
    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var saveData = navigator.connection && navigator.connection.saveData;
    if (clip && clip.getAttribute('data-src') && !calm && !saveData) {
      clip.addEventListener('playing', function () { clip.classList.add('playing'); });
      clip.src = clip.getAttribute('data-src');
      var p = clip.play();
      if (p && p.catch) p.catch(function () {});
    }

    $$('[data-video]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var frame = document.createElement('iframe');
        frame.src = btn.getAttribute('data-embed');
        frame.title = 'Devia Coaching | About';
        frame.allow = 'autoplay; fullscreen; picture-in-picture';
        frame.setAttribute('allowfullscreen', '');
        btn.parentNode.replaceChild(frame, btn);
        frame.focus();
      });
    });

    var bar = $('[data-mobile-cta]');
    var hero = $('[data-hero]');
    var band = $('.cta-band');
    if (bar && hero && band && 'IntersectionObserver' in window) {
      var heroOut = false, bandIn = false;
      var update = function () { bar.classList.toggle('show', heroOut && !bandIn); };
      new IntersectionObserver(function (e) { heroOut = !e[0].isIntersecting; update(); }).observe(hero);
      new IntersectionObserver(function (e) { bandIn = e[0].isIntersecting; update(); }).observe(band);
    }
  }

  /* ---------- form helpers ---------- */

  function controlOf(field) {
    return field.querySelector('input[type=tel]') || field.querySelector('input:not([type=radio]), select, textarea');
  }

  function checkField(field) {
    var msg = '';
    var radios = $$('input[type=radio]', field);
    var el;
    if (radios.length) {
      el = radios[0];
      if (field.hasAttribute('data-required') && !radios.some(function (r) { return r.checked; })) {
        msg = field.getAttribute('data-msg') || 'Please choose one.';
      }
    } else {
      el = controlOf(field);
      if (!el) return true;
      var val = el.type === 'checkbox' ? el.checked : el.value.trim();
      var required = el.required || el.hasAttribute('data-required');
      if (required && !val) {
        msg = el.getAttribute('data-msg') || 'Please fill this in.';
      } else if (val && el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) {
        msg = 'Please enter a valid email, like name@example.com.';
      } else if (val && el.type === 'tel') {
        var digits = val.replace(/\D/g, '').length;
        if (digits < 6 || digits > 14 || /[^\d\s()+-]/.test(val)) msg = 'Please enter a valid phone number.';
      } else if (val && el.getAttribute('data-min') && val.length < +el.getAttribute('data-min')) {
        msg = 'Please add a little more detail (at least ' + el.getAttribute('data-min') + ' characters).';
      }
    }

    var err = field.querySelector('.err');
    field.classList.toggle('has-error', !!msg);
    if (err) {
      err.textContent = msg;
      if (!err.id) err.id = 'err-' + Math.random().toString(36).slice(2, 8);
    }
    var targets = radios.length ? radios : [el];
    targets.forEach(function (t) {
      if (msg) {
        t.setAttribute('aria-invalid', 'true');
        if (err) t.setAttribute('aria-describedby', err.id);
      } else {
        t.removeAttribute('aria-invalid');
      }
    });
    return !msg;
  }

  function checkAll(root) {
    var first = null;
    $$('.field', root).forEach(function (f) {
      if (!checkField(f) && !first) first = f;
    });
    if (first) {
      var target = first.querySelector('[aria-invalid]') || controlOf(first);
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (target) setTimeout(function () { target.focus({ preventScroll: true }); }, 250);
      return false;
    }
    return true;
  }

  function liveCheck(root) {
    root.addEventListener('input', function (e) {
      var f = e.target.closest('.field');
      if (f && f.classList.contains('has-error')) checkField(f);
    });
    root.addEventListener('change', function (e) {
      var f = e.target.closest('.field');
      if (f && f.classList.contains('has-error')) checkField(f);
    });
  }

  /* ---------- application ---------- */

  function initApply() {
    var form = $('#apply-form');
    var steps = $$('.form-step[data-step]', form);
    var stepper = $$('[data-stepper] li');
    var btnBack = $('[data-back]', form);
    var btnNext = $('[data-next]', form);
    var btnSubmit = $('[data-submit]', form);
    var count = $('[data-step-count]', form);
    var current = 0;

    function data() {
      var out = {};
      $$('input, select, textarea', form).forEach(function (el) {
        if (!el.name || el.name === 'website') return;
        if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; }
        else if (el.type === 'checkbox') out[el.name] = el.checked;
        else out[el.name] = el.value.trim();
      });
      return out;
    }

    function restore(values) {
      Object.keys(values || {}).forEach(function (name) {
        $$('[name="' + name + '"]', form).forEach(function (el) {
          if (el.type === 'radio') el.checked = el.value === values[name];
          else if (el.type === 'checkbox') el.checked = !!values[name];
          else el.value = values[name];
        });
      });
    }

    restore(store.get(KEY_DRAFT));
    var params = new URLSearchParams(location.search);
    var focus = params.get('focus');
    var program = params.get('program');
    if (focus && FOCUS[focus]) restore({ focus: focus });
    if (program && PROGRAMS[program]) restore({ program: program });

    form.addEventListener('input', function () { store.set(KEY_DRAFT, data()); });
    form.addEventListener('change', function () { store.set(KEY_DRAFT, data()); });
    liveCheck(form);

    $$('[data-count-for]').forEach(function (c) {
      var ta = document.getElementById(c.getAttribute('data-count-for'));
      var upd = function () { c.textContent = ta.value.length + '/' + ta.maxLength; };
      ta.addEventListener('input', upd);
      upd();
    });

    function show(i, moveFocus) {
      current = i;
      steps.forEach(function (s, n) { s.hidden = n !== i; });
      stepper.forEach(function (li, n) {
        li.classList.toggle('is-done', n < i);
        li.classList.toggle('is-current', n === i);
        if (n === i) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
        li.querySelector('.num').innerHTML = n < i ? '<svg class="ic" aria-hidden="true"><use href="#i-check"/></svg>' : String(n + 1);
      });
      btnBack.hidden = i === 0;
      btnNext.hidden = i === steps.length - 1;
      btnSubmit.hidden = i !== steps.length - 1;
      count.textContent = 'Step ' + (i + 1) + ' of ' + steps.length;
      if (i === steps.length - 1) buildReview();
      if (moveFocus) {
        var top = form.getBoundingClientRect().top + window.scrollY - 16;
        if (window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' });
        var firstInput = steps[i].querySelector('input:not([type=hidden]), textarea, select');
        if (firstInput && i < steps.length - 1) firstInput.focus({ preventScroll: true });
      }
    }

    function buildReview() {
      var d = data();
      var rows = [
        ['Name', d.firstName + ' ' + d.lastName, 0],
        ['Email', maskEmail(d.email), 0],
        ['Phone', maskPhone(d.phoneCode, d.phone), 0],
        ['Location', d.location, 0],
        ['Work', d.role, 0],
        ['Coaching', FOCUS[d.focus], 1],
        ['Right now', d.stage, 1],
        ['Challenge', d.challenge, 1],
        ['Program', PROGRAMS[d.program], 2],
        ['90-day goal', d.goal, 2],
        ['Coached before', d.coached, 2],
        ['Commitment', d.commitment + ' / 10', 2],
        ['Ready to invest', d.invest, 2],
        ['Start', d.start, 2]
      ];
      if (d.link) rows.splice(5, 0, ['LinkedIn / website', d.link, 0]);
      var dl = $('[data-review]', form);
      dl.innerHTML = '';
      rows.forEach(function (r) {
        var wrap = document.createElement('div');
        var dt = document.createElement('dt');
        var dd = document.createElement('dd');
        var edit = document.createElement('button');
        dt.textContent = r[0];
        dd.textContent = r[1] || '';
        edit.type = 'button';
        edit.textContent = 'Edit';
        edit.setAttribute('aria-label', 'Edit ' + r[0].toLowerCase());
        edit.addEventListener('click', function () { show(r[2], true); });
        wrap.appendChild(dt);
        wrap.appendChild(dd);
        wrap.appendChild(edit);
        dl.appendChild(wrap);
      });
    }

    btnNext.addEventListener('click', function () {
      if (checkAll(steps[current])) show(current + 1, true);
    });
    btnBack.addEventListener('click', function () { show(current - 1, true); });

    // Enter in a text input moves to the next step instead of submitting early.
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && current < steps.length - 1) {
        e.preventDefault();
        btnNext.click();
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (current < steps.length - 1) { btnNext.click(); return; }
      if (!checkAll(steps[current])) return;

      var d = data();
      var app = Object.assign({ id: makeRef().replace('DC-', 'AP-'), submittedAt: new Date().toISOString() }, d);
      delete app.consent;

      if (form.website.value) { location.href = 'book.html'; return; }

      store.set(KEY_APP, app);
      store.del(KEY_DRAFT);
      store.del(KEY_BOOKING);
      showOverlay();
      Promise.all([send('application', app), wait(900)]).then(function () { location.href = 'book.html'; });
    });

    show(0, false);
  }

  /* ---------- time zone helpers ---------- */

  var partsFmt = {};
  function partsIn(date, tz) {
    if (!partsFmt[tz]) {
      partsFmt[tz] = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    }
    var o = {};
    partsFmt[tz].formatToParts(date).forEach(function (p) { o[p.type] = p.value; });
    return { year: +o.year, month: +o.month, day: +o.day, hour: +o.hour % 24, minute: +o.minute, second: +o.second };
  }

  function offsetMs(date, tz) {
    var p = partsIn(date, tz);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(date.getTime() / 1000) * 1000;
  }

  function zonedToUtc(y, m, d, h, min, tz) {
    var guess = Date.UTC(y, m, d, h, min);
    var t = guess - offsetMs(new Date(guess), tz);
    var off2 = offsetMs(new Date(t), tz);
    return new Date(guess - off2);
  }

  function dayKey(date, tz) {
    var p = partsIn(date, tz);
    return p.year + '-' + String(p.month).padStart(2, '0') + '-' + String(p.day).padStart(2, '0');
  }

  function tzLabel(tz) {
    var off = '';
    try {
      off = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
        .formatToParts(new Date()).filter(function (p) { return p.type === 'timeZoneName'; })[0].value;
    } catch (e) {}
    var city = tz.split('/').pop().replace(/_/g, ' ');
    if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') city = 'India';
    return city + (off ? ' (' + off + ')' : '');
  }

  function fmtDate(date, tz, opts) {
    return new Intl.DateTimeFormat('en-US', Object.assign({ timeZone: tz }, opts)).format(date);
  }
  function fmtTime(date, tz) { return fmtDate(date, tz, { hour: 'numeric', minute: '2-digit' }); }
  function fmtLongDate(date, tz) { return fmtDate(date, tz, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function buildSlots() {
    var tz = CONFIG.coachTimeZone;
    var earliest = Date.now() + CONFIG.minNoticeHours * 36e5;
    var today = partsIn(new Date(), tz);
    var out = [];
    for (var i = 0; i <= CONFIG.daysAhead; i++) {
      var day = new Date(Date.UTC(today.year, today.month - 1, today.day + i));
      var range = CONFIG.hours[day.getUTCDay()];
      if (!range) continue;
      for (var h = range[0]; h < range[1]; h++) {
        var y = day.getUTCFullYear(), m = day.getUTCMonth(), d = day.getUTCDate();
        var start = zonedToUtc(y, m, d, h, 0, tz);
        if (start.getTime() < earliest) continue;
        // Hide a few slots so the calendar doesn't look empty until a real calendar is connected.
        if (hash(y + '-' + m + '-' + d + '-' + h) % 100 < 38) continue;
        out.push(start);
      }
    }
    return out;
  }

  /* ---------- booking ---------- */

  function initBook() {
    var app = store.get(KEY_APP);
    var slots = buildSlots();
    var detected = 'Asia/Kolkata';
    try { detected = Intl.DateTimeFormat().resolvedOptions().timeZone || detected; } catch (e) {}
    if (detected === 'Asia/Calcutta') detected = 'Asia/Kolkata';
    var tz = detected;
    var byDay = {}, keys = [];
    var viewY, viewM, selDay = null, selSlot = null;

    var cal = $('[data-cal]');
    var monthLabel = $('[data-month-label]');
    var prev = $('[data-prev]');
    var next = $('[data-next-month]');
    var slotsBox = $('[data-slots]');
    var slotsHead = $('[data-slots-head]');
    var tzSelect = $('[data-tz]');
    var pickPane = $('[data-pick-pane]');
    var confirmPane = $('[data-confirm-pane]');

    if (app) {
      $('[data-app-notice]').hidden = false;
      $('[data-first-name]').textContent = app.firstName;
      if (FOCUS[app.focus]) $('[data-focus-label]').textContent = FOCUS[app.focus];
    } else {
      $('[data-noapp-notice]').hidden = false;
      var applyStep = $('[data-apply-step]');
      applyStep.classList.remove('is-done');
      applyStep.querySelector('.num').textContent = '1';
    }

    var zones = [detected, 'Asia/Kolkata', 'Asia/Dubai', 'Asia/Riyadh', 'Asia/Singapore', 'Asia/Kuala_Lumpur',
      'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'America/Los_Angeles',
      'America/Toronto', 'Australia/Sydney', 'Africa/Johannesburg'];
    zones.filter(function (z, i) { return zones.indexOf(z) === i; }).forEach(function (z) {
      try {
        var o = document.createElement('option');
        o.value = z;
        o.textContent = tzLabel(z);
        tzSelect.appendChild(o);
      } catch (e) {}
    });
    tzSelect.value = tz;

    function group() {
      byDay = {};
      slots.forEach(function (s) {
        var k = dayKey(s, tz);
        (byDay[k] = byDay[k] || []).push(s);
      });
      keys = Object.keys(byDay).sort();
    }

    function renderCal() {
      var first = new Date(Date.UTC(viewY, viewM, 1));
      var daysIn = new Date(Date.UTC(viewY, viewM + 1, 0)).getUTCDate();
      var todayKey = dayKey(new Date(), tz);
      monthLabel.textContent = fmtDate(first, 'UTC', { month: 'long', year: 'numeric' });
      cal.innerHTML = '';
      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(function (d) {
        var s = document.createElement('span');
        s.className = 'dow';
        s.textContent = d;
        cal.appendChild(s);
      });
      for (var p = 0; p < first.getUTCDay(); p++) {
        var pad = document.createElement('span');
        pad.className = 'pad';
        cal.appendChild(pad);
      }
      for (var day = 1; day <= daysIn; day++) {
        var k = viewY + '-' + String(viewM + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        var b = document.createElement('button');
        var n = byDay[k] ? byDay[k].length : 0;
        b.type = 'button';
        b.textContent = day;
        b.dataset.key = k;
        var label = fmtDate(new Date(Date.UTC(viewY, viewM, day)), 'UTC', { weekday: 'long', month: 'long', day: 'numeric' });
        if (n) {
          b.className = 'avail';
          b.setAttribute('aria-label', label + ', ' + n + (n === 1 ? ' time' : ' times') + ' available');
        } else {
          b.disabled = true;
          b.setAttribute('aria-label', label + ', not available');
        }
        if (k === todayKey) b.classList.add('today');
        if (k === selDay) { b.classList.add('sel'); b.setAttribute('aria-pressed', 'true'); }
        cal.appendChild(b);
      }
      var firstKey = keys[0] || '', lastKey = keys[keys.length - 1] || '';
      var ym = viewY * 12 + viewM;
      prev.disabled = !firstKey || ym <= (+firstKey.slice(0, 4)) * 12 + (+firstKey.slice(5, 7) - 1);
      next.disabled = !lastKey || ym >= (+lastKey.slice(0, 4)) * 12 + (+lastKey.slice(5, 7) - 1);
    }

    function renderSlots() {
      slotsBox.innerHTML = '';
      if (!selDay || !byDay[selDay]) {
        slotsHead.textContent = keys.length ? 'Select a date' : 'No times available';
        if (!keys.length) {
          var empty = document.createElement('p');
          empty.className = 'empty';
          empty.textContent = 'All slots are booked right now. Please check back tomorrow.';
          slotsBox.appendChild(empty);
        }
        return;
      }
      slotsHead.textContent = fmtDate(byDay[selDay][0], tz, { weekday: 'long', month: 'long', day: 'numeric' });
      byDay[selDay].forEach(function (s) {
        var row = document.createElement('div');
        row.className = 'slot';
        var t = document.createElement('button');
        t.type = 'button';
        t.className = 'time';
        t.textContent = fmtTime(s, tz);
        row.appendChild(t);
        if (selSlot && selSlot.getTime() === s.getTime()) {
          row.classList.add('sel');
          t.setAttribute('aria-pressed', 'true');
          var go = document.createElement('button');
          go.type = 'button';
          go.className = 'next';
          go.textContent = 'Next';
          go.addEventListener('click', openConfirm);
          row.appendChild(go);
        }
        t.addEventListener('click', function () {
          selSlot = s;
          renderSlots();
          updatePicked();
          var n = slotsBox.querySelector('.slot.sel .next');
          if (n) n.focus();
        });
        slotsBox.appendChild(row);
      });
    }

    function updatePicked() {
      var li = $('[data-picked]');
      if (!selSlot) { li.hidden = true; return; }
      li.hidden = false;
      $('[data-picked-text]').textContent = fmtDate(selSlot, tz, { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + fmtTime(selSlot, tz);
    }

    function setView(key) {
      viewY = +key.slice(0, 4);
      viewM = +key.slice(5, 7) - 1;
    }

    function selectDay(k) {
      selDay = k;
      if (selSlot && dayKey(selSlot, tz) !== k) { selSlot = null; updatePicked(); }
      renderCal();
      renderSlots();
    }

    cal.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b && !b.disabled) selectDay(b.dataset.key);
    });
    prev.addEventListener('click', function () { viewM--; if (viewM < 0) { viewM = 11; viewY--; } renderCal(); });
    next.addEventListener('click', function () { viewM++; if (viewM > 11) { viewM = 0; viewY++; } renderCal(); });
    tzSelect.addEventListener('change', function () {
      tz = tzSelect.value;
      group();
      selDay = selSlot ? dayKey(selSlot, tz) : keys[0] || null;
      if (selDay) setView(selDay);
      renderCal();
      renderSlots();
      updatePicked();
    });

    function openConfirm() {
      var end = new Date(selSlot.getTime() + CONFIG.callMinutes * 6e4);
      $('[data-confirm-date]').textContent = fmtLongDate(selSlot, tz);
      $('[data-confirm-time]').textContent = fmtTime(selSlot, tz) + ' – ' + fmtTime(end, tz) + ' · ' + tzLabel(tz);
      pickPane.hidden = true;
      confirmPane.hidden = false;
      $('#confirm-title').focus();
    }

    $('[data-change-time]').addEventListener('click', function () {
      confirmPane.hidden = true;
      pickPane.hidden = false;
      var n = slotsBox.querySelector('.slot.sel .next');
      if (n) n.focus();
    });

    var bookForm = $('#book-form');
    var contact = $('[data-contact-fields]');
    if (app) {
      var who = $('[data-booking-for]');
      who.hidden = false;
      who.innerHTML = 'Booking for <strong></strong> · <span></span>';
      who.querySelector('strong').textContent = app.firstName + ' ' + app.lastName.charAt(0) + '.';
      who.querySelector('span').textContent = maskEmail(app.email);
    } else {
      contact.hidden = false;
      $('#b-name').required = true;
      $('#b-email').required = true;
    }
    liveCheck(bookForm);

    bookForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!selSlot || !checkAll(bookForm)) return;
      var booking = {
        ref: makeRef(),
        start: selSlot.toISOString(),
        end: new Date(selSlot.getTime() + CONFIG.callMinutes * 6e4).toISOString(),
        timeZone: tz,
        note: $('#b-note').value.trim(),
        bookedAt: new Date().toISOString()
      };
      if (app) {
        booking.applicationId = app.id;
        booking.name = app.firstName + ' ' + app.lastName;
        booking.email = app.email;
        booking.focus = app.focus;
      } else {
        booking.name = $('#b-name').value.trim();
        booking.email = $('#b-email').value.trim();
      }
      store.set(KEY_BOOKING, booking);
      showOverlay();
      Promise.all([send('booking', booking), wait(900)]).then(function () { location.href = 'confirmed.html'; });
    });

    group();
    if (keys.length) {
      selDay = keys[0];
      setView(selDay);
    } else {
      var now = partsIn(new Date(), tz);
      viewY = now.year;
      viewM = now.month - 1;
    }
    renderCal();
    renderSlots();
  }

  /* ---------- confirmation ---------- */

  function initConfirmed() {
    var b = store.get(KEY_BOOKING);
    if (!b || !b.start) {
      $('[data-not-booked]').hidden = false;
      return;
    }
    $('[data-booked]').hidden = false;

    var start = new Date(b.start), end = new Date(b.end), tz = b.timeZone;
    var first = String(b.name || '').split(' ')[0];
    if (first) $('[data-first-name]').textContent = first;
    else $('[data-first-name-wrap]').hidden = true;
    $('[data-masked-email]').textContent = maskEmail(b.email);
    $('[data-ref]').textContent = b.ref;
    $('[data-date]').textContent = fmtLongDate(start, tz);
    $('[data-time]').textContent = fmtTime(start, tz) + ' – ' + fmtTime(end, tz) + ' · ' + tzLabel(tz);
    if (FOCUS[b.focus]) $('[data-focus]').textContent = FOCUS[b.focus];

    var title = 'Strategy Call with Devia Coaching';
    var details = 'Your free 45-minute strategy call. The Google Meet link is in your confirmation email.\nBooking ref: ' + b.ref;
    var stamp = function (d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };

    $('[data-gcal]').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(title) +
      '&dates=' + stamp(start) + '/' + stamp(end) +
      '&details=' + encodeURIComponent(details) +
      '&location=' + encodeURIComponent('Google Meet (link in email)');

    $('[data-ics]').addEventListener('click', function () {
      var ics = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Devia Coaching//Booking//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        'UID:' + b.ref + '@deviacoaching',
        'DTSTAMP:' + stamp(new Date()),
        'DTSTART:' + stamp(start),
        'DTEND:' + stamp(end),
        'SUMMARY:' + title,
        'DESCRIPTION:' + details.replace(/\n/g, '\\n'),
        'LOCATION:Google Meet (link in email)',
        'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:' + title, 'END:VALARM',
        'END:VEVENT', 'END:VCALENDAR'
      ].join('\r\n');
      var url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
      var a = document.createElement('a');
      a.href = url;
      a.download = 'devia-strategy-call.ics';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });
  }

  /* ---------- boot ---------- */

  function boot() {
    initCommon();
    var page = document.body.getAttribute('data-page');
    if (page === 'home') initHome();
    if (page === 'apply') initApply();
    if (page === 'book') initBook();
    if (page === 'confirmed') initConfirmed();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
