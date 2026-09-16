(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  if (!path.endsWith('/budget/shopping.html') && !path.endsWith('/shopping.html')) return;

  var activeList = null;
  var undoHistory = [];
  var selectedItemIds = window.selectedItemIds = window.selectedItemIds || new Set();
  var editingHeaderTitle = false;
  var saveTemplateFeedbackTimeout = null;

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function readJson(key, fallback) {
    try {
      var value = JSON.parse(localStorage.getItem(key) || '');
      return value == null ? fallback : value;
    } catch (_) { return fallback; }
  }
  function getLists() {
    var lists = readJson('sh_lists', []);
    return Array.isArray(lists) ? lists : [];
  }
  function setLists(lists) {
    localStorage.setItem('sh_lists', JSON.stringify(lists));
  }
  function currentList() {
    var lists = getLists();
    var list = lists.find(function (entry) { return Number(entry.id) === Number(activeList); });
    if (!list) {
      list = lists[0] || null;
      activeList = list ? list.id : null;
    }
    return list;
  }
  function ensureLists() {
    var lists = getLists();
    if (!lists.length) {
      lists = [{id:1,name:'Huvudlista',createdAt:new Date().toISOString().slice(0,10),items:[]}];
    }
    lists.forEach(function (list) {
      if (!Array.isArray(list.items)) list.items = [];
      list.items = list.items.filter(function (item) { return item && item.text !== '- storlek M'; });
    });
    setLists(lists);
    if (activeList == null || !lists.some(function (list) { return Number(list.id) === Number(activeList); })) activeList = lists[0].id;
  }

  window.renderItems = window.renderItems || function () {};
  window.renderRecipes = window.renderRecipes || function () {};
  window.renderRecipesDropdown = window.renderRecipesDropdown || function () {
    var menu = document.getElementById('recipes-dropdown');
    if (menu && !menu.innerHTML.trim()) menu.innerHTML = '<a href="#" onclick="return false;">Laddar recept…</a>';
  };

  window.saveState = function saveState() {
    undoHistory.push(clone(getLists()));
    if (undoHistory.length > 50) undoHistory.shift();
  };
  window.undo = function undo() {
    if (!undoHistory.length) return;
    setLists(undoHistory.pop());
    if (typeof window.renderItems === 'function') window.renderItems();
    updateSummary();
  };
  window.toggleSelectedItem = function toggleSelectedItem(id) {
    if (selectedItemIds.has(id)) selectedItemIds.delete(id);
    else selectedItemIds.add(id);
    if (typeof window.renderItems === 'function') window.renderItems();
  };
  window.deleteSelectedItems = function deleteSelectedItems() {
    if (!selectedItemIds.size) return;
    window.saveState();
    var lists = getLists();
    var list = lists.find(function (entry) { return Number(entry.id) === Number(activeList); });
    if (!list) return;
    list.items = (list.items || []).filter(function (item) {
      return item.type === 'category' || !selectedItemIds.has(item.id);
    });
    setLists(lists);
    selectedItemIds.clear();
    if (typeof window.renderItems === 'function') window.renderItems();
    updateSummary();
  };

  function getSavedTemplates() {
    var templates = readJson('sh_saved_templates', []);
    return Array.isArray(templates) ? templates : [];
  }
  function getActiveTemplateId() {
    var raw = localStorage.getItem('sh_active_template_id');
    return raw ? Number(raw) : null;
  }
  function getTemplateItems() {
    var activeId = getActiveTemplateId();
    var template = getSavedTemplates().find(function (entry) { return Number(entry.id) === Number(activeId); });
    var stamp = Date.now();
    return (template && Array.isArray(template.headings) ? template.headings : []).map(function (text,index) {
      return {id:stamp + index,type:'category',text:String(text || '').trim()};
    }).filter(function (item) { return item.text; });
  }

  window.renderListsMenu = function renderListsMenu() {
    var menu = document.getElementById('lists-menu');
    if (!menu) return;
    var lists = getLists();
    menu.innerHTML = lists.map(function (list) {
      var active = Number(list.id) === Number(activeList);
      return '<div class="list-menu-row"><a href="#" class="' + (active ? 'active' : '') + '" onclick="selectList(' + list.id + ');return false;">' +
        (active ? '✓ ' : '') + escapeHtml(list.name || 'Lista') + '</a><button class="list-delete-btn" type="button" onclick="deleteList(' + list.id + ');event.stopPropagation();" aria-label="Radera lista">×</button></div>';
    }).join('') + '<a href="#" class="menu-action" onclick="createNewList();return false;">+ Ny lista</a>';
  };
  window.selectList = function selectList(id) {
    activeList = id;
    selectedItemIds.clear();
    window.renderListsMenu();
    if (typeof window.renderItems === 'function') window.renderItems();
    updateSummary();
    closeAllMenus();
  };
  window.createNewList = function createNewList() {
    var name = prompt('Listans namn:');
    if (!name || !name.trim()) return;
    window.saveState();
    var lists = getLists();
    var id = lists.reduce(function (max,list) { return Math.max(max,Number(list.id) || 0); },0) + 1;
    lists.push({id:id,name:name.trim(),createdAt:new Date().toISOString().slice(0,10),items:getTemplateItems()});
    setLists(lists);
    activeList = id;
    window.renderListsMenu();
    if (typeof window.renderItems === 'function') window.renderItems();
    updateSummary();
    closeAllMenus();
  };
  window.deleteList = function deleteList(id) {
    var lists = getLists();
    var target = lists.find(function (list) { return Number(list.id) === Number(id); });
    if (!target || !confirm('Radera listan "' + (target.name || 'Lista') + '"?')) return;
    window.saveState();
    lists = lists.filter(function (list) { return Number(list.id) !== Number(id); });
    if (!lists.length) lists.push({id:Date.now(),name:'Huvudlista',createdAt:new Date().toISOString().slice(0,10),items:getTemplateItems()});
    setLists(lists);
    if (Number(activeList) === Number(id)) activeList = lists[0].id;
    window.renderListsMenu();
    if (typeof window.renderItems === 'function') window.renderItems();
    updateSummary();
    closeAllMenus();
  };

  window.renderTemplatesMenu = function renderTemplatesMenu() {
    var menu = document.getElementById('templates-menu');
    if (!menu) return;
    var templates = getSavedTemplates();
    var activeId = getActiveTemplateId();
    var rows = '<a href="#" class="menu-action" onclick="saveTemplate();return false;">+ Spara nuvarande rubriker</a>';
    if (!templates.length) rows += '<a href="#" onclick="return false;">Inga mallar sparade</a>';
    else rows += templates.map(function (template) {
      var active = Number(template.id) === Number(activeId);
      return '<div class="list-menu-row"><a href="#" class="' + (active ? 'active' : '') + '" onclick="selectTemplate(' + template.id + ');return false;">' +
        (active ? '✓ ' : '') + escapeHtml(template.name || 'Mall') + '</a><button class="list-delete-btn" type="button" onclick="deleteTemplate(' + template.id + ');event.stopPropagation();" aria-label="Radera mall">×</button></div>';
    }).join('');
    menu.innerHTML = rows;
  };
  window.saveTemplate = function saveTemplate() {
    var list = currentList();
    if (!list) return;
    var headings = (list.items || []).filter(function (item) { return item.type === 'category' && String(item.text || '').trim(); }).map(function (item) { return String(item.text).trim(); });
    if (!headings.length) return alert('Lägg till minst en rubrik innan du sparar mallen');
    var name = '';
    try { name = (prompt('Mallens namn:') || '').trim(); } catch (_) {}
    if (!name) {
      var now = new Date();
      name = 'Mall ' + now.toLocaleDateString('sv-SE') + ' ' + now.toLocaleTimeString('sv-SE',{hour:'2-digit',minute:'2-digit'});
    }
    var templates = getSavedTemplates();
    var id = Date.now();
    templates.push({id:id,name:name,headings:headings});
    localStorage.setItem('sh_saved_templates',JSON.stringify(templates));
    localStorage.setItem('sh_active_template_id',String(id));
    window.renderTemplatesMenu();
    updateSummary();
    var button = document.getElementById('mallar-btn');
    if (button) {
      if (saveTemplateFeedbackTimeout) clearTimeout(saveTemplateFeedbackTimeout);
      var original = 'Mallar';
      button.classList.add('saved');
      button.textContent = 'Sparad ✓';
      saveTemplateFeedbackTimeout = setTimeout(function () {
        button.classList.remove('saved');
        button.textContent = original;
        saveTemplateFeedbackTimeout = null;
      },1200);
    }
  };
  window.selectTemplate = function selectTemplate(id) {
    localStorage.setItem('sh_active_template_id',String(id));
    window.renderTemplatesMenu();
    updateSummary();
  };
  window.deleteTemplate = function deleteTemplate(id) {
    var templates = getSavedTemplates().filter(function (template) { return Number(template.id) !== Number(id); });
    localStorage.setItem('sh_saved_templates',JSON.stringify(templates));
    if (Number(getActiveTemplateId()) === Number(id)) {
      if (templates.length) localStorage.setItem('sh_active_template_id',String(templates[0].id));
      else localStorage.removeItem('sh_active_template_id');
    }
    window.renderTemplatesMenu();
    updateSummary();
  };

  function renderHeaderTitle() {
    var logo = document.querySelector('.logo');
    if (!logo) return;
    var title = localStorage.getItem('sh_header_title') || 'Inköpslista';
    if (editingHeaderTitle) {
      logo.innerHTML = '<input id="header-title-input" type="text" value="' + escapeAttr(title) + '" aria-label="Namn på inköpssidan">';
      var input = document.getElementById('header-title-input');
      if (input) {
        input.addEventListener('keydown',function (event) {
          if (event.key === 'Enter') { event.preventDefault(); saveHeaderTitle(); }
          else if (event.key === 'Escape') { editingHeaderTitle = false; renderHeaderTitle(); }
        });
        input.addEventListener('blur',saveHeaderTitle,{once:true});
        setTimeout(function () { try { input.focus({preventScroll:true}); input.setSelectionRange(input.value.length,input.value.length); } catch (_) {} },0);
      }
    } else {
      logo.textContent = title;
      document.title = title;
    }
  }
  window.startEditHeaderTitle = function startEditHeaderTitle() {
    if (editingHeaderTitle) return;
    editingHeaderTitle = true;
    renderHeaderTitle();
  };
  function saveHeaderTitle() {
    if (!editingHeaderTitle) return;
    var input = document.getElementById('header-title-input');
    localStorage.setItem('sh_header_title',String(input && input.value || '').trim() || 'Inköpslista');
    editingHeaderTitle = false;
    renderHeaderTitle();
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function escapeAttr(value) { return escapeHtml(value); }

  function closeAllMenus() {
    document.querySelectorAll('.dropdown-wrapper.open').forEach(function (wrapper) { wrapper.classList.remove('open'); });
    var tools = document.querySelector('.shopping-tools-wrap.open');
    if (tools) tools.classList.remove('open');
  }
  function setupDropdownHandlers() {
    document.addEventListener('click',function (event) {
      var toggle = event.target.closest('.minimal-tools-toggle');
      if (toggle) {
        event.preventDefault();
        event.stopPropagation();
        var tools = toggle.closest('.shopping-tools-wrap');
        if (tools) tools.classList.toggle('open');
        return;
      }
      var button = event.target.closest('.dropdown-btn,.nav-btn');
      if (button) {
        var wrapper = button.closest('.dropdown-wrapper');
        if (wrapper) {
          event.preventDefault();
          event.stopPropagation();
          var wasOpen = wrapper.classList.contains('open');
          document.querySelectorAll('.dropdown-wrapper.open').forEach(function (other) { if (other !== wrapper) other.classList.remove('open'); });
          wrapper.classList.toggle('open',!wasOpen);
          return;
        }
      }
      if (!event.target.closest('.dropdown-wrapper') && !event.target.closest('.shopping-tools-wrap')) closeAllMenus();
    });
  }

  function updateSummary() {
    var list = currentList();
    var name = list && list.name ? list.name : 'Huvudlista';
    var items = list && Array.isArray(list.items) ? list.items.filter(function (item) { return item && item.type !== 'category' && String(item.text || '').trim(); }) : [];
    var done = items.filter(function (item) { return !!item.checked; }).length;
    var remaining = Math.max(0,items.length - done);
    var listName = document.getElementById('shopping-current-list');
    var summary = document.getElementById('shopping-summary');
    var headerMeta = document.getElementById('shopping-header-meta');
    var statLists = document.getElementById('shopping-stat-lists');
    var statTemplates = document.getElementById('shopping-stat-templates');
    if (listName) listName.textContent = name;
    if (summary) summary.textContent = remaining + ' kvar · ' + items.length + ' totalt';
    if (headerMeta) headerMeta.textContent = name + ' · ' + remaining + ' kvar';
    if (statLists) statLists.textContent = String(getLists().length);
    if (statTemplates) statTemplates.textContent = String(getSavedTemplates().length);
  }
  window.__shoppingShellV1UpdateSummary = updateSummary;

  function setupSummaryObservers() {
    var root = document.getElementById('items-list');
    if (root && typeof MutationObserver !== 'undefined') {
      new MutationObserver(updateSummary).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class','checked']});
      root.addEventListener('change',updateSummary);
    }
    window.addEventListener('storage',function (event) {
      if (!event.key || event.key.indexOf('sh_') !== 0) return;
      updateSummary();
      window.renderListsMenu();
      window.renderTemplatesMenu();
    });
  }

  function handleGlobalKeydown(event) {
    if (event.key === 'Escape') {
      closeAllMenus();
      if (selectedItemIds.size) {
        selectedItemIds.clear();
        if (typeof window.renderItems === 'function') window.renderItems();
      }
      return;
    }
    var target = event.target;
    var isText = target && (target.isContentEditable || /^(input|textarea)$/i.test(target.tagName || ''));
    if (event.key === 'Backspace' && selectedItemIds.size && !isText) {
      event.preventDefault();
      window.deleteSelectedItems();
    }
  }

  function init() {
    ensureLists();
    renderHeaderTitle();
    window.renderListsMenu();
    window.renderTemplatesMenu();
    window.renderRecipesDropdown();
    setupDropdownHandlers();
    setupSummaryObservers();
    document.addEventListener('keydown',handleGlobalKeydown);
    updateSummary();
    document.documentElement.classList.add('shopping-shell-ready-v1');
  }

  window.addEventListener('firebase-sync',function (event) {
    var key = event && event.detail && event.detail.key;
    if (!key || key.indexOf('sh_') !== 0) return;
    updateSummary();
    if (key === 'sh_lists') window.renderListsMenu();
    if (key === 'sh_saved_templates') window.renderTemplatesMenu();
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
