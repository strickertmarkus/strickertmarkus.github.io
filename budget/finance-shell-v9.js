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

if(!document.querySelector('script[data-finance-shell-v14]')){
  var s=document.createElement('script');
  s.src='finance-shell-v14.js?v=20260829-2345-nonblocking-v14';
  s.async=false;
  s.setAttribute('data-finance-shell-v14','true');
  document.head.appendChild(s);
}
})();
