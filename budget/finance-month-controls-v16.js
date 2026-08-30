(function(){
'use strict';
var p=location.pathname.toLowerCase();
var isBudget=p.endsWith('/budget/budget.html')||p.endsWith('/budget.html')||p.endsWith('/budget/budget_maja.html')||p.endsWith('/budget_maja.html');
if(!isBudget)return;

function installStyles(){
  var old=document.getElementById('finance-month-controls-v15-style');
  if(old)old.remove();
  if(document.getElementById('finance-month-controls-v16-style'))return;
  var s=document.createElement('style');
  s.id='finance-month-controls-v16-style';
  s.textContent=
    'html.finance-shell-v14 body .header>#finance-toggle-row-v14{position:absolute!important;left:10px!important;right:auto!important;bottom:8px!important;top:auto!important;grid-area:unset!important;z-index:4!important}' +
    'html.finance-shell-v14 body .header>#month-nav{position:absolute!important;left:50%!important;right:auto!important;bottom:8px!important;top:auto!important;transform:translateX(-50%)!important;grid-area:unset!important;z-index:8!important;margin:0!important;padding:0!important;height:29px!important;display:flex!important;align-items:center!important;justify-content:center!important;flex-wrap:nowrap!important;gap:5px!important;width:max-content!important}' +
    'html.finance-shell-v14 body .header>#month-nav>.custom-dropdown-wrapper{flex:0 0 auto!important;flex-basis:auto!important;position:relative!important;height:29px!important;margin:0!important;padding:0!important}' +
    'html.finance-shell-v14 body .header #month-dropdown{appearance:none!important;height:29px!important;min-width:110px!important;width:110px!important;margin:0!important;padding:0 22px 0 9px!important;border:1px solid rgba(255,255,255,.08)!important;border-radius:8px!important;background-color:rgba(255,255,255,.035)!important;color:#F0F6FC!important;font:700 10.5px/1 Inter,sans-serif!important;letter-spacing:.1px!important;box-shadow:none!important;background-image:url("data:image/svg+xml,%3Csvg fill='%238B949E' height='16' viewBox='0 0 24 24' width='16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")!important;background-repeat:no-repeat!important;background-position:right 5px center!important;background-size:13px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;transform:none!important;transition:background-color .15s,border-color .15s,box-shadow .15s!important}' +
    'html.finance-shell-v14 body .header #month-dropdown:hover{background-color:rgba(255,255,255,.06)!important;border-color:rgba(96,165,250,.30)!important;box-shadow:0 0 0 1px rgba(96,165,250,.05)!important;transform:none!important}' +
    'html.finance-shell-v14 body .header #month-dropdown:focus,html.finance-shell-v14 body .header #month-dropdown:active{outline:none!important;background-color:rgba(96,165,250,.07)!important;border-color:rgba(96,165,250,.42)!important;box-shadow:0 0 0 2px rgba(96,165,250,.08)!important;transform:none!important}' +
    'html.finance-shell-v14 body .header>#month-nav>.finance-month-arrow-v16{appearance:none!important;width:29px!important;min-width:29px!important;max-width:29px!important;height:29px!important;min-height:29px!important;max-height:29px!important;flex:0 0 29px!important;margin:0!important;padding:0!important;border:1px solid rgba(255,255,255,.08)!important;border-radius:8px!important;background:rgba(255,255,255,.035)!important;color:#F0F6FC!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;box-shadow:none!important;font-size:0!important;line-height:1!important;transition:background .15s,border-color .15s,color .15s,transform .09s!important;-webkit-tap-highlight-color:transparent!important}' +
    'html.finance-shell-v14 body .header>#month-nav>.finance-month-arrow-v16 svg{width:14px!important;height:14px!important;fill:none!important;stroke:currentColor!important;stroke-width:2.1!important;stroke-linecap:round!important;stroke-linejoin:round!important}' +
    'html.finance-shell-v14 body .header>#month-nav>.finance-month-arrow-v16:not(:disabled):hover{background:rgba(255,255,255,.06)!important;border-color:rgba(96,165,250,.34)!important;color:#93C5FD!important}' +
    'html.finance-shell-v14 body .header>#month-nav>.finance-month-arrow-v16:not(:disabled):active{transform:scale(.94)!important}' +
    'html.finance-shell-v14 body .header>#month-nav>.finance-month-arrow-v16:disabled{opacity:.26!important;cursor:default!important}' +
    'html.finance-shell-v14 #month-dropdown-menu{top:calc(100% + 7px)!important;left:50%!important;right:auto!important;min-width:188px!important;width:max-content!important;max-width:min(260px,88vw)!important;margin:0!important;padding:5px 0!important;border:1px solid rgba(255,255,255,.08)!important;border-radius:12px!important;background:#161B22!important;color:#C9D1D9!important;box-shadow:0 14px 38px rgba(0,0,0,.52),inset 0 1px 0 rgba(255,255,255,.035)!important;backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important;overflow:hidden!important;transform:translateX(-50%)!important;transform-origin:top center!important;animation:financeMonthDropV16 .20s cubic-bezier(.16,1,.3,1)!important}' +
    'html.finance-shell-v14 #month-dropdown-menu .custom-dropdown-item{min-height:36px!important;padding:9px 11px!important;color:#C9D1D9!important;border-bottom:1px solid rgba(255,255,255,.045)!important;background:transparent!important;font-size:11px!important;transition:background .14s,color .14s!important}' +
    'html.finance-shell-v14 #month-dropdown-menu .custom-dropdown-item:last-child{border-bottom:0!important}' +
    'html.finance-shell-v14 #month-dropdown-menu .custom-dropdown-item:hover{padding-left:11px!important;background:rgba(96,165,250,.10)!important;color:#F0F6FC!important}' +
    'html.finance-shell-v14 #month-dropdown-menu .custom-dropdown-item.selected{padding-left:11px!important;background:rgba(96,165,250,.12)!important;color:#93C5FD!important;box-shadow:inset 3px 0 0 #60A5FA!important;border-left:0!important}' +
    'html.finance-shell-v14 #month-dropdown-menu .budget-month-delete-v4{color:#64748B!important;background:transparent!important}' +
    'html.finance-shell-v14 #month-dropdown-menu .budget-month-delete-v4:hover{color:#F87171!important;background:rgba(248,113,113,.10)!important}' +
    'html.finance-shell-v14 #month-dropdown-menu .custom-dropdown-item.budget-month-add-v6{margin-top:4px!important;padding-left:11px!important;border-top:1px solid rgba(74,222,128,.18)!important;border-bottom:0!important;color:#4ADE80!important;background:transparent!important;font-weight:750!important}' +
    'html.finance-shell-v14 #month-dropdown-menu .custom-dropdown-item.budget-month-add-v6:hover{padding-left:11px!important;background:rgba(74,222,128,.09)!important;color:#86EFAC!important}' +
    '@keyframes financeMonthDropV16{from{opacity:0;transform:translate(-50%,-8px) scale(.97)}to{opacity:1;transform:translate(-50%,0) scale(1)}}' +
    '@media(max-width:600px){html.finance-shell-v14 body .header>#finance-toggle-row-v14{left:8px!important;bottom:8px!important}html.finance-shell-v14 body .header>#month-nav{bottom:8px!important;height:28px!important;gap:4px!important}html.finance-shell-v14 body .header>#month-nav>.custom-dropdown-wrapper{height:28px!important}html.finance-shell-v14 body .header #month-dropdown{height:28px!important;min-width:80px!important;width:80px!important;padding:0 17px 0 6px!important;border-radius:8px!important;font-size:8.8px!important;background-position:right 3px center!important;background-size:12px!important}html.finance-shell-v14 body .header>#month-nav>.finance-month-arrow-v16{width:25px!important;min-width:25px!important;max-width:25px!important;height:28px!important;min-height:28px!important;max-height:28px!important;flex:0 0 25px!important;padding:0!important;border-radius:8px!important}html.finance-shell-v14 body .header>#month-nav>.finance-month-arrow-v16 svg{width:12px!important;height:12px!important}html.finance-shell-v14 #month-dropdown-menu{min-width:176px!important;border-radius:11px!important}html.finance-shell-v14 #month-dropdown-menu .custom-dropdown-item{min-height:34px!important;padding:8px 10px!important;font-size:10px!important}}' +
    '@media(max-width:360px){html.finance-shell-v14 body .header>#month-nav{gap:3px!important}html.finance-shell-v14 body .header #month-dropdown{min-width:66px!important;width:66px!important;font-size:7.9px!important;padding-left:5px!important}html.finance-shell-v14 body .header>#month-nav>.finance-month-arrow-v16{width:21px!important;min-width:21px!important;max-width:21px!important;flex:0 0 21px!important;padding:0!important}html.finance-shell-v14 #month-dropdown-menu{min-width:164px!important}}';
  document.head.appendChild(s);
}

function getMenu(){return document.getElementById('month-dropdown-menu')}
function getItems(){
  var menu=getMenu();
  if(!menu)return[];
  return Array.prototype.slice.call(menu.querySelectorAll('.custom-dropdown-item')).filter(function(item){
    return !item.classList.contains('budget-month-add-v6');
  });
}
function selectedIndex(items){
  for(var i=0;i<items.length;i++)if(items[i].classList.contains('selected'))return i;
  var label=(document.getElementById('month-dropdown')||{}).textContent||'';
  label=String(label).trim();
  for(var j=0;j<items.length;j++){
    var text=String(items[j].childNodes[0]&&items[j].childNodes[0].textContent||items[j].textContent||'').trim();
    if(text===label)return j;
  }
  return -1;
}
function updateArrows(){
  var items=getItems(),idx=selectedIndex(items);
  var prev=document.getElementById('finance-month-prev-v16');
  var next=document.getElementById('finance-month-next-v16');
  if(prev){prev.disabled=idx<=0;prev.setAttribute('aria-disabled',prev.disabled?'true':'false')}
  if(next){next.disabled=idx<0||idx>=items.length-1;next.setAttribute('aria-disabled',next.disabled?'true':'false')}
}
function stepMonth(delta){
  var items=getItems(),idx=selectedIndex(items);
  var target=items[idx+delta];
  if(!target)return;
  var menu=getMenu();
  if(menu)menu.classList.remove('active');
  if(typeof target.click==='function')target.click();
  setTimeout(updateArrows,0);
}
function arrow(id,label,path,delta){
  var b=document.createElement('button');
  b.type='button';b.id=id;b.className='finance-month-arrow-v16';b.setAttribute('aria-label',label);b.title=label;
  b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+path+'"/></svg>';
  b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();stepMonth(delta)});
  return b;
}
function install(){
  var nav=document.getElementById('month-nav');
  var wrapper=nav&&nav.querySelector('.custom-dropdown-wrapper');
  var menu=getMenu();
  if(!nav||!wrapper||!menu){setTimeout(install,40);return}
  installStyles();
  ['finance-month-prev-v15','finance-month-next-v15'].forEach(function(id){var old=document.getElementById(id);if(old)old.remove()});
  if(!document.getElementById('finance-month-prev-v16'))nav.insertBefore(arrow('finance-month-prev-v16','Föregående månad','M15 18l-6-6 6-6',-1),wrapper);
  if(!document.getElementById('finance-month-next-v16'))nav.insertBefore(arrow('finance-month-next-v16','Nästa månad','M9 6l6 6-6 6',1),wrapper.nextSibling);
  updateArrows();
  if(!window.__financeMonthMenuObserverV16){
    window.__financeMonthMenuObserverV16=true;
    new MutationObserver(function(){setTimeout(updateArrows,0)}).observe(menu,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }
  [0,80,220,600,1300].forEach(function(delay){setTimeout(updateArrows,delay)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
