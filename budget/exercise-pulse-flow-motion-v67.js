(function(){
  'use strict';
  if(!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if(String(new URLSearchParams(window.location.search).get('concept')||'').toLowerCase()!=='pulse-home') return;

  function loadBase(){
    var s=document.createElement('script');
    s.src='exercise-pulse-flow-motion-v67-base-v73.js?v=76';
    s.async=false;
    s.onload=installV76;
    document.head.appendChild(s);
  }

  function installV76(){
    if(window.__exercisePulseFlowMarkerV76Installed) return;
    window.__exercisePulseFlowMarkerV76Installed=true;

    ['exercise-pulse-flow-marker-v74-style','exercise-pulse-flow-marker-v75-style'].forEach(function(id){
      var old=document.getElementById(id);
      if(old) old.remove();
    });
    document.querySelectorAll('.pf-arc-marker-core-v74,.pf-arc-marker-core-v75,.pf-arc-marker-halo-v75,.pf-arc-marker-v76').forEach(function(node){node.remove();});

    var style=document.createElement('style');
    style.id='exercise-pulse-flow-marker-v76-style';
    style.textContent=`
      /* Classic v69 endpoint appearance on top of the current exact SVG geometry. */
      .pf-arc-marker-v73{
        opacity:0!important;
        filter:none!important;
      }
      .pf-arc-marker-v76{
        stroke:none!important;
        pointer-events:none!important;
        opacity:1;
      }

      #session-modal.pulse-flow-v58 .pf-arc-marker-v76{
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
      #session-between-overlay-v2 .pf-arc-marker-v76{
        filter:drop-shadow(0 0 3px rgba(var(--pf-between-rgb),.96)) drop-shadow(0 0 8px rgba(var(--pf-between-rgb),.70)) drop-shadow(0 0 16px rgba(var(--pf-between-rgb),.32))!important;
      }

      /* Keep the compact 5 s marker from the previous iteration. */
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
          return {white:'#FFFFFF',soft:'#FDBA74',accent:'#FB923C',rgb:'251,146,60'};
        }
        return {white:'#FFFFFF',soft:'#CFFAFE',accent:'#22D3EE',rgb:'34,211,238'};
      }
      return {white:'#FFFFFF',soft:'#FCA5A5',accent:'#EF4444',rgb:'239,68,68'};
    }

    function ensureGradient(svg){
      var id=svg.getAttribute('data-pf-marker-gradient-v76');
      var gradient=id&&svg.querySelector('#'+id);
      if(gradient) return gradient;

      id='pf-endpoint-gradient-v76-'+(++uid);
      svg.setAttribute('data-pf-marker-gradient-v76',id);

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

    function paintGradient(svg,gradient){
      var palette=markerPalette(svg);
      gradient.querySelectorAll('stop').forEach(function(stop){
        var key=stop.getAttribute('data-pf-colour-key');
        stop.setAttribute('stop-color',palette[key]||palette.accent);
      });
    }

    function ensureMarker(svg){
      var source=svg.querySelector('.pf-arc-marker-v73');
      if(!source) return null;

      var gradient=ensureGradient(svg);
      paintGradient(svg,gradient);

      var marker=svg.querySelector('.pf-arc-marker-v76');
      if(!marker){
        marker=document.createElementNS(NS,'circle');
        marker.setAttribute('class','pf-arc-marker-v76');
        marker.setAttribute('r','2.05');
        source.insertAdjacentElement('afterend',marker);
      }
      marker.setAttribute('fill','url(#'+gradient.id+')');
      return marker;
    }

    function sync(){
      document.querySelectorAll('.pf-arc-svg-v73').forEach(function(svg){
        var source=svg.querySelector('.pf-arc-marker-v73');
        var marker=ensureMarker(svg);
        if(!source||!marker) return;

        marker.setAttribute('cx',source.getAttribute('cx')||'0');
        marker.setAttribute('cy',source.getAttribute('cy')||'0');
        marker.style.opacity=source.style.opacity==='0'?'0':'1';

        var gradient=ensureGradient(svg);
        paintGradient(svg,gradient);
      });
      requestAnimationFrame(sync);
    }
    requestAnimationFrame(sync);
  }

  loadBase();
})();