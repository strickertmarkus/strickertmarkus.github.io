/*
 * Listor → "Lista" tab as a notes app.
 * A blank page with headings (H1/H2), bold, italic, underline, to-do checkboxes, bullets,
 * indent, dividers and undo/redo behind a round "Aa" button bottom right.
 * - Each note is a `sh_lists` entry with mode "general" and a sanitised `note` HTML field
 *   (syncs through the existing Firebase key). `pinned` keeps a note at the top of the sheet.
 * - Headings show "done/total" for the to-dos under them and fold on a tap on that counter.
 * - Ticked to-dos sink to the end of their list. Lines with @Maja / @Markus get their colour.
 * - "Till inköp" sends the open to-dos of the section under the caret to the shopping list.
 * - Empty notes offer quick templates; swiping the name row switches note.
 */
(function () {
  'use strict';
  var KEY = 'sh_lists';
  var SELECTED = 'sh_selected_general';
  var ALLOWED = { H1: 1, H2: 1, P: 1, DIV: 1, BR: 1, B: 1, STRONG: 1, I: 1, EM: 1, U: 1, UL: 1, OL: 1, LI: 1, HR: 1 };
  var TEMPLATES = {
    'Packlista resa': '<h1>Packlista</h1><h2>Kläder</h2><ul class="nt-todo"><li>Underkläder</li><li>Strumpor</li><li>Tröjor</li></ul><h2>Barnen</h2><ul class="nt-todo"><li>Blöjor</li><li>Gosedjur</li></ul><h2>Övrigt</h2><ul class="nt-todo"><li>Laddare</li><li>Pass</li></ul>',
    'Inför fest': '<h1>Inför fest</h1><h2>Att handla</h2><ul class="nt-todo"><li></li></ul><h2>Att göra</h2><ul class="nt-todo"><li>Bjuda in</li><li>Duka</li></ul>',
    'Möte': '<h1>Möte</h1><h2>Punkter</h2><ul><li></li></ul><h2>Att göra efteråt</h2><ul class="nt-todo"><li></li></ul>'
  };
  var root, editor, titleInput, sheet, saveTimer = 0, decorateTimer = 0, currentId = null;

  function readLists() { try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (_) { return []; } }
  function writeLists(lists) { localStorage.setItem(KEY, JSON.stringify(lists)); }
  function notes(lists) { return (lists || readLists()).filter(function (l) { return l && l.mode === 'general'; }); }
  function sortedNotes() {
    return notes().slice().sort(function (a, b) { return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.updatedAt || 0) - (a.updatedAt || 0); });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function today() { return new Date().toISOString().slice(0, 10); }

  // Keep only the formatting the toolbar can make; everything else becomes plain text.
  function sanitize(html) {
    var box = document.createElement('div');
    box.innerHTML = html || '';
    (function clean(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) return;
        if (child.nodeType !== 1 || !ALLOWED[child.tagName]) {
          if (child.nodeType === 1) { clean(child); while (child.firstChild) node.insertBefore(child.firstChild, child); }
          node.removeChild(child);
          return;
        }
        var keepClass = child.tagName === 'UL' && child.classList.contains('nt-todo');
        var checked = child.tagName === 'LI' && child.getAttribute('data-checked') === 'true';
        var folded = /^H[12]$/.test(child.tagName) && child.getAttribute('data-folded') === 'true';
        Array.prototype.slice.call(child.attributes).forEach(function (a) { child.removeAttribute(a.name); });
        if (keepClass) child.className = 'nt-todo';
        if (checked) child.setAttribute('data-checked', 'true');
        if (folded) child.setAttribute('data-folded', 'true');
        clean(child);
      });
    })(box);
    return box.innerHTML;
  }

  function currentNote(lists) {
    var all = notes(lists);
    var sel = currentId != null ? currentId : Number(localStorage.getItem(SELECTED));
    var n = all.find(function (l) { return Number(l.id) === Number(sel); }) || all[0] || null;
    currentId = n ? n.id : null;
    return n;
  }
  function ensureNote() {
    var lists = readLists();
    if (!notes(lists).length) {
      var id = lists.reduce(function (m, l) { return Math.max(m, Number(l.id) || 0); }, 0) + 1;
      lists.push({ id: id, name: 'Anteckning', mode: 'general', createdAt: today(), updatedAt: Date.now(), items: [], note: '' });
      writeLists(lists);
    }
  }

  var ICON = {
    todo: '<rect x="4" y="4" width="7" height="7" rx="2"/><path d="m5.6 7.6 1.3 1.3 2.5-2.6M14 7.5h6M4 15.5h7M14 15.5h6"/>',
    ul: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
    indent: '<path d="M10 6h10M10 12h10M10 18h10M4 9l3 3-3 3"/>',
    outdent: '<path d="M10 6h10M10 12h10M10 18h10M7 9l-3 3 3 3"/>',
    hr: '<path d="M4 12h16"/><path d="M8 7h8M8 17h8" opacity=".4"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
    redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
    cart: '<path d="M3 4h2l2 11h11l3-8H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    folder: '<path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>',
    pin: '<path d="M9 4h6l-1 6 3 3H7l3-3z"/><path d="M12 13v7"/>'
  };
  function svg(n) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[n] + '</svg>'; }
  function tool(cmd, label, inner) { return '<button type="button" data-cmd="' + cmd + '" aria-label="' + label + '" title="' + label + '">' + inner + '</button>'; }

  function build() {
    root = document.createElement('section');
    root.className = 'nt';
    root.setAttribute('aria-label', 'Anteckning');
    root.innerHTML =
      '<div class="nt-top">' +
        '<input class="nt-title" id="nt-title" type="text" placeholder="Namn" aria-label="Anteckningens namn">' +
        '<span class="nt-saved" id="nt-saved" aria-live="polite"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7"/></svg><span class="sr">Sparat</span></span>' +
        '<button type="button" class="nt-icon" data-nt="new" aria-label="Ny anteckning" title="Ny anteckning">' + svg('plus') + '</button>' +
        '<button type="button" class="nt-icon" data-nt="saved" aria-label="Sparade anteckningar" title="Sparade">' + svg('folder') + '<span class="nt-count" id="nt-count"></span></button>' +
      '</div>' +
      '<div class="nt-starters" id="nt-starters"><span>Börja med</span>' + Object.keys(TEMPLATES).map(function (k) { return '<button type="button" data-nt="template" data-name="' + esc(k) + '">' + esc(k) + '</button>'; }).join('') + '</div>' +
      '<div class="nt-editor" id="nt-editor" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Anteckning" data-placeholder="Skriv här…"></div>' +
      '<div class="nt-bar" role="toolbar" aria-label="Formatering">' +
        '<div class="nt-tools">' +
          '<div class="nt-row">' +
            tool('h1', 'Rubrik', 'H1') + tool('h2', 'Underrubrik', 'H2') + tool('p', 'Brödtext', 'Aa') + '<span class="nt-sep"></span>' +
            tool('bold', 'Fetstil', '<b>B</b>') + tool('italic', 'Kursiv', '<i>I</i>') + tool('underline', 'Understruken', '<u>U</u>') +
          '</div>' +
          '<div class="nt-row">' +
            tool('todo', 'Att göra-lista', svg('todo')) + tool('ul', 'Punktlista', svg('ul')) + tool('indent', 'Öka indrag', svg('indent')) + tool('outdent', 'Minska indrag', svg('outdent')) + tool('hr', 'Avdelare', svg('hr')) + '<span class="nt-sep"></span>' +
            tool('undo', 'Ångra', svg('undo')) + tool('redo', 'Gör om', svg('redo')) + tool('cart', 'Lägg i inköpslistan', svg('cart')) +
          '</div>' +
        '</div>' +
        '<button type="button" class="nt-fab" data-nt="tools" aria-label="Formatering" aria-expanded="false"><span>Aa</span></button>' +
      '</div>';
    document.querySelector('main.wrap').appendChild(root);
    editor = root.querySelector('#nt-editor');
    titleInput = root.querySelector('#nt-title');

    sheet = document.createElement('div');
    sheet.className = 'nt-sheet-wrap';
    sheet.innerHTML = '<div class="nt-dim" data-nt="close"></div><div class="nt-sheet" role="dialog" aria-label="Sparade anteckningar"><span class="nt-grab"></span><h2>Sparade anteckningar</h2><div class="nt-list" id="nt-list"></div><button type="button" class="nt-add" data-nt="new">+ Ny anteckning</button></div>';
    document.body.appendChild(sheet);

    var toast = document.createElement('div');
    toast.className = 'nt-toast';
    toast.id = 'nt-toast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);

    root.addEventListener('click', onClick);
    sheet.addEventListener('click', onClick);
    var bar = root.querySelector('.nt-bar');
    bar.addEventListener('mousedown', function (e) { e.preventDefault(); });
    bar.addEventListener('touchstart', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      e.preventDefault();
      if (btn.dataset.nt === 'tools') toggleTools(); else run(btn.dataset.cmd);
    }, { passive: false });
    if (window.visualViewport) {
      var place = function () {
        var vv = window.visualViewport;
        root.style.setProperty('--nt-kb', Math.max(0, window.innerHeight - (vv.height + vv.offsetTop)) + 'px');
      };
      window.visualViewport.addEventListener('resize', place);
      window.visualViewport.addEventListener('scroll', place);
    }
    editor.addEventListener('input', function () { queueSave(); queueDecorate(); syncStarters(); });
    editor.addEventListener('click', onEditorClick);
    editor.addEventListener('keydown', onKey);
    editor.addEventListener('paste', function (e) {
      e.preventDefault();
      document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain'));
    });
    titleInput.addEventListener('input', queueSave);
    setupSwipe(root.querySelector('.nt-top'));
  }

  // ── formatting ──────────────────────────────────────
  function run(cmd) {
    if (cmd === 'cart') { sendToShopping(); return; }
    editor.focus();
    if (cmd === 'h1' || cmd === 'h2' || cmd === 'p') document.execCommand('formatBlock', false, cmd);
    else if (cmd === 'bold' || cmd === 'italic' || cmd === 'underline' || cmd === 'undo' || cmd === 'redo') document.execCommand(cmd);
    else if (cmd === 'indent' || cmd === 'outdent') {
      document.execCommand(cmd);
      // A nested list keeps the to-do style of its parent.
      editor.querySelectorAll('ul.nt-todo ul').forEach(function (ul) { ul.classList.add('nt-todo'); });
    }
    else if (cmd === 'hr') document.execCommand('insertHorizontalRule');
    else if (cmd === 'ul' || cmd === 'todo') {
      var ul = closestList();
      var isTodo = ul && ul.classList.contains('nt-todo');
      if (!ul) { document.execCommand('insertUnorderedList'); ul = closestList(); if (ul && cmd === 'todo') ul.classList.add('nt-todo'); }
      else if (cmd === 'todo' && !isTodo) ul.classList.add('nt-todo');
      else if (cmd === 'ul' && isTodo) ul.classList.remove('nt-todo');
      else document.execCommand('insertUnorderedList');
    }
    queueSave(); decorate(); syncBar(); syncStarters();
  }
  function toggleTools(force) {
    var bar = root.querySelector('.nt-bar');
    var open = typeof force === 'boolean' ? force : !bar.classList.contains('open');
    bar.classList.toggle('open', open);
    bar.querySelector('.nt-fab').setAttribute('aria-expanded', String(open));
  }
  function caretElement() {
    var sel = window.getSelection(), n = sel && sel.anchorNode;
    if (!n || !editor.contains(n)) return null;
    return n.nodeType === 1 ? n : n.parentNode;
  }
  function closestList() {
    var el = caretElement();
    while (el && el !== editor) { if (el.tagName === 'UL') return el; el = el.parentNode; }
    return null;
  }
  function syncBar() {
    var block = '';
    try { block = String(document.queryCommandValue('formatBlock') || '').toLowerCase(); } catch (_) {}
    var ul = closestList();
    root.querySelectorAll('.nt-bar [data-cmd]').forEach(function (b) {
      var c = b.dataset.cmd, on = false;
      try {
        if (c === 'bold' || c === 'italic' || c === 'underline') on = document.queryCommandState(c);
        else if (c === 'h1' || c === 'h2') on = block === c;
        else if (c === 'todo') on = !!(ul && ul.classList.contains('nt-todo'));
        else if (c === 'ul') on = !!(ul && !ul.classList.contains('nt-todo'));
      } catch (_) {}
      b.classList.toggle('on', on);
    });
  }

  // ── headings: counters and folding; @names ─────────
  // Top-level blocks after a heading, up to the next heading of the same or a higher level.
  function sectionOf(h) {
    var level = h.tagName === 'H1' ? 1 : 2, out = [], n = h.nextElementSibling;
    while (n) {
      if (n.tagName === 'H1' || (n.tagName === 'H2' && level === 2)) break;
      out.push(n);
      n = n.nextElementSibling;
    }
    return out;
  }
  function decorate() {
    if (!editor) return;
    var heads = editor.querySelectorAll(':scope > h1, :scope > h2');
    editor.querySelectorAll(':scope > *').forEach(function (n) { n.classList.remove('nt-hidden'); });
    heads.forEach(function (h) {
      var blocks = sectionOf(h), total = 0, done = 0;
      blocks.forEach(function (b) {
        b.querySelectorAll('ul.nt-todo > li').forEach(function (li) {
          if (!li.textContent.trim()) return;
          total++; if (li.getAttribute('data-checked') === 'true') done++;
        });
      });
      if (total) h.setAttribute('data-count', done + '/' + total); else h.removeAttribute('data-count');
      h.classList.toggle('nt-all-done', !!total && done === total);
    });
    heads.forEach(function (h) {
      if (h.getAttribute('data-folded') === 'true') sectionOf(h).forEach(function (b) { b.classList.add('nt-hidden'); });
    });
    editor.querySelectorAll('li, p, div, h1, h2').forEach(function (el) {
      var t = el.firstChild && el.childNodes.length ? el.textContent : '';
      var who = /@maja\b/i.test(t) ? 'maja' : /@markus\b/i.test(t) ? 'markus' : '';
      if (who && !el.querySelector('li, p, div')) el.setAttribute('data-who', who); else el.removeAttribute('data-who');
    });
  }
  function queueDecorate() { clearTimeout(decorateTimer); decorateTimer = setTimeout(decorate, 250); }

  function onEditorClick(e) {
    // Tap on the counter/chevron at the right of a heading folds its section.
    var h = e.target.closest && e.target.closest('h1, h2');
    if (h && h.parentNode === editor) {
      var r = h.getBoundingClientRect();
      if (r.right - e.clientX < 44) {
        e.preventDefault();
        if (h.getAttribute('data-folded') === 'true') h.removeAttribute('data-folded'); else h.setAttribute('data-folded', 'true');
        decorate(); queueSave();
        return;
      }
    }
    // Tap on the box in front of a to-do ticks it; ticked items sink to the end.
    var li = e.target.closest && e.target.closest('ul.nt-todo > li');
    if (!li) return;
    var rr = li.getBoundingClientRect();
    if (e.clientX - rr.left > 24) return;
    e.preventDefault();
    var on = li.getAttribute('data-checked') !== 'true';
    li.setAttribute('data-checked', on ? 'true' : 'false');
    var ul = li.parentNode;
    if (on) ul.appendChild(li);
    else { var firstDone = ul.querySelector(':scope > li[data-checked="true"]'); if (firstDone && firstDone !== li) ul.insertBefore(li, firstDone); }
    decorate(); queueSave();
  }
  function onKey(e) {
    if ((e.metaKey || e.ctrlKey) && /^[biu]$/.test(e.key)) { e.preventDefault(); run({ b: 'bold', i: 'italic', u: 'underline' }[e.key]); }
    if (e.key === 'Tab' && closestList()) { e.preventDefault(); run(e.shiftKey ? 'outdent' : 'indent'); }
    if (e.key === 'Enter' && !e.shiftKey) {
      setTimeout(function () {
        var block = '';
        try { block = String(document.queryCommandValue('formatBlock') || '').toLowerCase(); } catch (_) {}
        var el = caretElement();
        if ((block === 'h1' || block === 'h2') && el && !el.textContent.trim()) document.execCommand('formatBlock', false, 'p');
        var li = el && el.closest && el.closest('ul.nt-todo > li');
        if (li) li.removeAttribute('data-checked');
      }, 0);
    }
    setTimeout(syncBar, 0);
  }
  document.addEventListener('selectionchange', function () { if (root && document.activeElement === editor) syncBar(); });

  // ── send open to-dos to the shopping list ──────────
  function sendToShopping() {
    var el = caretElement();
    var top = el; while (top && top.parentNode !== editor) top = top.parentNode;
    var scope = [];
    if (top) {
      var h = top.tagName === 'H1' || top.tagName === 'H2' ? top : null;
      for (var n = top; !h && n; n = n.previousElementSibling) if (n.tagName === 'H1' || n.tagName === 'H2') h = n;
      scope = h ? [h].concat(sectionOf(h)) : [top];
    } else scope = Array.prototype.slice.call(editor.children);
    var texts = [];
    scope.forEach(function (b) {
      b.querySelectorAll('ul.nt-todo li').forEach(function (li) {
        var t = li.textContent.replace(/@\w+/g, '').trim();
        if (t && li.getAttribute('data-checked') !== 'true') texts.push(t);
      });
    });
    if (!texts.length) { toast('Inga öppna att göra-rader att skicka här'); return; }
    var lists = readLists();
    var shop = lists.filter(function (l) { return !l.mode || l.mode === 'shopping'; });
    var sel = Number(localStorage.getItem('sh_selected_shopping'));
    var target = shop.find(function (l) { return Number(l.id) === sel; }) || shop[0];
    if (!target) { toast('Hittade ingen inköpslista'); return; }
    target.items = Array.isArray(target.items) ? target.items : [];
    var existing = target.items.filter(function (i) { return i && i.type !== 'category' && !i.checked; }).map(function (i) { return String(i.text || '').toLowerCase(); });
    var added = 0;
    texts.forEach(function (t, i) {
      if (existing.indexOf(t.toLowerCase()) !== -1) return;
      target.items.unshift({ id: Date.now() + i + Math.random(), type: 'item', text: t, checked: false });
      added++;
    });
    writeLists(lists);
    toast(added ? added + (added === 1 ? ' vara' : ' varor') + ' tillagd' + (added === 1 ? '' : 'a') + ' i Inköpslista' : 'Allt fanns redan i Inköpslista');
  }
  function toast(text) {
    var t = document.getElementById('nt-toast');
    if (!t) return;
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  // ── saving ──────────────────────────────────────────
  function queueSave() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 450); }
  function save() {
    if (!editor) return;
    var lists = readLists();
    var n = lists.find(function (l) { return l && l.mode === 'general' && Number(l.id) === Number(currentId); });
    if (!n) return;
    var html = sanitize(editor.innerHTML);
    var name = titleInput.value.trim() || 'Anteckning';
    if (n.note === html && n.name === name) return;
    n.note = html; n.name = name; n.updatedAt = Date.now();
    writeLists(lists);
    var s = document.getElementById('nt-saved');
    if (s) { s.classList.remove('show'); void s.offsetWidth; s.classList.add('show'); }
    renderCount();
  }

  function show(note) {
    if (!note) return;
    currentId = note.id;
    try { localStorage.setItem(SELECTED, String(note.id)); } catch (_) {}
    titleInput.value = note.name && note.name !== 'Anteckning' ? note.name : '';
    editor.innerHTML = sanitize(note.note || '');
    decorate(); syncStarters(); renderCount();
  }
  function syncStarters() {
    var s = document.getElementById('nt-starters');
    if (s) s.hidden = !!editor.textContent.trim() || !!editor.querySelector('li, hr');
  }
  function renderCount() {
    var c = document.getElementById('nt-count');
    var count = notes().length;
    if (c) c.textContent = count > 1 ? String(count) : '';
  }

  // ── saved notes sheet ──────────────────────────────
  function renderSheet() {
    document.getElementById('nt-list').innerHTML = sortedNotes().map(function (n) {
      var box = document.createElement('div');
      box.innerHTML = String(n.note || '').replace(/<\/(h1|h2|div|p|li)>/gi, ' · $&');
      var preview = box.textContent.replace(/(\s·\s*)+$/, '').replace(/\s+/g, ' ').trim().slice(0, 70) || 'Tom anteckning';
      var when = n.updatedAt ? new Date(n.updatedAt).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }) : '';
      return '<div class="nt-srow' + (Number(n.id) === Number(currentId) ? ' on' : '') + '">' +
        '<button type="button" class="nt-pin' + (n.pinned ? ' is-pinned' : '') + '" data-nt="pin" data-id="' + n.id + '" aria-pressed="' + !!n.pinned + '" aria-label="Fäst ' + esc(n.name || 'anteckning') + '">' + svg('pin') + '</button>' +
        '<button type="button" class="nt-open" data-nt="open" data-id="' + n.id + '"><b>' + esc(n.name || 'Anteckning') + '</b><span>' + esc(preview) + '</span></button>' +
        '<em>' + esc(when) + '</em>' +
        '<button type="button" class="nt-del" data-nt="delete" data-id="' + n.id + '" aria-label="Radera ' + esc(n.name || 'anteckning') + '">×</button></div>';
    }).join('');
  }
  function openSheet(open) {
    if (open) renderSheet();
    document.documentElement.classList.toggle('nt-sheet-open', open);
  }
  function newNote() {
    save();
    var lists = readLists();
    var id = lists.reduce(function (m, l) { return Math.max(m, Number(l.id) || 0); }, 0) + 1;
    var note = { id: id, name: 'Anteckning', mode: 'general', createdAt: today(), updatedAt: Date.now(), items: [], note: '' };
    lists.push(note);
    writeLists(lists);
    openSheet(false);
    show(note);
    titleInput.focus();
  }
  function step(dir) {
    var list = sortedNotes();
    var i = list.findIndex(function (n) { return Number(n.id) === Number(currentId); });
    var next = list[i + dir];
    if (!next) return;
    save();
    root.classList.remove('nt-slide-l', 'nt-slide-r'); void root.offsetWidth;
    root.classList.add(dir > 0 ? 'nt-slide-l' : 'nt-slide-r');
    show(next);
  }
  function setupSwipe(area) {
    var x0 = 0, y0 = 0, on = false;
    area.addEventListener('touchstart', function (e) { var t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; on = true; }, { passive: true });
    area.addEventListener('touchend', function (e) {
      if (!on) return; on = false;
      var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
      if (Math.abs(dx) > 70 && Math.abs(dy) < 40) step(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  function onClick(e) {
    var b = e.target.closest('[data-nt],[data-cmd]');
    if (!b) return;
    if (b.dataset.cmd) { if (e.pointerType !== 'touch') run(b.dataset.cmd); return; }
    var act = b.dataset.nt;
    if (act === 'tools') { if (e.pointerType !== 'touch') toggleTools(); return; }
    if (act === 'new') newNote();
    else if (act === 'saved') { save(); openSheet(true); }
    else if (act === 'close') openSheet(false);
    else if (act === 'template') {
      editor.innerHTML = sanitize(TEMPLATES[b.dataset.name] || '');
      if (!titleInput.value.trim()) titleInput.value = b.dataset.name;
      decorate(); syncStarters(); save(); editor.focus();
    }
    else if (act === 'open') { save(); show(notes().find(function (n) { return Number(n.id) === Number(b.dataset.id); })); openSheet(false); }
    else if (act === 'pin') {
      var pl = readLists();
      var pn = pl.find(function (l) { return Number(l.id) === Number(b.dataset.id); });
      if (pn) { pn.pinned = !pn.pinned; writeLists(pl); renderSheet(); }
    }
    else if (act === 'delete') {
      var lists = readLists();
      var target = lists.find(function (l) { return Number(l.id) === Number(b.dataset.id); });
      if (!target || !confirm('Radera "' + (target.name || 'Anteckning') + '"?')) return;
      lists = lists.filter(function (l) { return l !== target; });
      writeLists(lists);
      if (Number(target.id) === Number(currentId)) { currentId = null; ensureNote(); show(currentNote()); }
      renderSheet(); renderCount();
    }
  }

  function activate() {
    if (document.documentElement.dataset.listMode !== 'general') return;
    if (!root) build();
    ensureNote();
    if (document.activeElement !== editor && document.activeElement !== titleInput) show(currentNote());
  }

  function init() {
    activate();
    new MutationObserver(activate).observe(document.documentElement, { attributes: true, attributeFilter: ['data-list-mode'] });
    window.addEventListener('firebase-sync', function (e) {
      if (e.detail && e.detail.key === KEY && root && document.documentElement.dataset.listMode === 'general'
        && document.activeElement !== editor && document.activeElement !== titleInput) show(currentNote());
    });
    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', function () { if (document.hidden) save(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
