(function(){
'use strict';
var p=location.pathname.toLowerCase();
var isBudget=p.endsWith('/budget/budget.html')||p.endsWith('/budget.html')||p.endsWith('/budget/budget_maja.html')||p.endsWith('/budget_maja.html');
if(!isBudget)return;

function installStyles(){
  if(document.getElementById('finance-month-controls-v15-style'))return;
  var s=document.createElement('style');
  s.id='finance-month-controls-v15-style';
  s.textContent=
    'html.finance-shell-v14 body .header>#finance-toggle-row-v14{position:absolute!important;left:10px!important;right:auto!important;bottom:8px!important;top:auto!important;grid-area:unset!important;z-index:4!important}' +
    'html.finance-shell-v14 body .header>#month-nav{position:absolute!important;left:50%!important;right:auto!important;bottom:8px!important;top:auto!important;transform:translateX(-50%)!important;grid-area:unset!important;z-index:6!important;margin:0!important;display:flex!important;align-items:center!important;justify-content:center!important;flex-wrap:nowrap!important;gap:3px!important;width:max-content!important}' +
    'html.finance-shell-v14 body .header>#month-nav>.custom-dropdown-wrapper{flex:0 0 auto!important;position:relative!important}' +
    'html.finance-shell-v14 body .header #month-dropdown{height:29px!important;min-width:102px!important;width:102px!important;padding:0 22px 0 8px!important;border:1px solid rgba(255,255,255,.22)!important;border-radius:15px!important;background:rgba(255,255,255,.075)!important;color:#E2E8F0!important;font:700 10px/1 Inter,sans-serif!important;letter-spacing:0!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 4px 14px rgba(0,0,0,.14)!important;background-image:url("data:image/svg+xml,%3Csvg fill='%2394A3B8' height='16' viewBox='0 0 24 24' width='16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")!important;background-repeat:no-repeat!important;background-position:right 5px center!important;background-size:14px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;transform:none!important}' +
    'html.finance-shell-v14 body .header #month-dropdown:hover{background-color:rgba(255,255,255,.11)!important;border-color:rgba(96,165,250,.42)!important;box-shadow:inset 0 0 0 1px rgba(96,165,250,.14),0 0 12px rgba(59,130,246,.12)!important;transform:none!important}' +
    'html.finance-shell-v14 body .header #month-dropdown:active{box-shadow:inset 0 0 0 1px rgba(96,165,250,.28),0 0 14px rgba(59,130,246,.16)!important}' +
    '.finance-month-arrow-v15{appearance:none;width:27px;height:29px;flex:0 0 27px;padding:0;border:1px solid rgba(255,255,255,.18);border-radius:14px;background:rgba(255,255,255,.06);color:#94A3B8;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.045);transition:color .14s ease,background .14s ease,border-color .14s ease,box-shadow .14s ease,transform .09s ease;-webkit-tap-highlight-color:transparent}' +
    '.finance-month-arrow-v15 svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}' +
    '.finance-month-arrow-v15:not(:disabled):hover{color:#93C5FD;background:rgba(59,130,246,.12);border-color:rgba(96,165,250,.38);box-shadow:0 0 10px rgba(59,130,246,.13)}' +
    '.finance-month-arrow-v15:not(:disabled):active{transform:scale(.94)}' +
    '.finance-month-arrow-v15:disabled{opacity:.28;cursor:default}' +
    'html.finance-shell-v14 .custom-dropdown-menu{background:rgba(15,18,25,.97)!important;border:1px solid rgba(148,163,184,.22)!important;box-shadow:0 14px 34px rgba(0,0,0,.46),inset 0 1px 0 rgba(255,255,255,.04)!important;backdrop-filter:blur(16px)!important;-webkit-backdrop-filter:blur(16px)!important}' +
    'html.finance-shell-v14 .custom-dropdown-item{color:#CBD5E1!important;border-bottom-color:rgba(148,163,184,.12)!important;background:transparent!important}' +
    'html.finance-shell-v14 .custom-dropdown-item:hover{background:rgba(96,165,250,.11)!important;color:#F1F5F9!important}' +
    'html.finance-shell-v14 .custom-dropdown-item.selected{background:linear-gradient(135deg,rgba(59,130,246,.20),rgba(30,41,59,.28))!important;color:#93C5FD!important;border-left:3px solid #60A5FA!important}' +
    'html.finance-shell-v14 .custom-dropdown-item.budget-month-add-v6{color:#4ADE80!important;border-top-color:rgba(74,222,128,.22)!important}' +
    'html.finance-shell-v14 .custom-dropdown-item.budget-month-add-v6:hover{background:rgba(74,222,128,.10)!important;color:#86EFAC!important}' +
    '@media(max-width:600px){html.finance-shell-v14 body .header>#finance-toggle-row-v14{left:8px!important;bottom:8px!important}html.finance-shell-v14 body .header>#month-nav{bottom:8px!important;gap:2px!important}html.finance-shell-v14 body .header #month-dropdown{height:28px!important;min-width:80px!important;width:80px!important;padding:0 18px 0 6px!important;border-radius:14px!important;font-size:8.9px!important;background-position:right 3px center!important;background-size:13px!important}.finance-month-arrow-v15{width:23px;height:28px;flex-basis:23px;border-radius:13px}.finance-month-arrow-v15 svg{width:12px;height:12px}}' +
    '@media(max-width:360px){html.finance-shell-v14 body .header #month-dropdown{min-width:72px!important;width:72px!important;font-size:8.2px!important}.finance-month-arrow-v15{width:21px;flex-basis:21px}}';
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
  var prev=document.getElementById('finance-month-prev-v15');
  var next=document.getElementById('finance-month-next-v15');
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
  b.type='button';b.id=id;b.className='finance-month-arrow-v15';b.setAttribute('aria-label',label);b.title=label;
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
  if(!document.getElementById('finance-month-prev-v15'))nav.insertBefore(arrow('finance-month-prev-v15','Föregående månad','M15 18l-6-6 6-6',-1),wrapper);
  if(!document.getElementById('finance-month-next-v15'))nav.insertBefore(arrow('finance-month-next-v15','Nästa månad','M9 6l6 6-6 6',1),wrapper.nextSibling);
  updateArrows();
  if(!window.__financeMonthMenuObserverV15){
    window.__financeMonthMenuObserverV15=true;
    new MutationObserver(function(){setTimeout(updateArrows,0)}).observe(menu,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }
  [0,80,220,600,1300].forEach(function(delay){setTimeout(updateArrows,delay)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
