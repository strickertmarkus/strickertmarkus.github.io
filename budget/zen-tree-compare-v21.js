/* Zen v21: temporary Stretch tree comparison toggle. */
(function(){
  'use strict';
  var sanctuary=document.querySelector('.sanctuary');
  if(!sanctuary)return;

  var STORAGE='zen-stretch-tree-compare-v21';
  var wrap=document.createElement('div');
  wrap.className='tree-compare-v21';
  var button=document.createElement('button');
  button.type='button';
  button.innerHTML='<span>Träd ·</span><span class="tree-compare-state">Ny</span>';
  wrap.appendChild(button);
  sanctuary.appendChild(wrap);

  function storedMode(){
    try{
      return localStorage.getItem(STORAGE)==='original'?'original':'new';
    }catch(error){
      return 'new';
    }
  }

  function apply(mode,save){
    mode=mode==='original'?'original':'new';
    document.body.dataset.stretchTree=mode;
    var state=button.querySelector('.tree-compare-state');
    if(state)state.textContent=mode==='original'?'Original':'Ny';
    button.setAttribute('aria-pressed',mode==='original'?'true':'false');
    button.setAttribute('aria-label',mode==='original'?'Trädbakgrund: original. Visa nya trädet.':'Trädbakgrund: ny. Visa originalträdet.');
    if(save){
      try{localStorage.setItem(STORAGE,mode);}catch(error){}
    }
  }

  button.addEventListener('click',function(){
    apply(document.body.dataset.stretchTree==='original'?'new':'original',true);
  });

  apply(storedMode(),false);
})();
