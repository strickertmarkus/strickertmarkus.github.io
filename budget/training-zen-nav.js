(function(){
  'use strict';
  function mount(){
    var header=document.querySelector('.app-header, .zen-header');
    if(!header||header.querySelector('.wellness-nav'))return;
    var isZen=/\/zen\.html$/.test(location.pathname);
    var profile=new URLSearchParams(location.search).get('user');
    var query=profile==='maja'?'?user=maja':'';
    var nav=document.createElement('nav');
    nav.className='wellness-nav';nav.setAttribute('aria-label','Träning och återhämtning');
    nav.innerHTML='<a data-destination="training" href="exercise.html'+query+'" '+(!isZen?'aria-current="page"':'')+'><span class="wellness-symbol" aria-hidden="true">◆⌁</span>Träning</a><a data-destination="zen" href="zen.html'+query+'" '+(isZen?'aria-current="page"':'')+'><span class="wellness-symbol" aria-hidden="true">✧≈</span>Zen</a>';
    var anchor=header.querySelector('.streak-badge, .zen-header-end');
    header.insertBefore(nav,anchor||null);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
