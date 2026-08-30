(function(){
'use strict';
/* Legacy rescue shim.
   Old cached finance bootstraps may still request finance-shell-v9.js.
   Never let that path hide the page: clear all blocking legacy state and
   hand control to the non-blocking V14 shell. */
try{
  document.documentElement.classList.remove(
    'finance-shell-booting-v8',
    'finance-shell-v9',
    'finance-shell-arriving-v9',
    'finance-shell-arriving-v12',
    'finance-shell-leaving-v10'
  );
  var critical=document.getElementById('finance-shell-critical-v8');
  if(critical)critical.remove();
}catch(_){}

var path=window.location.pathname.toLowerCase();
var isBudget=path.endsWith('/budget/budget.html')||path.endsWith('/budget.html')||
             path.endsWith('/budget/budget_maja.html')||path.endsWith('/budget_maja.html');

if(!document.querySelector('script[data-finance-shell-v14]')){
  var s=document.createElement('script');
  s.src='finance-shell-v14.js?v=20260830-1025-month-rescue-v14';
  s.async=false;
  s.setAttribute('data-finance-shell-v14','true');
  document.head.appendChild(s);
}

/* Important: older cached bootstraps know nothing about the month-control
   layer. Load it explicitly from the rescue path too. */
if(isBudget&&!document.querySelector('script[data-finance-month-controls-v16]')){
  var m=document.createElement('script');
  m.src='finance-month-controls-v16.js?v=20260830-1025-month-rescue-v16';
  m.async=false;
  m.setAttribute('data-finance-month-controls-v16','true');
  document.head.appendChild(m);
}
})();
