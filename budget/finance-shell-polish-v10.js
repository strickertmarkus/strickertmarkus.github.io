(function(){
'use strict';
var p=location.pathname.toLowerCase();
var finance=p.endsWith('/budget/budget.html')||p.endsWith('/budget.html')||p.endsWith('/budget/budget_maja.html')||p.endsWith('/budget_maja.html')||p.endsWith('/budget/analytics.html')||p.endsWith('/analytics.html')||p.endsWith('/budget/analytics_maja.html')||p.endsWith('/analytics_maja.html')||p.endsWith('/budget/familjebudget.html')||p.endsWith('/familjebudget.html');
if(!finance)return;

function installStyles(){
  if(document.getElementById('finance-shell-polish-v13-style'))return;
  var s=document.createElement('style');
  s.id='finance-shell-polish-v13-style';
  s.textContent=
    'html.finance-shell-v9 body .header>#finance-toggle-row-v9{align-self:end!important;justify-self:start!important;margin:0!important;padding:0!important}' +
    '.budget-user-toggle-v1,.budget-finance-toggle-v9{padding:3px!important;gap:2px!important;border-radius:18px!important;border:1px solid rgba(255,255,255,.22)!important;background:rgba(255,255,255,.075)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 4px 16px rgba(0,0,0,.12)!important;backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px)}' +
    '.budget-user-option-v1,.budget-finance-option-v9{height:29px!important;box-sizing:border-box!important;border-radius:14px!important}' +
    '.budget-user-option-v1{min-width:50px!important;padding:0 8px!important;font-size:10px!important}' +
    '.budget-finance-toggle-v9{top:auto!important;bottom:9px!important;right:9px!important;z-index:3!important}' +
    '.budget-finance-option-v9{width:39px!important;padding:0!important}' +
    '.budget-finance-option-v9 svg{width:17px!important;height:17px!important}' +
    'html.finance-shell-arriving-v9 body .container{animation:none!important;opacity:1!important;transform:none!important}' +
    '.container.finance-arrival-v13>*{transform-origin:top center;animation:financeBlockDropV13 .34s cubic-bezier(.16,1,.3,1) both!important;will-change:transform}' +
    '.container.finance-arrival-v13>*:nth-child(2){animation-delay:.025s!important}' +
    '.container.finance-arrival-v13>*:nth-child(3){animation-delay:.05s!important}' +
    '.container.finance-arrival-v13>*:nth-child(4){animation-delay:.075s!important}' +
    '.container.finance-arrival-v13>*:nth-child(5){animation-delay:.10s!important}' +
    '.container.finance-arrival-v13>*:nth-child(6){animation-delay:.125s!important}' +
    '.container.finance-arrival-v13>*:nth-child(n+7){animation-delay:.15s!important}' +
    '@keyframes financeBlockDropV13{0%{transform:translateY(-14px) scale(.994)}72%{transform:translateY(1px) scale(1.001)}100%{transform:translateY(0) scale(1)}}' +
    '@media(max-width:600px){.budget-user-toggle-v1,.budget-finance-toggle-v9{padding:3px!important;gap:2px!important;border-radius:17px!important}.budget-user-option-v1,.budget-finance-option-v9{height:28px!important;border-radius:13px!important}.budget-user-option-v1{min-width:47px!important;padding:0 6px!important;font-size:9.5px!important}.budget-finance-toggle-v9{top:auto!important;bottom:8px!important;right:7px!important}.budget-finance-option-v9{width:37px!important}.budget-finance-option-v9 svg{width:16px!important;height:16px!important}}' +
    '@media(prefers-reduced-motion:reduce){.container.finance-arrival-v13>*{animation:none!important}}';
  document.head.appendChild(s);
}

function triggerArrivalOnce(){
  if(window.__financeShellArrivalV13Triggered)return;
  var container=document.querySelector('.container');
  if(!container)return;
  window.__financeShellArrivalV13Triggered=true;
  container.classList.remove('finance-arrival-v13');
  requestAnimationFrame(function(){
    container.classList.add('finance-arrival-v13');
    setTimeout(function(){container.classList.remove('finance-arrival-v13')},700);
  });
}

function waitForTransition(attempt){
  if(window.__financeShellArrivalV13Triggered)return;
  if(document.documentElement.classList.contains('finance-shell-arriving-v9')){
    triggerArrivalOnce();
    return;
  }
  if(attempt<35)setTimeout(function(){waitForTransition(attempt+1)},16);
}

installStyles();
waitForTransition(0);

/* Never allow the first-paint guard to strand Safari on a hidden page. */
setTimeout(function(){document.documentElement.classList.remove('finance-shell-booting-v8')},700);
})();
