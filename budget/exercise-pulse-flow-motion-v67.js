(function(){
  'use strict';
  if(!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if(String(new URLSearchParams(window.location.search).get('concept')||'').toLowerCase()!=='pulse-home') return;

  function loadBase(){
    var s=document.createElement('script');
    s.src='exercise-pulse-flow-motion-v67-base-v73.js?v=77';
    s.async=false;
    s.onload=installV77;
    document.head.appendChild(s);
  }

  function installV77(){
    if(window.__exercisePulseFlowMarkerV77Installed) return;
    window.__exercisePulseFlowMarkerV77Installed=true;

    ['exercise-pulse-flow-marker-v74-style','exercise-pulse-flow-marker-v75-style','exercise-pulse-flow-marker-v76-style'].forEach(function(id){
      var old=document.getElementById(id);
      if(old) old.remove();
    });

    document.querySelectorAll('.pf-arc-marker-core-v74,.pf-arc-marker-core-v75,.pf-arc-marker-halo-v75,.pf-arc-marker-v76').forEach(function(node){node.remove();});
    document.querySelectorAll('radialGradient[id^="pf-endpoint-gradient-v7"]').forEach(function(node){node.remove();});
    document.querySelectorAll('.pf-arc-svg-v73').forEach(function(svg){
      svg.removeAttribute('data-pf-marker-gradient-v76');
    });

    var style=document.createElement('style');
    style.id='exercise-pulse-flow-marker-v77-style';
    style.textContent=`
      /* One endpoint marker only: classic v69 appearance, current exact geometry. */
      #session-modal.pulse-flow-v58 .pf-arc-marker-v73{
        stroke:none!important;
        filter:drop-shadow(0 0 3px rgba(var(--pf-rgb),.96)) drop-shadow(0 0 8px rgba(var(--pf-rgb),.70)) drop-shadow(0 0 16px rgba(var(--pf-rgb),.32))!important;
      }

      #session-between-overlay-v2{
        --pf-between-accent:#22D3EE;
        --pf-between-soft:#CFFAFE;
        --pf-between-rgb:34,211,238;
      }
      #session-between-overlay-v2[data-between-type="custom"]{
        --pf-between-accent:#FB923C;
        --pf-between-soft:#FDBA74;
        --pf-between-rgb:251,146,60;
      }
      #session-between-overlay-v2 .pf-arc-marker-v73{
        stroke:none!important;
        filter:drop-shadow(0 0 3px rgba(var(--pf-between-rgb),.96)) drop-shadow(0 0 8px rgba(var(--pf-between-rgb),.70)) drop-shadow(0 0 16px rgba(var(--pf-between-rgb),.32))!important;
      }

      html.exercise-concept-pulse-home-v1 #session-pre-timer .pf-pre-line-dot-v62{
        width:15px!important;
        height:15px!important;
        top:.5px!important;
      }
    `;
    document.head.appendChild(style);

    var NS='http://www.w3.org/2000/svg';
    var uid=0;

    function markerPalette(svg){
      var overlay=svg.closest('#session-between-overlay-v2');
      if(overlay){
        if(String(overlay.dataset.betweenType||'rest')==='custom'){
          return {white:'#FFFFFF',soft:'#FDBA74',accent:'#FB923C'};
        }
        return {white:'#FFFFFF',soft:'#CFFAFE',accent:'#22D3EE'};
      }
      return {white:'#FFFFFF',soft:'#FCA5A5',accent:'#EF4444'};
    }

    function ensureGradient(svg){
      var id=svg.getAttribute('data-pf-marker-gradient-v77');
      var gradient=id&&svg.querySelector('#'+id);
      if(gradient) return gradient;

      id='pf-endpoint-gradient-v77-'+(++uid);
      svg.setAttribute('data-pf-marker-gradient-v77',id);

      var defs=svg.querySelector(':scope > defs');
      if(!defs){
        defs=document.createElementNS(NS,'defs');
        svg.insertBefore(defs,svg.firstChild);
      }

      gradient=document.createElementNS(NS,'radialGradient');
      gradient.setAttribute('id',id);
      gradient.setAttribute('cx','50%');
      gradient.setAttribute('cy','50%');
      gradient.setAttribute('r','50%');

      [
        ['0%','white','1'],
        ['8%','white','1'],
        ['20%','soft','1'],
        ['43%','accent','1'],
        ['68%','accent','.42'],
        ['100%','accent','0']
      ].forEach(function(spec){
        var stop=document.createElementNS(NS,'stop');
        stop.setAttribute('offset',spec[0]);
        stop.setAttribute('data-pf-colour-key',spec[1]);
        stop.setAttribute('stop-opacity',spec[2]);
        gradient.appendChild(stop);
      });
      defs.appendChild(gradient);
      return gradient;
    }

    function paintMarker(svg){
      var marker=svg.querySelector('.pf-arc-marker-v73');
      if(!marker) return;

      var gradient=ensureGradient(svg);
      var palette=markerPalette(svg);
      gradient.querySelectorAll('stop').forEach(function(stop){
        var key=stop.getAttribute('data-pf-colour-key');
        stop.setAttribute('stop-color',palette[key]||palette.accent);
      });

      /* Match the old ~9 px visual marker size on the current ring. */
      marker.setAttribute('r','3.0');
      marker.style.setProperty('fill','url(#'+gradient.id+')','important');
    }

    function sync(){
      document.querySelectorAll('.pf-arc-svg-v73').forEach(paintMarker);
      requestAnimationFrame(sync);
    }
    requestAnimationFrame(sync);
  }

  loadBase();
})();