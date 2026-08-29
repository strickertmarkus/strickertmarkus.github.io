(function(){
'use strict';
var p=location.pathname.toLowerCase();
var fam=p.endsWith('/budget/familjebudget.html')||p.endsWith('/familjebudget.html');
var finance=p.endsWith('/budget/budget.html')||p.endsWith('/budget.html')||p.endsWith('/budget/budget_maja.html')||p.endsWith('/budget_maja.html')||p.endsWith('/budget/analytics.html')||p.endsWith('/analytics.html')||p.endsWith('/budget/analytics_maja.html')||p.endsWith('/analytics_maja.html')||fam;
if(!finance)return;

function installStyles(){
  if(document.getElementById('finance-shell-polish-v10-style'))return;
  var s=document.createElement('style');
  s.id='finance-shell-polish-v10-style';
  s.textContent=
    'html.finance-shell-v9 body .header>#finance-toggle-row-v9{align-self:end!important;justify-self:start!important;margin:0!important;padding:0!important}' +
    '.budget-user-toggle-v1,.budget-finance-toggle-v9{padding:2px!important;gap:2px!important;border-radius:10px!important;border:1px solid rgba(255,255,255,.22)!important;background:rgba(255,255,255,.075)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 4px 16px rgba(0,0,0,.12)!important;backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px)}' +
    '.budget-user-option-v1,.budget-finance-option-v9{height:29px!important;box-sizing:border-box!important;border-radius:7px!important}' +
    '.budget-user-option-v1{min-width:50px!important;padding:0 8px!important;font-size:10px!important}' +
    '.budget-finance-toggle-v9{top:auto!important;bottom:9px!important;right:9px!important;z-index:3!important}' +
    '.budget-finance-option-v9{width:37px!important;padding:0!important}' +
    '.budget-finance-option-v9 svg{width:17px!important;height:17px!important}' +
    'html.finance-shell-leaving-v10 body .container{pointer-events:none;animation:financeContentOutV10 .09s cubic-bezier(.4,0,1,1) both!important}' +
    'html.finance-shell-arriving-v9 body .container{animation:financeContentInV10 .27s cubic-bezier(.16,1,.3,1) both!important}' +
    '@keyframes financeContentOutV10{from{opacity:1;transform:translateY(0)}to{opacity:.48;transform:translateY(3px)}}' +
    '@keyframes financeContentInV10{from{opacity:.20;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}' +
    '@media(max-width:600px){.budget-user-toggle-v1,.budget-finance-toggle-v9{padding:2px!important;gap:2px!important;border-radius:9px!important}.budget-user-option-v1,.budget-finance-option-v9{height:28px!important;border-radius:7px!important}.budget-user-option-v1{min-width:47px!important;padding:0 6px!important;font-size:9.5px!important}.budget-finance-toggle-v9{top:auto!important;bottom:8px!important;right:7px!important}.budget-finance-option-v9{width:35px!important}.budget-finance-option-v9 svg{width:16px!important;height:16px!important}}' +
    '@media(prefers-reduced-motion:reduce){html.finance-shell-leaving-v10 body .container,html.finance-shell-arriving-v9 body .container{animation:none!important}}';
  document.head.appendChild(s);
}

function startLeaving(){
  document.documentElement.classList.remove('finance-shell-arriving-v9');
  document.documentElement.classList.add('finance-shell-leaving-v10');
}

function bindOutgoingAnimation(){
  if(window.__financeShellPolishV10Bound)return;
  window.__financeShellPolishV10Bound=true;
  document.addEventListener('click',function(event){
    var button=event.target&&event.target.closest?event.target.closest('#budget-finance-toggle-v9 [data-view],#budget-user-toggle-v1 [data-user]'):null;
    if(!button||button.classList.contains('active'))return;
    if(fam&&button.hasAttribute('data-user'))return;
    startLeaving();
  },true);
}

installStyles();
bindOutgoingAnimation();
})();
