/* Compact Home list actions + read-only next-trip preview. All edits use existing synced stores. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const readLists = () => {
    try { const rows = JSON.parse(localStorage.getItem('sh_lists') || '[]'); return Array.isArray(rows) ? rows : []; }
    catch (_) { return []; }
  };
  const listMode = list => list && list.mode === 'packing' ? 'packing' : list && list.mode === 'todo' ? 'todo' : 'shopping';
  const itemCount = mode => readLists().filter(list => listMode(list) === mode).reduce((sum, list) =>
    sum + (Array.isArray(list.items) ? list.items : []).filter(item =>
      item && item.type !== 'category' && String(item.text || '').trim() && !item.checked
    ).length, 0);
  const initialPacking = () => ({
    id: -102, name: 'Packlista', mode: 'packing',
    items: ['Melker','Mila','Maja','Markus','Övrigt'].map((text, index) => ({id:10200-index,type:'category',text}))
  });
  const pickedPacking = lists => {
    const candidates = lists.filter(list => listMode(list) === 'packing');
    const id = Number(localStorage.getItem('sh_selected_packing'));
    return candidates.find(list => Number(list.id) === id) || candidates[0] || null;
  };
  const normalize = text => {
    if (typeof window.normalizeShoppingItemText === 'function') return window.normalizeShoppingItemText(text);
    return String(text || '').trim().replace(/\p{L}/u, char => char.toLocaleUpperCase('sv-SE'));
  };
  const saveLists = lists => {
    if (typeof window.saveShoppingLists === 'function') window.saveShoppingLists(lists);
    else localStorage.setItem('sh_lists', JSON.stringify(lists));
  };
  function renderCounts() {
    const shop = $('home-list-shopping-remaining'), pack = $('home-list-packing-remaining'), tasks = $('home-list-todos-remaining');
    if (shop) shop.textContent = String(itemCount('shopping'));
    if (pack) pack.textContent = String(itemCount('packing'));
    if (tasks) tasks.textContent = String(window.FamilyTodos ? window.FamilyTodos.list().filter(task => !task.done && !task.deleted).length : 0);
  }
  function packingCategories() {
    const list = pickedPacking(readLists());
    const groups = list && Array.isArray(list.items) ? list.items.filter(row => row && row.type === 'category' && String(row.text || '').trim()) : [];
    return groups.length ? groups : initialPacking().items;
  }
  function updatePackPicker() {
    const select = $('home-list-add-group');
    if (!select) return;
    const selected = select.value;
    const groups = packingCategories();
    select.replaceChildren();
    groups.forEach(group => {
      const opt = document.createElement('option');
      opt.value = String(group.id);
      opt.textContent = String(group.text);
      select.appendChild(opt);
    });
    const saved = Array.from(select.options).find(x => x.value === selected);
    if (saved) select.value = saved.value;
    else {
      const other = Array.from(select.options).find(x => x.textContent === 'Övrigt');
      if (other) select.value = other.value;
    }
  }
  function updateQuickMode() {
    const mode = $('home-list-add-mode'), group = $('home-list-add-group'), input = $('home-list-add-text');
    if (!mode || !group || !input) return;
    const isPacking = mode.value === 'packing';
    group.hidden = !isPacking;
    if (isPacking) updatePackPicker();
    const label = {shopping:'Lägg till i inköpslistan…',packing:'Lägg till att packa…',todo:'Lägg till uppgift…'}[mode.value];
    input.placeholder = label || '';
  }
  function addToShopping(text) {
    const lists = typeof window.ensureShoppingList === 'function' ? window.ensureShoppingList() : readLists();
    const selected = typeof window.getPrimaryShoppingList === 'function' ? window.getPrimaryShoppingList(lists) : lists.find(x => listMode(x) === 'shopping');
    if (!selected) throw new Error('Inköpslistan kunde inte hittas.');
    const item = {id:Date.now()+Math.random(),type:'item',text,checked:false};
    if (typeof window.insertShoppingItemUnderDefaultHeading === 'function') window.insertShoppingItemUnderDefaultHeading(selected.items,item);
    else selected.items.push(item);
    saveLists(lists);
    if (typeof window.renderShoppingWidget === 'function') window.renderShoppingWidget();
  }
  function addToPacking(text) {
    const lists = readLists();
    let list = pickedPacking(lists);
    if (!list) { list = initialPacking(); lists.push(list); }
    if (!Array.isArray(list.items)) list.items = [];
    const selected = $('home-list-add-group')?.value || '';
    let at = list.items.findIndex(row => row && row.type === 'category' && String(row.id) === selected);
    if (at < 0) at = list.items.findIndex(row => row && row.type === 'category' && row.text === 'Övrigt');
    if (at < 0) {
      list.items.push({id:Date.now()+Math.random(),type:'category',text:'Övrigt'});
      at = list.items.length-1;
    }
    let end = at + 1;
    while (end < list.items.length && list.items[end] && list.items[end].type !== 'category') end++;
    list.items.splice(end,0,{id:Date.now()+Math.random(),type:'item',text,checked:false});
    saveLists(lists);
  }
  function addQuick(event) {
    event.preventDefault();
    const input = $('home-list-add-text'), mode = $('home-list-add-mode')?.value, status = $('home-list-add-status');
    if (!input) return;
    const text = normalize(input.value);
    if (!text) return;
    if (status) status.textContent = '';
    try {
      if (mode === 'shopping') addToShopping(text);
      else if (mode === 'packing') addToPacking(text);
      else if (mode === 'todo') {
        if (!window.FamilyTodos || !window.FamilyTodos.add(text,'family','normal','')) throw new Error('Kunde inte spara uppgiften.');
      } else return;
      input.value = '';
      renderCounts();
      input.focus({preventScroll:true});
    } catch (error) {
      if (status) status.textContent = error.message || 'Kunde inte lägga till posten.';
    }
  }
  function refresh() { renderCounts(); }
  let viewRequest = 0;
  function sendPlannerViewport() {
    const frame = $('home-travel-frame');
    if (!frame || !frame.getAttribute('src') || document.body.dataset.homeSection !== 'travel') return;
    const rect = frame.getBoundingClientRect(), vv = window.visualViewport;
    const pageOffset = vv ? vv.offsetTop : 0;
    const viewHeight = vv ? vv.height : window.innerHeight;
    const visibleTop = Math.max(0, pageOffset - rect.top);
    const visibleHeight = Math.max(120,Math.min(viewHeight,rect.height - visibleTop));
    frame.contentWindow?.postMessage({
      type:'home:viewport',top:visibleTop,height:visibleHeight
    },location.origin);
  }
  function schedulePlannerViewport() {
    if (viewRequest) return;
    viewRequest = requestAnimationFrame(() => { viewRequest=0;sendPlannerViewport(); });
  }
  function receivePlannerHeight(event) {
    const frame = $('home-travel-frame');
    if (!frame || event.source !== frame.contentWindow || event.origin !== location.origin) return;
    if (!event.data || event.data.type !== 'travel:content-height') return;
    const height = Number(event.data.height);
    if (!Number.isFinite(height) || height < 200 || height > 25000) return;
    if (Math.abs((parseFloat(frame.style.height)||0)-height)>3) frame.style.height=Math.ceil(height)+'px';
    schedulePlannerViewport();
  }
  function install() {
    $('home-list-quick-add')?.addEventListener('submit',addQuick);
    $('home-list-add-mode')?.addEventListener('change',updateQuickMode);
    $('home-travel-frame')?.addEventListener('load',event => {
      event.currentTarget.dataset.loaded = 'true';
      schedulePlannerViewport();
    });
    window.addEventListener('message',receivePlannerHeight);
    window.addEventListener('scroll',schedulePlannerViewport,{passive:true});
    window.addEventListener('resize',schedulePlannerViewport,{passive:true});
    window.visualViewport?.addEventListener('resize',schedulePlannerViewport);
    window.visualViewport?.addEventListener('scroll',schedulePlannerViewport);
    const shoppingItems = $('shopping-items');
    if (shoppingItems && 'MutationObserver' in window) {
      new MutationObserver(renderCounts).observe(shoppingItems,{childList:true,subtree:true,attributes:true});
    }
    window.addEventListener('family-todos-change',renderCounts);
    window.addEventListener('firebase-sync',event => { if (!event.detail?.key || event.detail.key === 'sh_lists') renderCounts(); });
    window.addEventListener('storage',event => { if (event.key === 'sh_lists') {updatePackPicker();renderCounts();} });
    window.addEventListener('pageshow',refresh);
    document.addEventListener('visibilitychange',() => {if (!document.hidden) refresh();});
    window.FamilyTodos?.subscribe(renderCounts);
    updateQuickMode();
    refresh();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();