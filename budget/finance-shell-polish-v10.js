(function(){
'use strict';
/* Legacy no-op/rescue file.
   Older cached loaders may still request this asset. It must never hide or
   animate the page. V14 owns the finance UI and motion. */
try{
  document.documentElement.classList.remove(
    'finance-shell-booting-v8',
    'finance-shell-arriving-v9',
    'finance-shell-arriving-v12',
    'finance-shell-leaving-v10'
  );
  var critical=document.getElementById('finance-shell-critical-v8');
  if(critical)critical.remove();
}catch(_){}
})();
