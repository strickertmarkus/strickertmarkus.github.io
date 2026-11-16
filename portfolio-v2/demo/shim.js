/* Runs first on every page of the family-app demo (sw.js puts it at the top of <head>).
   1. The app's localStorage becomes a demo store kept in this tab's sessionStorage under "demo:",
      so the real app's data on this domain is never read or written.
   2. Service workers, Firebase and notifications are switched off.
   3. Invented data is written once per tab, with dates relative to today.
   4. Names on screen are invented, and a small button leads back to the portfolio. */
(function () {
  'use strict';
  var P = 'demo:', ss = window.sessionStorage, mem = {};
  try { for (var i = 0; i < ss.length; i++) { var k = ss.key(i); if (k.indexOf(P) === 0) mem[k.slice(P.length)] = ss.getItem(k); } } catch (e) {}
  function put(k, v) { k = String(k); v = String(v); mem[k] = v; try { ss.setItem(P + k, v); } catch (e) {} }
  function del(k) { k = String(k); delete mem[k]; try { ss.removeItem(P + k); } catch (e) {} }
  var api = {
    getItem: function (k) { k = String(k); return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
    setItem: put, removeItem: del,
    clear: function () { Object.keys(mem).forEach(del); },
    key: function (n) { return Object.keys(mem)[n] || null; }
  };
  var store = new Proxy(api, {
    get: function (t, p) { if (p === 'length') return Object.keys(mem).length; if (p in t) return t[p]; return typeof p === 'string' ? api.getItem(p) : undefined; },
    set: function (t, p, v) { put(p, v); return true; },
    deleteProperty: function (t, p) { del(p); return true; },
    has: function (t, p) { return p in t || Object.prototype.hasOwnProperty.call(mem, p); },
    ownKeys: function () { return Object.keys(mem); },
    getOwnPropertyDescriptor: function (t, p) { return Object.prototype.hasOwnProperty.call(mem, p) ? { value: mem[p], enumerable: true, configurable: true, writable: true } : undefined; }
  });
  try { Object.defineProperty(window, 'localStorage', { configurable: true, get: function () { return store; } }); } catch (e) {}

  if (navigator.serviceWorker) try { navigator.serviceWorker.register = function () { return new Promise(function () {}); }; } catch (e) {}
  try { if (window.Notification) window.Notification.requestPermission = function () { return Promise.resolve('denied'); }; } catch (e) {}
  window.__familyDemo = true;
  /* the demo's own top page: this one, unless it sits inside another demo page (Home's views) */
  var demoTop = window;
  try { if (window.parent !== window && window.parent.__familyDemo) demoTop = window.parent.__demoTop; } catch (e) {}
  window.__demoTop = demoTop;

  /* ---------- invented data, once per tab ---------- */
  if (!api.getItem('__demo_seeded')) {
    var S = function (k, v) { put(k, typeof v === 'string' ? v : JSON.stringify(v)); };
    var now = new Date(); now.setHours(12, 0, 0, 0);
    var pad = function (n) { return String(n).padStart(2, '0'); };
    var day = function (off) { var d = new Date(now); d.setDate(d.getDate() + off); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
    var month = function (off) { var d = new Date(now.getFullYear(), now.getMonth() + off, 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1); };

    var sec = function (key, name, color, light, bg, items, isIncome) { return { key: key, name: name, color: color, light: light, bg: bg, isIncome: !!isIncome, items: items.map(function (x) { return { name: x[0], budget: x[1], actual: x[2] }; }) }; };
    var cur = [
      sec('income', 'Inkomster', '#10B981', '#D1FAE5', '#ECFDF5', [['Lön (netto)', 31000, 31000], ['Barnbidrag', 1250, 1250], ['Övriga inkomster', 0, 400]], true),
      sec('house', 'Bostadskostnader', '#3B6DE0', '#DBEAFE', '#EFF6FF', [['Lån', 6200, 6200], ['Amortering', 2000, 2000], ['HOA / Bostadsrättsavgift', 0, 0], ['Hemförsäkring', 290, 290], ['Internet', 349, 349], ['Elektricitet', 900, 640], ['Vatten & avlopp', 400, 0], ['Huskonto', 1500, 1500]]),
      sec('insurances', 'Försäkringar', '#E0723B', '#FFE4D1', '#FFF4EC', [['Sjukförsäkring', 180, 180], ['Bilförsäkring', 420, 420], ['Livförsäkring', 150, 150], ['Husdjursförsäkring', 0, 0]]),
      sec('subscriptions', 'Prenumerationer', '#D4A72C', '#FEF3C7', '#FFFBEB', [['Spotify', 129, 129], ['Netflix', 119, 119], ['Molnlagring', 39, 39], ['Gym', 399, 399], ['Nyheter / Tidningar', 0, 0]]),
      sec('savings', 'Sparande', '#22A06B', '#D1FAE5', '#ECFDF5', [['Nödfond', 1500, 1500], ['Investeringar', 2000, 2000], ['Semesterfond', 1000, 1000], ['Pension (extra)', 500, 0]]),
      sec('misc', 'Övrigt', '#A855F7', '#F3E8FF', '#FAF5FF', [['Matinköp', 3200, 1840], ['ICA-konto', 0, 0], ['Restaurang/café', 600, 455], ['Transport', 900, 610], ['Kläder', 500, 0], ['Underhållning', 400, 190], ['Personlig vård', 300, 120], ['Gåvor', 300, 0]])
    ];
    var md = {}, wob = [0.96, 1.08, 0.93, 1.12, 1.0];
    md[month(0)] = { sections: cur };
    for (var mi = 0; mi < 5; mi++) {
      var m = JSON.parse(JSON.stringify(cur));
      m.forEach(function (s) { s.items.forEach(function (x, ii) { x.actual = s.isIncome ? x.budget : Math.round(x.budget * (s.key === 'misc' || (s.key === 'house' && ii === 5) ? wob[mi] + (ii % 3) * 0.05 : 1)); }); });
      if (mi === 1) m[0].items[2].actual = 2500;
      md[month(mi - 5)] = { sections: m };
    }
    S('budgetTracker', { currentMonth: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), monthlyData: md });
    S('selectedBudgetMonth', month(0)); S('finance-last-page-v1', 'budget.html'); S('budget-last-user-v1', 'markus');

    var ev = function (id, off, title, member, time, endOff, endTime, loc) { return { id: id, date: day(off), title: title, shortTitle: '', location: loc || '', otherPeople: '', time: time || '', endDate: endOff != null ? day(endOff) : '', endTime: endTime || '', member: member, emoji: '', notes: '', repeat: 'none', repeatUntil: '', reminderMinutes: null }; };
    S('cal_events', [
      ev('d1', -12, 'Konsert', 'family', '19:00', null, '', 'Konserthuset'), ev('d2', -4, 'Bilservice', 'markus', '07:30'),
      ev('d3', 1, 'Tandläkare', 'maja', '08:30'), ev('d4', 3, 'Workshop', 'markus', '09:00', null, '12:00'),
      ev('d5', 5, 'Middag hos vänner', 'family', '18:30'), ev('d6', 6, 'Loppis', 'family', '10:00'),
      ev('d7', 9, 'Föräldramöte', 'maja', '18:00'), ev('d8', 11, 'Löpning', 'markus', '06:30'),
      ev('d9', 12, 'Stugan', 'family', '', 14), ev('d10', 19, 'Marknad', 'family', '11:00')
    ]);

    var it = function (id, text, checked) { return { id: id, type: 'item', text: text, checked: !!checked }; };
    var cat = function (id, text) { return { id: id, type: 'category', text: text }; };
    S('sh_lists', [
      { id: -101, name: 'Inköpslista', mode: 'shopping', modeTemplateInitialized: true, items: [cat(-10100, 'Willys'), it(1, 'Mjölk'), it(2, 'Havregryn'), it(3, 'Bananer'), it(4, 'Pasta'), it(5, 'Kaffe', true), cat(-10101, 'Lidl'), it(6, 'Ägg'), it(7, 'Tomater'), it(8, 'Knäckebröd', true), cat(-10102, 'Coop'), it(9, 'Blommor')] },
      { id: -102, name: 'Packlista', mode: 'packing', items: [cat(-10200, 'Kläder'), it(20, 'Mössa och vantar'), it(21, 'Ullstrumpor'), it(22, 'Regnjacka', true), cat(-10201, 'Övrigt'), it(23, 'Laddare'), it(24, 'Termos'), it(25, 'Spel till kvällen')] }
    ]);
    S('sh_list_mode', 'shopping');
    var td = {}, mk = function (id, text, member, priority, due, done) { td[id] = { id: id, text: text, member: member, done: !!done, priority: priority, dueDate: due == null ? '' : day(due), createdAt: Date.now(), updatedAt: Date.now(), deleted: false }; };
    mk('t1', 'Byta till vinterdäck', 'markus', 'important', 4); mk('t2', 'Boka tvättstuga', 'maja', 'normal', 2);
    mk('t3', 'Köpa present till kalaset', 'family', 'urgent', 5); mk('t4', 'Rensa förrådet', 'family', 'normal', null, true);
    S('family_todos_v2_cache', td);

    /* six weeks of training up to today */
    var wk = [], n = 0, start = -41;
    for (var w = 0; w < 6; w++) {
      [[0, 'Styrka', 'Överkropp', 52, 118, [['Bänkpress', 4, 8, 60 + w * 2.5], ['Rodd med skivstång', 4, 10, 50 + w * 2.5], ['Axelpress', 3, 10, 30 + w]]],
       [2, 'Löpning', 'Distans', 38 + w, 148, null, 6 + w * 0.4],
       [3, 'Styrka', 'Underkropp', 55, 122, [['Knäböj', 4, 6, 80 + w * 2.5], ['Marklyft', 3, 5, 100 + w * 5], ['Utfall', 3, 10, 16]]],
       [5, 'Löpning', 'Intervaller', 32, 158, null, 5.2],
       [6, 'Rörlighet', 'Stretch', 20, 92, null]].forEach(function (s0) {
        var off = start + w * 7 + s0[0]; if (off > 0) return;
        var o = { id: 'w' + (++n), date: day(off), name: s0[2], title: s0[2], type: s0[1], duration: s0[3], hrAvg: s0[4], hrMin: s0[4] - 25, hrMax: s0[4] + 24, notes: '' };
        if (s0[5]) o.exercises = s0[5].map(function (e) { return { name: e[0], sets: e[1], reps: e[2], weight: e[3] }; });
        if (s0[6]) o.runDistance = Math.round(s0[6] * 10) / 10;
        wk.push(o);
      });
    }
    S('ex_wk', wk); S('ex_goals', { weeklySessions: 4, weeklyMinutes: 180 });
    var rest = { enabled: true, type: 'rest', seconds: 60, name: 'Vila' };
    S('ex_templates', [
      { id: 9001, name: 'Överkropp', type: 'Styrka', duration: 50, exercises: [
        { kind: 'strength', name: 'Bänkpress', sets: 4, reps: 8, weight: 72.5, weightMode: 'kg', betweenSets: rest },
        { kind: 'strength', name: 'Rodd med skivstång', sets: 4, reps: 10, weight: 62.5, weightMode: 'kg', betweenSets: rest },
        { kind: 'strength', name: 'Axelpress', sets: 3, reps: 10, weight: 35, weightMode: 'kg', betweenSets: rest },
        { kind: 'strength', name: 'Chins', sets: 3, reps: 8, weight: 0, weightMode: 'bodyweight', betweenSets: rest }] },
      { id: 9002, name: 'Underkropp', type: 'Styrka', duration: 55, exercises: [
        { kind: 'strength', name: 'Knäböj', sets: 4, reps: 6, weight: 92.5, weightMode: 'kg', betweenSets: rest },
        { kind: 'strength', name: 'Marklyft', sets: 3, reps: 5, weight: 125, weightMode: 'kg', betweenSets: rest }] }
    ]);
    put('__demo_seeded', '1');
  }

  /* ---------- invented names on screen ---------- */
  var NAMES = [[/Frick Strickert/gi, 'Familjen Lind'], [/Strickert/gi, 'Lind'], [/Markus/gi, 'Alex'], [/Maja/gi, 'Sara'], [/Melker/gi, 'Leo'], [/Mila/gi, 'Ella']].map(function (r) {
    var to = r[1]; return [r[0], function (m) { return m === m.toUpperCase() && m !== m.toLowerCase() ? to.toUpperCase() : m === m.toLowerCase() ? to.toLowerCase() : to; }];
  });
  function swap(v) { var n = v; NAMES.forEach(function (r) { n = n.replace(r[0], r[1]); }); return n; }
  function fix(node) {
    if (!node) return;
    var w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT), t;
    while ((t = w.nextNode())) { var n = swap(t.nodeValue); if (n !== t.nodeValue) t.nodeValue = n; }
    if (node.querySelectorAll) node.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(function (e) { var n = swap(e.placeholder); if (n !== e.placeholder) e.placeholder = n; });
  }
  new MutationObserver(function (ms) {
    ms.forEach(function (m) { if (m.type === 'characterData') fix(m.target.parentNode); else m.addedNodes.forEach(function (n) { if (n.nodeType === 1) fix(n); else if (n.nodeType === 3) fix(n.parentNode); }); });
  }).observe(document, { subtree: true, childList: true, characterData: true });

  document.addEventListener('DOMContentLoaded', function () {
    fix(document.documentElement);
    /* links written as /budget/... would leave the demo */
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="/budget/"]'); if (!a) return;
      e.preventDefault(); location.href = a.getAttribute('href').replace(/^\/budget\//, '/portfolio-v2/demo/app/');
    }, true);
    /* opened full screen on a phone: a way back to the portfolio */
    if (window.top === window) {
      var b = document.createElement('a'); b.href = '/portfolio-v2/#work/fam'; b.textContent = '‹ Portfolio · demo';
      b.setAttribute('style', 'position:fixed;z-index:2147483000;top:calc(env(safe-area-inset-top,0px) + 8px);left:50%;transform:translateX(-50%);padding:6px 14px;border-radius:999px;font:600 12px/1.4 Inter,system-ui,sans-serif;letter-spacing:.02em;color:#0B0E14;background:#FDBA74;box-shadow:0 6px 24px rgba(0,0,0,.4);text-decoration:none');
      document.body.appendChild(b);
    }
  });
})();
