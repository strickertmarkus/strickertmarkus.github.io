/* Inline category add buttons and pointer/keyboard reordering for Home > Listor.
   Uses the canonical sh_lists value; no shadow list or new Firebase key. */
(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document){root.ShoppingListReorderV1=api;api.install(root);}
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  function sameId(a,b){return String(a)===String(b);}
  function locate(items,kind,id){
    return items.findIndex(function(e){return !!e&&sameId(e.id,id)&&(kind==='category'?(e.type==='category'):(e.type!=='category'));});
  }
  function endOfCategory(items,index){
    var j=index+1;
    while(j<items.length&&items[j]&&items[j].type!=='category')j++;
    return j;
  }
  function moveEntries(original,sourceKind,sourceId,targetKind,targetId,after){
    if(!Array.isArray(original)||!original.length)return null;
    var start=locate(original,sourceKind,sourceId);
    if(start<0)return null;
    if(sourceKind==='category'&&targetKind!=='category')return null;
    if(sourceKind==='category'&&sameId(sourceId,targetId))return null;
    if(sourceKind==='item'&&targetKind==='item'&&sameId(sourceId,targetId))return null;
    var end=sourceKind==='category'?endOfCategory(original,start):start+1;
    var moving=original.slice(start,end),rest=original.slice(0,start).concat(original.slice(end));
    var at=-1;
    if(targetKind==='item'&&sourceKind==='item'){
      at=locate(rest,'item',targetId);
      if(at>=0&&after)at++;
    }else if(targetKind==='category'){
      var index=locate(rest,'category',targetId);
      if(index>=0)at=sourceKind==='category'?(after?endOfCategory(rest,index):index):endOfCategory(rest,index);
    }else if(targetKind==='uncategorized'&&sourceKind==='item'){
      at=rest.findIndex(function(e){return e&&e.type==='category';});
      if(at<0)at=rest.length;
    }
    if(at<0)return null;
    var result=rest.slice(0,at).concat(moving,rest.slice(at));
    if(result.length!==original.length||result.every(function(e,i){return e===original[i];}))return null;
    return result;
  }
  function install(win){
    var doc=win.document;
    if(!/\/(?:budget\/)?shopping\.html$/i.test(win.location.pathname))return;
    var root=doc.getElementById('items-list');
    if(!root||!win.__shoppingListEngineV7){
      win.setTimeout(function(){install(win);},60);return;
    }
    if(win.__shoppingReorderInstalledV1)return;
    win.__shoppingReorderInstalledV1=true;

    var style=doc.createElement('style');
    style.id='shopping-reorder-v1-styles';
    style.textContent=[
      '.shopping-tools-wrap{display:flex;align-items:center;gap:7px}',
      '.shopping-quick-add{flex:0 0 34px;display:grid;place-items:center;width:34px;height:34px;padding:0;border:1px solid rgba(var(--accent-rgb),.33);border-radius:10px;background:rgba(var(--accent-rgb),.08);color:var(--accent);cursor:pointer;box-shadow:0 0 12px rgba(var(--accent-rgb),.05);transition:background .15s,border-color .15s}',
      '.shopping-quick-add:hover,.shopping-quick-add:focus-visible{border-color:rgba(var(--accent-rgb),.65);background:rgba(var(--accent-rgb),.16)}',
      '.shopping-quick-add svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}',
      'body.shopping-list-engine-v7 #items-list .list-item[data-item-id]{grid-template-columns:20px minmax(0,1fr) 22px 24px!important;gap:7px!important}',
      'body.shopping-list-engine-v7 #items-list .list-item[data-item-id] .item-text{grid-column:2!important}',
      'body.shopping-list-engine-v7 #items-list .list-item[data-item-id] .shopping-del{grid-column:3!important}',
      '#items-list .shopping-drag-grip{grid-column:4;width:24px;min-width:24px;min-height:32px;display:grid;place-items:center;align-self:center;padding:0;border:0;background:transparent;color:var(--text-sec,#9ca3af);opacity:.58;cursor:grab;touch-action:none;-webkit-user-select:none;user-select:none;border-radius:5px}',
      '#items-list .shopping-drag-grip svg{width:14px;height:17px;stroke:currentColor;fill:none;stroke-width:1.5;stroke-linecap:round}',
      '#items-list .shopping-drag-grip:hover,#items-list .shopping-drag-grip:focus-visible{opacity:1;color:var(--accent)}',
      '#items-list .shopping-drag-grip:focus-visible,#items-list .shopping-category-quick-add:focus-visible{outline:2px solid var(--accent);outline-offset:2px}',
      'body.shopping-list-engine-v7 #items-list .category-title[data-category-id]:not([contenteditable]){display:flex!important;align-items:center;gap:8px}',
      '#items-list .shopping-category-quick-add{display:grid;place-items:center;margin-left:auto;flex:0 0 28px;width:28px;height:28px;min-width:28px;padding:0;border:1px solid rgba(var(--accent-rgb),.22);border-radius:8px;background:rgba(var(--accent-rgb),.06);color:var(--accent);font-size:19px;line-height:1;cursor:pointer}',
      '#items-list .shopping-category-quick-add:hover{border-color:rgba(var(--accent-rgb),.6);background:rgba(var(--accent-rgb),.12)}',
      '#items-list .shopping-drag-source{opacity:.44!important}',
      'body.shopping-list-engine-v7 #items-list .shopping-drag-over-before{box-shadow:inset 0 2px 0 var(--accent)!important;background:rgba(var(--accent-rgb),.06)!important}',
      'body.shopping-list-engine-v7 #items-list .shopping-drag-over-after{box-shadow:inset 0 -2px 0 var(--accent)!important;background:rgba(var(--accent-rgb),.06)!important}',
      'body.shopping-list-engine-v7 #items-list .shopping-drag-over-category{background:rgba(var(--accent-rgb),.12)!important;box-shadow:inset 0 0 0 1px rgba(var(--accent-rgb),.42)!important}',
      'body.shopping-reordering #items-list .shopping-drag-grip{cursor:grabbing}',
      'body.shopping-list-engine-v7 #items-list .category-title[data-category-id] .shopping-drag-grip{grid-column:auto;margin-left:0}',
      '@media(max-width:520px){body.shopping-list-engine-v7 #items-list .list-item[data-item-id]{grid-template-columns:18px minmax(0,1fr) 22px 24px!important;gap:6px!important}#items-list .shopping-category-quick-add{flex-basis:30px;height:30px}}',
      '@media(prefers-reduced-motion:reduce){.shopping-quick-add{transition:none}}'
    ].join('\n');
    doc.head.appendChild(style);

    var tools=doc.querySelector('.shopping-panel-head .shopping-tools-wrap');
    if(tools&&!doc.getElementById('shopping-quick-add')){
      var quick=doc.createElement('button');quick.id='shopping-quick-add';
      quick.className='shopping-quick-add';quick.type='button';
      quick.setAttribute('aria-label','Lägg till artikel i listan');
      quick.setAttribute('title','Lägg till artikel');
      quick.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
      tools.insertBefore(quick,tools.firstChild);
      quick.addEventListener('click',function(){
        var list=activeList();
        var category=list&&list.items.find(function(e){return e&&e.type==='category';});
        openAdd(category?category.id:null);
      });
    }
    var gripSvg='<svg viewBox="0 0 16 20" aria-hidden="true"><circle cx="5" cy="4" r="1.25"/><circle cx="11" cy="4" r="1.25"/><circle cx="5" cy="10" r="1.25"/><circle cx="11" cy="10" r="1.25"/><circle cx="5" cy="16" r="1.25"/><circle cx="11" cy="16" r="1.25"/></svg>';
    function decorate(){
      root.querySelectorAll('.list-item[data-item-id]').forEach(function(row){
        if(row.querySelector('.shopping-drag-grip'))return;
        var handle=doc.createElement('button');handle.type='button';
        handle.className='shopping-drag-grip';handle.setAttribute('data-shopping-drag','item');
        handle.setAttribute('data-drag-id',row.dataset.itemId);
        handle.setAttribute('aria-label','Flytta artikel. Dra eller använd piltangenterna');
        handle.innerHTML=gripSvg;row.appendChild(handle);
      });
      root.querySelectorAll('.category-title[data-category-id]:not([contenteditable])').forEach(function(heading){
        if(!heading.querySelector('.shopping-drag-grip')){
          var grip=doc.createElement('button');grip.type='button';grip.className='shopping-drag-grip';
          grip.setAttribute('data-shopping-drag','category');grip.setAttribute('data-drag-id',heading.dataset.categoryId);
          grip.setAttribute('aria-label','Flytta rubrik och dess artiklar. Dra eller använd piltangenterna');
          grip.innerHTML=gripSvg;heading.appendChild(grip);
        }
        if(!heading.querySelector('.shopping-category-quick-add')){
          var add=doc.createElement('button');add.type='button';
          add.className='shopping-category-quick-add';add.textContent='+';
          add.setAttribute('data-shopping-add-category',heading.dataset.categoryId);
          add.setAttribute('aria-label','Lägg till artikel under '+(heading.textContent||'rubriken').trim());
          heading.appendChild(add);
        }
        // Keep the category handle aligned at the right edge, after its plus button.
        var categoryGrip=heading.querySelector('.shopping-drag-grip');
        if(categoryGrip&&categoryGrip!==heading.lastElementChild)heading.appendChild(categoryGrip);
      });
    }
    var observer=new MutationObserver(function(){decorate();});
    observer.observe(root,{childList:true});decorate();

    function readLists(){
      try{var v=JSON.parse(win.localStorage.getItem('sh_lists')||'[]');return Array.isArray(v)?v:[];}
      catch(_){return [];}
    }
    function activeList(){
      var id=win.__shoppingListEngineV7.getActiveListId();
      return readLists().find(function(l){return l&&sameId(l.id,id);})||null;
    }
    function openAdd(categoryId){
      if(typeof win.startAddItem!=='function')return;
      win.__shoppingListEngineV7.commitActive();
      win.startAddItem(categoryId);
      var editor=root.querySelector('.shopping-draft-editor');
      if(editor){try{editor.focus({preventScroll:true});}catch(_){editor.focus();}}
    }
    function persist(kind,id,targetKind,targetId,after){
      if(win.__shoppingListEngineV7)win.__shoppingListEngineV7.commitActive();
      var lists=readLists(),idActive=win.__shoppingListEngineV7.getActiveListId();
      var list=lists.find(function(l){return l&&sameId(l.id,idActive);});
      if(!list||!Array.isArray(list.items))return false;
      var ordered=moveEntries(list.items,kind,id,targetKind,targetId,after);
      if(!ordered)return false;
      try{
        if(typeof win.saveState==='function')win.saveState();
        list.items=ordered;
        win.localStorage.setItem('sh_lists',JSON.stringify(lists));
      }catch(_){return false;}
      win.renderItems();
      // A moved item tells the shop sorting where it belongs (shopping-store-sort-v1.js learns from it).
      if(kind==='item')try{win.dispatchEvent(new CustomEvent('shopping:item-moved',{detail:{id:id,items:ordered}}));}catch(_){}
      return true;
    }
    function dropNodeAt(x,y,sourceKind,sourceId){
      var el=doc.elementFromPoint(x,y);
      if(!el)return null;
      var row=el.closest('.list-item[data-item-id]');
      var heading=el.closest('.category-title[data-category-id]');
      var line=el.closest('.add-item-line');
      if(sourceKind==='category'&&row){
        var head=row.previousElementSibling;
        while(head&&!head.matches('.category-title[data-category-id]'))head=head.previousElementSibling;
        heading=head;
      }
      if(sourceKind==='category'){
        if(!heading||sameId(heading.dataset.categoryId,sourceId))return null;
        var hc=heading.getBoundingClientRect();
        return {node:heading,kind:'category',id:heading.dataset.categoryId,after:y>hc.top+hc.height/2,highlight:y>hc.top+hc.height/2?'after':'before'};
      }
      if(row){
        if(sameId(row.dataset.itemId,sourceId))return null;
        var rc=row.getBoundingClientRect(),isAfter=y>rc.top+rc.height/2;
        return {node:row,kind:'item',id:row.dataset.itemId,after:isAfter,highlight:isAfter?'after':'before'};
      }
      if(heading)return {node:heading,kind:'category',id:heading.dataset.categoryId,after:true,highlight:'category'};
      if(line){
        var cat=line.getAttribute('data-category-id');
        return {node:line,kind:cat==null?'uncategorized':'category',id:cat,after:true,highlight:'category'};
      }
      return null;
    }
    var drag=null,hover=null;
    function removeHighlights(){
      root.querySelectorAll('.shopping-drag-source,.shopping-drag-over-before,.shopping-drag-over-after,.shopping-drag-over-category').forEach(function(el){
        el.classList.remove('shopping-drag-source','shopping-drag-over-before','shopping-drag-over-after','shopping-drag-over-category');
      });
    }
    function clearDrag(){
      drag=null;hover=null;win.document.body.classList.remove('shopping-reordering');removeHighlights();
    }
    root.addEventListener('click',function(e){
      var add=e.target.closest('[data-shopping-add-category]');
      var grip=e.target.closest('[data-shopping-drag]');
      if(!add&&!grip)return;
      e.preventDefault();e.stopImmediatePropagation();
      if(add)openAdd(add.getAttribute('data-shopping-add-category'));
    },true);
    root.addEventListener('pointerdown',function(e){
      var grip=e.target.closest('[data-shopping-drag]');
      if(!grip||e.button!==0||!e.isPrimary)return;
      if(root.querySelector('[contenteditable="true"]'))return;
      e.preventDefault();e.stopPropagation();
      clearDrag();
      var kind=grip.getAttribute('data-shopping-drag'),id=grip.getAttribute('data-drag-id');
      drag={pointerId:e.pointerId,kind:kind,id:id,x:e.clientX,y:e.clientY,moved:false};
      var parent=grip.closest(kind==='category'?'.category-title[data-category-id]':'.list-item[data-item-id]');
      if(parent)parent.classList.add('shopping-drag-source');
      try{grip.setPointerCapture(e.pointerId);}catch(_){}
    },true);
    doc.addEventListener('pointermove',function(e){
      if(!drag||e.pointerId!==drag.pointerId)return;
      if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<5)return;
      drag.moved=true;
      win.document.body.classList.add('shopping-reordering');
      e.preventDefault();
      // When Listor is embedded in Home, the parent owns vertical scrolling.
      // Scroll that viewport near its edges so long lists can be rearranged
      // with touch/pointer input rather than being limited to visible rows.
      try{
        var embedded=win.document.documentElement.classList.contains('shopping-embedded')&&win.parent!==win;
        var scrollWin=embedded?win.parent:win;
        var y=embedded&&win.frameElement?win.frameElement.getBoundingClientRect().top+e.clientY:e.clientY;
        var viewportHeight=scrollWin.innerHeight;
        if(y<60)scrollWin.scrollBy(0,-18);
        else if(y>viewportHeight-60)scrollWin.scrollBy(0,18);
      }catch(_){} 
      removeHighlights();
      var source=root.querySelector(drag.kind==='category'?'.category-title[data-category-id="'+drag.id+'"]':'.list-item[data-item-id="'+drag.id+'"]');
      if(source)source.classList.add('shopping-drag-source');
      hover=dropNodeAt(e.clientX,e.clientY,drag.kind,drag.id);
      if(hover)hover.node.classList.add('shopping-drag-over-'+hover.highlight);
    },{passive:false});
    doc.addEventListener('pointerup',function(e){
      if(!drag||e.pointerId!==drag.pointerId)return;
      var moving=drag,target=hover;
      if(moving.moved&&target)persist(moving.kind,moving.id,target.kind,target.id,target.after);
      clearDrag();
    },true);
    doc.addEventListener('pointercancel',clearDrag,true);
    doc.addEventListener('keydown',function(e){
      if(e.key==='Escape'&&drag){clearDrag();return;}
      var grip=e.target.closest&&e.target.closest('[data-shopping-drag]');
      if(!grip||!['ArrowUp','ArrowDown'].includes(e.key))return;
      e.preventDefault();e.stopPropagation();
      var kind=grip.getAttribute('data-shopping-drag'),id=grip.getAttribute('data-drag-id');
      var list=activeList();if(!list)return;
      var items=list.items,step=e.key==='ArrowDown'?1:-1;
      var idx=locate(items,kind,id);
      if(idx<0)return;
      var targetKind,targetId,after;
      if(kind==='category'){
        var categories=items.filter(function(it){return it&&it.type==='category';});
        var catIdx=categories.findIndex(function(it){return sameId(it.id,id);});
        if(!categories[catIdx+step])return;
        targetKind='category';targetId=categories[catIdx+step].id;after=step>0;
      }else{
        var other=items[idx+step];if(!other)return;
        targetKind=other.type==='category'?'category':'item';targetId=other.id;after=step>0;
        if(targetKind==='category'&&step<0){
          var prev=items.slice(0,idx).reverse().find(function(it){return it&&it.type==='category';});
          if(prev&&sameId(prev.id,other.id)){
            var beforeHeading=items.indexOf(prev)-1;
            if(beforeHeading<0){targetKind='uncategorized';targetId=null;}
            else {targetKind=items[beforeHeading].type==='category'?'category':'item';targetId=items[beforeHeading].id;after=true;}
          }
        }
      }
      if(persist(kind,id,targetKind,targetId,after)){
        var next=root.querySelector('[data-shopping-drag="'+kind+'"][data-drag-id="'+id+'"]');
        if(next)next.focus({preventScroll:true});
      }
    },true);
  }
  return {moveEntries:moveEntries,install:install};
});
