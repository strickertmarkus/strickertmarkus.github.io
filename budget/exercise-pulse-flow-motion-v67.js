(function(){
  'use strict';
  if(!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if(String(new URLSearchParams(window.location.search).get('concept')||'').toLowerCase()!=='pulse-home') return;

  function loadBase(){
    var s=document.createElement('script');
    s.src='exercise-pulse-flow-motion-v67-base-v73.js?v=74';
    s.async=false;
    s.onload=installV74;
    document.head.appendChild(s);
  }

  function installV74(){
    if(window.__exercisePulseFlowMarkerV74Installed) return;
    window.__exercisePulseFlowMarkerV74Installed=true;

    var style=document.createElement('style');
    style.id='exercise-pulse-flow-marker-v74-style';
    style.textContent=`
      /* Endpoint marker = same visual language as active Passflöde point. */
      #session-modal.pulse-flow-v58 .pf-arc-marker-v73{
        fill:var(--pf-accent)!important;
        stroke:none!important;
        filter:drop-shadow(0 0 2px var(--pf-accent)) drop-shadow(0 0 6px rgba(var(--pf-rgb),.96)) drop-shadow(0 0 13px rgba(var(--pf-rgb),.52))!important;
      }
      #session-modal.pulse-flow-v58 .pf-arc-marker-core-v74{
        fill:#FFE4E6!important;
        stroke:none!important;
        opacity:.96!important;
        filter:drop-shadow(0 0 2px rgba(255,228,230,.88))!important;
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
      #session-between-overlay-v2 .pf-arc-marker-v73{
        fill:var(--pf-between-accent)!important;
        stroke:none!important;
        filter:drop-shadow(0 0 2px var(--pf-between-accent)) drop-shadow(0 0 6px rgba(var(--pf-between-rgb),.96)) drop-shadow(0 0 13px rgba(var(--pf-between-rgb),.52))!important;
      }
      #session-between-overlay-v2 .pf-arc-marker-core-v74{
        fill:var(--pf-between-core)!important;
        stroke:none!important;
        opacity:.96!important;
        filter:drop-shadow(0 0 2px var(--pf-between-core))!important;
      }
    `;
    document.head.appendChild(style);

    var NS='http://www.w3.org/2000/svg';
    function ensureCores(){
      document.querySelectorAll('.pf-arc-svg-v73').forEach(function(svg){
        var marker=svg.querySelector('.pf-arc-marker-v73');
        if(!marker) return;
        var core=svg.querySelector('.pf-arc-marker-core-v74');
        if(!core){
          core=document.createElementNS(NS,'circle');
          core.setAttribute('class','pf-arc-marker-core-v74');
          core.setAttribute('r','.52');
          marker.insertAdjacentElement('afterend',core);
        }
      });
    }

    function sync(){
      ensureCores();
      document.querySelectorAll('.pf-arc-svg-v73').forEach(function(svg){
        var marker=svg.querySelector('.pf-arc-marker-v73');
        var core=svg.querySelector('.pf-arc-marker-core-v74');
        if(!marker||!core) return;
        core.setAttribute('cx',marker.getAttribute('cx')||'0');
        core.setAttribute('cy',marker.getAttribute('cy')||'0');
        core.style.opacity=marker.style.opacity==='0'?'0':'1';
      });
      requestAnimationFrame(sync);
    }
    requestAnimationFrame(sync);
  }

  loadBase();
})();