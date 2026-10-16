/* Present the existing shopping mode buttons as a compact dropdown inside Home. */
(function(){
  'use strict';
  if(new URLSearchParams(location.search).get('embed')!=='home')return;

  function install(){
    const compact=document.getElementById('shopping-mode-compact');
    const trigger=document.getElementById('shopping-mode-current');
    const choices=document.getElementById('shopping-mode-options');
    const icon=document.getElementById('shopping-mode-current-icon');
    const label=document.getElementById('shopping-mode-current-label');
    const source=[...document.querySelectorAll('.shopping-mode-switch>[data-list-mode-button]')];
    if(!compact||!trigger||!choices||!icon||!label||source.length!==3)return;

    const current=()=>document.documentElement.dataset.listMode||'shopping';
    const name=button=>button.querySelector('span')?.textContent.trim()||button.getAttribute('aria-label')||'';
    const check='<svg class="shopping-mode-check" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5 12 4.5 4.5L19 7"/></svg>';

    source.forEach(button=>{
      const option=document.createElement('button');
      option.type='button';
      option.className='shopping-mode-choice';
      option.setAttribute('role','menuitemradio');
      option.dataset.compactMode=button.dataset.listModeButton;
      option.setAttribute('aria-checked','false');
      const title=document.createElement('span');
      title.textContent=name(button);
      const svg=button.querySelector('svg');
      if(!svg)return;
      option.append(svg.cloneNode(true),title);
      option.insertAdjacentHTML('beforeend',check);
      choices.appendChild(option);
    });

    function sync(){
      const selected=source.find(button=>button.dataset.listModeButton===current())||source[0];
      label.textContent=name(selected);
      trigger.setAttribute('aria-label','Välj lista: '+name(selected));
      icon.replaceChildren(selected.querySelector('svg').cloneNode(true));
      choices.querySelectorAll('[data-compact-mode]').forEach(option=>{
        const isCurrent=option.dataset.compactMode===selected.dataset.listModeButton;
        option.setAttribute('aria-checked',String(isCurrent));
        const checkIcon=option.querySelector('.shopping-mode-check');
        if(checkIcon)checkIcon.hidden=!isCurrent;
      });
    }
    function close(restoreFocus){
      if(choices.hidden)return;
      choices.hidden=true;
      trigger.setAttribute('aria-expanded','false');
      if(restoreFocus)trigger.focus({preventScroll:true});
    }
    function open(focusCurrent){
      sync();
      choices.hidden=false;
      trigger.setAttribute('aria-expanded','true');
      if(focusCurrent)choices.querySelector('[aria-checked="true"]')?.focus({preventScroll:true});
    }

    trigger.addEventListener('click',()=>choices.hidden?open(false):close(false));
    choices.addEventListener('click',event=>{
      const option=event.target.closest('[data-compact-mode]');
      if(!option)return;
      // Delegation retains the original commit-on-mode-change and Firebase persistence.
      const button=source.find(button=>button.dataset.listModeButton===option.dataset.compactMode);
      if(button)button.click();
      sync();
      close(true);
    });
    choices.addEventListener('keydown',event=>{
      const options=[...choices.querySelectorAll('[data-compact-mode]')];
      const index=options.indexOf(document.activeElement);
      if(event.key==='Escape'){
        event.preventDefault();
        event.stopPropagation();
        close(true);
      }else if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
        event.preventDefault();
        const next=event.key==='Home'?0:event.key==='End'?options.length-1:
          (index+(event.key==='ArrowDown'?1:-1)+options.length)%options.length;
        options[next]?.focus({preventScroll:true});
      }
    });
    trigger.addEventListener('keydown',event=>{
      if(event.key==='ArrowDown'||event.key==='ArrowUp'){
        event.preventDefault();
        open(true);
      }
    });
    document.addEventListener('pointerdown',event=>{
      if(!compact.contains(event.target))close(false);
    },{passive:true});
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&!choices.hidden){event.preventDefault();close(true);}
      else if(event.key==='Tab'&&!choices.hidden)close(false);
    });
    new MutationObserver(sync).observe(document.documentElement,{
      attributes:true,attributeFilter:['data-list-mode']
    });

    sync();
    compact.hidden=false;
    document.documentElement.classList.add('shopping-compact-ready');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
