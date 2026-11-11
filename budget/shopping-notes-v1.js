/*
 * Listor → "Lista" tab as a notes app.
 * A blank page with headings (H1/H2), bold, italic, underline, to-do checkboxes, bullets,
 * indent, dividers and undo/redo behind a round "Aa" button bottom right.
 * - Each note is a `sh_lists` entry with mode "general" and a sanitised `note` HTML field
 *   (syncs through the existing Firebase key). `pinned` keeps a note at the top of the sheet.
 * - Headings show "done/total" for the to-dos under them and fold on a tap on that counter.
 * - Ticked to-dos sink to the end of their list. Lines with @Maja / @Markus get their colour.
 * - Swiping the name row switches note. The format panel is one row you can swipe sideways.
 */
(function () {
  'use strict';
  var KEY = 'sh_lists';
  var SELECTED = 'sh_selected_general';
  // Text colours from the format row (stored as <font color>; the editor handles nesting natively).
  var COLORS = [['Orange', '#fdba74'], ['Röd', '#f87171'], ['Grön', '#4ade80'], ['Blå', '#93c5fd'], ['Lila', '#c4b5fd'], ['Rosa', '#f9a8d4'], ['Gul', '#fde047']];
  var COLOR_OK = {}; COLORS.forEach(function (c) { COLOR_OK[c[1]] = 1; });
  var RESET_COLOR = '#010101';
  var ALLOWED = { FONT: 1, H1: 1, H2: 1, P: 1, DIV: 1, BR: 1, B: 1, STRONG: 1, I: 1, EM: 1, U: 1, UL: 1, OL: 1, LI: 1, HR: 1 };
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
        if (child.tagName === 'FONT') {
          var col = String(child.getAttribute('color') || '').toLowerCase();
          clean(child);
          if (!COLOR_OK[col]) { while (child.firstChild) node.insertBefore(child.firstChild, child); node.removeChild(child); return; }
          Array.prototype.slice.call(child.attributes).forEach(function (a) { child.removeAttribute(a.name); });
          child.setAttribute('color', col);
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

  // Paste (from iPhone Notes and elsewhere) keeping its look: headings (tags or larger text),
  // bold/italic/underline (tags or inline styles), bullet lists and checklists with their ticks.
  var BLOCK_TAGS = /^(P|DIV|H[1-6]|UL|OL|LI|BLOCKQUOTE|TABLE|TBODY|TR|TD|TH|SECTION|ARTICLE|PRE|HR)$/;
  function fontPx(style) {
    var m = /font-size:\s*([\d.]+)\s*(px|pt|em|rem)?/i.exec(style || '');
    if (!m) return 0;
    var v = parseFloat(m[1]);
    return m[2] === 'pt' ? v * 4 / 3 : (m[2] === 'em' || m[2] === 'rem') ? v * 16 : v;
  }
  function isTodoItem(li) {
    return !!li.querySelector('input[type=checkbox]') || /check|todo|task/i.test(li.className || '') || li.hasAttribute('data-checked') || li.hasAttribute('aria-checked');
  }
  function isChecked(li) {
    var box = li.querySelector('input[type=checkbox]');
    if (box && (box.checked || box.hasAttribute('checked'))) return true;
    return /(^|\s|-)(checked|done|completed)(\s|$)/i.test(li.className || '') || li.getAttribute('data-checked') === 'true' || li.getAttribute('aria-checked') === 'true';
  }
  function inlineHtml(node, fmt, size) {
    if (node.nodeType === 3) {
      var t = esc(node.nodeValue.replace(/[\r\n]+/g, ' '));
      if (!t) return '';
      if (fmt.u) t = '<u>' + t + '</u>';
      if (fmt.i) t = '<i>' + t + '</i>';
      if (fmt.b) t = '<b>' + t + '</b>';
      return t;
    }
    if (node.nodeType !== 1) return '';
    var tag = node.tagName;
    if (tag === 'BR') return '<br>';
    if (/^(INPUT|STYLE|SCRIPT|META|TITLE|UL|OL)$/.test(tag)) return '';
    var st = node.getAttribute('style') || '';
    var w = /font-weight:\s*(\w+)/i.exec(st);
    var f = { b: fmt.b, i: fmt.i, u: fmt.u };
    if (tag === 'B' || tag === 'STRONG' || (w && (w[1] === 'bold' || w[1] === 'bolder' || Number(w[1]) >= 600))) f.b = true;
    if (w && (w[1] === 'normal' || (Number(w[1]) && Number(w[1]) < 600))) f.b = false;
    if (tag === 'I' || tag === 'EM' || /font-style:\s*italic/i.test(st)) f.i = true;
    if (tag === 'U' || /text-decoration[^;]*underline/i.test(st)) f.u = true;
    var px = fontPx(st);
    if (px) size.px = Math.max(size.px, px);
    var out = '';
    Array.prototype.forEach.call(node.childNodes, function (c) { out += inlineHtml(c, f, size); });
    return out;
  }
  function collectBlocks(node, out, depth) {
    var pending = null;
    function flush() {
      if (pending && pending.html.trim()) out.push(pending);
      pending = null;
    }
    Array.prototype.forEach.call(node.childNodes, function (c) {
      if (c.nodeType === 1 && BLOCK_TAGS.test(c.tagName)) {
        flush();
        var tag = c.tagName;
        if (tag === 'HR') { out.push({ type: 'hr' }); return; }
        if (tag === 'UL' || tag === 'OL') {
          var todoList = /check|todo|task/i.test(c.className || '');
          Array.prototype.forEach.call(c.children, function (li) {
            if (li.tagName !== 'LI') { collectBlocks(li, out, depth); return; }
            var size = { px: fontPx(li.getAttribute('style')) };
            var fmt = { b: false, i: false, u: false };
            var html = '';
            Array.prototype.forEach.call(li.childNodes, function (k) {
              if (k.nodeType === 1 && (k.tagName === 'UL' || k.tagName === 'OL')) return;
              if (k.nodeType === 1 && BLOCK_TAGS.test(k.tagName)) { html += (html ? '<br>' : '') + inlineHtml(k, fmt, size); return; }
              html += inlineHtml(k, fmt, size);
            });
            var todo = todoList || isTodoItem(li);
            out.push({ type: 'li', html: html.replace(/^(<br>)+|(<br>)+$/g, '').replace(/^\s+/, ''), todo: todo, checked: todo && isChecked(li), depth: depth });
            Array.prototype.forEach.call(li.children, function (k) {
              if (k.tagName === 'UL' || k.tagName === 'OL') { var wrap = document.createElement('div'); wrap.appendChild(k.cloneNode(true)); collectBlocks(wrap, out, depth + 1); }
            });
          });
          return;
        }
        var hasBlocks = Array.prototype.some.call(c.childNodes, function (k) { return k.nodeType === 1 && BLOCK_TAGS.test(k.tagName); });
        var hx = /^H([1-6])$/.exec(tag);
        if (hasBlocks && !hx) { collectBlocks(c, out, depth); return; }
        var size = { px: fontPx(c.getAttribute('style')) };
        var html = inlineHtml(c, { b: false, i: false, u: false }, size);
        out.push({ type: hx ? (hx[1] === '1' ? 'h1' : 'h2') : 'p', html: html, px: size.px });
        return;
      }
      if (c.nodeType === 1 && c.tagName === 'BR') { if (pending) flush(); else out.push({ type: 'p', html: '', px: 0 }); return; }
      if (c.nodeType === 3 && !c.nodeValue.trim() && !pending) return;
      if (!pending) pending = { type: 'p', html: '', px: 0 };
      var s = { px: 0 };
      pending.html += inlineHtml(c, { b: false, i: false, u: false }, s);
      pending.px = Math.max(pending.px, s.px);
    });
    flush();
  }
  // Plain-text markers: "☐ x", "- [ ] x", "• x", "- x".
  function markerBlock(b) {
    if (b.type !== 'p') return b;
    var m = /^\s*(?:[☐◻□○◯]|-\s*\[\s?\])\s+/.exec(b.html);
    if (m) return { type: 'li', html: b.html.slice(m[0].length), todo: true, checked: false, depth: 0 };
    m = /^\s*(?:[☑✅✓✔☒]|-\s*\[[xX]\])\s+/.exec(b.html);
    if (m) return { type: 'li', html: b.html.slice(m[0].length), todo: true, checked: true, depth: 0 };
    m = /^\s*[•◦▪‣\-–*]\s+/.exec(b.html);
    if (m) return { type: 'li', html: b.html.slice(m[0].length), todo: false, checked: false, depth: 0 };
    return b;
  }
  function textOf(html) { var d = document.createElement('div'); d.innerHTML = html; return d.textContent || ''; }
  function pasteToNote(html, text) {
    var blocks = [];
    if (html && /<[a-z]/i.test(html)) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      collectBlocks(doc.body, blocks, 0);
    } else if (text) {
      text.replace(/\r\n?/g, '\n').split('\n').forEach(function (line) { blocks.push({ type: 'p', html: esc(line), px: 0 }); });
    }
    if (!blocks.length) return '';
    // Larger text than the body size becomes a heading (Notes: Title, Heading, Subheading).
    var weight = {};
    blocks.forEach(function (b) { if (b.type === 'p' && b.px) { var k = Math.round(b.px); weight[k] = (weight[k] || 0) + textOf(b.html).length; } });
    var body = 0, best = -1;
    Object.keys(weight).forEach(function (k) { if (weight[k] > best) { best = weight[k]; body = Number(k); } });
    blocks = blocks.map(function (b) {
      if (b.type === 'p' && body && b.px && textOf(b.html).trim()) {
        if (b.px >= body * 1.4) b.type = 'h1';
        else if (b.px >= body * 1.12) b.type = 'h2';
      }
      if (b.type === 'h1' || b.type === 'h2') b.html = b.html.replace(/<\/?b>/g, '');
      return markerBlock(b);
    });
    // Collapse runs of empty lines and drop empty ones at the ends.
    blocks = blocks.filter(function (b, i) {
      if (b.type !== 'p' || textOf(b.html).trim()) return true;
      var prev = blocks[i - 1];
      return i > 0 && i < blocks.length - 1 && !(prev && prev.type === 'p' && !textOf(prev.html).trim());
    });
    var out = '', stack = [];
    function closeLists(toDepth) { while (stack.length > toDepth) { out += '</li></ul>'; stack.pop(); } }
    blocks.forEach(function (b) {
      if (b.type !== 'li') {
        closeLists(0);
        if (b.type === 'hr') out += '<hr>';
        else out += '<' + b.type + '>' + (b.html.trim() ? b.html : '<br>') + '</' + b.type + '>';
        return;
      }
      var depth = Math.min(b.depth || 0, stack.length);
      if (stack.length > depth + 1) closeLists(depth + 1);
      if (stack.length === depth + 1 && stack[depth] !== b.todo) closeLists(depth);
      if (stack.length === depth + 1) out += '</li>';
      else { out += b.todo ? '<ul class="nt-todo">' : '<ul>'; stack.push(b.todo); }
      out += '<li' + (b.checked ? ' data-checked="true"' : '') + '>' + (b.html.trim() ? b.html : '<br>');
    });
    closeLists(0);
    return sanitize(out);
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
    back: '<path d="M15 6l-6 6 6 6"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
    redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
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
      '<div class="nt-editor" id="nt-editor" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Anteckning" data-placeholder="Skriv här…"></div>' +
      '<div class="nt-bar" role="toolbar" aria-label="Formatering">' +
        '<div class="nt-tools"><div class="nt-scroll">' +
          tool('h1', 'Rubrik', 'H1') + tool('h2', 'Underrubrik', 'H2') + tool('p', 'Brödtext', 'Aa') + '<span class="nt-sep"></span>' +
          tool('todo', 'Att göra-lista', svg('todo')) + tool('ul', 'Punktlista', svg('ul')) + '<span class="nt-sep"></span>' +
          tool('bold', 'Fetstil', '<b>B</b>') + tool('italic', 'Kursiv', '<i>I</i>') + tool('underline', 'Understruken', '<u>U</u>') + tool('color', 'Textfärg', '<span class="nt-swatch-btn">A</span>') + '<span class="nt-sep"></span>' +
          tool('indent', 'Öka indrag', svg('indent')) + tool('outdent', 'Minska indrag', svg('outdent')) + tool('hr', 'Avdelare', svg('hr')) + '<span class="nt-sep"></span>' +
          tool('undo', 'Ångra', svg('undo')) + tool('redo', 'Gör om', svg('redo')) +
        '</div><div class="nt-scroll nt-colors">' +
          tool('colorback', 'Tillbaka', svg('back')) + '<span class="nt-sep"></span>' +
          tool('c:' + RESET_COLOR, 'Standardfärg', '<span class="nt-dot nt-dot-reset"></span>') +
          COLORS.map(function (c) { return tool('c:' + c[1], c[0], '<span class="nt-dot" style="background:' + c[1] + '"></span>'); }).join('') +
        '</div></div>' +
        '<button type="button" class="nt-fab" data-nt="tools" aria-label="Formatering" aria-expanded="false"><span>Aa</span></button>' +
      '</div>';
    document.querySelector('main.wrap').appendChild(root);
    editor = root.querySelector('#nt-editor');
    titleInput = root.querySelector('#nt-title');

    sheet = document.createElement('div');
    sheet.className = 'nt-sheet-wrap';
    sheet.innerHTML = '<div class="nt-dim" data-nt="close"></div><div class="nt-sheet" role="dialog" aria-label="Sparade anteckningar"><span class="nt-grab"></span><h2>Sparade anteckningar</h2><div class="nt-list" id="nt-list"></div><button type="button" class="nt-add" data-nt="new">+ Ny anteckning</button></div>';
    document.body.appendChild(sheet);

    root.addEventListener('click', onClick);
    sheet.addEventListener('click', onClick);
    var bar = root.querySelector('.nt-bar');
    bar.addEventListener('mousedown', function (e) { e.preventDefault(); });
    // Taps run on touchend (and cancel the click, so the editor keeps focus);
    // a sideways drag scrolls the row instead.
    var tx = 0, ty = 0;
    bar.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    bar.addEventListener('touchend', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      var t = e.changedTouches[0];
      if (Math.abs(t.clientX - tx) > 8 || Math.abs(t.clientY - ty) > 8) return;
      e.preventDefault();
      if (btn.dataset.nt === 'tools') { toggleTools(); autoOpened = false; userClosed = !root.querySelector('.nt-bar').classList.contains('open'); } else run(btn.dataset.cmd);
    }, { passive: false });
    // While typing, pin the format button just above the keyboard using the visual viewport
    // (fixed elements on iOS otherwise stay at the bottom of the layout viewport, behind it).
    var placeFrame = 0;
    function placeBar() {
      cancelAnimationFrame(placeFrame);
      placeFrame = requestAnimationFrame(function () {
        var vv = window.visualViewport;
        var typing = document.activeElement === editor || document.activeElement === titleInput;
        if (!vv || !typing) { bar.style.top = ''; bar.style.bottom = ''; bar.classList.remove('kb'); return; }
        var keyboard = window.innerHeight - vv.height > 120 || (screen.height - vv.height) > 260;
        if (!keyboard) { bar.style.top = ''; bar.style.bottom = ''; bar.classList.remove('kb'); return; }
        bar.classList.add('kb');
        bar.style.bottom = 'auto';
        bar.style.top = Math.round(vv.offsetTop + vv.height - bar.offsetHeight - 10) + 'px';
      });
    }
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', placeBar);
      window.visualViewport.addEventListener('scroll', placeBar);
    }
    window.addEventListener('scroll', placeBar, { passive: true });
    document.addEventListener('focusin', function () { setTimeout(placeBar, 50); setTimeout(placeBar, 400); });
    document.addEventListener('focusout', function () { setTimeout(placeBar, 50); });
    editor.addEventListener('input', function () { queueSave(); queueDecorate(); });
    editor.addEventListener('click', onEditorClick);
    editor.addEventListener('keydown', onKey);
    editor.addEventListener('paste', function (e) {
      var cd = e.clipboardData || window.clipboardData;
      if (!cd) return;
      e.preventDefault();
      var html = pasteToNote(cd.getData('text/html'), cd.getData('text/plain'));
      if (html) document.execCommand('insertHTML', false, html);
      decorate();
      queueSave();
    });
    titleInput.addEventListener('input', queueSave);
    setupSwipe(root.querySelector('.nt-top'));
  }

  // ── formatting ──────────────────────────────────────
  function run(cmd) {
    var bar = root.querySelector('.nt-bar');
    if (cmd === 'color' || cmd === 'colorback') { bar.classList.toggle('pick', cmd === 'color'); return; }
    editor.focus();
    if (cmd.indexOf('c:') === 0) {
      var col = cmd.slice(2);
      try { document.execCommand('styleWithCSS', false, false); } catch (_) {}
      document.execCommand('foreColor', false, col);
      if (col === RESET_COLOR) {
        editor.querySelectorAll('font').forEach(function (f) {
          if (String(f.getAttribute('color')).toLowerCase() !== RESET_COLOR) return;
          while (f.firstChild) f.parentNode.insertBefore(f.firstChild, f);
          f.parentNode.removeChild(f);
        });
      }
      bar.classList.remove('pick');
      queueSave(); syncBar();
      return;
    }
    if (/^(h1|h2|p|ul|todo)$/.test(cmd) && formatLines(cmd)) { /* several lines converted */ }
    else if (cmd === 'h1' || cmd === 'h2' || cmd === 'p') document.execCommand('formatBlock', false, cmd);
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
    // A list made inside a paragraph is lifted out to the top level.
    editor.querySelectorAll(':scope > p > ul, :scope > div > ul').forEach(function (u) {
      var parent = u.parentNode;
      while (parent.firstChild) editor.insertBefore(parent.firstChild, parent);
      editor.removeChild(parent);
    });
    queueSave(); decorate(); syncBar();
  }
  // Several selected lines get the format one by one: H1/H2/text per line, or one list with an
  // item per line (ticks kept); when every line already is that kind of list, they go back to text.
  // Returns false for a single line (the editor's own commands handle that).
  function formatLines(cmd) {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return false;
    var range = sel.getRangeAt(0);
    var blocks = Array.prototype.filter.call(editor.children, function (b) { return range.intersectsNode(b); });
    if (!blocks.length) return false;
    var lines = [];
    blocks.forEach(function (b) {
      if (b.tagName === 'UL') {
        Array.prototype.forEach.call(b.children, function (li) {
          if (li.tagName !== 'LI') return;
          var copy = li.cloneNode(true);
          copy.querySelectorAll('ul').forEach(function (n) { n.remove(); });
          lines.push({ html: copy.innerHTML, checked: li.getAttribute('data-checked') === 'true', todo: b.classList.contains('nt-todo'), list: true });
        });
      } else if (b.tagName !== 'HR') {
        b.innerHTML.split(/<br\s*\/?>/i).forEach(function (part) {
          if (part.replace(/<[^>]+>/g, '').trim()) lines.push({ html: part, checked: false, list: false });
        });
      }
    });
    if (lines.length < 2) return false;
    var wantTodo = cmd === 'todo';
    var isList = cmd === 'ul' || cmd === 'todo';
    var already = isList && lines.every(function (l) { return l.list && l.todo === wantTodo; });
    var html = !isList
      ? lines.map(function (l) { return '<' + cmd + '>' + l.html + '</' + cmd + '>'; }).join('')
      : already
      ? lines.map(function (l) { return '<p>' + l.html + '</p>'; }).join('')
      : '<ul' + (wantTodo ? ' class="nt-todo"' : '') + '>' + lines.map(function (l) {
          return '<li' + (wantTodo && l.checked ? ' data-checked="true"' : '') + '>' + l.html + '</li>';
        }).join('') + '</ul>';
    var whole = document.createRange();
    whole.setStartBefore(blocks[0]);
    whole.setEndAfter(blocks[blocks.length - 1]);
    sel.removeAllRanges();
    sel.addRange(whole);
    document.execCommand('insertHTML', false, sanitize(html));
    // The editor may merge the new items into a neighbouring list and drop its class.
    var made = closestList();
    if (isList && !already && made) made.classList.toggle('nt-todo', wantTodo);
    return true;
  }
  function toggleTools(force) {
    var bar = root.querySelector('.nt-bar');
    var open = typeof force === 'boolean' ? force : !bar.classList.contains('open');
    bar.classList.toggle('open', open);
    if (!open) bar.classList.remove('pick');
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
    var cur = caretElement(), shown = '';
    while (cur && cur !== editor) { if (cur.tagName === 'FONT') { shown = String(cur.getAttribute('color')).toLowerCase(); break; } cur = cur.parentNode; }
    var sw = root.querySelector('.nt-swatch-btn');
    if (sw) sw.style.setProperty('--sw', COLOR_OK[shown] ? shown : '');
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
  // Selecting text, or placing the caret in a line with text, opens the format row by itself;
  // a row opened this way closes again when the editor loses focus.
  var autoOpened = false, userClosed = false;
  document.addEventListener('selectionchange', function () {
    if (!root || document.activeElement !== editor) return;
    syncBar();
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount || !editor.contains(sel.anchorNode)) return;
    var el = caretElement();
    while (el && el.parentNode !== editor && el !== editor) el = el.parentNode;
    var hasText = !sel.isCollapsed || (el && el !== editor && el.textContent.trim());
    var bar = root.querySelector('.nt-bar');
    if (hasText && !userClosed && !bar.classList.contains('open')) { toggleTools(true); autoOpened = true; }
  });
  document.addEventListener('focusout', function (e) {
    if (!root || e.target !== editor) return;
    userClosed = false;
    if (!autoOpened) return;
    setTimeout(function () { if (document.activeElement !== editor) { toggleTools(false); autoOpened = false; } }, 120);
  });

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
    decorate(); renderCount();
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
    if (act === 'tools') { if (e.pointerType !== 'touch') { toggleTools(); autoOpened = false; userClosed = !root.querySelector('.nt-bar').classList.contains('open'); } return; }
    if (act === 'new') newNote();
    else if (act === 'saved') { save(); openSheet(true); }
    else if (act === 'close') openSheet(false);
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
