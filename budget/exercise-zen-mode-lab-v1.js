(function(){
  'use strict';

  var frame=document.getElementById('zen-lab-frame');
  if(!frame)return;
  var MODE_KEY='exercise-zen-lab-mode-v1';
  var installTimer=null;
  var progressTimer=null;
  var observer=null;

  function safeMode(win){
    try{return win.localStorage.getItem(MODE_KEY)==='zen'?'zen':'training';}
    catch(_){return 'training';}
  }

  function saveMode(win,mode){
    try{win.localStorage.setItem(MODE_KEY,mode);}catch(_){}
  }

  function addStyle(doc){
    if(doc.getElementById('exercise-zen-mode-lab-v1-style'))return;
    var style=doc.createElement('style');
    style.id='exercise-zen-mode-lab-v1-style';
    style.textContent=`
      html[data-zen-lab="true"]{--zen-train:#22D3EE;--zen-strength:#FB923C;--zen-cardio:#EF4444;--zen-stretch:#A8D67D;--zen-meditation:#B3DEEE}
      html[data-zen-lab="true"] #calm-home{display:none!important}
      .zen-mode-shell-v1{margin:0 0 24px;position:relative;isolation:isolate}
      .zen-mode-toggle-v1{width:min(430px,100%);margin:0 auto 16px;padding:4px;display:grid;grid-template-columns:1fr 1fr;gap:4px;border:1px solid rgba(148,163,184,.15);border-radius:999px;background:rgba(7,13,20,.72);box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 12px 38px rgba(0,0,0,.16);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
      .zen-mode-toggle-v1 button{position:relative;min-height:42px;border:0;border-radius:999px;background:transparent;color:#708094;font:inherit;font-size:12px;font-weight:750;letter-spacing:.2px;cursor:pointer;transition:color .5s ease,background .65s cubic-bezier(.22,1,.36,1),box-shadow .65s cubic-bezier(.22,1,.36,1),transform .35s ease}
      .zen-mode-toggle-v1 button:active{transform:scale(.985)}
      html[data-zen-mode="training"] .zen-mode-toggle-v1 [data-mode="training"]{color:#DDF9FF;background:linear-gradient(135deg,rgba(34,211,238,.18),rgba(34,211,238,.065));box-shadow:inset 0 0 0 1px rgba(34,211,238,.24),0 0 24px rgba(34,211,238,.08)}
      html[data-zen-mode="zen"] .zen-mode-toggle-v1 [data-mode="zen"]{color:#ECF7DF;background:linear-gradient(135deg,rgba(168,214,125,.18),rgba(179,222,238,.075));box-shadow:inset 0 0 0 1px rgba(168,214,125,.24),0 0 28px rgba(168,214,125,.08)}
      .zen-mode-hero-v1{position:relative;overflow:hidden;padding:22px;border:1px solid rgba(148,163,184,.12);border-radius:22px;background:linear-gradient(145deg,rgba(255,255,255,.025),rgba(255,255,255,.012));transition:border-color .8s ease,background 1s ease,box-shadow .8s ease}
      .zen-mode-hero-v1::before,.zen-mode-hero-v1::after{content:'';position:absolute;pointer-events:none;border-radius:50%;filter:blur(26px);opacity:.38;transition:background .9s ease,transform 1.2s ease}
      .zen-mode-hero-v1::before{width:240px;height:240px;left:-90px;top:-125px}
      .zen-mode-hero-v1::after{width:210px;height:210px;right:-80px;bottom:-130px}
      html[data-zen-mode="training"] .zen-mode-hero-v1{border-color:rgba(34,211,238,.14);background:radial-gradient(circle at 15% 0%,rgba(34,211,238,.07),transparent 42%),linear-gradient(145deg,#0A121B,#0A0F16);box-shadow:0 18px 50px rgba(0,0,0,.16)}
      html[data-zen-mode="training"] .zen-mode-hero-v1::before{background:rgba(34,211,238,.18)}
      html[data-zen-mode="training"] .zen-mode-hero-v1::after{background:rgba(239,68,68,.11)}
      html[data-zen-mode="zen"] .zen-mode-hero-v1{border-color:rgba(168,214,125,.18);background:radial-gradient(ellipse at 18% 2%,rgba(168,214,125,.10),transparent 42%),radial-gradient(ellipse at 92% 94%,rgba(179,222,238,.10),transparent 44%),linear-gradient(145deg,#102018,#101B20 58%,#13212B);box-shadow:0 18px 58px rgba(4,17,11,.24),inset 0 1px 0 rgba(231,249,216,.025)}
      html[data-zen-mode="zen"] .zen-mode-hero-v1::before{background:rgba(168,214,125,.20);animation:zenLabDriftA 15s ease-in-out infinite alternate}
      html[data-zen-mode="zen"] .zen-mode-hero-v1::after{background:rgba(179,222,238,.16);animation:zenLabDriftB 19s ease-in-out infinite alternate}
      @keyframes zenLabDriftA{to{transform:translate(34px,24px) scale(1.14)}}
      @keyframes zenLabDriftB{to{transform:translate(-32px,-20px) scale(1.1)}}
      .zen-mode-copy-v1{position:relative;z-index:1;max-width:680px}
      .zen-mode-eyebrow-v1{font-size:9px;font-weight:800;letter-spacing:1.7px;text-transform:uppercase;color:#718096;transition:color .6s ease}
      html[data-zen-mode="training"] .zen-mode-eyebrow-v1{color:#67E8F9}
      html[data-zen-mode="zen"] .zen-mode-eyebrow-v1{color:#C6E8A1}
      .zen-mode-title-v1{margin-top:5px;font-size:clamp(24px,5vw,38px);line-height:1.02;font-weight:650;letter-spacing:-1.2px;color:#F4F8FB}
      html[data-zen-mode="zen"] .zen-mode-title-v1{font-weight:480;color:#EDF7E7;text-shadow:0 0 24px rgba(168,214,125,.08)}
      .zen-mode-sub-v1{max-width:600px;margin-top:9px;color:#8391A2;font-size:13px;line-height:1.6}
      html[data-zen-mode="zen"] .zen-mode-sub-v1{color:#B4C7B2}
      .zen-mode-cards-v1{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:20px}
      .zen-kind-card-v1{position:relative;overflow:hidden;min-height:92px;padding:17px;border-radius:18px;border:1px solid var(--zen-card-border);background:linear-gradient(135deg,var(--zen-card-bg),rgba(255,255,255,.012));color:var(--zen-card-color);font:inherit;text-align:left;cursor:pointer;transition:transform .55s cubic-bezier(.22,1,.36,1),border-color .55s ease,box-shadow .55s ease}
      .zen-kind-card-v1:hover{transform:translateY(-3px);border-color:var(--zen-card-color);box-shadow:0 14px 34px rgba(0,0,0,.14),0 0 22px var(--zen-card-glow)}
      .zen-kind-card-v1 strong{display:block;font-size:16px;font-weight:650;color:inherit}
      .zen-kind-card-v1 small{display:block;margin-top:4px;color:#8795A4;font-size:12px;line-height:1.45}
      html[data-zen-mode="zen"] .zen-kind-card-v1 small{color:#B0C0B2}
      .zen-kind-symbol-v1{display:block;margin-bottom:8px;font-size:23px;font-weight:300;line-height:1;text-shadow:0 0 20px currentColor}
      .zen-kind-card-v1[data-kind="strength"]{--zen-card-color:#FDBA74;--zen-card-border:rgba(251,146,60,.25);--zen-card-bg:rgba(251,146,60,.09);--zen-card-glow:rgba(251,146,60,.07)}
      .zen-kind-card-v1[data-kind="cardio"]{--zen-card-color:#FCA5A5;--zen-card-border:rgba(239,68,68,.25);--zen-card-bg:rgba(239,68,68,.08);--zen-card-glow:rgba(239,68,68,.07)}
      .zen-kind-card-v1[data-kind="stretch"]{--zen-card-color:#DDF2BA;--zen-card-border:rgba(168,214,125,.25);--zen-card-bg:rgba(168,214,125,.09);--zen-card-glow:rgba(168,214,125,.08)}
      .zen-kind-card-v1[data-kind="meditation"]{--zen-card-color:#DDF7FF;--zen-card-border:rgba(179,222,238,.25);--zen-card-bg:rgba(179,222,238,.08);--zen-card-glow:rgba(179,222,238,.08)}
      .zen-all-four-v1{position:relative;z-index:1;margin-top:12px;padding-top:12px;border-top:1px solid rgba(148,163,184,.09);color:#68788A;font-size:11px;line-height:1.5}
      html[data-zen-mode="zen"] .zen-all-four-v1{color:#8EA398;border-top-color:rgba(168,214,125,.10)}
      html[data-zen-mode="zen"] body{background:radial-gradient(760px 360px at 15% -80px,rgba(168,214,125,.095),transparent 66%),radial-gradient(620px 330px at 95% 28%,rgba(179,222,238,.055),transparent 68%),#0C1412!important;transition:background 1s ease}
      html[data-zen-mode="zen"] .app-header{background:linear-gradient(180deg,rgba(10,20,16,.985),rgba(168,214,125,.035))!important;border-bottom-color:rgba(168,214,125,.16)!important;box-shadow:0 7px 28px rgba(0,0,0,.36),0 1px 26px rgba(168,214,125,.04)!important}
      html[data-zen-mode="zen"] :is(.stat-card,.goal-card,.chart-card,.pr-card,.week-day){border-color:rgba(168,214,125,.09)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.018),0 10px 28px rgba(0,0,0,.13)!important}
      html[data-zen-mode="zen"] .week-day.today{background:linear-gradient(180deg,rgba(168,214,125,.105),rgba(179,222,238,.035))!important;border-color:rgba(168,214,125,.34)!important}
      html[data-zen-mode="zen"] .section-hdr h2::before{background:#A8D67D!important;box-shadow:0 0 11px rgba(168,214,125,.28)!important}
      html[data-zen-mode="zen"] .btn-sm{color:#DDF2BA!important;border-color:rgba(168,214,125,.25)!important;background:rgba(168,214,125,.075)!important}
      html[data-zen-mode="zen"] hr.rule{background:linear-gradient(90deg,transparent,rgba(168,214,125,.14),rgba(179,222,238,.09),transparent)!important}
      .hype-progress-legend .hype-progress-dot.stretch{background:#A8D67D!important;box-shadow:0 0 7px rgba(168,214,125,.24)!important}
      .hype-progress-legend .hype-progress-dot.meditation{background:#B3DEEE!important;box-shadow:0 0 7px rgba(179,222,238,.24)!important}
      @media(max-width:600px){.zen-mode-shell-v1{margin-top:-4px}.zen-mode-hero-v1{padding:18px 14px;border-radius:19px}.zen-mode-cards-v1{gap:8px}.zen-kind-card-v1{padding:14px 12px;min-height:88px}.zen-mode-toggle-v1{margin-bottom:12px}.zen-mode-title-v1{font-size:27px}.zen-mode-sub-v1{font-size:12px}}
      @media(prefers-reduced-motion:reduce){.zen-mode-hero-v1::before,.zen-mode-hero-v1::after{animation:none!important}.zen-mode-toggle-v1 button,.zen-kind-card-v1,.zen-mode-hero-v1{transition:none!important}}
    `;
    doc.head.appendChild(style);
  }

  function quickBuilder(doc,win,kind){
    try{
      var iso=win.todayISO();
      win.openDayWorkoutBuilder(win.dayLabelFromISO(iso),iso);
      win.setTimeout(function(){
        var list=doc.getElementById('day-workout-ex-list');
        if(!list)return;
        var rows=Array.prototype.slice.call(list.querySelectorAll('.ex-row-item'));
        var untouched=rows.length===1&&!(rows[0].querySelector('.dw-name')||{}).value;
        if(kind==='stretch'||kind==='meditation'){
          if(untouched&&win.ExerciseCalm&&typeof win.ExerciseCalm.add==='function')win.ExerciseCalm.add(kind);
        }else if(untouched){
          var buttons=Array.prototype.slice.call(rows[0].querySelectorAll('.ex-kind-btn'));
          var wanted=buttons.find(function(btn){return String(btn.textContent||'').trim().toLowerCase()===(kind==='strength'?'styrka':'kondition');});
          if(wanted)wanted.click();
          var type=doc.getElementById('day-workout-type');
          if(type)type.value=kind==='strength'?'Styrka':'Kondition';
        }
      },20);
    }catch(_){ }
  }

  function cardMarkup(kind,title,copy,symbol){
    return '<button type="button" class="zen-kind-card-v1" data-kind="'+kind+'"><span class="zen-kind-symbol-v1" aria-hidden="true">'+symbol+'</span><strong>'+title+'</strong><small>'+copy+'</small></button>';
  }

  function renderHero(doc,mode){
    var hero=doc.getElementById('zen-mode-hero-v1');
    if(!hero)return;
    if(mode==='zen'){
      hero.innerHTML='<div class="zen-mode-copy-v1"><div class="zen-mode-eyebrow-v1">ZEN MODE</div><div class="zen-mode-title-v1">Återhämtning i Pulse Flow</div><div class="zen-mode-sub-v1">Stretch och meditation får ett mjukare visuellt språk med skogsljus, långsamma vågor och lugnare rörelse. Samma passmotor ligger under ytan.</div></div><div class="zen-mode-cards-v1">'+cardMarkup('stretch','Stretch','Rörlighet, mjuk guidning och tid.','✧')+cardMarkup('meditation','Meditation','Stillhet, ljus och valbar andningsrytm.','≈')+'</div><div class="zen-all-four-v1">Passbyggaren är fortfarande gemensam. Du kan blanda Styrka, Kondition, Stretch och Meditation i vilken ordning du vill.</div>';
    }else{
      hero.innerHTML='<div class="zen-mode-copy-v1"><div class="zen-mode-eyebrow-v1">TRÄNING</div><div class="zen-mode-title-v1">Pulse Flow</div><div class="zen-mode-sub-v1">Det vanliga träningsläget med styrka och kondition som primära ingångar. Intensitet, timer och progress behåller det aktiva Pulse Flow-språket.</div></div><div class="zen-mode-cards-v1">'+cardMarkup('strength','Styrka','Bygg set, reps, vikt och återhämtning.','◆')+cardMarkup('cardio','Kondition','Tid, distans och det röda pulstemat.','⌁')+'</div><div class="zen-all-four-v1">Även här kan passbyggaren innehålla Stretch och Meditation före, mellan eller efter träningsmomenten.</div>';
    }
    Array.prototype.slice.call(hero.querySelectorAll('[data-kind]')).forEach(function(button){button.addEventListener('click',function(){quickBuilder(doc,frame.contentWindow,button.getAttribute('data-kind'));});});
  }

  function setMode(doc,win,mode){
    mode=mode==='zen'?'zen':'training';
    doc.documentElement.setAttribute('data-zen-mode',mode);
    saveMode(win,mode);
    var toggle=doc.getElementById('zen-mode-toggle-v1');
    if(toggle){
      Array.prototype.slice.call(toggle.querySelectorAll('button')).forEach(function(btn){var active=btn.getAttribute('data-mode')===mode;btn.setAttribute('aria-pressed',active?'true':'false');});
    }
    renderHero(doc,mode);
  }

  function installModeUi(doc,win){
    if(doc.getElementById('zen-mode-shell-v1'))return true;
    var main=doc.querySelector('.main-content');
    if(!main)return false;
    var shell=doc.createElement('section');
    shell.id='zen-mode-shell-v1';
    shell.className='zen-mode-shell-v1';
    shell.innerHTML='<div class="zen-mode-toggle-v1" id="zen-mode-toggle-v1" role="group" aria-label="Välj startsideläge"><button type="button" data-mode="training" aria-pressed="false">Träning</button><button type="button" data-mode="zen" aria-pressed="false">Zen mode</button></div><div class="zen-mode-hero-v1" id="zen-mode-hero-v1"></div>';
    main.insertBefore(shell,main.firstChild);
    shell.querySelector('[data-mode="training"]').addEventListener('click',function(){setMode(doc,win,'training');});
    shell.querySelector('[data-mode="zen"]').addEventListener('click',function(){setMode(doc,win,'zen');});
    setMode(doc,win,safeMode(win));
    return true;
  }

  function progressKinds(win){
    try{
      var state=win.sessionState;
      var api=win.__exerciseProgressConsistencyV10;
      if(state&&api&&typeof api.calculate==='function'){
        var result=api.calculate(state);
        if(result&&Array.isArray(result.segments))return result.segments.map(function(item){return item&&item.kind||'strength';});
      }
    }catch(_){}
    return [];
  }

  function fixProgress(doc,win){
    var legend=doc.querySelector('#hype-workout-progress .hype-progress-legend');
    if(legend){
      if(!legend.querySelector('[data-zen-legend="stretch"]')){
        var stretch=doc.createElement('span');stretch.className='hype-progress-key';stretch.setAttribute('data-zen-legend','stretch');stretch.innerHTML='<span class="hype-progress-dot stretch"></span>Stretch';legend.appendChild(stretch);
      }
      if(!legend.querySelector('[data-zen-legend="meditation"]')){
        var meditation=doc.createElement('span');meditation.className='hype-progress-key';meditation.setAttribute('data-zen-legend','meditation');meditation.innerHTML='<span class="hype-progress-dot meditation"></span>Meditation';legend.appendChild(meditation);
      }
    }
    var track=doc.getElementById('hype-progress-track');
    if(!track)return;
    var nodes=Array.prototype.slice.call(track.children);
    var kinds=progressKinds(win);
    nodes.forEach(function(node,index){
      var kind=kinds[index]||node.getAttribute('data-pf-kind-v98')||'';
      if(['strength','cardio','stretch','meditation'].indexOf(kind)===-1)return;
      ['strength','cardio','stretch','meditation'].forEach(function(name){node.classList.toggle(name,name===kind);});
    });
  }

  function installProgressFix(doc,win){
    if(progressTimer)win.clearInterval(progressTimer);
    progressTimer=win.setInterval(function(){fixProgress(doc,win);},240);
    if(observer)observer.disconnect();
    observer=new win.MutationObserver(function(){fixProgress(doc,win);});
    var root=doc.body;
    if(root)observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-pf-kind-v98']});
    fixProgress(doc,win);
  }

  function install(){
    var win,doc;
    try{win=frame.contentWindow;doc=frame.contentDocument;}catch(_){return;}
    if(!win||!doc||!doc.documentElement)return;
    doc.documentElement.setAttribute('data-zen-lab','true');
    addStyle(doc);
    var tries=0;
    if(installTimer)win.clearInterval(installTimer);
    installTimer=win.setInterval(function(){
      tries++;
      if(installModeUi(doc,win)||tries>100){win.clearInterval(installTimer);installTimer=null;}
      fixProgress(doc,win);
    },80);
    installProgressFix(doc,win);
    document.body.classList.add('ready');
  }

  frame.addEventListener('load',install);
  if(frame.contentDocument&&frame.contentDocument.readyState!=='loading')install();
})();
