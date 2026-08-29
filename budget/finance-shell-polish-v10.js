(function(){
'use strict';
var p=location.pathname.toLowerCase();
var finance=p.endsWith('/budget/budget.html')||p.endsWith('/budget.html')||p.endsWith('/budget/budget_maja.html')||p.endsWith('/budget_maja.html')||p.endsWith('/budget/analytics.html')||p.endsWith('/analytics.html')||p.endsWith('/budget/analytics_maja.html')||p.endsWith('/analytics_maja.html')||p.endsWith('/budget/familjebudget.html')||p.endsWith('/familjebudget.html');
if(!finance)return;

function installStyles(){
  if(document.getElementById('finance-shell-polish-v11-style'))return;
  var s=document.createElement('style');
  s.id='finance-shell-polish-v11-style';
  s.textContent=
    'html.finance-shell-v9 body .header>#finance-toggle-row-v9{align-self:end!important;justify-self:start!important;margin:0!important;padding:0!important}' +
    '.budget-user-toggle-v1,.budget-finance-toggle-v9{padding:3px!important;gap:2px!important;border-radius:11px!important;border:1px solid rgba(255,255,255,.22)!important;background:rgba(255,255,255,.075)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 4px 16px rgba(0,0,0,.12)!important;backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px)}' +
    '.budget-user-option-v1,.budget-finance-option-v9{height:29px!important;box-sizing:border-box!important;border-radius:8px!important}' +
    '.budget-user-option-v1{min-width:50px!important;padding:0 8px!important;font-size:10px!important}' +
    '.budget-finance-toggle-v9{top:auto!important;bottom:9px!important;right:9px!important;z-index:3!important}' +
    '.budget-finance-option-v9{width:38px!important;padding:0!important}' +
    '.budget-finance-option-v9 svg{width:17px!important;height:17px!important}' +
    'html.finance-shell-arriving-v9 body .container{animation:financeContentSettleV11 .24s cubic-bezier(.16,1,.3,1) both!important;will-change:transform}' +
    '@keyframes financeContentSettleV11{0%{transform:translateY(-8px)}72%{transform:translateY(1px)}100%{transform:translateY(0)}}' +
    '@media(max-width:600px){.budget-user-toggle-v1,.budget-finance-toggle-v9{padding:3px!important;gap:2px!important;border-radius:11px!important}.budget-user-option-v1,.budget-finance-option-v9{height:28px!important;border-radius:8px!important}.budget-user-option-v1{min-width:47px!important;padding:0 6px!important;font-size:9.5px!important}.budget-finance-toggle-v9{top:auto!important;bottom:8px!important;right:7px!important}.budget-finance-option-v9{width:36px!important}.budget-finance-option-v9 svg{width:16px!important;height:16px!important}}' +
    '@media(prefers-reduced-motion:reduce){html.finance-shell-arriving-v9 body .container{animation:none!important}}';
  document.head.appendChild(s);
}

installStyles();
})();
