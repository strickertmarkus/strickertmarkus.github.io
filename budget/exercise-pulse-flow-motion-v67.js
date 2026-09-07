(function(){
  'use strict';
  if(!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if(String(new URLSearchParams(window.location.search).get('concept')||'').toLowerCase()!=='pulse-home') return;

  function loadBase(){
    var s=document.createElement('script');
    s.src='exercise-pulse-flow-motion-v67-base-v73.js?v=79';
    s.async=false;
    s.onload=installV79;
    document.head.appendChild(s);
  }

  function installV79(){
    if(window.__exercisePulseFlowMarkerV79Installed) return;
    window.__exercisePulseFlowMarkerV79Installed=true;

    ['exercise-pulse-flow-marker-v74-style','exercise-pulse-flow-marker-v75-style','exercise-pulse-flow-marker-v76-style','exercise-pulse-flow-marker-v77-style','exercise-pulse-flow-marker-v78-style'].forEach(function(id){
      var old=document.getElementById(id);
      if(old) old.remove();
    });

    document.querySelectorAll('.pf-arc-marker-core-v74,.pf-arc-marker-core-v75,.pf-arc-marker-halo-v75,.pf-arc-marker-v76').forEach(function(node){node.remove();});
    document.querySelectorAll('radialGradient[id^="pf-endpoint-gradient-v7"]').forEach(function(node){node.remove();});
    document.querySelectorAll('.pf-arc-svg-v73').forEach(function(svg){
      svg.removeAttribute('data-pf-marker-gradient-v76');
      svg.removeAttribute('data-pf-marker-gradient-v77');
      svg.removeAttribute('data-pf-marker-gradient-v78');
    });

    var style=document.createElement('style');
    style.id='exercise-pulse-flow-marker-v79-style';
    style.textContent=`
      #session-modal.pulse-flow-v58 .pf-arc-marker-v73{
        stroke:none!important;
        filter:drop-shadow(0 0 3px rgba(var(--pf-rgb),1)) drop-shadow(0 0 9px rgba(var(--pf-rgb),.74)) drop-shadow(0 0 18px rgba(var(--pf-rgb),.34))!important;
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
        filter:drop-shadow(0 0 3px rgba(var(--pf-between-rgb),1)) drop-shadow(0 0 9px rgba(var(--pf-between-rgb),.74)) drop-shadow(0 0 18px rgba(var(--pf-between-rgb),.34))!important;
      }

      html.exercise-concept-pulse-home-v1 #session-pre-timer .pf-pre-line-dot-v62{
        width:15px!important;
        height:15px!important;
        top:.5px!important;
      }

      /* v79 owns the visible ECG. Keep the base v73 engine hidden so the two RAF loops never fight. */
      html.exercise-concept-pulse-home-v1 .pf-ecg-v73{
        display:none!important;
        visibility:hidden!important;
        opacity:0!important;
      }
      html.exercise-concept-pulse-home-v1 .pf-ecg-v79{
        display:block!important;
        position:relative!important;
        width:48px!important;
        min-width:48px!important;
        height:10px!important;
        min-height:10px!important;
        margin:5px auto 2px!important;
        flex:0 0 10px!important;
        overflow:visible!important;
        opacity:1!important;
        visibility:visible!important;
      }
      html.exercise-concept-pulse-home-v1 .pf-ecg-v79 svg{
        display:block!important;
        width:100%!important;
        height:100%!important;
        overflow:visible!important;
      }
      html.exercise-concept-pulse-home-v1 .pf-ecg-v79 .pf-ecg-base-v79,
      html.exercise-concept-pulse-home-v1 .pf-ecg-v79 .pf-ecg-sweep-a-v79,
      html.exercise-concept-pulse-home-v1 .pf-ecg-v79 .pf-ecg-sweep-b-v79{
        fill:none!important;
        stroke:currentColor!important;
        stroke-linecap:round!important;
        stroke-linejoin:round!important;
        vector-effect:non-scaling-stroke!important;
      }
      html.exercise-concept-pulse-home-v1 .pf-ecg-v79 .pf-ecg-base-v79{
        stroke-width:1.05!important;
        opacity:.24!important;
      }
      html.exercise-concept-pulse-home-v1 .pf-ecg-v79 .pf-ecg-sweep-a-v79,
      html.exercise-concept-pulse-home-v1 .pf-ecg-v79 .pf-ecg-sweep-b-v79{
        stroke-width:1.65!important;
        opacity:.92!important;
        filter:drop-shadow(0 0 1.5px currentColor) drop-shadow(0 0 4px currentColor)!important;
      }
      html.exercise-concept-pulse-home-v1 .pf-ecg-v79 .pf-ecg-marker-v79{
        fill:currentColor!important;
        stroke:none!important;
        opacity:1!important;
        filter:drop-shadow(0 0 1.5px currentColor) drop-shadow(0 0 3px currentColor)!important;
      }
      #session-countdown-ring .pf-ecg-v79{color:var(--pf-accent)!important;}
      #session-between-overlay-v2 .pf-ecg-v79{color:var(--pf-between-accent)!important;}
    `;
    document.head.appendChild(style);

    var NS='http://www.w3.org/2000/svg';
    var ECG_D='M0 5 H10 L13 3.7 L16 6.1 L20 1 L24 8 L28 4.8 H42';
    var uid=0;
    var lastSurfaceSync=0;

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
      var id=svg.getAttribute('data-pf-marker-gradient-v79');
      var gradient=id&&svg.querySelector('#'+id);
      if(gradient) return gradient;

      id='pf-endpoint-gradient-v79-'+(++uid);
      svg.setAttribute('data-pf-marker-gradient-v79',id);

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

      marker.setAttribute('r','4.5');
      marker.style.setProperty('fill','url(#'+gradient.id+')','important');
    }

    function ensureEcgV79(copy){
      if(!copy) return null;
      var signal=copy.querySelector(':scope > .pf-ecg-v79');
      if(signal) return signal;

      signal=document.createElement('span');
      signal.className='pf-ecg-v79';
      signal.setAttribute('aria-hidden','true');
      signal.innerHTML='<svg viewBox="0 0 42 9" focusable="false" aria-hidden="true">'+
        '<path class="pf-ecg-guide-v79" d="'+ECG_D+'" fill="none" stroke="none"></path>'+
        '<path class="pf-ecg-base-v79" d="'+ECG_D+'"></path>'+
        '<path class="pf-ecg-sweep-a-v79"></path>'+
        '<path class="pf-ecg-sweep-b-v79"></path>'+
        '<circle class="pf-ecg-marker-v79" cx="0" cy="5" r=".68"></circle>'+
        '</svg>';

      var label=copy.querySelector('.session-countdown-label,.bs-label');
      if(label) copy.insertBefore(signal,label);
      else copy.appendChild(signal);
      return signal;
    }

    function syncEcgSurfaces(){
      var cardio=document.querySelector('#session-countdown-ring .session-countdown-copy');
      if(cardio) ensureEcgV79(cardio);
      var overlay=document.getElementById('session-between-overlay-v2');
      var between=overlay&&overlay.querySelector('.bs-copy');
      if(between) ensureEcgV79(between);
    }

    function sampledPath(path,startLength,endLength,steps){
      if(!path||typeof path.getPointAtLength!=='function'||endLength<=startLength) return '';
      steps=Math.max(2,steps||12);
      var d='';
      for(var i=0;i<=steps;i++){
        var t=i/steps;
        var len=startLength+(endLength-startLength)*t;
        var p=path.getPointAtLength(len);
        d+=(i===0?'M':' L')+p.x.toFixed(3)+' '+p.y.toFixed(3);
      }
      return d;
    }

    function paintWrappedEcgV79(signal,now){
      var svg=signal&&signal.querySelector('svg');
      var guide=svg&&svg.querySelector('.pf-ecg-guide-v79');
      var sweepA=svg&&svg.querySelector('.pf-ecg-sweep-a-v79');
      var sweepB=svg&&svg.querySelector('.pf-ecg-sweep-b-v79');
      var marker=svg&&svg.querySelector('.pf-ecg-marker-v79');
      if(!guide||!sweepA||!sweepB||!marker||typeof guide.getTotalLength!=='function') return;

      var overlay=signal.closest('#session-between-overlay-v2');
      var isRest=!!(overlay&&String(overlay.dataset.betweenType||'rest')!=='custom');
      var cycle=isRest?2000:1000;
      var phase=(now%cycle)/cycle;
      var total=guide.getTotalLength();
      var head=total*phase;
      var span=total*.23;

      if(head>=span){
        sweepA.setAttribute('d',sampledPath(guide,head-span,head,14));
        sweepB.setAttribute('d','');
      }else{
        /* Snake-style toroidal wrap: right tail exits while left head enters at the same speed. */
        var wrappedStart=total-(span-head);
        sweepA.setAttribute('d',sampledPath(guide,wrappedStart,total,14));
        sweepB.setAttribute('d',head>0?sampledPath(guide,0,head,10):'');
      }

      var p=guide.getPointAtLength(head);
      marker.setAttribute('cx',p.x.toFixed(3));
      marker.setAttribute('cy',p.y.toFixed(3));
    }

    function sync(now){
      if(now-lastSurfaceSync>80){
        lastSurfaceSync=now;
        syncEcgSurfaces();
      }
      document.querySelectorAll('.pf-arc-svg-v73').forEach(paintMarker);
      document.querySelectorAll('.pf-ecg-v79').forEach(function(signal){paintWrappedEcgV79(signal,now);});
      requestAnimationFrame(sync);
    }
    requestAnimationFrame(sync);
  }

  loadBase();
})();