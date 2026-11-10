/*
 * Listor → "Lista" tab as a notes app.
 * A blank page you write on, with headings, subheadings, bold, italic, bullet lists and
 * to-do checkboxes. Each note is stored as a list in `sh_lists` with mode "general" and a
 * sanitised `note` (HTML) field, so it syncs through the existing Firebase key.
 * Header buttons: new note and saved notes (a sheet listing them, with delete).
 */
(function () {
  'use strict';
  var KEY = 'sh_lists';
  var SELECTED = 'sh_selected_general';
  var ALLOWED = { H1: 1, H2: 1, P: 1, DIV: 1, BR: 1, B: 1, STRONG: 1, I: 1, EM: 1, UL: 1, OL: 1, LI: 1 };
  var root, editor, titleInput, sheet, saveTimer = 0, currentId = null;

  function readLists() { try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (_) { return []; } }
  function writeLists(lists) { localStorage.setItem(KEY, JSON.stringify(lists)); }
  function notes(lists) { return (lists || readLists()).filter(function (l) { return l && l.mode === 'general'; }); }
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
        Array.prototype.slice.call(child.attributes).forEach(function (a) { child.removeAttribute(a.name); });
        if (keepClass) child.className = 'nt-todo';
        if (checked) child.setAttribute('data-checked', 'true');
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

  function build() {
    root = document.createElement('section');
    root.className = 'nt';
    root.setAttribute('aria-label', 'Anteckning');
    root.innerHTML =
      '<div class="nt-top">' +
        '<input class="nt-title" id="nt-title" type="text" placeholder="Rubrik" aria-label="Anteckningens namn">' +
        '<button type="button" class="nt-icon" data-nt="new" aria-label="Ny anteckning" title="Ny anteckning"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>' +
        '<button type="button" class="nt-icon" data-nt="saved" aria-label="Sparade anteckningar" title="Sparade"><svg viewBox="0 0 24 24"><path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/></svg><span class="nt-count" id="nt-count"></span></button>' +
      '</div>' +
      '<div class="nt-bar" role="toolbar" aria-label="Formatering">' +
        '<button type="button" data-cmd="h1" aria-label="Rubrik">H1</button>' +
        '<button type="button" data-cmd="h2" aria-label="Underrubrik">H2</button>' +
        '<button type="button" data-cmd="p" aria-label="Brödtext">Aa</button>' +
        '<span class="nt-sep"></span>' +
        '<button type="button" data-cmd="bold" aria-label="Fetstil"><b>B</b></button>' +
        '<button type="button" data-cmd="italic" aria-label="Kursiv"><i>I</i></button>' +
        '<span class="nt-sep"></span>' +
        '<button type="button" data-cmd="todo" aria-label="Att göra-lista"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="2"/><path d="m5.6 7.6 1.3 1.3 2.5-2.6M14 7.5h6M4 15.5h7M14 15.5h6"/></svg></button>' +
        '<button type="button" data-cmd="ul" aria-label="Punktlista"><svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/></svg></button>' +
      '</div>' +
      '<div class="nt-editor" id="nt-editor" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Anteckning" data-placeholder="Skriv här…"></div>' +
      '<p class="nt-saved" id="nt-saved" aria-live="polite"></p>';
    var main = document.querySelector('main.wrap');
    main.appendChild(root);
    editor = root.querySelector('#nt-editor');
    titleInput = root.querySelector('#nt-title');

    sheet = document.createElement('div');
    sheet.className = 'nt-sheet-wrap';
    sheet.innerHTML = '<div class="nt-dim" data-nt="close"></div><div class="nt-sheet" role="dialog" aria-label="Sparade anteckningar"><span class="nt-grab"></span><h2>Sparade anteckningar</h2><div class="nt-list" id="nt-list"></div><button type="button" class="nt-add" data-nt="new">+ Ny anteckning</button></div>';
    document.body.appendChild(sheet);

    root.addEventListener('click', onClick);
    sheet.addEventListener('click', onClick);
    // Keep the editor's selection when tapping toolbar buttons.
    root.querySelector('.nt-bar').addEventListener('mousedown', function (e) { e.preventDefault(); });
    root.querySelector('.nt-bar').addEventListener('touchstart', function (e) { if (e.target.closest('button')) e.preventDefault(); e.target.closest('button') && run(e.target.closest('button').dataset.cmd); }, { passive: false });
    editor.addEventListener('input', queueSave);
    editor.addEventListener('click', toggleTodo);
    editor.addEventListener('keydown', onKey);
    editor.addEventListener('paste', function (e) {
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, text);
    });
    titleInput.addEventListener('input', queueSave);
  }

  function run(cmd) {
    editor.focus();
    if (cmd === 'h1' || cmd === 'h2' || cmd === 'p') document.execCommand('formatBlock', false, cmd);
    else if (cmd === 'bold' || cmd === 'italic') document.execCommand(cmd);
    else if (cmd === 'ul' || cmd === 'todo') {
      var ul = closestList();
      var isTodo = ul && ul.classList.contains('nt-todo');
      if (!ul) { document.execCommand('insertUnorderedList'); ul = closestList(); if (ul && cmd === 'todo') ul.classList.add('nt-todo'); }
      else if (cmd === 'todo' && !isTodo) ul.classList.add('nt-todo');
      else if (cmd === 'ul' && isTodo) ul.classList.remove('nt-todo');
      else document.execCommand('insertUnorderedList'); // same type again: back to text
    }
    queueSave();
    syncBar();
  }
  function closestList() {
    var sel = window.getSelection();
    var node = sel && sel.anchorNode;
    while (node && node !== editor) { if (node.nodeType === 1 && node.tagName === 'UL') return node; node = node.parentNode; }
    return null;
  }
  function syncBar() {
    var block = '';
    try { block = String(document.queryCommandValue('formatBlock') || '').toLowerCase(); } catch (_) {}
    var ul = closestList();
    root.querySelectorAll('.nt-bar [data-cmd]').forEach(function (b) {
      var c = b.dataset.cmd, on = false;
      try {
        if (c === 'bold' || c === 'italic') on = document.queryCommandState(c);
        else if (c === 'h1' || c === 'h2') on = block === c;
        else if (c === 'todo') on = !!(ul && ul.classList.contains('nt-todo'));
        else if (c === 'ul') on = !!(ul && !ul.classList.contains('nt-todo'));
      } catch (_) {}
      b.classList.toggle('on', on);
    });
  }

  // Tapping the box in front of a to-do item ticks it.
  function toggleTodo(e) {
    var li = e.target.closest && e.target.closest('ul.nt-todo > li');
    if (!li) return;
    var r = li.getBoundingClientRect();
    if (e.clientX - r.left > 30) return;
    e.preventDefault();
    li.setAttribute('data-checked', li.getAttribute('data-checked') === 'true' ? 'false' : 'true');
    queueSave();
  }
  function onKey(e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'i')) { e.preventDefault(); run(e.key === 'b' ? 'bold' : 'italic'); }
    // Enter after a heading continues in body text.
    if (e.key === 'Enter' && !e.shiftKey) {
      setTimeout(function () {
        var block = '';
        try { block = String(document.queryCommandValue('formatBlock') || '').toLowerCase(); } catch (_) {}
        var sel = window.getSelection(), n = sel && sel.anchorNode;
        var el = n && (n.nodeType === 1 ? n : n.parentNode);
        if ((block === 'h1' || block === 'h2') && el && !el.textContent.trim()) document.execCommand('formatBlock', false, 'p');
        var li = el && el.closest && el.closest('ul.nt-todo > li');
        if (li) li.removeAttribute('data-checked');
      }, 0);
    }
    setTimeout(syncBar, 0);
  }
  document.addEventListener('selectionchange', function () { if (root && document.activeElement === editor) syncBar(); });

  function queueSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 450);
  }
  function save() {
    var lists = readLists();
    var n = lists.find(function (l) { return l && l.mode === 'general' && Number(l.id) === Number(currentId); });
    if (!n) return;
    var html = sanitize(editor.innerHTML);
    var name = titleInput.value.trim() || 'Anteckning';
    if (n.note === html && n.name === name) return;
    n.note = html; n.name = name; n.updatedAt = Date.now();
    writeLists(lists);
    var s = document.getElementById('nt-saved');
    if (s) s.textContent = 'Sparat';
    renderCount();
  }

  function show(note) {
    if (!note) return;
    currentId = note.id;
    try { localStorage.setItem(SELECTED, String(note.id)); } catch (_) {}
    titleInput.value = note.name && note.name !== 'Anteckning' ? note.name : '';
    editor.innerHTML = sanitize(note.note || '');
    var s = document.getElementById('nt-saved');
    if (s) s.textContent = '';
    renderCount();
  }
  function renderCount() {
    var c = document.getElementById('nt-count');
    var count = notes().length;
    if (c) c.textContent = count > 1 ? String(count) : '';
    var meta = document.getElementById('shopping-header-meta');
    if (meta && document.documentElement.dataset.listMode === 'general') meta.textContent = count + (count === 1 ? ' anteckning' : ' anteckningar');
  }
  function renderSheet() {
    var list = notes().slice().sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    document.getElementById('nt-list').innerHTML = list.map(function (n) {
      var box = document.createElement('div'); box.innerHTML = String(n.note || '').replace(/<\/(h1|h2|div|p|li)>/gi, ' · $&');
      var preview = box.textContent.replace(/(\s·\s*)+$/, '').replace(/\s+/g, ' ').trim().slice(0, 70) || 'Tom anteckning';
      var when = n.updatedAt ? new Date(n.updatedAt).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }) : '';
      return '<div class="nt-row' + (Number(n.id) === Number(currentId) ? ' on' : '') + '">' +
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
  function onClick(e) {
    var b = e.target.closest('[data-nt],[data-cmd]');
    if (!b) return;
    if (b.dataset.cmd) { if (e.pointerType !== 'touch') run(b.dataset.cmd); return; }
    var act = b.dataset.nt;
    if (act === 'new') newNote();
    else if (act === 'saved') { save(); openSheet(true); }
    else if (act === 'close') openSheet(false);
    else if (act === 'open') { save(); show(notes().find(function (n) { return Number(n.id) === Number(b.dataset.id); })); openSheet(false); }
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
    var meta = document.getElementById('shopping-header-meta');
    if (meta) meta.textContent = notes().length + (notes().length === 1 ? ' anteckning' : ' anteckningar');
  }

  function init() {
    activate();
    new MutationObserver(function () { activate(); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-list-mode'] });
    // The core rewrites the header line on every change; keep ours in notes mode.
    var meta = document.getElementById('shopping-header-meta');
    if (meta) new MutationObserver(function () {
      if (document.documentElement.dataset.listMode !== 'general') return;
      var want = notes().length + (notes().length === 1 ? ' anteckning' : ' anteckningar');
      if (meta.textContent !== want) meta.textContent = want;
    }).observe(meta, { childList: true, characterData: true, subtree: true });
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
