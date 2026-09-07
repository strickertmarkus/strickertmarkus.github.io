(function(){
  'use strict';
  if(!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if(String(new URLSearchParams(window.location.search).get('concept')||'').toLowerCase()!=='pulse-home') return;

  function loadBase(){
    var s=document.createElement('script');
    s.src='exercise-pulse-flow-motion-v67-base-v73.js?v=75';
    s.async=false;
    s.onload=installV75;
    document.head.appendChild(s);
  }

  function installV75(){
    if(window.__exercisePulseFlowMarkerV75Installed) return;
    window.__exercisePulseFlowMarkerV75Installed=true;

    var oldStyle=document.getElementById('exercise-pulse-flow-marker-v74-style');
    if(oldStyle) oldStyle.remove();
    document.querySelectorAll('.pf-arc-marker-core-v74,.pf-arc-marker-halo-v75').forEach(function(node){node.remove();});

    var style=document.createElement('style');
    style.id='exercise-pulse-flow-marker-v75-style';
    style.textContent=`
      /* Endpoint marker = active Passflöde point: soft halo, coloured body, pale core. */
      #session-modal.pulse-flow-v58 .pf-arc-marker-halo-v75{
        fill:rgba(var(--pf-rgb),.20)!important;
        stroke:none!important;
        opacity:.92!important;
        filter:blur(.82px) drop-shadow(0 0 5px rgba(var(--pf-rgb),.74)) drop-shadow(0 0 11px rgba(var(--pf-rgb),.34))!important;
      }
      #session-modal.pulse-flow-v58 .pf-arc-marker-v73{
        fill:var(--pf-accent)!important;
        stroke:none!important;
        filter:drop-shadow(0 0 2px var(--pf-accent)) drop-shadow(0 0 7px rgba(var(--pf-rgb),.98)) drop-shadow(0 0 15px rgba(var(--pf-rgb),.58))!important;
      }
      #session-modal.pulse-flow-v58 .pf-arc-marker-core-v75{
        fill:#FFE4E6!important;
        stroke:none!important;
        opacity:.98!important;
        filter:drop-shadow(0 0 2px rgba(255,228,230,.96)) drop-shadow(0 0 4px rgba(var(--pf-rgb),.42))!important;
      }

      #session-between-overlay-v2{
        --pf-between-accent:#22D3EE;
        --pf-between-rgb:34,211,238;
        --pf-between-core:#ECFEFF;
      }
      #session-between-overlay-v2[data-between-type="custom"]{
        --pf-between-accent:#FB923C;
        --pf-between-rgb:251,146,60;
        --pf-between-core:#FFF2DE;
      }
      #session-between-overlay-v2 .pf-arc-marker-halo-v75{
        fill:rgba(var(--pf-between-rgb),.20)!important;
        stroke:none!important;
        opacity:.92!important;
        filter:blur(.82px) drop-shadow(0 0 5px rgba(var(--pf-between-rgb),.74)) drop-shadow(0 0 11px rgba(var(--pf-between-rgb),.34))!important;
      }
      #session-between-overlay-v2 .pf-arc-marker-v73{
        fill:var(--pf-between-accent)!important;
        stroke:none!important;
        filter:drop-shadow(0 0 2px var(--pf-between-accent)) drop-shadow(0 0 7px rgba(var(--pf-between-rgb),.98)) drop-shadow(0 0 15px rgba(var(--pf-between-rgb),.58))!important;
      }
      #session-between-overlay-v2 .pf-arc-marker-core-v75{
        fill:var(--pf-between-core)!important;
        stroke:none!important;
        opacity:.98!important;
        filter:drop-shadow(0 0 2px var(--pf-between-core)) drop-shadow(0 0 4px rgba(var(--pf-between-rgb),.42))!important;
      }
    `;
    document.head.appendChild(style);

    var NS='http://www.w3.org/2000/svg';
    function ensureMarkerLayers(){
      document.querySelectorAll('.pf-arc-svg-v73').forEach(function(svg){
        var marker=svg.querySelector('.pf-arc-marker-v73');
        if(!marker) return;

        /* Slightly larger than the base endpoint, but still compact. */
        marker.setAttribute('r','1.72');

        var halo=svg.querySelector('.pf-arc-marker-halo-v75');
        if(!halo){
          halo=document.createElementNS(NS,'circle');
          halo.setAttribute('class','pf-arc-marker-halo-v75');
          halo.setAttribute('r','3.05');
          marker.parentNode.insertBefore(halo,marker);
        }

        var core=svg.querySelector('.pf-arc-marker-core-v75');
        if(!core){
          core=document.createElementNS(NS,'circle');
          core.setAttribute('class','pf-arc-marker-core-v75');
          core.setAttribute('r','.62');
          marker.insertAdjacentElement('afterend',core);
        }
      });
    }

    function sync(){
      ensureMarkerLayers();
      document.querySelectorAll('.pf-arc-svg-v73').forEach(function(svg){
        var marker=svg.querySelector('.pf-arc-marker-v73');
        var halo=svg.querySelector('.pf-arc-marker-halo-v75');
        var core=svg.querySelector('.pf-arc-marker-core-v75');
        if(!marker) return;
        var x=marker.getAttribute('cx')||'0';
        var y=marker.getAttribute('cy')||'0';
        var hidden=marker.style.opacity==='0';
        [halo,core].forEach(function(node){
          if(!node) return;
          node.setAttribute('cx',x);
          node.setAttribute('cy',y);
          node.style.opacity=hidden?'0':'1';
        });
      });
      requestAnimationFrame(sync);
    }
    requestAnimationFrame(sync);
  }

  loadBase();
})();