(function(){
'use strict';
var p=location.pathname.toLowerCase();
var isBudget=p.endsWith('/budget/budget.html')||p.endsWith('/budget.html')||p.endsWith('/budget/budget_maja.html')||p.endsWith('/budget_maja.html');
if(!isBudget)return;
if(document.querySelector('script[data-finance-month-controls-v16]'))return;
var s=document.createElement('script');
s.src='finance-month-controls-v16.js?v=20260830-0945-week-style-dark-v16';
s.async=false;
s.setAttribute('data-finance-month-controls-v16','true');
document.head.appendChild(s);
})();
