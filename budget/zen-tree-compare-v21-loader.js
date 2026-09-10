/* Zen v21 loader: inject comparison toggle assets without touching Zen logic. */
(function(){
  'use strict';
  var head=document.head;
  if(!head)return;
  if(!document.querySelector('link[data-zen-tree-compare-v21]')){
    var link=document.createElement('link');
    link.rel='stylesheet';
    link.href='zen-tree-compare-v21.css?v=20260910-tree-compare-v21';
    link.setAttribute('data-zen-tree-compare-v21','');
    head.appendChild(link);
  }
  if(!document.querySelector('script[data-zen-tree-compare-v21]')){
    var script=document.createElement('script');
    script.src='zen-tree-compare-v21.js?v=20260910-tree-compare-v21';
    script.defer=true;
    script.setAttribute('data-zen-tree-compare-v21','');
    head.appendChild(script);
  }
})();
