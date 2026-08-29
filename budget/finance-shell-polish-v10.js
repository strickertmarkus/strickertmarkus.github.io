(function(){
'use strict';
var p=location.pathname.toLowerCase();
var finance=p.endsWith('/budget/budget.html')||p.endsWith('/budget.html')||p.endsWith('/budget/budget_maja.html')||p.endsWith('/budget_maja.html')||p.endsWith('/budget/analytics.html')||p.endsWith('/analytics.html')||p.endsWith('/budget/analytics_maja.html')||p.endsWith('/analytics_maja.html')||p.endsWith('/budget/familjebudget.html')||p.endsWith('/familjebudget.html');
if(!finance)return;

function installStyles(){
  if(document.getElementById('finance-shell-polish-v12-style'))return;
  var s=document.createElement('style');
  s.id='finance-shell-polish-v12-style';
  s.textContent=
    'html.finance-shell-v9 body .header>#finance-toggle-row-v9{align-self:end!important;justify-self:start!important;margin:0!important;padding:0!important}' +
    '.budget-user-toggle-v1,.budget-finance-toggle-v9{padding:3px!important;gap:2px!important;border-radius:18px!important;border:1px solid rgba(255,255,255,.22)!important;background:rgba(255,255,255,.075)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 4px 16px rgba(0,0,0,.12)!important;backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px)}' +
    '.budget-user-option-v1,.budget-finance-option-v9{height:29px!important;box-sizing:border-box!important;border-radius:14px!important}' +
    '.budget-user-option-v1{min-width:50px!important;padding:0 8px!important;font-size:10px!important}' +
    '.budget-finance-toggle-v9{top:auto!important;bottom:9px!important;right:9px!important;z-index:3!important}' +
    '.budget-finance-option-v9{width:39px!important;padding:0!important}' +
    '.budget-finance-option-v9 svg{width:17px!important;height:17px!important}' +
    'html.finance-shell-arriving-v12 body .container>*{transform-origin:top center;animation:financeBlockDropV12 .34s cubic-bezier(.16,1,.3,1) both!important;will-change:transform}' +
    'html.finance-shell-arriving-v12 body .container>*:nth-child(2){animation-delay:.025s!important}' +
    'html.finance-shell-arriving-v12 body .container>*:nth-child(3){animation-delay:.05s!important}' +
    'html.finance-shell-arriving-v12 body .container>*:nth-child(4){animation-delay:.075s!important}' +
    'html.finance-shell-arriving-v12 body .container>*:nth-child(5){animation-delay:.10s!important}' +
    'html.finance-shell-arriving-v12 body .container>*:nth-child(6){animation-delay:.125s!important}' +
    'html.finance-shell-arriving-v12 body .container>*:nth-child(n+7){animation-delay:.15s!important}' +
    '@keyframes financeBlockDropV12{0%{transform:translateY(-16px) scale(.992)}72%{transform:translateY(2px) scale(1.001)}100%{transform:translateY(0) scale(1)}}' +
    '@media(max-width:600px){.budget-user-toggle-v1,.budget-finance-toggle-v9{padding:3px!important;gap:2px!important;border-radius:17px!important}.budget-user-option-v1,.budget-finance-option-v9{height:28px!important;border-radius:13px!important}.budget-user-option-v1{min-width:47px!important;padding:0 6px!important;font-size:9.5px!important}.budget-finance-toggle-v9{top:auto!important;bottom:8px!important;right:7px!important}.budget-finance-option-v9{width:37px!important}.budget-finance-option-v9 svg{width:16px!important;height:16px!important}}' +
    '@media(prefers-reduced-motion:reduce){html.finance-shell-arriving-v12 body .container>*{animation:none!important}}';
  document.head.appendChild(s);
}

function armArrivalAnimation(){
  if(window.__financeShellArrivalV12Armed)return;
  window.__financeShellArrivalV12Armed=true;

  function trigger(){
    document.documentElement.classList.remove('finance-shell-arriving-v12');
    requestAnimationFrame(function(){
      document.documentElement.classList.add('finance-shell-arriving-v12');
      setTimeout(function(){document.documentElement.classList.remove('finance-shell-arriving-v12')},650);
    });
  }

  if(document.documentElement.classList.contains('finance-shell-arriving-v9')) trigger();

  if(window.MutationObserver){
    new MutationObserver(function(){
      if(document.documentElement.classList.contains('finance-shell-arriving-v9')) trigger();
    }).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  }
}

installStyles();
armArrivalAnimation();
})();
