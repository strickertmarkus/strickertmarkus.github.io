/* Zen v31: reuse the existing builder through card/summary interactions and remove detached Anpassa UI. */
(function(){
  'use strict';

  var startButton=document.getElementById('start-button');
  var selectedName=document.getElementById('selected-name');
  var selectedMeta=document.getElementById('selected-meta');
  var selectedRoutine=document.querySelector('.selected-routine');
  var routines=document.getElementById('routines');
  var editButton=document.getElementById('selected-edit');
  if(!startButton||!selectedName||!selectedMeta||!routines)return;

  /* Capture the original builder hook before removing the visible button. */
  var openSelected=null;
  if(editButton&&typeof editButton.onclick==='function'){
    openSelected=function(){editButton.onclick();};
  }
  if(editButton)editButton.remove();

  /* Put selected pass information directly inside the Meditation start ring. */
  var ringName=document.createElement('span');
  ringName.className='start-ring-name';
  ringName.setAttribute('aria-hidden','true');
  var ringMeta=document.createElement('span');
  ringMeta.className='start-ring-meta';
  ringMeta.setAttribute('aria-hidden','true');
  var arrow=startButton.lastElementChild;
  if(arrow){startButton.insertBefore(ringName,arrow);startButton.insertBefore(ringMeta,arrow);}
  else{startButton.appendChild(ringName);startButton.appendChild(ringMeta);}

  function syncRing(){
    var name=(selectedName.textContent||'').trim();
    var meta=(selectedMeta.textContent||'').trim();
    ringName.textContent=name;
    ringMeta.textContent=meta;
    if(name)startButton.setAttribute('aria-label','Starta '+name+(meta?', '+meta:''));
  }

  function configureSelected(){
    if(openSelected)openSelected();
  }

  /* The Stretch selected summary is itself editable now. */
  if(selectedRoutine&&openSelected){
    selectedRoutine.setAttribute('role','button');
    selectedRoutine.setAttribute('tabindex','0');
    selectedRoutine.setAttribute('aria-label','Konfigurera valt pass');
    selectedRoutine.addEventListener('click',function(){
      if(document.body.dataset.kind==='stretch')configureSelected();
    });
    selectedRoutine.addEventListener('keydown',function(event){
      if(document.body.dataset.kind!=='stretch')return;
      if(event.key==='Enter'||event.key===' '){event.preventDefault();configureSelected();}
    });
  }

  function decorateCards(){
    routines.querySelectorAll('.ritual-choice[data-select]').forEach(function(card){
      var title=card.querySelector('strong');
      var name=title?(title.textContent||'').trim():'passet';
      card.setAttribute('aria-label','Välj och konfigurera '+name);
      card.setAttribute('title','Välj och konfigurera');
    });
  }

  /* Capture the card before zen.js replaces the rendered list. zen.js then selects
     it during bubbling; the zero-delay callback opens the builder for that new selection. */
  routines.addEventListener('click',function(event){
    var card=event.target.closest('.ritual-choice[data-select]');
    if(!card)return;
    window.setTimeout(function(){
      syncRing();
      configureSelected();
    },0);
  },true);

  var selectedObserver=new MutationObserver(syncRing);
  selectedObserver.observe(selectedName,{childList:true,characterData:true,subtree:true});
  selectedObserver.observe(selectedMeta,{childList:true,characterData:true,subtree:true});

  var routineObserver=new MutationObserver(function(){decorateCards();syncRing();});
  routineObserver.observe(routines,{childList:true,subtree:true});

  decorateCards();
  syncRing();
})();
