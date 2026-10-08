(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  if (!path.endsWith('/budget/shopping.html') && !path.endsWith('/shopping.html')) return;

  var modes = {
    shopping:{title:'Inköpslista',headings:['Maxi','Willys','Hemköp','Lidl','Coop'],id:-101},
    packing:{title:'Packlista',headings:['Melker','Mila','Maja','Markus','Övrigt'],id:-102},
    todo:{title:'Att göra',headings:[],id:-103}
  };
  var activeMode = 'shopping';
  // Home opens Shopping directly in the Att göra tab.
  try {
    var requestedMode = new URLSearchParams(window.location.search).get('mode');
    if (modes[requestedMode]) activeMode = requestedMode;
    else if (modes[localStorage.getItem('sh_list_mode')]) activeMode = localStorage.getItem('sh_list_mode');
  } catch (_) {}
  var activeList = null;
  function listMode(list) { return modes[list.mode] ? list.mode : 'shopping'; }
  function modeLists(lists) { return (lists || getLists()).filter(function(list){return listMode(list) === activeMode;}); }
  function defaultItems(mode) {
    return modes[mode].headings.map(function(text,index){return {id:modes[mode].id * 100 - index,type:'category',text:text};});
  }
  function ensureModeList() {
    var lists = getLists(), available = modeLists(lists);
    if (!available.length) {
      var list = {id:modes[activeMode].id,name:modes[activeMode].title,mode:activeMode,items:defaultItems(activeMode)};
      lists.push(list);setLists(lists);available = [list];
    }
    if (activeMode === 'shopping' && !available[0].modeTemplateInitialized) {
      var primary = available[0];
      primary.items = primary.items || [];
      defaultItems('shopping').forEach(function(heading){
        if (!primary.items.some(function(item){return item.type === 'category' && item.text === heading.text;})) primary.items.push(heading);
      });
      primary.modeTemplateInitialized = true;
      setLists(lists);
    }
    var remembered = Number(localStorage.getItem('sh_selected_' + activeMode));
    return available.find(function(list){return Number(list.id) === remembered;}) || available[0];
  }
  function syncModeUI() {
    document.documentElement.dataset.listMode = activeMode;
    document.querySelectorAll('[data-list-mode-button]').forEach(function(button){
      button.setAttribute('aria-pressed',String(button.dataset.listModeButton === activeMode));
    });
    renderHeaderTitle();
  }
  function switchMode(mode) {
    if (!modes[mode] || mode === activeMode) return;
    // Commit drafts before changing the active storage/list scope.
    if (window.__shoppingListEngineV7) window.__shoppingListEngineV7.commitActive();
    activeMode = mode;
    localStorage.setItem('sh_list_mode',mode);
    var list = ensureModeList();
    window.selectList(list.id);
    window.renderTemplatesMenu();
    window.renderRecipes();
    syncModeUI();
    var panel = document.querySelector('.shopping-dashboard');
    if (panel.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      panel.getAnimations().forEach(function(animation){animation.cancel();});
      panel.animate([{opacity:.55,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'cubic-bezier(.22,1,.36,1)'});
    }
  }
  window.getShoppingActiveListId = function(){return activeList;};
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
      list = modeLists(lists)[0] || null;
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
      list.items = list.items.filter(Boolean);
    });
    setLists(lists);
    activeList = ensureModeList().id;
  }

  window.renderItems = window.renderItems || function () {};
  window.renderRecipes = window.renderRecipes || function () {};
  window.renderRecipesDropdown = window.renderRecipesDropdown || function () {
    var menu = document.getElementById('recipes-dropdown');
    if (menu && !menu.innerHTML.trim()) menu.innerHTML = '<a href="#" onclick="return false;">Laddar recept…</a>';
  };

  window.saveState = function saveState() {
    undoHistory.push({mode:activeMode,lists:clone(modeLists())});
    if (undoHistory.length > 50) undoHistory.shift();
  };
  window.undo = function undo() {
    var index = undoHistory.map(function(entry){return entry.mode;}).lastIndexOf(activeMode);
    if (index < 0) return;
    var previous = undoHistory.splice(index,1)[0];
    var lists = getLists(), restored = false, next = [];
    lists.forEach(function(list){
      if (listMode(list) !== activeMode) next.push(list);
      else if (!restored) { next.push.apply(next,previous.lists);restored = true; }
    });
    if (!restored) next.push.apply(next,previous.lists);
    setLists(next);
    currentList();
    window.renderListsMenu();
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
    var defaults = Object.keys(modes).map(function(mode){return {id:modes[mode].id,name:modes[mode].title,headings:modes[mode].headings,builtin:true};});
    return defaults.concat(Array.isArray(templates) ? templates.filter(function(template){return !template.builtin;}) : []);
  }
  function getActiveTemplateId() {
    var raw = localStorage.getItem(activeMode === 'shopping' ? 'sh_active_template_id' : 'sh_active_template_id_' + activeMode);
    return raw ? Number(raw) : modes[activeMode].id;
  }
  function getTemplateItems() {
    var activeId = getActiveTemplateId();
    var template = getSavedTemplates().find(function (entry) { return Number(entry.id) === Number(activeId); });
    var stamp = Date.now();
    return (template && Array.isArray(template.headings) ? template.headings : modes[activeMode].headings).map(function (text,index) {
      return {id:stamp + index,type:'category',text:String(text || '').trim()};
    }).filter(function (item) { return item.text; });
  }

  window.renderListsMenu = function renderListsMenu() {
    var menu = document.getElementById('lists-menu');
    if (!menu) return;
    var lists = modeLists();
    menu.innerHTML = lists.map(function (list) {
      var active = Number(list.id) === Number(activeList);
      return '<div class="list-menu-row"><a href="#" class="' + (active ? 'active' : '') + '" onclick="selectList(' + list.id + ');return false;">' +
        (active ? '✓ ' : '') + escapeHtml(list.name || 'Lista') + '</a><button class="list-delete-btn" type="button" onclick="deleteList(' + list.id + ');event.stopPropagation();" aria-label="Radera lista">×</button></div>';
    }).join('') + '<a href="#" class="menu-action" onclick="createNewList();return false;">+ Ny lista</a>';
  };
  window.selectList = function selectList(id) {
    activeList = id;
    localStorage.setItem('sh_selected_' + activeMode,String(id));
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
    lists.push({id:id,name:name.trim(),mode:activeMode,createdAt:new Date().toISOString().slice(0,10),items:getTemplateItems()});
    setLists(lists);
    activeList = id;
    localStorage.setItem('sh_selected_' + activeMode,String(id));
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
    if (!modeLists(lists).length) lists.push({id:modes[activeMode].id,name:modes[activeMode].title,mode:activeMode,items:defaultItems(activeMode)});
    setLists(lists);
    if (Number(activeList) === Number(id)) activeList = modeLists(lists)[0].id;
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
        (active ? '✓ ' : '') + escapeHtml(template.name || 'Mall') + '</a><button class="list-delete-btn" type="button" onclick="deleteTemplate(' + template.id + ');event.stopPropagation();" ' + (template.builtin ? 'hidden' : '') + ' aria-label="Radera mall">×</button></div>';
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
    localStorage.setItem('sh_saved_templates',JSON.stringify(templates.filter(function(template){return !template.builtin;})));
    localStorage.setItem(activeMode === 'shopping' ? 'sh_active_template_id' : 'sh_active_template_id_' + activeMode,String(id));
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
    localStorage.setItem(activeMode === 'shopping' ? 'sh_active_template_id' : 'sh_active_template_id_' + activeMode,String(id));
    window.renderTemplatesMenu();
    updateSummary();
  };
  window.deleteTemplate = function deleteTemplate(id) {
    var templates = getSavedTemplates().filter(function (template) { return Number(template.id) !== Number(id); });
    localStorage.setItem('sh_saved_templates',JSON.stringify(templates.filter(function(template){return !template.builtin;})));
    if (Number(getActiveTemplateId()) === Number(id)) {
      if (templates.length) localStorage.setItem(activeMode === 'shopping' ? 'sh_active_template_id' : 'sh_active_template_id_' + activeMode,String(templates[0].id));
      else localStorage.removeItem(activeMode === 'shopping' ? 'sh_active_template_id' : 'sh_active_template_id_' + activeMode);
    }
    window.renderTemplatesMenu();
    updateSummary();
  };

  function renderHeaderTitle() {
    var logo = document.querySelector('.logo');
    if (!logo) return;
    var title = localStorage.getItem(activeMode === 'shopping' ? 'sh_header_title' : 'sh_header_title_' + activeMode) || modes[activeMode].title;
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
    localStorage.setItem(activeMode === 'shopping' ? 'sh_header_title' : 'sh_header_title_' + activeMode,String(input && input.value || '').trim() || modes[activeMode].title);
    editingHeaderTitle = false;
    renderHeaderTitle();
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function escapeAttr(value) { return escapeHtml(value); }

  var menuDialog, menuState = null;
  function restoreMenu() {
    if (!menuState) return;
    var previous = menuState;
    menuState = null;
    previous.home.appendChild(previous.menu);
    previous.button.setAttribute('aria-expanded','false');
    window.TrainingOverlay.release('shopping-menu');
    if (previous.button.isConnected) previous.button.focus({preventScroll:true});
  }
  function closeAllMenus() {
    if (menuDialog && menuDialog.open) menuDialog.close();
    restoreMenu();
  }
  function setupDropdownHandlers() {
    menuDialog = document.getElementById('shopping-menu-dialog');
    document.querySelectorAll('.dropdown-btn,.nav-btn').forEach(function (button) {
      var menu = button.parentElement.querySelector('.dropdown-menu');
      if (!menu) return;
      button.setAttribute('aria-haspopup','dialog');
      button.setAttribute('aria-controls',menu.id);
      button.setAttribute('aria-expanded','false');
      button.addEventListener('click',function () {
        if (menuState && menuState.button === button) { closeAllMenus(); return; }
        closeAllMenus();
        menuState = {menu:menu,home:menu.parentElement,button:button};
        document.getElementById('shopping-menu-title').textContent = button.classList.contains('nav-btn') ? 'Meny' : button.textContent;
        document.getElementById('shopping-menu-content').appendChild(menu);
        button.setAttribute('aria-expanded','true');
        window.TrainingOverlay.acquire('shopping-menu');
        menuDialog.showModal();
      });
    });
    menuDialog.addEventListener('close',function () {
      // An old close event must not close a newly opened menu.
      if (!menuDialog.open) restoreMenu();
    });
    menuDialog.addEventListener('cancel',function (event) { event.preventDefault(); closeAllMenus(); });
    menuDialog.addEventListener('click',function (event) {
      if (event.target.closest('.shopping-menu-close')) closeAllMenus();
      else if (event.target === menuDialog) {
        var rect = menuDialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeAllMenus();
      } else if (event.target.closest('a') && menuState && /^(nav-menu|recipes-dropdown)$/.test(menuState.menu.id)) closeAllMenus();
    });
    window.addEventListener('pagehide',closeAllMenus);
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
    if (statLists) statLists.textContent = String(modeLists().length);
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
    if (event.defaultPrevented) return;
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
    setupDropdownHandlers();
    document.querySelector('.logo').addEventListener('keydown',function (event) {
      if (event.target === this && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault(); window.startEditHeaderTitle();
      }
    });
    ensureLists();
    document.querySelectorAll('[data-list-mode-button]').forEach(function(button){
      button.addEventListener('click',function(){switchMode(button.dataset.listModeButton);});
    });
    syncModeUI();
    window.renderListsMenu();
    window.renderTemplatesMenu();
    window.renderRecipesDropdown();
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
