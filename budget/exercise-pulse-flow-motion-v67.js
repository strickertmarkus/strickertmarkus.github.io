(function(){
  'use strict';
  if(!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if(String(new URLSearchParams(window.location.search).get('concept')||'').toLowerCase()!=='pulse-home') return;

  function loadBase(){
    var s=document.createElement('script');
    s.src='exercise-pulse-flow-motion-v67-base-v73.js?v=78';
    s.async=false;
    s.onload=installV78;
    document.head.appendChild(s);
  }

  function installV78(){
    if(window.__exercisePulseFlowMarkerV78Installed) return;
    window.__exercisePulseFlowMarkerV78Installed=true;

    ['exercise-pulse-flow-marker-v74-style','exercise-pulse-flow-marker-v75-style','exercise-pulse-flow-marker-v76-style','exercise-pulse-flow-marker-v77-style'].forEach(function(id){
      var old=document.getElementById(id);
      if(old) old.remove();
    });

    /* Remove every historical extra endpoint layer. v78 uses the base v73 circle only. */
    document.querySelectorAll('.pf-arc-marker-core-v74,.pf-arc-marker-core-v75,.pf-arc-marker-halo-v75,.pf-arc-marker-v76').forEach(function(node){node.remove();});
    document.querySelectorAll('radialGradient[id^="pf-endpoint-gradient-v7"]').forEach(function(node){node.remove();});
    document.querySelectorAll('.pf-arc-svg-v73').forEach(function(svg){
      svg.removeAttribute('data-pf-marker-gradient-v76');
      svg.removeAttribute('data-pf-marker-gradient-v77');
    });

    var style=document.createElement('style');
    style.id='exercise-pulse-flow-marker-v78-style';
    style.textContent=`
      /* Single classic Pulse Flow endpoint marker on the exact current arc geometry. */
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

      /* Keep the compact 5 s marker. */
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
      /* Cardio / conditioning timer. */
      return {white:'#FFFFFF',soft:'#FCA5A5',accent:'#EF4444'};
    }

    function ensureGradient(svg){
      var id=svg.getAttribute('data-pf-marker-gradient-v78');
      var gradient=id&&svg.querySelector('#'+id);
      if(gradient) return gradient;

      id='pf-endpoint-gradient-v78-'+(++uid);
      svg.setAttribute('data-pf-marker-gradient-v78',id);

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

      /* About +2 px diameter compared with v77 on the rendered timer. */
      marker.setAttribute('r','3.75');
      marker.style.setProperty('fill','url(#'+gradient.id+')','important');
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

    function paintWrappedEcg(signal,now){
      var svg=signal&&signal.querySelector('svg');
      var guide=svg&&svg.querySelector('.pf-ecg-guide-v73');
      var sweep=svg&&svg.querySelector('.pf-ecg-sweep-v73');
      var marker=svg&&svg.querySelector('.pf-ecg-marker-v73');
      if(!guide||!sweep||!marker||typeof guide.getTotalLength!=='function') return;

      var overlay=signal.closest('#session-between-overlay-v2');
      var isRest=!!(overlay&&String(overlay.dataset.betweenType||'rest')!=='custom');
      var cycle=isRest?2000:1000;
      var phase=(now%cycle)/cycle;
      var total=guide.getTotalLength();
      var head=total*phase;
      var span=total*.23;
      var d='';

      if(head>=span){
        d=sampledPath(guide,head-span,head,12);
      }else{
        /* Seamless wrap: tail remains at the right while the head continues at the left. */
        var wrappedStart=total-(span-head);
        var rightPart=sampledPath(guide,wrappedStart,total,12);
        var leftPart=head>0?sampledPath(guide,0,head,8):'';
        d=rightPart+(rightPart&&leftPart?' ':'')+leftPart;
      }

      sweep.setAttribute('d',d);
      var p=guide.getPointAtLength(head);
      marker.setAttribute('cx',p.x.toFixed(3));
      marker.setAttribute('cy',p.y.toFixed(3));
    }

    function sync(now){
      document.querySelectorAll('.pf-arc-svg-v73').forEach(paintMarker);
      document.querySelectorAll('.pf-ecg-v73').forEach(function(signal){paintWrappedEcg(signal,now);});
      requestAnimationFrame(sync);
    }
    requestAnimationFrame(sync);
  }

  loadBase();
})();