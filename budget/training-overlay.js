/* One scroll owner per document. Fixed-body locking also covers mobile Safari;
   named owners keep nested popups from unlocking the page underneath. */
(function(){
  'use strict';
  var owners=new Set(),saved=null;
  var bodyProps=['position','top','left','right','width','overflow'];
  var htmlProps=['overflow','overscrollBehavior','scrollBehavior'];
  function capture(style,props){var values={};props.forEach(function(p){values[p]=style[p];});return values;}
  function restore(style,values){Object.keys(values).forEach(function(p){style[p]=values[p];});}
  function acquire(owner){
    if(owners.has(owner))return;
    owners.add(owner);
    if(saved)return;
    var body=document.body,html=document.documentElement;
    saved={x:window.scrollX,y:window.scrollY,body:capture(body.style,bodyProps),html:capture(html.style,htmlProps)};
    html.style.overflow='hidden';html.style.overscrollBehavior='none';html.style.scrollBehavior='auto';
    body.style.position='fixed';body.style.top=-saved.y+'px';body.style.left=-saved.x+'px';body.style.right='0';body.style.width='100%';body.style.overflow='hidden';
    window.dispatchEvent(new CustomEvent('training-overlay:change',{detail:{locked:true}}));
  }
  function release(owner){
    owners.delete(owner);
    if(owners.size||!saved)return;
    var previous=saved;saved=null;
    restore(document.body.style,previous.body);restore(document.documentElement.style,previous.html);
    document.documentElement.style.scrollBehavior='auto';
    window.scrollTo(previous.x,previous.y);
    document.documentElement.style.scrollBehavior=previous.html.scrollBehavior;
    window.dispatchEvent(new CustomEvent('training-overlay:change',{detail:{locked:false}}));
  }
  window.TrainingOverlay={acquire:acquire,release:release,isLocked:function(){return owners.size>0;}};

  // The preserved editor uses class-based popups, including its save preview.
  // Watch only overlay roots, never every changing input/timer in the document.
  function installEditors(){
    if(!document.getElementById('pulse-page'))return;
    var selector='.modal-overlay,#exercise-plan-preview-v7,#session-between-overlay-v2,#session-pre-timer',stack=[],observed=new WeakSet(),inertNodes=new Map(),lastTop=null,returnFocus=new Map();
    function sync(){
      var visible=Array.from(document.querySelectorAll(selector)).filter(function(el){return el.classList.contains('show');});
      stack=stack.filter(function(el){return visible.includes(el);});
      visible.forEach(function(el){if(!stack.includes(el)){stack.push(el);returnFocus.set(el,document.activeElement);}});
      var top=stack[stack.length-1]||null;
      inertNodes.forEach(function(value,el){el.inert=value;});inertNodes.clear();
      if(top){
        acquire('editor');
        Array.from(document.body.children).forEach(function(el){
          if(el===top||el.contains(top)||el.id==='toast'||el.classList.contains('exercise-name-picker-v1')||/^(SCRIPT|STYLE|LINK)$/.test(el.tagName))return;
          inertNodes.set(el,el.inert);el.inert=true;
        });
        top.setAttribute('role','dialog');top.setAttribute('aria-modal','true');
        if(!top.hasAttribute('aria-label'))top.setAttribute('aria-label',(top.querySelector('h2,.plan-preview-title-v7,.session-title')||{}).textContent||'Passverktyg');
      }else release('editor');
      if(top!==lastTop){
        var prior=lastTop;lastTop=top;
        if(top&&!top.contains(document.activeElement)){
          // Focus the panel, without opening the mobile keyboard automatically.
          var panel=top.querySelector('.modal,.plan-preview-card-v7,.session-shell')||top;
          panel.tabIndex=-1;panel.focus({preventScroll:true});
        }else if(!top&&prior){var target=returnFocus.get(prior);if(target&&target.isConnected&&!target.inert)target.focus({preventScroll:true});}
        if(prior&&!stack.includes(prior))returnFocus.delete(prior);
      }
    }
    function watch(el){
      if(!el.matches||!el.matches(selector)||observed.has(el))return;
      observed.add(el);new MutationObserver(sync).observe(el,{attributes:true,attributeFilter:['class']});
    }
    document.querySelectorAll(selector).forEach(watch);
    new MutationObserver(function(records){
      var changed=false;
      records.forEach(function(record){Array.from(record.addedNodes).forEach(function(el){if(el.matches&&el.matches(selector)){watch(el);changed=true;}});Array.from(record.removedNodes).forEach(function(el){if(stack.includes(el))changed=true;});});
      if(changed)sync();
    }).observe(document.body,{childList:true});
    document.addEventListener('keydown',function(event){
      var top=stack[stack.length-1];if(!top||event.defaultPrevented)return;
      if(event.key==='Escape'){
        // Let the exercise name picker consume its own Escape first.
        var picker=document.querySelector('.exercise-name-picker-v1.show');
        if(picker&&!picker.hidden&&getComputedStyle(picker).display!=='none'&&typeof window.closeExerciseNamePicker==='function'){window.closeExerciseNamePicker();event.preventDefault();return;}
        event.preventDefault();
        if(top.id==='exercise-plan-preview-v7'&&window.__exerciseBuilderBetweenPreviewV7)window.__exerciseBuilderBetweenPreviewV7.closePreview();
        else if(top.id==='session-between-overlay-v2'||top.id==='session-pre-timer'){return;}
        else if(top.id==='session-modal'){
          if(window.confirm('Avsluta det pågående passet utan att spara?'))window.stopSessionMode(false);
        }else if(typeof window.closeModal==='function')window.closeModal(top.id);
      }
      if(event.key==='Tab'){
        var controls=Array.from(top.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')).filter(function(el){return !el.disabled&&!el.closest('[inert]')&&el.getClientRects().length;});
        var first=controls[0],last=controls[controls.length-1];
        if(!first){event.preventDefault();return;}
        if(event.shiftKey&&(!top.contains(document.activeElement)||document.activeElement===first||document.activeElement.tabIndex===-1)){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&(!top.contains(document.activeElement)||document.activeElement===last)){event.preventDefault();first.focus();}
      }
    });
    sync();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installEditors,{once:true});else installEditors();
})();
