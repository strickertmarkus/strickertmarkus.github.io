(function(){
  'use strict';
  const M=window.ZenModel,S=window.ZenStore,$=id=>document.getElementById(id);
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const id=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID():'zen_'+Date.now()+'_'+Math.random().toString(36).slice(2);
  const fmt=seconds=>{const n=Math.max(0,Math.ceil(seconds));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');};
  const mins=seconds=>Number((seconds/60).toFixed(1)).toLocaleString('sv-SE');
  const prefKey='zen_preferences_'+S.profile;
  let prefs={};try{prefs=JSON.parse(localStorage.getItem(prefKey)||'{}');}catch(_){}
  if(!prefs||typeof prefs!=='object')prefs={};
  const routeKind=new URLSearchParams(location.search).get('wellness');
  let kind=routeKind==='stretch'||routeKind==='meditation'?routeKind:prefs.kind==='meditation'?'meditation':'stretch',selected={stretch:typeof prefs.selected?.stretch==='string'?prefs.selected.stretch:'forest',meditation:typeof prefs.selected?.meditation==='string'?prefs.selected.meditation:'water'},view='home',session=null,pendingRecord=null,builder=null,builderExisting=false,allHistory=false,sound=prefs.sound===true,audioContext=null,toastTimer,lastStep=-1,lastPhase='',confirmAction=null,readyOnce=false,editingHistoryId=null,editingHistoryVersion=0,expandedHistory=new Set(),expandedRoutines=new Set(),builderOrigin='',statsRange='week';
  let tempMinutes=0; // temporary meditation length in minutes, 0 = the template length
  var requestedRoutine=new URLSearchParams(location.search).get('routine');
  // Built-in or own pass from a plan; own passes resolve once the store is ready (chosen() falls back until then).
  var requested=M.routines.find(r=>r.id===requestedRoutine&&r.kind===kind);if(requested)selected[kind]=requested.id;else if(requestedRoutine&&/^[A-Za-z0-9_-]{1,100}$/.test(requestedRoutine))selected[kind]=requestedRoutine;
  // A planned day with several passes: the next ones come after this one is saved.
  let queue=(new URLSearchParams(location.search).get('then')||'').split(',').filter(Boolean);
  // Started from the training page: the pass begins right away, with the "get ready" countdown.
  let autostart=new URLSearchParams(location.search).get('autostart')==='1';
  // Dialog scroll lock and focus return live in ui-motion.js (SurfaceMotion.showDialog).
  // D01: whose history this is, quietly beside the area name (?user=maja selects Maja).
  const profileName=S.profile==='maja'?'Maja':'Markus';
  const copy={
    stretch:{eyebrow:'RÖRLIGHET',title:'Stretch',description:'Välj ett pass för hela kroppen eller fokusera på ett område.',symbol:'✧',hint:'Välj en mall efter ditt träningspass eller bygg ditt eget.',growth:'Statistik',growthEyebrow:'ÖVERSIKT',collection:'Milstolpar',home:'← Till startsidan'},
    meditation:{eyebrow:'ANDNING & FOKUS',title:'Meditation',description:'Välj längd och meditera med andningsguide eller i egen takt.',symbol:'≈',hint:'Tiden fortsätter om skärmen släcks, men ljud spelas bara när sidan är öppen.',growth:'Statistik',growthEyebrow:'ÖVERSIKT',collection:'Milstolpar',home:'← Till startsidan'}
  };
  let volume=Number.isFinite(prefs.volume)?Math.max(0,Math.min(100,prefs.volume)):100,prepare=prefs.prepare!==false,ending=false,breathOffset=0;
  const TRANSITION_SECONDS=7,TRANSITION_NOTES=[440,523.25,587.33,659.25,783.99,880,1046.5];
  let transitionCue=null;
  let switchSeconds=[3,5,10].includes(prefs.switchSeconds)?prefs.switchSeconds:0,autoPaused=false;
  let ambient=['rain','sea','wind'].includes(prefs.ambient)?prefs.ambient:'',intervalMinutes=[1,2,5,10].includes(prefs.interval)?prefs.interval:0,ambientNodes=null,lastIntervalMark=-1;
  function savePrefs(){prefs={kind,sound,volume,prepare,selected,ambient,interval:intervalMinutes,switchSeconds};try{localStorage.setItem(prefKey,JSON.stringify(prefs));}catch(_){} }
  function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
  function routines(){return [...M.routines,...S.entries.filter(e=>e.type==='routine').map(e=>e.routine)];}
  function chosen(){return routines().find(r=>r.id===selected[kind]&&r.kind===kind)||M.routines.find(r=>r.kind===kind);}
  function records(){return S.entries.filter(e=>e.type==='session');}
  function syncViewTheme(){
    const color=kind==='stretch'?'#071c1b':view==='session'?'#081f23':'#a8c5be';
    if(kind==='meditation'&&view==='session')document.documentElement.style.setProperty('--zen-session-edge-color',color);
    else document.documentElement.style.removeProperty('--zen-session-edge-color');
    document.documentElement.style.backgroundColor=color;
    document.querySelector('meta[name=theme-color]').content=color;
  }
  function applyKind(next){
    kind=next;allHistory=false;document.body.dataset.kind=kind;
    syncViewTheme();
    if(/\/zen\.html$/.test(location.pathname)){
      var route=new URL(location.href);
      if(route.searchParams.get('wellness')!==kind){route.searchParams.set('wellness',kind);history.replaceState(history.state,'',route.href);}
    }const c=copy[kind];
    $('hero-eyebrow').textContent=c.eyebrow+' · '+profileName.toLocaleUpperCase('sv-SE');$('hero-title').innerHTML=c.title;$('hero-description').innerHTML=c.description;$('selected-symbol').textContent=c.symbol;$('start-hint').textContent=c.hint;$('growth-title').textContent=c.growth;$('growth-eyebrow').textContent=c.growthEyebrow;$('collection-title').textContent=c.collection;$('leave-session').textContent=c.home;
    document.querySelectorAll('.kind-switch button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kind===kind)));savePrefs();renderHome();
  }
  let kindMotionTimer=0,kindMotionToken=0;
  function setKind(next){tempMinutes=0;
    const token=++kindMotionToken;clearTimeout(kindMotionTimer);
    next=next==='meditation'?'meditation':'stretch';
    const changed=next!==kind,home=$('home-view');
    const animate=!!(changed&&view==='home'&&home);
    if(home)home.classList.remove('zen-kind-surface-enter');
    applyKind(next);
    if(!animate)return;
    home.style.visibility='';
    const motionReduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if(motionReduced)return;
    requestAnimationFrame(()=>{
      if(token!==kindMotionToken)return;
      home.classList.add('zen-kind-surface-enter');
      kindMotionTimer=setTimeout(()=>home.classList.remove('zen-kind-surface-enter'),200);
    });
  }
  const isBuiltin=r=>M.routines.some(p=>p.id===r.id);
  const passSymbols=()=>kind==='stretch'?['✧','⌁','⋮']:['≈','◌','○'];
  // One compact row per pass: name, time and count, a start button; it opens to show its exercises.
  function passRow(r,i){
    const own=!isBuiltin(r),open=expandedRoutines.has(r.id),current=r.id===chosen().id,minutes=mins(M.duration(r));
    const meta=minutes+' min · '+(r.kind==='stretch'?r.steps.length+' övningar':r.guidance==='breath'?'andningsguide':'utan guide')+(own?' · egen':'');
    const detail=r.kind==='stretch'
      ?'<ol class="pass-steps">'+r.steps.map(step=>'<li><span>'+escape(step.name)+'</span><small>'+fmt(step.seconds)+'</small></li>').join('')+'</ol>'
      :'<p class="pass-summary">'+escape(r.description||M.breathingSummary(r))+'</p>';
    return '<article class="pass-row'+(current?' is-current':'')+(open?' is-open':'')+'"><div class="pass-main">'+
      '<button type="button" class="pass-toggle" data-expand="'+escape(r.id)+'" aria-expanded="'+open+'">'+
      '<span class="pass-glyph" aria-hidden="true">'+passSymbols()[i%3]+'</span><span class="pass-text"><strong>'+escape(r.name)+'</strong><small>'+escape(meta)+'</small></span>'+
      '<svg class="pass-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 10l4 4 4-4"/></svg></button>'+
      '<button type="button" class="pass-play" data-play="'+escape(r.id)+'" aria-label="Starta '+escape(r.name)+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7l8 5-8 5z"/></svg></button></div>'+
      '<div class="pass-detail"'+(open?'':' hidden')+'>'+detail+
      '<div class="pass-tools">'+(current?'<span class="pass-chosen">Startpass</span>':'<button type="button" class="text-button pass-choose" data-choose="'+escape(r.id)+'">Välj som startpass</button>')+'<button type="button" class="text-button" data-edit="'+escape(r.id)+'">'+(own?'Redigera':'Anpassa som egen')+'</button>'+(own?'<button type="button" class="text-button" data-remove="'+escape(r.id)+'">Ta bort</button>':'')+'</div></div></article>';
  }
  /* The pass menu: every template, filtered by training category and searchable by pass or exercise name. */
  const LIBRARY_GROUPS=[['all','Alla'],['base','Baspass'],['chest','Bröst + Triceps'],['back','Biceps + Rygg'],['legs','Axlar + Mage + Ben'],['cardio','Kondition'],['own','Mina egna']];
  let libraryGroup='all',libraryLength='all';
  // S02: length from the pass's actual content (ZenModel.duration), never from its name.
  const LIBRARY_LENGTHS=[['all','Alla längder',()=>true],['short','Högst 5 min',s=>s<=300],['mid','6–10 min',s=>s>300&&s<=600],['long','Över 10 min',s=>s>600]];
  function libraryGroupOf(r){return isBuiltin(r)?(r.category||'base'):'own';}
  function renderLibrary(){
    const all=routines().filter(r=>r.kind===kind),query=$('library-search').value.trim().toLocaleLowerCase('sv-SE');
    const groups=kind==='stretch'?LIBRARY_GROUPS:[['all','Alla'],['own','Mina egna']];
    if(!groups.some(g=>g[0]===libraryGroup))libraryGroup='all';
    $('library-title').textContent=kind==='stretch'?'Stretchpass':'Meditationer';
    $('library-groups').innerHTML=groups.map(([id,label])=>{const n=id==='all'?all.length:all.filter(r=>kind==='stretch'?libraryGroupOf(r)===id:(id==='own')!==isBuiltin(r)).length;return '<button type="button" class="library-chip" data-group="'+id+'" aria-pressed="'+(libraryGroup===id)+'">'+label+' <small>'+n+'</small></button>';}).join('');
    const match=r=>!query||(r.name+' '+(r.description||'')+' '+(r.steps||[]).map(x=>x.name).join(' ')).toLocaleLowerCase('sv-SE').includes(query);
    const inGroup=r=>libraryGroup==='all'||(kind==='stretch'?libraryGroupOf(r)===libraryGroup:(libraryGroup==='own')!==isBuiltin(r));
    const fits=LIBRARY_LENGTHS.find(l=>l[0]===libraryLength)[2],list=all.filter(r=>inGroup(r)&&match(r)&&fits(M.duration(r)));
    $('library-length').innerHTML=LIBRARY_LENGTHS.map(([id,label,test])=>'<button type="button" class="library-chip" data-length="'+id+'" aria-pressed="'+(libraryLength===id)+'">'+label+(id==='all'?'':' <small>'+all.filter(r=>inGroup(r)&&match(r)&&test(M.duration(r))).length+'</small>')+'</button>').join('');
    let html='';
    if(libraryGroup==='all'&&kind==='stretch'&&!query&&libraryLength==='all'){
      for(const [id,label] of LIBRARY_GROUPS.slice(1)){const part=list.filter(r=>libraryGroupOf(r)===id);if(part.length)html+='<h3 class="library-heading">'+label+'</h3>'+part.map((r,i)=>passRow(r,i)).join('');}
    }else html=list.map((r,i)=>passRow(r,i)).join('');
    const filtered=query||libraryLength!=='all'||libraryGroup!=='all';
    $('library-list').innerHTML=html||(libraryGroup==='own'&&!all.some(r=>!isBuiltin(r))?'<p class="history-empty">Inga egna mallar ännu. Skapa ett pass eller anpassa en färdig mall.</p>'
      :'<p class="history-empty">Inga pass matchar valen.'+(filtered?' <button type="button" class="text-button" data-library-reset="1">Visa alla pass</button>':'')+'</p>');
  }
  function openLibrary(){renderLibrary();SurfaceMotion.showDialog($('library-dialog'));$('library-title').focus({preventScroll:true});}
  // Meditation length for this session only; the template itself is never changed.
  function renderMediLength(r){
    const box=$('medi-length');if(!box)return;box.hidden=r.kind!=='meditation';if(box.hidden)return;
    const own=Math.round(M.duration(r)/60),current=tempMinutes||own,options=[...new Set([5,10,15,20,own])].sort((a,b)=>a-b);
    box.innerHTML=options.map(m=>'<button type="button" data-medi-min="'+m+'" aria-pressed="'+(m===current)+'" aria-label="'+m+' minuter">'+m+'</button>').join('');
  }
  function renderHome(){
    const r=chosen();renderMediLength(r);$('selected-name').textContent=r.name;$('selected-meta').textContent=mins(tempMinutes&&r.kind==='meditation'?tempMinutes*60:M.duration(r))+' min · '+(kind==='stretch'?r.steps.length+' övningar':r.guidance==='breath'?'andningsguide':'utan guide');
    document.querySelector('.start-ring-symbol').textContent=copy[kind].symbol;
    document.querySelector('.start-ring-name').textContent=r.name;
    document.querySelector('.start-ring-meta').textContent=$('selected-meta').textContent;
    $('start-button').setAttribute('aria-label','Starta '+r.name+', '+$('selected-meta').textContent);
    const symbols=kind==='stretch'?['✧','⌁','⋮']:['≈','◌','○'];
    // Start page: only the chosen pass and a few recently used ones; every pass lives in the pass menu.
    const all=routines().filter(r=>r.kind===kind),recentNames=[...new Set(records().filter(e=>e.kind===kind).sort((a,b)=>b.completedAt-a.completedAt).map(e=>e.name))];
    const shortlist=[chosen()];
    for(const name of recentNames){const r=all.find(x=>x.name===name);if(r&&!shortlist.includes(r))shortlist.push(r);if(shortlist.length>=4)break;}
    for(const r of all.filter(r=>!isBuiltin(r)))if(shortlist.length<4&&!shortlist.includes(r))shortlist.push(r);
    $('routines').innerHTML='<p class="pass-count">'+(recentNames.length?'Valt och senast använda':'Valt pass')+'</p>'+shortlist.map((r,i)=>passRow(r,i)).join('');
    $('open-library').textContent='Alla pass · '+all.length;
    if($('library-dialog').open)renderLibrary();

    // Statistics for the chosen period: this week (days), this month (days) or this year (months).
    const now=Date.now(),st=M.stats(records(),kind,now),bars=M.period(records(),kind,now,statsRange),total=bars.reduce((n,d)=>n+d.minutes,0);
    const periodWord={week:'denna vecka',month:'denna månad',year:'i år'}[statsRange];
    $('period-scope').textContent={week:'Denna vecka',month:'Denna månad',year:'I år'}[statsRange];$('muscle-groups-title').textContent='Mest stretchat '+periodWord;
    $('weekly-minutes').innerHTML=escape(Number(total.toFixed(1)).toLocaleString('sv-SE'))+'<small>minuter</small>';$('weekly-copy').textContent=total?'Sammanlagd tid '+periodWord+'.':'Inga pass sparade '+periodWord+'.';
    $('total-minutes').textContent=st.minutes;$('total-sessions').textContent=st.count;$('streak-days').textContent=st.streak;
    document.querySelectorAll('[data-stats-range]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.statsRange===statsRange)));
    const days=['Mån','Tis','Ons','Tor','Fre','Lör','Sön'],months=['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'],max=Math.max(10,...bars.map(d=>d.minutes));
    const today=M.localDate(now),thisMonth=new Date(now).getMonth();
    const label=(d,i)=>statsRange==='year'?months[d.month]:statsRange==='month'?(d.day===1||d.day%5===0?String(d.day):''):days[i];
    const isNow=d=>statsRange==='year'?d.month===thisMonth:d.date===today;
    $('week-chart').classList.toggle('is-month',statsRange==='month');$('week-chart').classList.toggle('is-year',statsRange==='year');
    $('week-chart').innerHTML=bars.map((d,i)=>'<div class="day-column '+(isNow(d)?'today':'')+'"><span class="day-minutes">'+(d.minutes?Number(d.minutes.toFixed(statsRange==='week'?1:0)).toLocaleString('sv-SE'):'·')+'</span><div class="day-track"><span class="day-fill '+(!d.minutes?'empty':'')+'" style="height:'+Math.max(4,d.minutes/max*100)+'%"></span></div><span class="day-label">'+label(d,i)+'</span></div>').join('');
    $('week-chart').setAttribute('aria-label','Minuter '+periodWord+': '+bars.map((d,i)=>(statsRange==='year'?months[d.month]:statsRange==='month'?d.day:days[i])+' '+Number(d.minutes.toFixed(1))).join(', '));
    // Which muscle groups got the most stretching in the period.
    const groups=kind==='stretch'?M.groups(records(),now,statsRange):[],groupMax=Math.max(1,...groups.map(g=>g.seconds));
    $('muscle-groups').hidden=kind!=='stretch';
    $('muscle-groups-list').innerHTML=groups.length?groups.slice(0,6).map(g=>'<li><span>'+escape(g.group)+'</span><span class="group-bar"><i style="width:'+Math.max(4,g.seconds/groupMax*100)+'%"></i></span><small>'+Math.round(g.seconds/60)+' min</small></li>').join(''):'<li class="group-empty">Inga stretchpass sparade '+periodWord+'.</li>';
    const symbolsMilestone=kind==='stretch'?['✧','⌁','✦','∞']:['◌','≈','☼','∞'];
    $('collection').innerHTML=M.milestones(kind,S.entries).map(m=>{const value=st[m.metric],done=value>=m.goal;return '<article class="keepsake '+(done?'unlocked':'')+'"><span class="keepsake-symbol" aria-hidden="true">'+symbolsMilestone[m.slot]+'</span><h3>'+escape(m.name)+'</h3><p>'+m.goal+' '+M.milestoneMetrics[m.metric]+'</p><small>'+(done?'Uppnått':Math.min(value,m.goal)+' / '+m.goal)+'</small><button class="text-button milestone-edit" data-milestone="'+m.slot+'" aria-label="Redigera '+escape(m.name)+'">Redigera</button></article>';}).join('');
    const history=records().filter(r=>r.kind===kind).sort((a,b)=>b.completedAt-a.completedAt);$('history-more').hidden=history.length<=5;$('history-more').textContent=allHistory?'Visa färre':'Visa alla ('+history.length+')';
    $('history').innerHTML=history.length?(allHistory?history:history.slice(0,5)).map(r=>{
      const open=expandedHistory.has(r.id);
      const exercises=r.kind==='stretch'?(Array.isArray(r.steps)&&r.steps.length
        ?'<p class="history-detail-label">'+r.steps.length+' övningar i passet</p><ol class="history-steps">'+r.steps.map(step=>'<li><span>'+escape(step.name)+'</span><small>'+fmt(step.seconds)+'</small></li>').join('')+'</ol>'
        :'<p class="history-legacy">'+(r.manual?'Loggat i efterhand, utan övningar.':'Övningarna registrerades inte för detta äldre pass.')+'</p>')
        :r.guidance?'<p class="history-detail-label is-plain">'+escape(r.guidance==='silent'?'Utan guide · egen andning':'Andningsguide · '+M.breathingSummary({guidance:'breath',breathing:r.breathing}))+(r.guidanceChanged?' · bytte under passet':'')+'</p>':'';
      const again=M.redoRoutine(r)?'<button type="button" class="text-button history-again" data-again="'+escape(r.id)+'">Gör samma pass igen</button>':'';
      return '<article class="history-row"><button type="button" class="history-trigger" data-history="'+escape(r.id)+'" aria-expanded="'+open+'" aria-controls="zen-history-'+escape(r.id)+'"><span class="small-symbol" aria-hidden="true">'+copy[kind].symbol+'</span><span class="history-info"><strong>'+escape(r.name)+'</strong><time datetime="'+new Date(r.completedAt).toISOString()+'">'+new Date(r.completedAt).toLocaleString('sv-SE',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})+'</time>'+(r.manual?'<span class="history-feeling">Loggat i efterhand</span>':'')+(r.feeling?'<span class="history-feeling">'+escape(feelingLabel(r.feeling))+'</span>':'')+(r.note?'<span class="history-note">'+escape(r.note)+'</span>':'')+'</span><span class="history-length">'+mins(r.seconds)+' min</span><span class="history-chevron" aria-hidden="true">⌄</span></button><button type="button" class="text-button history-delete" data-delete="'+escape(r.id)+'" aria-label="Ta bort '+escape(r.name)+'">×</button><div id="zen-history-'+escape(r.id)+'" class="history-expanded" '+(open?'':'hidden')+'>'+exercises+'<div class="history-actions">'+again+'<button type="button" class="text-button history-edit-link" data-edit-session="'+escape(r.id)+'">Redigera pass</button></div></div></article>';
    }).join(''):'<p class="history-empty">Inga sparade pass ännu.</p>';
    $('resume-banner').hidden=!S.active;if(S.active){const a=S.active,left=Math.max(0,M.duration(a.routine)-Math.floor(M.elapsed(a,Date.now())/1000));$('resume-text').textContent='Pågående '+(a.routine.kind==='meditation'?'meditation':'stretch')+': '+a.routine.name+' · '+(left>=60?Math.round(left/60)+' min':left+' s')+' kvar';}$('start-button').disabled=!S.ready;document.dispatchEvent(new Event('zen:home-rendered'));
  }
  function feelingLabel(value){return M.feelingLabels[value]||'';}
  // Keep the screen awake during a pass, so the phone does not lock in the middle of a stretch.
  let wakeLock=null;
  function updateWakeLock(){
    const want=view==='session'&&!document.hidden;
    if(want&&!wakeLock&&navigator.wakeLock){navigator.wakeLock.request('screen').then(lock=>{if(view!=='session'){lock.release().catch(()=>{});return;}wakeLock=lock;lock.addEventListener('release',()=>{if(wakeLock===lock)wakeLock=null;});}).catch(()=>{});}
    else if(!want&&wakeLock){const lock=wakeLock;wakeLock=null;lock.release().catch(()=>{});}
  }
  document.addEventListener('visibilitychange',updateWakeLock);
  function showView(next){view=next;setTimeout(updateWakeLock,0);if(next!=='session')stopAmbient();if(next!=='session'){$('session-preparation').hidden=true;$('session-view').classList.remove('is-stretch-preparing');}syncViewTheme();for(const name of ['home','session','complete'])$(name+'-view').hidden=name!==next;document.body.classList.toggle('in-session',next!=='home');document.body.dataset.sessionView=next;document.dispatchEvent(new CustomEvent('zen:session-view',{detail:{view:next,kind}}));if(next==='home'){document.body.classList.remove('is-paused');document.title='Zen · Stretch och meditation';}window.scrollTo(0,0);}
  function confirm(title,message,yes,action){$('confirm-title').textContent=title;$('confirm-copy').textContent=message;$('confirm-yes').textContent=yes;$('confirm-no').textContent='Tillbaka';confirmAction=action;SurfaceMotion.showDialog($('confirm-dialog'));}
  $('confirm-yes').onclick=()=>{const action=confirmAction;confirmAction=null;SurfaceMotion.closeDialog($('confirm-dialog'));if(action)action();};$('confirm-no').onclick=()=>SurfaceMotion.closeDialog($('confirm-dialog'));$('confirm-dialog').addEventListener('close',()=>confirmAction=null);
  function openSession(s){ending=false;document.querySelectorAll('.session-top,.session-layout,.session-bottom').forEach(el=>el.inert=false);$('session-ending').hidden=true;$('session-view').classList.remove('clock-hidden','session-finished');$('clock-toggle').textContent='Dölj tiden';$('clock-toggle').setAttribute('aria-pressed','true');session=s;pausedFrame='';breathOffset=M.position(s,Date.now()).spent;setKind(s.routine.kind);lastStep=-1;lastPhase='';showView('session');$('session-routine-name').textContent=session.routine.name;updateSound();tick();$('session-title').focus();}
  function startSession(force){
    force=force===true;
    if(!S.ready)return;
    if(S.active){confirm('Du har ett pågående pass','Fortsätt passet från startsidan eller avbryt det och starta ett nytt.','Starta nytt pass',()=>{S.setActive(null);startSession(force);});return;}
    const base=chosen();runRoutine(tempMinutes&&base.kind==='meditation'?{...base,seconds:tempMinutes*60}:base,force);
  }
  // Every pass starts here. Stretch gets the chosen time to switch position (S05);
  // a meditation remembers the guidance it started with (M05).
  function runRoutine(routine,force){
    if(routine.kind==='stretch')routine={...routine,switchSeconds:switchSeconds||undefined};
    session=M.start(routine,Date.now()+(routine.kind==='stretch'||prepare||force?5000:0),id());
    if(routine.kind==='meditation')session.guidanceAtStart=routine.guidance;
    S.setActive(session);openSession(session);playDing();
  }
  let pausedFrame='';
  function tick(){
    if(view!=='session'||!session||ending)return;
    const now=Date.now(),p=M.position(session,now);
    if(p.done){if(!ending){ending=true;stopAmbient();session=M.pause(session,now);S.setActive(session);$('session-ending').hidden=false;$('session-view').classList.add('session-finished');document.querySelectorAll('.session-top,.session-layout,.session-bottom').forEach(el=>el.inert=true);$('session-ending-title').focus();updateBreathAudio(false);document.dispatchEvent(new CustomEvent('zen:session-frame',{detail:{kind,paused:true,done:true,progress:1}}));playDing();}return;}
    // P02: a paused session does not change between ticks. Repaint only when something
    // does (resume, step change, seek, guidance switch) instead of five full frames a second.
    if(session.paused){const sig=[session.elapsedMs,p.index,session.routine.guidance,breathOffset,$('session-view').className].join('|');if(sig===pausedFrame)return;pausedFrame=sig;}else pausedFrame='';
    const isStretch=session.routine.kind==='stretch',preparing=!session.paused&&now<session.anchor;
    // Keep the authoritative start anchor in the session model. This is only
    // the visual five-second countdown; no second clock or work time is added.
    const prepVisible=isStretch&&preparing,prepOverlay=$('session-preparation');
    prepOverlay.hidden=!prepVisible;
    $('session-view').classList.toggle('is-stretch-preparing',prepVisible);
    if(prepVisible){
      const remaining=Math.max(0,session.anchor-now),count=Math.max(1,Math.ceil(remaining/1000));
      if($('session-prep-count').textContent!==String(count)){
        $('session-prep-count').textContent=String(count);
        $('session-prep-remaining').textContent=String(count);
      }
      // Identical v67 pre-timer visual: a horizontal glow line and the
      // next exercise name. The real five-second start anchor is unchanged.
      const upcoming=session.routine.steps&&session.routine.steps[0];
      const exerciseLabel=$('session-prep-exercise');
      if(exerciseLabel&&upcoming&&exerciseLabel.textContent!==upcoming.name)
        exerciseLabel.textContent=upcoming.name;
    }
    const switching=isStretch&&p.switching&&!preparing;
    if(isStretch&&lastStep!==p.index){lastStep=p.index;const step=session.routine.steps[p.index];$('session-overline').textContent='RÖRELSE '+(p.index+1)+' AV '+session.routine.steps.length;$('session-title').textContent=step.name;document.querySelector('.session-copy').classList.toggle('is-long',step.name.length>30||step.cue.length>150);$('session-cue').textContent=step.cue;$('next-step').textContent=p.index+1<session.routine.steps.length?'Härnäst · '+session.routine.steps[p.index+1].name:'Sista övningen i passet.';if(p.index>0)playDing();}
    if(!isStretch){$('session-overline').textContent='MEDITATION';$('session-title').textContent=session.routine.guidance==='breath'?'Andningsguide':'Meditation utan guide';$('session-cue').textContent=session.routine.guidance==='breath'?M.breathingSummary(session.routine)+'. Byt till egen andning när du vill.':'Rikta uppmärksamheten mot andningen. När du märker att du tänker på annat, återgå till andetagen.';
      const action=session.routine.guidance==='breath'?'Byt till egen andning':'Visa andningsguide';if(!$('guidance-toggle')||$('guidance-toggle').textContent!==action)$('next-step').innerHTML='<button class="text-button" id="guidance-toggle">'+action+'</button>';
    }
    const guided=!isStretch&&session.routine.guidance==='breath',breathing=M.breathState(session.routine,Math.max(0,p.spent-breathOffset)),cycle=breathing.cycle;
    const phase=session.paused?'Pausat':preparing?(isStretch?'Påbörja stretch':'Gör dig redo'):switching?'Byt position':guided?breathing.label:isStretch?(session.routine.steps[p.index].id==='rest'?'Släpp efter':'Håll mjukt'):'Egen andning';
    if(phase!==lastPhase){$('breath-label').textContent=phase;lastPhase=phase;}
    const scale=guided&&!preparing?breathing.scale:1;$('breathing-field').style.setProperty('--breath-scale',scale.toFixed(4));
    $('session-clock').textContent=preparing?String(Math.ceil((session.anchor-now)/1000)):fmt(p.remaining);$('clock-caption').textContent=switching?'till nästa rörelse':isStretch?'kvar i rörelsen':'kvar av passet';$('session-elapsed').textContent=fmt(Math.floor(M.practiced(session,now)/1000))+' aktiv tid';document.querySelector('.session-progress').setAttribute('aria-valuenow',String(Math.round(p.spent/p.total*100)));
    $('pause-session').textContent=session.paused?'Fortsätt':'Pausa';document.body.classList.toggle('is-paused',session.paused);$('session-footnote').textContent=isStretch?'Rör dig mjukt. Backa om något känns obehagligt.':'Du får alltid andas i din egen takt.';document.title=fmt(p.total-p.spent)+' · '+session.routine.name+' · Zen';
    const step=isStretch?session.routine.steps[p.index]:null;
    // SVG orbital clock is interpolated from this authoritative position by
    // the existing session scene renderer. No additional clock is created.
    $('session-phase-detail').textContent=session.paused?'Ta den tid du behöver':preparing||switching?'Hitta en bekväm position':guided?breathing.seconds+' SEKUNDER · '+({inhale:'IN',exhale:'UT',holdIn:'EFTER IN',holdOut:'EFTER UT'}[breathing.id]):isStretch?'Följ din egen andning':'Ingenting att prestera';
    // The last seven seconds of a movement: a soft rising cue and a quiet countdown to the next one.
    const nextUp=isStretch&&!preparing&&!switching&&!session.paused&&p.index<session.routine.steps.length-1&&session.routine.steps[p.index].seconds>=15&&p.remaining<=TRANSITION_SECONDS+.05;
    if(nextUp)$('session-phase-detail').textContent='NÄSTA ÖVNING OM '+Math.max(1,Math.ceil(p.remaining))+' S';
    if(switching)$('session-phase-detail').textContent='BÖRJAR OM '+Math.max(1,Math.ceil(p.remaining))+' S';
    updateTransitionCue(nextUp,p);
    $('session-side').textContent=step?.id?.endsWith('-left')?'Vänster sida':step?.id?.endsWith('-right')?'Höger sida':'';
    $('previous-step').disabled=isStretch&&p.index===0;
    $('following-step').disabled=isStretch&&p.index===session.routine.steps.length-1;
    $('restart-step').hidden=!isStretch||!session.paused;
    document.dispatchEvent(new CustomEvent('zen:session-frame',{detail:{kind:session.routine.kind,step,index:p.index,steps:session.routine.steps||[],progress:p.spent/p.total,stepProgress:step&&!switching?1-p.remaining/step.seconds:0,switching,phase,cycle,breathing,guided,preparing,prepRemainingMs:preparing?Math.max(0,session.anchor-now):0,paused:session.paused,scale,volume,sound}}));
    updateBreathAudio(guided&&!preparing&&!session.paused,breathing.id);
    updateAmbient();if(!preparing)updateIntervalBell(p);

  }
  function complete(early){
    if(!session)return;ending=false;$('session-ending').hidden=true;
    session=M.pause(session,Date.now());const r=session.routine,steps=r.kind==='stretch'?M.actualSteps(session,Date.now()):undefined;
    // With switch time on, only the stretching itself counts as the pass length.
    const seconds=r.kind==='stretch'&&r.switchSeconds?steps.reduce((n,x)=>n+x.seconds,0):Math.floor(M.practiced(session,Date.now())/1000);
    if(seconds<1){toast('Passet behöver vara minst en sekund för att sparas.');session=M.resume(session,Date.now());S.setActive(session);return;}
    S.setActive(session);pendingRecord={id:session.id,type:'session',name:session.routine.name,kind:session.routine.kind,seconds,completedAt:early?Date.now():session.anchor,updatedAt:Date.now(),note:'',feeling:'',...(r.kind==='stretch'?{steps,stepsActual:true,plan:r.steps.map(x=>({id:x.id||'',seconds:x.seconds})).filter(x=>x.id)}:{
      guidance:session.guidanceAtStart||r.guidance,breathing:M.breathingSettings(r),plannedSeconds:r.seconds,...(session.guidanceSwitched?{guidanceChanged:true}:{})})};
    if(pendingRecord.plan&&!pendingRecord.plan.length)delete pendingRecord.plan;
    $('complete-summary').textContent=mins(seconds)+' minuter · '+session.routine.name;$('session-note').value='';document.querySelectorAll('[data-feeling]').forEach(b=>b.setAttribute('aria-pressed','false'));showView('complete');$('complete-title').focus();playDing();document.title='Passet avslutat · Zen';
  }
  function saveComplete(){
    if(!pendingRecord)return;const record={...pendingRecord,note:$('session-note').value.trim(),updatedAt:Date.now()};
    if(S.put(record)){pendingRecord=null;session=null;S.setActive(null);showView('home');renderHome();$('hero-title').setAttribute('tabindex','-1');$('hero-title').focus();
      if(queue.length){
        const nextId=queue.shift(),next=routines().find(r=>r.id===nextId);
        try{const route=new URL(location.href);if(queue.length)route.searchParams.set('then',queue.join(','));else route.searchParams.delete('then');if(next)route.searchParams.set('routine',next.id);history.replaceState(history.state,'',route.href);}catch(_){}
        if(next){if(next.kind!==kind)applyKind(next.kind);selected[next.kind]=next.id;savePrefs();renderHome();if(autostart){toast('Passet är sparat. Nästa: '+next.name+'.');setTimeout(()=>startSession(true),400);return;}toast('Passet är sparat. Nästa: '+next.name+' – tryck Starta när du är redo.');return;}
      }
      toast('Passet är sparat.');}
  }
  function updateSound(){const medi=session?session.routine.kind==='meditation':kind==='meditation';$('session-interval').hidden=!medi;$('session-interval-label').hidden=!medi;setDingVolume();$('session-volume').value=volume;$('volume-value').textContent=volume+' %';$('sound-toggle').textContent=sound?'Signaler på':'Signaler av';$('sound-toggle').setAttribute('aria-pressed',String(sound));$('session-audio').dataset.enabled=String(sound);$('session-audio').querySelector('summary').setAttribute('aria-label','Ljudinställningar, ljud '+(sound?'på':'av'));}
  function mixedAudioContext(){
    // Fail silent when audio mixing cannot be requested; preserve external music.
    try{
      if(!navigator.audioSession)return null;
      navigator.audioSession.type='ambient';
      if(navigator.audioSession.type!=='ambient')return null;
      const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return null;
      if(!audioContext)audioContext=new Audio();
      if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
      return audioContext;
    }catch(_){return null;}
  }
  let dingBus=null,dingReverb=null,lastDing=-Infinity,breathSoundPhase=null;
  function setDingVolume(){if(dingBus)dingBus.gain.setTargetAtTime((sound||ambient)&&!document.hidden?volume/100:0,audioContext.currentTime,.06);}
  function prepareDing(){
    if(!mixedAudioContext())return false;
    if(!dingBus){
      dingBus=audioContext.createGain();dingBus.gain.value=(sound||ambient)?volume/100:0;dingBus.connect(audioContext.destination);
      // A light, brief room reflection softens the bell without a dark trailing wash.
      dingReverb=audioContext.createConvolver();dingReverb.normalize=false;
      const length=Math.ceil(audioContext.sampleRate*.55),impulse=audioContext.createBuffer(2,length,audioContext.sampleRate);
      for(let ch=0;ch<2;ch++){const samples=impulse.getChannelData(ch);let smooth=0;for(let i=0;i<length;i++){smooth=.72*smooth+.28*(Math.random()*2-1);samples[i]=smooth*.18*Math.pow(1-i/length,3);}}
      dingReverb.buffer=impulse;const wet=audioContext.createGain();wet.gain.value=.12;dingReverb.connect(wet);wet.connect(dingBus);
    }
    return true;
  }
  function playDing(){
    if(!sound||document.hidden)return;
    try{
      if(!prepareDing())return;const now=audioContext.currentTime;if(now-lastDing<.5)return;lastDing=now;
      // Stable, harmonic bell tones: no descending pitch or low rumble.
      [[880,.085,.85],[1760,.018,.36]].forEach(([frequency,level,decay])=>{
        const oscillator=audioContext.createOscillator(),envelope=audioContext.createGain();
        oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,now);
        envelope.gain.setValueAtTime(0,now);envelope.gain.linearRampToValueAtTime(level,now+.012);envelope.gain.exponentialRampToValueAtTime(.0001,now+decay);
        oscillator.connect(envelope);envelope.connect(dingBus);envelope.connect(dingReverb);
        oscillator.onended=()=>{oscillator.disconnect();envelope.disconnect();};oscillator.start(now);oscillator.stop(now+decay+.03);
      });
    }catch(_){sound=false;setDingVolume();updateSound();toast('Ljudet kunde inte startas i den här webbläsaren.');}
  }
  /* Seven seconds before the next movement: one soft glass note per second, rising
     through a pentatonic scale over a quiet swelling pad; the bell then marks the change. */
  function stopTransitionCue(){
    if(!transitionCue)return;
    const cue=transitionCue;transitionCue=null;
    try{const now=audioContext.currentTime;cue.gain.gain.cancelScheduledValues(now);cue.gain.gain.setTargetAtTime(0,now,.05);cue.nodes.forEach(n=>{try{n.stop(now+.3);}catch(_){}});setTimeout(()=>{try{cue.gain.disconnect();}catch(_){}},500);}catch(_){}
  }
  function updateTransitionCue(active,p){
    const key=active&&session?session.id+':'+p.index:'';
    if(transitionCue&&transitionCue.key!==key)stopTransitionCue();
    if(transitionCue&&!sound)stopTransitionCue();
    if(!active||transitionCue||!sound||document.hidden||view!=='session'||ending)return;
    try{
      if(!prepareDing())return;
      const now=audioContext.currentTime,left=Math.max(0,p.remaining),end=now+left,gain=audioContext.createGain(),nodes=[];
      gain.gain.value=1;gain.connect(dingBus);gain.connect(dingReverb);
      transitionCue={key,gain,nodes};
      // Pad: two soft fifths that swell toward the change and are gone when the bell rings.
      [[220,.010],[329.63,.007]].forEach(([frequency,level])=>{
        const o=audioContext.createOscillator(),g=audioContext.createGain(),f=audioContext.createBiquadFilter();
        o.type='triangle';o.frequency.value=frequency;f.type='lowpass';f.frequency.value=900;
        g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(level,Math.max(now+.2,end-.4));g.gain.linearRampToValueAtTime(0,end+.05);
        o.connect(f);f.connect(g);g.connect(gain);o.start(now);o.stop(end+.1);nodes.push(o);
      });
      // Notes on each whole second that is still ahead: 7, 6, … 1 seconds left.
      TRANSITION_NOTES.forEach((frequency,i)=>{
        const at=end-(TRANSITION_SECONDS-i);if(at<now-.02)return;
        const start=Math.max(now,at),o=audioContext.createOscillator(),overtone=audioContext.createOscillator(),g=audioContext.createGain(),level=.022+i*.004;
        o.type='sine';o.frequency.value=frequency;overtone.type='sine';overtone.frequency.value=frequency*2.01;
        const og=audioContext.createGain();og.gain.value=.18;overtone.connect(og);og.connect(g);
        g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(level,start+.01);g.gain.exponentialRampToValueAtTime(.0001,start+.7);
        o.connect(g);g.connect(gain);o.start(start);overtone.start(start);o.stop(start+.75);overtone.stop(start+.75);nodes.push(o,overtone);
      });
    }catch(_){transitionCue=null;}
  }
  /* Background sound, made in the browser: rain (bright filtered noise with soft drops),
     sea (deep noise rising and falling like waves) or wind in the trees (swaying band of noise). */
  function noiseBuffer(type){
    const length=audioContext.sampleRate*6,buffer=audioContext.createBuffer(2,length,audioContext.sampleRate);
    for(let ch=0;ch<2;ch++){const d=buffer.getChannelData(ch);let b0=0,b1=0,b2=0,brown=0;
      for(let i=0;i<length;i++){const w=Math.random()*2-1;
        if(type==='sea'){brown=(brown+.02*w)/1.02;d[i]=brown*3.2;}
        else{b0=.99765*b0+w*.0990460;b1=.96300*b1+w*.2965164;b2=.57000*b2+w*1.0526913;d[i]=(b0+b1+b2+w*.1848)*.18;}
        if(type==='rain'&&Math.random()<.0009)d[i]+=(Math.random()*2-1)*.5;}
      // Fade the loop seam so it repeats without a click.
      for(let i=0;i<2048;i++){const f=i/2048;d[i]*=f;d[length-1-i]*=f;}}
    return buffer;
  }
  function stopAmbient(){if(!ambientNodes)return;const n=ambientNodes;ambientNodes=null;try{const t=audioContext.currentTime;n.gain.gain.setTargetAtTime(0,t,.4);setTimeout(()=>{n.nodes.forEach(x=>{try{x.stop();}catch(_){}});try{n.gain.disconnect();}catch(_){}},1800);}catch(_){}}
  function updateAmbient(){
    const want=view==='session'&&!!session&&!session.paused&&!document.hidden&&!ending&&ambient;
    if(ambientNodes&&(!want||ambientNodes.type!==ambient))stopAmbient();
    if(!want||ambientNodes)return;
    try{
      if(!prepareDing())return;
      const t=audioContext.currentTime,gain=audioContext.createGain(),src=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),nodes=[src];
      src.buffer=noiseBuffer(ambient);src.loop=true;
      if(ambient==='rain'){filter.type='highpass';filter.frequency.value=900;}
      else if(ambient==='sea'){filter.type='lowpass';filter.frequency.value=520;}
      else{filter.type='bandpass';filter.frequency.value=420;filter.Q.value=.6;}
      src.connect(filter);filter.connect(gain);gain.connect(dingBus);
      const level=ambient==='sea'?.20:ambient==='rain'?.10:.16;
      gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(level,t+2.5);
      // Slow movement: waves for the sea, gusts for the wind.
      if(ambient!=='rain'){const lfo=audioContext.createOscillator(),depth=audioContext.createGain();lfo.frequency.value=ambient==='sea'?.11:.07;depth.gain.value=ambient==='sea'?level*.75:180;lfo.connect(depth);depth.connect(ambient==='sea'?gain.gain:filter.frequency);lfo.start(t);nodes.push(lfo);}
      src.start(t);ambientNodes={type:ambient,gain,nodes};
    }catch(_){ambientNodes=null;}
  }
  // An optional bell every few minutes in a meditation, for keeping time without a guide.
  function updateIntervalBell(p){
    if(!session||session.routine.kind!=='meditation'||!intervalMinutes||session.paused||p.done){lastIntervalMark=-1;return;}
    const mark=Math.floor(p.spent/(intervalMinutes*60));
    if(lastIntervalMark<0){lastIntervalMark=mark;return;}
    if(mark>lastIntervalMark){lastIntervalMark=mark;if(p.remaining>5)playDing();}
  }
  function updateBreathAudio(active,phase='inhale'){
    if(!active||!sound||document.hidden||view!=='session'||ending){breathSoundPhase=null;return;}
    if(phase!==breathSoundPhase){breathSoundPhase=phase;playDing();}
  }
  document.addEventListener('visibilitychange',()=>{setDingVolume();if(document.hidden)breathSoundPhase=null;});
  document.addEventListener('zen:session-view',()=>updateBreathAudio(false));
  $('show-session-summary').onclick=()=>complete(false);
  $('session-ambient').value=ambient;$('session-interval').value=String(intervalMinutes);
  $('session-ambient').onchange=()=>{ambient=$('session-ambient').value;savePrefs();setDingVolume();updateAmbient();};
  $('session-interval').onchange=()=>{intervalMinutes=Number($('session-interval').value);lastIntervalMark=-1;savePrefs();};
  $('session-volume').oninput=()=>{volume=Number($('session-volume').value);savePrefs();updateSound();tick();};
  $('switch-seconds').value=String(switchSeconds);
  $('switch-seconds').onchange=()=>{switchSeconds=Number($('switch-seconds').value)||0;savePrefs();builderTotal();};
  $('prepare-session').checked=prepare;
  $('prepare-session').onchange=()=>{prepare=$('prepare-session').checked;savePrefs();};
  function moveStep(delta,restart=false){
    if(!session||session.routine.kind!=='stretch'||ending)return;
    session=M.seek(session,restart?M.position(session,Date.now()).index:M.position(session,Date.now()).index+delta,Date.now());
    lastStep=-1;S.setActive(session);tick();
  }
  $('previous-step').onclick=()=>moveStep(-1);$('following-step').onclick=()=>moveStep(1);$('restart-step').onclick=()=>moveStep(0,true);
  $('clock-toggle').onclick=()=>{const hidden=$('session-view').classList.toggle('clock-hidden');$('clock-toggle').textContent=hidden?'Visa tiden':'Dölj tiden';$('clock-toggle').setAttribute('aria-pressed',String(!hidden));};
  function renderPoseOptions(){
    if(!builder||builder.kind!=='stretch')return;
    const query=$('pose-search').value.trim().toLocaleLowerCase('sv-SE'),group=$('pose-group').value;
    const matches=M.poses.filter(p=>(!group||p.group===group)&&(!query||(p.name+' '+p.group+' '+(p.muscle||'')).toLocaleLowerCase('sv-SE').includes(query)));
    const previous=$('pose-select').value;
    $('pose-select').innerHTML=matches.length?[...new Set(matches.map(p=>p.group))].map(g=>'<optgroup label="'+escape(g)+'">'+matches.filter(p=>p.group===g).map(p=>'<option value="'+p.id+'">'+escape(p.name)+'</option>').join('')+'</optgroup>').join(''):'<option value="">Inga matchande övningar</option>';
    if(matches.some(p=>p.id===previous))$('pose-select').value=previous;
    $('pose-count').textContent=matches.length+' valbara alternativ · '+window.ZenStretch.families.length+' rörelser, med sidvarianter';
    $('add-pose').disabled=!matches.length||builder.steps.length>=20;updatePoseDescription();
  }
  function updatePoseDescription(){const pose=M.poses.find(p=>p.id===$('pose-select').value);$('add-pose').textContent=pose&&pose.side?'Lägg till båda sidor':'Lägg till';$('pose-description').textContent=pose?(pose.muscle?'Muskler: '+pose.muscle+'. ':'')+pose.cue:'Prova en annan sökning eller muskelgrupp.';
    // S03: a still of the marked movement; S04: say honestly how it is shown during the pass.
    const drawn=!!(pose&&window.ZenPoseStill&&window.ZenPoseStill.draw($('pose-preview'),pose.id));$('pose-preview').hidden=!drawn;
    const silver=window.PulseSilverStretch;$('pose-preview-note').textContent=!pose?'':(pose.side?(pose.side==='left'?'Vänster sida':'Höger sida')+' · ':'')+(silver&&silver.supports(pose.id)?'3D-figur under passet':'Tecknad figur under passet');}
  $('pose-search').oninput=renderPoseOptions;$('pose-group').onchange=renderPoseOptions;$('pose-select').onchange=updatePoseDescription;
  let milestoneDraft=null;
  $('collection').onclick=e=>{
    const button=e.target.closest('[data-milestone]');if(!button)return;
    milestoneDraft=M.milestones(kind,S.entries)[Number(button.dataset.milestone)];
    $('milestone-name').value=milestoneDraft.name;$('milestone-metric').value=milestoneDraft.metric;$('milestone-goal').value=milestoneDraft.goal;
    $('milestone-kind').textContent=kind==='stretch'?'STRETCH':'MEDITATION';$('milestone-error').textContent='';$('milestone-reset').hidden=!milestoneDraft.custom;
    SurfaceMotion.showDialog($('milestone-dialog'));$('milestone-title').focus({preventScroll:true});
  };
  $('milestone-form').onsubmit=e=>{
    e.preventDefault();if(!milestoneDraft)return;
    const m={kind:milestoneDraft.kind,slot:milestoneDraft.slot,name:$('milestone-name').value.trim(),metric:$('milestone-metric').value,goal:Number($('milestone-goal').value)};
    if(!M.milestoneValid(m)){$('milestone-error').textContent='Ange ett namn och ett helt målantal mellan 1 och 100 000.';return;}
    if(S.put({id:milestoneDraft.id,type:'milestone',milestone:m,updatedAt:Date.now()})){SurfaceMotion.closeDialog($('milestone-dialog'));renderHome();toast('Milstolpen är uppdaterad.');}else $('milestone-error').textContent='Vänta tills ditt konto har laddats.';
  };
  $('milestone-reset').onclick=()=>{
    if(milestoneDraft&&S.remove(milestoneDraft.id)){SurfaceMotion.closeDialog($('milestone-dialog'));renderHome();toast('Standardmilstolpen är återställd.');}
  };
  const breathKeys=['inhale','holdIn','exhale','holdOut'];
  function readBreathing(){return Object.fromEntries(breathKeys.map(k=>[k,$('breath-'+k).value===''?NaN:Number($('breath-'+k).value)]));}
  function updateBreathingBuilder(){
    if(!builder||builder.kind!=='meditation')return;
    const guided=$('meditation-guidance').value==='breath';
    $('meditation-rhythm').hidden=!guided;$('meditation-rhythm').disabled=!guided;
    const draft={...builder,guidance:guided?'breath':'silent',breathing:readBreathing()};
    const valid=M.breathingValid(draft),total=valid?M.breathState(draft,0).total:0;
    $('breath-summary').textContent=!guided?'Meditation i egen takt. Timern räknar hela passlängden.':valid?M.breathingSummary(draft)+' · '+total+' s per andetag.':'In och ut: 1–30 sek. Pauser: 0–30 sek.';
    const key=breathKeys.map(k=>draft.breathing[k]).join(','),preset=[...document.querySelectorAll('[data-breath-preset]')].some(b=>b.dataset.breathPreset===key);
    document.querySelectorAll('[data-breath-preset]').forEach(b=>b.setAttribute('aria-pressed',String(valid&&b.dataset.breathPreset===key)));
    // Own numbers stay visible; a preset rhythm keeps the four fields folded away.
    if(!preset||!valid)$('breath-custom').open=true;
    builderTotal();
  }
  function openBuilder(r,isNew){
    builder=JSON.parse(JSON.stringify(r));builderExisting=!isNew&&!M.routines.some(p=>p.id===r.id);if(!builderExisting)builder.id=id();
    builderOrigin=isNew?'':r.id+'|'+builderShape(r);
    $('routine-name').value=isNew?'Min '+(builder.kind==='stretch'?'stretch':'meditation'):r.name;$('builder-error').textContent='';
    $('builder-title').textContent=builder.kind==='meditation'?'Din meditation':'Anpassa pass';
    const meditation=builder.kind==='meditation';$('prepare-session').closest('.session-prep-setting').hidden=!meditation;$('stretch-builder').querySelectorAll('input,select,button').forEach(el=>el.disabled=meditation);$('stretch-builder').hidden=meditation;$('meditation-builder').hidden=!meditation;
    $('meditation-minutes').disabled=!meditation;$('meditation-guidance').disabled=!meditation;$('meditation-rhythm').disabled=!meditation;
    if(meditation){$('meditation-minutes').value=builder.seconds/60;$('meditation-guidance').value=builder.guidance;const settings=M.breathingSettings(builder);breathKeys.forEach(k=>$('breath-'+k).value=settings[k]);$('breath-custom').open=false;updateBreathingBuilder();}
    else{$('pose-search').value='';$('pose-group').innerHTML='<option value="">Alla muskelgrupper</option>'+[...new Set(M.poses.map(p=>p.group))].map(g=>'<option>'+escape(g)+'</option>').join('');renderPoseOptions();}
    renderBuilder();SurfaceMotion.showDialog($('builder-dialog'));$('builder-title').focus({preventScroll:true});
  }
  function renderBuilder(){
    if(!builder)return;
    if(builder.kind==='stretch')$('builder-steps').innerHTML=builder.steps.map((s,i)=>'<div class="builder-step"><button type="button" class="step-drag-handle" aria-label="Flytta '+escape(s.name)+'. Dra eller använd piltangenterna." title="Dra för att ändra ordning">⠿</button><span class="builder-step-name">'+escape(s.name)+'<small>sekunder</small></span><input type="number" min="15" max="600" step="15" value="'+s.seconds+'" data-step-time="'+i+'" aria-label="Sekunder för '+escape(s.name)+'"><button type="button" data-remove-step="'+i+'" '+(builder.steps.length===1?'disabled':'')+' aria-label="Ta bort '+escape(s.name)+'">×</button></div>').join('');
    $('add-pose').disabled=builder.kind==='stretch'&&(builder.steps.length>=20||!$('pose-select').value);builderTotal();
  }
  function builderTotal(){if(!builder)return;const stretch=builder.kind==='stretch',seconds=stretch?M.duration(builder):Number($('meditation-minutes').value)*60,extra=stretch&&switchSeconds?switchSeconds*Math.max(0,builder.steps.length-1):0;$('builder-total').textContent=Number.isFinite(seconds)?mins(seconds)+(stretch?' minuter stretch':' minuter totalt')+(extra?' + '+extra+' s byten':''):'';}
  document.querySelectorAll('.kind-switch button').forEach(b=>b.onclick=()=>setKind(b.dataset.kind));
  function passClick(e){const b=e.target.closest('button');if(!b)return;const inLibrary=!!e.target.closest('#library-dialog');
    if(b.dataset.group){libraryGroup=b.dataset.group;renderLibrary();return;}
    if(b.dataset.length){libraryLength=b.dataset.length;renderLibrary();return;}
    if(b.dataset.libraryReset){libraryGroup='all';libraryLength='all';$('library-search').value='';renderLibrary();$('library-search').focus();return;}
    if(b.dataset.expand){const rid=b.dataset.expand;if(expandedRoutines.has(rid))expandedRoutines.delete(rid);else expandedRoutines.add(rid);renderHome();if(inLibrary)renderLibrary();return;}
    // Starting straight from a template: choose it and begin.
    if(b.dataset.choose){selected[kind]=b.dataset.choose;tempMinutes=0;savePrefs();renderHome();if(inLibrary)renderLibrary();toast('Valt som startpass.');return;}
    if(b.dataset.play){selected[kind]=b.dataset.play;savePrefs();if(inLibrary)SurfaceMotion.closeDialog($('library-dialog'));renderHome();startSession();return;}
    if(b.dataset.edit){const r=routines().find(r=>r.id===b.dataset.edit);if(r){if(inLibrary)SurfaceMotion.closeDialog($('library-dialog'));openBuilder(r,false);}}
    if(b.dataset.remove){const rid=b.dataset.remove;confirm('Ta bort passmallen?','Genomförda pass finns kvar i historiken.','Ta bort',()=>S.remove(rid));}}
  $('routines').onclick=passClick;$('library-dialog').addEventListener('click',passClick);
  $('open-library').onclick=openLibrary;
  document.querySelector('.stats-range').onclick=e=>{const b=e.target.closest('[data-stats-range]');if(!b)return;statsRange=b.dataset.statsRange;renderHome();};$('library-search').oninput=renderLibrary;
  $('library-create').onclick=()=>{SurfaceMotion.closeDialog($('library-dialog'));$('create-routine').click();};
  const selectedRoutine=document.querySelector('.selected-routine');
  selectedRoutine.onclick=()=>openBuilder(chosen(),false);
  selectedRoutine.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openBuilder(chosen(),false);}};
  $('create-routine').onclick=()=>openBuilder(kind==='stretch'?{id:id(),kind,name:'',steps:[{...M.poses[0],seconds:60},{...M.poses.find(p=>p.id==='rest'),seconds:60}]}:{id:id(),kind,name:'',seconds:600,guidance:'breath'},true);
  $('builder-steps').oninput=e=>{if(e.target.matches('[data-step-time]')){builder.steps[Number(e.target.dataset.stepTime)].seconds=Number(e.target.value);builderTotal();}};
  $('builder-steps').onclick=e=>{const b=e.target.closest('[data-remove-step]');if(b&&builder.steps.length>1){builder.steps.splice(Number(b.dataset.removeStep),1);renderBuilder();}};
  window.ZenBuilderSort.attach($('builder-steps'),(from,to)=>{const [step]=builder.steps.splice(from,1);builder.steps.splice(to,0,step);renderBuilder();$('builder-sort-status').textContent=step.name+' flyttad till plats '+(to+1);});

  // A movement done on both sides is added as a pair: the chosen side first, then the other.
  // One tap sets the same hold time for every movement in the pass.
  document.querySelector('.step-time-presets').onclick=e=>{const b=e.target.closest('[data-all-seconds]');if(!b||!builder||builder.kind!=='stretch')return;const seconds=Number(b.dataset.allSeconds);builder.steps.forEach(step=>step.seconds=seconds);renderBuilder();builderTotal();};
  $('add-pose').onclick=()=>{const pose=M.poses.find(p=>p.id===$('pose-select').value);if(!pose||builder.steps.length>=20)return;
    const other=pose.side?M.poses.find(p=>p.id===pose.id.replace(/-(left|right)$/,pose.side==='left'?'-right':'-left')):null;
    builder.steps.push({...pose,seconds:60});if(other&&builder.steps.length<20)builder.steps.push({...other,seconds:60});renderBuilder();};$('meditation-minutes').oninput=builderTotal;
  $('meditation-guidance').onchange=updateBreathingBuilder;breathKeys.forEach(k=>$('breath-'+k).oninput=updateBreathingBuilder);
  document.querySelectorAll('[data-breath-preset]').forEach(b=>b.onclick=()=>{const values=b.dataset.breathPreset.split(',');breathKeys.forEach((k,i)=>$('breath-'+k).value=values[i]);updateBreathingBuilder();});
  function builderShape(r){return JSON.stringify({name:r.name,steps:(r.steps||[]).map(x=>[x.id,x.seconds]),seconds:r.seconds,guidance:r.guidance,breathing:r.breathing});}
  function readBuilderForm(){builder.name=$('routine-name').value.trim();delete builder.description;if(builder.kind==='meditation'){builder.seconds=Number($('meditation-minutes').value)*60;builder.guidance=$('meditation-guidance').value;const breathing=readBreathing();builder.breathing=builder.guidance==='silent'&&!M.breathingValid({breathing})?M.breathingSettings(builder):breathing;}if(!M.routineValid(builder)){$('builder-error').textContent='Ange ett namn och giltiga tider för passet.';return false;}return true;}
  $('builder-form').onsubmit=e=>{e.preventDefault();builder.name=$('routine-name').value.trim();delete builder.description;if(builder.kind==='meditation'){builder.seconds=Number($('meditation-minutes').value)*60;builder.guidance=$('meditation-guidance').value;const breathing=readBreathing();builder.breathing=builder.guidance==='silent'&&!M.breathingValid({breathing})?M.breathingSettings(builder):breathing;}if(!M.routineValid(builder)){$('builder-error').textContent='Ange ett namn och giltiga tider för passet.';return;}if(S.put({id:builder.id,type:'routine',routine:builder,updatedAt:Date.now()})){selected[kind]=builder.id;savePrefs();libraryGroup='own';SurfaceMotion.closeDialog($('builder-dialog'));renderHome();toast(builderExisting?'Passmallen är uppdaterad.':'Passmallen är sparad.');}else $('builder-error').textContent='Vänta tills ditt konto har laddats.';};
  // "Starta" in the builder: an untouched ready-made template starts as it is; anything
  // changed (or your own template) is saved first, then the pass begins.
  $('builder-start').onclick=()=>{
    if(!builder||!readBuilderForm())return;
    const originId=builderOrigin.split('|')[0],untouched=builderOrigin&&!builderExisting&&builderOrigin===originId+'|'+builderShape(builder)&&M.routines.some(p=>p.id===originId);
    if(untouched)selected[kind]=originId;
    else{if(!S.put({id:builder.id,type:'routine',routine:builder,updatedAt:Date.now()})){$('builder-error').textContent='Vänta tills ditt konto har laddats.';return;}selected[kind]=builder.id;libraryGroup='own';}
    savePrefs();SurfaceMotion.closeDialog($('builder-dialog'));renderHome();startSession();
  };
  $('start-button').onclick=startSession;
  $('resume-button').onclick=()=>{if(S.active){const s=S.active;openSession(s.paused?M.resume(s,Date.now()):s);S.setActive(session);}};
  $('discard-button').onclick=()=>confirm('Avbryta det pågående passet?','Passet sparas inte i historiken.','Avbryt passet',()=>{session=null;S.setActive(null);});
  $('pause-session').onclick=()=>{if(!session||ending)return;if(session.paused){breathOffset=M.position(session,Date.now()).spent;session=M.resume(session,Date.now()+(session.routine.kind==='meditation'?3000:0));}else session=M.pause(session,Date.now());S.setActive(session);tick();};
  $('leave-session').onclick=()=>{session=M.pause(session,Date.now());S.setActive(session);showView('home');renderHome();};
  $('next-step').onclick=e=>{if(e.target.id==='guidance-toggle'){session.guidanceSwitched=true;session.routine.guidance=session.routine.guidance==='breath'?'silent':'breath';breathOffset=M.position(session,Date.now()).spent;S.setActive(session);tick();}};
  $('finish-session').onclick=()=>{session=M.pause(session,Date.now());S.setActive(session);tick();if(view!=='session')return;confirm('Avsluta passet?','Den genomförda tiden kan sparas i historiken.','Avsluta',()=>complete(true));};
  $('sound-toggle').onclick=()=>{sound=!sound;savePrefs();updateSound();if(sound)playDing();else updateBreathAudio(false);};
  document.querySelectorAll('[data-feeling]').forEach(b=>b.onclick=()=>{if(!pendingRecord)return;pendingRecord.feeling=pendingRecord.feeling===b.dataset.feeling?'':b.dataset.feeling;document.querySelectorAll('[data-feeling]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.feeling===pendingRecord.feeling)));});
  $('save-session').onclick=saveComplete;$('cancel-complete').onclick=()=>confirm('Lämna utan att spara?','Passet läggs inte till i historiken.','Lämna',()=>{session=null;pendingRecord=null;S.setActive(null);showView('home');renderHome();});
  $('history').onclick=e=>{
    const del=e.target.closest('[data-delete]');
    if(del){confirm('Ta bort passet?','Statistik och milstolpar räknas om när passet tas bort.','Ta bort',()=>S.remove(del.dataset.delete));return;}
    const again=e.target.closest('[data-again]');
    if(again){const r=records().find(x=>x.id===again.dataset.again),routine=M.redoRoutine(r);if(!routine)return;if(S.active){confirm('Du har ett pågående pass','Fortsätt passet från startsidan eller avbryt det och starta ett nytt.','Starta nytt pass',()=>{S.setActive(null);runRoutine(routine);});return;}runRoutine(routine);return;}
    const edit=e.target.closest('[data-edit-session]');
    if(edit){
      const r=records().find(r=>r.id===edit.dataset.editSession);if(!r)return;
      editingHistoryId=r.id;editingHistoryVersion=r.updatedAt;loggingManual=false;
      $('history-edit-eyebrow').textContent='REDIGERA SPARAT PASS';$('history-edit-submit').textContent='Spara ändringar';$('history-edit-routine-row').hidden=true;
      const date=new Date(r.completedAt);
      $('history-edit-title').textContent=r.name;
      $('history-edit-date').value=new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);
      $('history-edit-minutes').value=Math.floor(r.seconds/60);
      $('history-edit-seconds').value=r.seconds%60;
      $('history-edit-note').value=r.note;
      $('history-edit-error').textContent='';
      SurfaceMotion.showDialog($('history-edit-dialog'));$('history-edit-title').focus({preventScroll:true});
      return;
    }
    const trigger=e.target.closest('[data-history]');
    if(trigger){const rid=trigger.dataset.history;if(expandedHistory.has(rid))expandedHistory.delete(rid);else expandedHistory.add(rid);trigger.setAttribute('aria-expanded',String(expandedHistory.has(rid)));$( 'zen-history-'+rid ).hidden=!expandedHistory.has(rid);}
  };
  // S06: log a stretch or meditation done without the timer. Only the total time is known,
  // so no movements are stored and muscle statistics are left untouched.
  let loggingManual=false,manualMinutesTouched=false;
  const localInput=ms=>{const d=new Date(ms);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};
  $('log-manual').onclick=()=>{
    if(!S.ready){toast('Vänta tills ditt konto har laddats.');return;}
    loggingManual=true;editingHistoryId=null;manualMinutesTouched=false;
    const list=routines().filter(r=>r.kind===kind),current=chosen();
    $('history-edit-eyebrow').textContent=kind==='stretch'?'STRETCH':'MEDITATION';
    $('history-edit-title').textContent='Logga genomfört pass';$('history-edit-submit').textContent='Spara i historiken';
    $('history-edit-routine-row').hidden=false;
    $('history-edit-routine').innerHTML='<option value="">Inget särskilt pass</option>'+list.map(r=>'<option value="'+escape(r.id)+'">'+escape(r.name)+' · '+mins(M.duration(r))+' min</option>').join('');
    $('history-edit-routine').value=current.id;
    $('history-edit-date').value=localInput(Date.now());
    $('history-edit-minutes').value=Math.round(M.duration(current)/60);$('history-edit-seconds').value=0;
    $('history-edit-note').value='';$('history-edit-error').textContent='';
    SurfaceMotion.showDialog($('history-edit-dialog'));$('history-edit-title').focus({preventScroll:true});
  };
  $('history-edit-minutes').addEventListener('input',()=>{manualMinutesTouched=true;});
  $('history-edit-routine').onchange=()=>{const r=routines().find(x=>x.id===$('history-edit-routine').value);if(r&&!manualMinutesTouched){$('history-edit-minutes').value=Math.round(M.duration(r)/60);$('history-edit-seconds').value=0;}};
  $('history-edit-form').onsubmit=e=>{
    e.preventDefault();
    if(loggingManual){
      const minutes=Number($('history-edit-minutes').value),secondsPart=Number($('history-edit-seconds').value),seconds=minutes*60+secondsPart;
      const completedAt=new Date($('history-edit-date').value).getTime(),note=$('history-edit-note').value.trim();
      const r=routines().find(x=>x.id===$('history-edit-routine').value);
      if(!Number.isInteger(minutes)||minutes<0||!Number.isInteger(secondsPart)||secondsPart<0||secondsPart>59||seconds<1||seconds>12000||!Number.isFinite(completedAt)||completedAt<=0||note.length>500){$('history-edit-error').textContent='Ange en giltig tid (högst 200 minuter), datum och anteckning.';return;}
      if(completedAt>Date.now()+60000){$('history-edit-error').textContent='Ett genomfört pass kan inte ligga i framtiden.';return;}
      const record={id:id(),type:'session',name:r?r.name:(kind==='stretch'?'Stretch':'Meditation'),kind,seconds,completedAt,updatedAt:Date.now(),note,feeling:'',manual:true,
        ...(r&&r.kind==='meditation'?{guidance:r.guidance,breathing:M.breathingSettings(r),plannedSeconds:r.seconds}:{}),
        ...(r&&r.kind==='stretch'?{plan:r.steps.map(x=>({id:x.id||'',seconds:x.seconds})).filter(x=>x.id)}:{})};
      if(record.plan&&!record.plan.length)delete record.plan;
      if(!S.put(record)){$('history-edit-error').textContent='Kunde inte spara passet.';return;}
      loggingManual=false;SurfaceMotion.closeDialog($('history-edit-dialog'));renderHome();toast('Passet är loggat.');return;
    }
    const r=records().find(r=>r.id===editingHistoryId);
    if(!r){$('history-edit-error').textContent='Passet finns inte längre. Uppdatera historiken.';return;}
    if(r.updatedAt!==editingHistoryVersion){$('history-edit-error').textContent='Passet har ändrats på en annan enhet. Stäng och öppna passet igen.';return;}
    const minutes=Number($('history-edit-minutes').value),secondsPart=Number($('history-edit-seconds').value);
    const seconds=minutes*60+secondsPart,completedAt=new Date($('history-edit-date').value).getTime();
    const note=$('history-edit-note').value.trim();
    if(!Number.isInteger(minutes)||minutes<0||!Number.isInteger(secondsPart)||secondsPart<0||secondsPart>59||!Number.isInteger(seconds)||seconds<1||seconds>12000||!Number.isFinite(completedAt)||completedAt<=0||note.length>500){$('history-edit-error').textContent='Ange en giltig tid (högst 200 minuter), datum och anteckning.';return;}
    // A new total no longer matches the recorded step times; keep them but leave them out of muscle statistics.
    const changed={...r,seconds,completedAt,note,updatedAt:Math.max(Date.now(),r.updatedAt+1),...(Array.isArray(r.steps)&&seconds!==r.seconds?{stepsUnverified:true}:{})};
    if(!S.put(changed)){$('history-edit-error').textContent='Kunde inte spara ändringarna.';return;}
    SurfaceMotion.closeDialog($('history-edit-dialog'));editingHistoryId=null;renderHome();toast('Passet har uppdaterats.');
  };
  $('history-edit-dialog').addEventListener('close',()=>{editingHistoryId=null;loggingManual=false;});
  $('history-more').onclick=()=>{allHistory=!allHistory;renderHome();};
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>SurfaceMotion.closeDialog($(b.dataset.close)));
  function setZenMenu(open){$('zen-menu').hidden=!open;$('zen-menu-toggle').setAttribute('aria-expanded',String(open));}
  $('zen-menu-toggle').onclick=e=>{e.stopPropagation();setZenMenu($('zen-menu').hidden);};
  document.addEventListener('click',e=>{if(!$('zen-menu').hidden&&!e.target.closest('#zen-menu,#zen-menu-toggle'))setZenMenu(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('zen-menu').hidden){setZenMenu(false);$('zen-menu-toggle').focus();}});
  $('settings-open').onclick=$('storage-status').onclick=()=>{setZenMenu(false);SurfaceMotion.showDialog($('settings-dialog'));};
  $('medi-length').onclick=e=>{const b=e.target.closest('[data-medi-min]');if(!b)return;const r=chosen(),m=Number(b.dataset.mediMin);tempMinutes=m===Math.round(M.duration(r)/60)?0:m;renderHome();};
  $('export-data').onclick=()=>{if(!S.ready){toast('Vänta tills ditt konto har laddats.');return;}const blob=new Blob([JSON.stringify(S.export(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='zen-'+S.profile+'-'+M.localDate(Date.now())+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),5000);};
  $('import-data').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>10000000)throw Error('Filen är för stor. Välj en Zen-säkerhetskopia under 10 MB.');const data=JSON.parse(await file.text());const count=S.import(data);$('import-result').textContent=count+' sparade uppgifter inlästa. Befintliga pass har behållits.';}catch(error){$('import-result').textContent=error instanceof SyntaxError?'Filen kunde inte läsas som en Zen-säkerhetskopia.':error.message;}e.target.value='';};
  /* M04: what happens when the screen locks or another app opens.
     Stretch pauses: the movements are shown on screen, so the pass waits for you.
     Meditation keeps its time: the end is correct when you come back, but the
     browser cannot promise sound while the page is hidden, so signals stop until then. */
  document.addEventListener('visibilitychange',()=>{
    document.body.classList.toggle('page-hidden',document.hidden);
    if(document.hidden){
      updateBreathAudio(false);
      if(view==='session'&&session&&!session.paused&&!ending&&session.routine.kind==='stretch'){session=M.pause(session,Date.now());S.setActive(session);autoPaused=true;}
      return;
    }
    const finishedAway=view==='session'&&session&&!ending&&session.routine.kind==='meditation'&&M.position(session,Date.now()).done;
    tick();
    if(autoPaused){autoPaused=false;toast('Passet pausades när skärmen släcktes. Tryck Fortsätt när du är redo.');}
    else if(finishedAway)toast('Meditationen blev klar medan skärmen var släckt.');
  });
  window.addEventListener('pagehide',()=>{updateBreathAudio(false);if(session)S.setActive(session);});
  S.subscribe(()=>{$('storage-status').textContent=S.status;$('sync-description').textContent=S.description;$('sync-account').textContent=S.account?'Inloggat konto: '+S.account:'Logga in med samma Firebase-konto på båda enheterna.';$('retry-sync').hidden=!S.needsRetry;$('start-button').disabled=!S.ready;document.dispatchEvent(new Event('zen:home-rendered'));if(S.ready&&!readyOnce){readyOnce=true;setKind(kind);if(autostart){try{const route=new URL(location.href);route.searchParams.delete('autostart');history.replaceState(history.state,'',route.href);}catch(_){}setTimeout(()=>startSession(true),60);}}if(view==='home')renderHome();});
  $('retry-sync').onclick=()=>{if(S.retry())toast('Försöker synka dina lokala pass mot Firebase…');};
  setKind(kind);setInterval(()=>{if(!document.hidden)tick();else updateBreathAudio(false);},200);
})();
