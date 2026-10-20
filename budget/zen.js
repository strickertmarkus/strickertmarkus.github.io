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
  let kind=routeKind==='stretch'||routeKind==='meditation'?routeKind:prefs.kind==='meditation'?'meditation':'stretch',selected={stretch:typeof prefs.selected?.stretch==='string'?prefs.selected.stretch:'forest',meditation:typeof prefs.selected?.meditation==='string'?prefs.selected.meditation:'water'},view='home',session=null,pendingRecord=null,builder=null,builderExisting=false,allHistory=false,sound=prefs.sound===true,audioContext=null,toastTimer,lastStep=-1,lastPhase='',confirmAction=null,readyOnce=false;
  // Native dialogs manage focus; the shared scroll owner preserves the page
  // position, including when a confirmation opens over another dialog.
  const dialogs=Array.from(document.querySelectorAll('dialog.zen-dialog'));
  const syncDialogScroll=()=>dialogs.forEach(dialog=>{
    const owner='zen-dialog:'+dialog.id;
    if(dialog.open)window.TrainingOverlay.acquire(owner);else window.TrainingOverlay.release(owner);
  });
  const dialogObserver=new MutationObserver(syncDialogScroll);
  dialogs.forEach(dialog=>dialogObserver.observe(dialog,{attributes:true,attributeFilter:['open']}));
  syncDialogScroll();
  const copy={
    stretch:{eyebrow:'RÖRLIGHET',title:'Stretch',description:'Välj ett pass för hela kroppen eller fokusera på ett område.',symbol:'✧',hint:'Välj en mall efter ditt träningspass eller bygg ditt eget.',growth:'Statistik',growthEyebrow:'ÖVERSIKT',collection:'Milstolpar',home:'← Till startsidan'},
    meditation:{eyebrow:'ANDNING & FOKUS',title:'Meditation',description:'Välj längd och meditera med andningsguide eller i egen takt.',symbol:'≈',hint:'Andningsguiden kan stängas av under passet.',growth:'Statistik',growthEyebrow:'ÖVERSIKT',collection:'Milstolpar',home:'← Till startsidan'}
  };
  let volume=Number.isFinite(prefs.volume)?Math.max(0,Math.min(100,prefs.volume)):100,prepare=prefs.prepare===true,ending=false,breathOffset=0;
  function savePrefs(){prefs={kind,sound,volume,prepare,selected};try{localStorage.setItem(prefKey,JSON.stringify(prefs));}catch(_){} }
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
    $('hero-eyebrow').textContent=c.eyebrow;$('hero-title').innerHTML=c.title;$('hero-description').innerHTML=c.description;$('selected-symbol').textContent=c.symbol;$('start-hint').textContent=c.hint;$('growth-title').textContent=c.growth;$('growth-eyebrow').textContent=c.growthEyebrow;$('collection-title').textContent=c.collection;$('leave-session').textContent=c.home;
    document.querySelectorAll('.kind-switch button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kind===kind)));savePrefs();renderHome();
  }
  let kindMotionTimer=0,kindMotionToken=0;
  function setKind(next){
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
  function renderHome(){
    const r=chosen();$('selected-name').textContent=r.name;$('selected-meta').textContent=mins(M.duration(r))+' min · '+(kind==='stretch'?r.steps.length+' övningar':r.guidance==='breath'?'guidad andning':'utan guide');
    document.querySelector('.start-ring-symbol').textContent=copy[kind].symbol;
    document.querySelector('.start-ring-name').textContent=r.name;
    document.querySelector('.start-ring-meta').textContent=$('selected-meta').textContent;
    $('start-button').setAttribute('aria-label','Starta '+r.name+', '+$('selected-meta').textContent);
    const symbols=kind==='stretch'?['✧','⌁','⋮']:['≈','◌','○'];
    const builtin=r=>M.routines.some(p=>p.id===r.id),category=$('routine-category').value;
    $('routine-filter').hidden=kind!=='stretch';
    const visible=routines().filter(r=>r.kind===kind&&(kind!=='stretch'||category==='all'||(category==='own'?!builtin(r):builtin(r)&&(r.category||'base')===category)));
    $('routines').innerHTML=visible.map((r,i)=>{
      const own=!builtin(r);
      return '<article class="ritual-card"><button class="ritual-choice" data-select="'+escape(r.id)+'" aria-label="Välj och konfigurera '+escape(r.name)+'" title="Välj och konfigurera" aria-pressed="'+(r.id===chosen().id)+'"><span class="ritual-top"><span class="ritual-glyph" aria-hidden="true">'+symbols[i%3]+'</span><span class="ritual-time">'+mins(M.duration(r))+' MIN · '+(own?'EGEN MALL':'MALL')+'</span></span><strong>'+escape(r.name)+'</strong><span class="ritual-description">'+escape(r.description||(kind==='stretch'?'Egna övningar och tider.':M.breathingSummary(r)))+'</span>'+(kind==='meditation'?'<span class="ritual-selection" aria-hidden="true">✓</span>':'')+'</button><div class="ritual-tools"><button class="text-button" data-edit="'+escape(r.id)+'">'+(own?'Redigera':'Anpassa som egen')+'</button>'+(own?'<button class="text-button" data-remove="'+escape(r.id)+'">Ta bort</button>':'')+'</div></article>';
    }).join('')||'<p class="history-empty">Inga egna mallar ännu. Välj Skapa pass eller anpassa en färdig mall.</p>';

    const st=M.stats(records(),kind,Date.now()),weekly=st.week.reduce((n,d)=>n+d.minutes,0);$('weekly-minutes').innerHTML=escape(Number(weekly.toFixed(1)).toLocaleString('sv-SE'))+'<small>minuter</small>';$('weekly-copy').textContent=weekly?'Sammanlagd tid denna vecka.':'Inga pass sparade denna vecka.';$('total-minutes').textContent=st.minutes;$('total-sessions').textContent=st.count;$('streak-days').textContent=st.streak;
    const days=['Mån','Tis','Ons','Tor','Fre','Lör','Sön'],max=Math.max(10,...st.week.map(d=>d.minutes));
    $('week-chart').innerHTML=st.week.map((d,i)=>'<div class="day-column '+(d.date===M.localDate(Date.now())?'today':'')+'"><span class="day-minutes">'+(d.minutes?Number(d.minutes.toFixed(1)).toLocaleString('sv-SE'):'·')+'</span><div class="day-track"><span class="day-fill '+(!d.minutes?'empty':'')+'" style="height:'+Math.max(4,d.minutes/max*100)+'%"></span></div><span class="day-label">'+days[i]+'</span></div>').join('');
    $('week-chart').setAttribute('aria-label','Minuter denna vecka: '+st.week.map((d,i)=>days[i]+' '+Number(d.minutes.toFixed(1))).join(', '));
    const symbolsMilestone=kind==='stretch'?['✧','⌁','✦','∞']:['◌','≈','☼','∞'];
    $('collection').innerHTML=M.milestones(kind,S.entries).map(m=>{const value=st[m.metric],done=value>=m.goal;return '<article class="keepsake '+(done?'unlocked':'')+'"><span class="keepsake-symbol" aria-hidden="true">'+symbolsMilestone[m.slot]+'</span><h3>'+escape(m.name)+'</h3><p>'+m.goal+' '+M.milestoneMetrics[m.metric]+'</p><small>'+(done?'Uppnått':Math.min(value,m.goal)+' / '+m.goal)+'</small><button class="text-button milestone-edit" data-milestone="'+m.slot+'" aria-label="Redigera '+escape(m.name)+'">Redigera</button></article>';}).join('');
    const history=records().filter(r=>r.kind===kind).sort((a,b)=>b.completedAt-a.completedAt);$('history-more').hidden=history.length<=5;$('history-more').textContent=allHistory?'Visa färre':'Visa alla ('+history.length+')';
    $('history').innerHTML=history.length?(allHistory?history:history.slice(0,5)).map(r=>'<article class="history-row"><span class="small-symbol" aria-hidden="true">'+copy[kind].symbol+'</span><div><h3>'+escape(r.name)+'</h3><time datetime="'+new Date(r.completedAt).toISOString()+'">'+new Date(r.completedAt).toLocaleString('sv-SE',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})+'</time>'+(r.feeling?'<p>'+escape(feelingLabel(r.feeling))+'</p>':'')+(r.note?'<p class="history-note">'+escape(r.note)+'</p>':'')+'</div><span class="history-length">'+mins(r.seconds)+' min</span><button class="text-button" data-delete="'+escape(r.id)+'" aria-label="Ta bort '+escape(r.name)+'">×</button></article>').join(''):'<p class="history-empty">Inga sparade pass ännu.</p>';
    $('resume-banner').hidden=!S.active;$('start-button').disabled=!S.ready;document.dispatchEvent(new Event('zen:home-rendered'));
  }
  function feelingLabel(value){return {lighter:'Lite lättare',calm:'Lugnare',present:'Mer närvarande'}[value]||'';}
  function showView(next){view=next;syncViewTheme();for(const name of ['home','session','complete'])$(name+'-view').hidden=name!==next;document.body.classList.toggle('in-session',next!=='home');document.body.dataset.sessionView=next;document.dispatchEvent(new CustomEvent('zen:session-view',{detail:{view:next,kind}}));if(next==='home'){document.body.classList.remove('is-paused');document.title='Zen · Stretch och meditation';}window.scrollTo(0,0);}
  function confirm(title,message,yes,action){$('confirm-title').textContent=title;$('confirm-copy').textContent=message;$('confirm-yes').textContent=yes;$('confirm-no').textContent='Tillbaka';confirmAction=action;SurfaceMotion.showDialog($('confirm-dialog'));}
  $('confirm-yes').onclick=()=>{const action=confirmAction;confirmAction=null;SurfaceMotion.closeDialog($('confirm-dialog'));if(action)action();};$('confirm-no').onclick=()=>SurfaceMotion.closeDialog($('confirm-dialog'));$('confirm-dialog').addEventListener('close',()=>confirmAction=null);
  function openSession(s){ending=false;document.querySelectorAll('.session-top,.session-layout,.session-bottom').forEach(el=>el.inert=false);$('session-ending').hidden=true;$('session-view').classList.remove('clock-hidden','session-finished');$('clock-toggle').textContent='Dölj tiden';$('clock-toggle').setAttribute('aria-pressed','true');session=s;breathOffset=M.position(s,Date.now()).spent;setKind(s.routine.kind);lastStep=-1;lastPhase='';showView('session');$('session-routine-name').textContent=session.routine.name;updateSound();tick();$('session-title').focus();}
  function startSession(){
    if(!S.ready)return;
    if(S.active){confirm('Du har ett pågående pass','Fortsätt passet från startsidan eller avbryt det och starta ett nytt.','Starta nytt pass',()=>{S.setActive(null);startSession();});return;}
    session=M.start(chosen(),Date.now()+(prepare?5000:0),id());S.setActive(session);openSession(session);playDing();
  }
  function tick(){
    if(view!=='session'||!session||ending)return;
    const now=Date.now(),p=M.position(session,now);
    if(p.done){if(!ending){ending=true;session=M.pause(session,now);S.setActive(session);$('session-ending').hidden=false;$('session-view').classList.add('session-finished');document.querySelectorAll('.session-top,.session-layout,.session-bottom').forEach(el=>el.inert=true);$('session-ending-title').focus();updateBreathAudio(false);document.dispatchEvent(new CustomEvent('zen:session-frame',{detail:{kind,paused:true,done:true,progress:1}}));playDing();}return;}
    const isStretch=session.routine.kind==='stretch',preparing=!session.paused&&now<session.anchor;
    if(isStretch&&lastStep!==p.index){lastStep=p.index;const step=session.routine.steps[p.index];$('session-overline').textContent='RÖRELSE '+(p.index+1)+' AV '+session.routine.steps.length;$('session-title').textContent=step.name;document.querySelector('.session-copy').classList.toggle('is-long',step.name.length>30||step.cue.length>150);$('session-cue').textContent=step.cue;$('next-step').textContent=p.index+1<session.routine.steps.length?'Härnäst · '+session.routine.steps[p.index+1].name:'Sista övningen i passet.';if(p.index>0)playDing();}
    if(!isStretch){$('session-overline').textContent='MEDITATION';$('session-title').textContent=session.routine.guidance==='breath'?'Guidad andning':'Meditation utan guide';$('session-cue').textContent=session.routine.guidance==='breath'?M.breathingSummary(session.routine)+'. Byt till egen andning när du vill.':'Rikta uppmärksamheten mot andningen. När du märker att du tänker på annat, återgå till andetagen.';
      const action=session.routine.guidance==='breath'?'Byt till egen andning':'Visa andningsguide';if(!$('guidance-toggle')||$('guidance-toggle').textContent!==action)$('next-step').innerHTML='<button class="text-button" id="guidance-toggle">'+action+'</button>';
    }
    const guided=!isStretch&&session.routine.guidance==='breath',breathing=M.breathState(session.routine,Math.max(0,p.spent-breathOffset)),cycle=breathing.cycle;
    const phase=session.paused?'Pausat':preparing?'Gör dig redo':guided?breathing.label:isStretch?(session.routine.steps[p.index].id==='rest'?'Släpp efter':'Håll mjukt'):'Egen andning';
    if(phase!==lastPhase){$('breath-label').textContent=phase;lastPhase=phase;}
    const scale=guided&&!preparing?breathing.scale:1;$('breathing-field').style.setProperty('--breath-scale',scale.toFixed(4));
    $('session-clock').textContent=preparing?String(Math.ceil((session.anchor-now)/1000)):fmt(p.remaining);$('clock-caption').textContent=isStretch?'kvar i rörelsen':'kvar av passet';$('session-elapsed').textContent=fmt(Math.floor(M.practiced(session,now)/1000))+' aktiv tid';document.querySelector('.session-progress').setAttribute('aria-valuenow',String(Math.round(p.spent/p.total*100)));
    $('pause-session').textContent=session.paused?'Fortsätt':'Pausa';document.body.classList.toggle('is-paused',session.paused);$('session-footnote').textContent=isStretch?'Rör dig mjukt. Backa om något känns obehagligt.':'Du får alltid andas i din egen takt.';document.title=fmt(p.total-p.spent)+' · '+session.routine.name+' · Zen';
    const step=isStretch?session.routine.steps[p.index]:null;
    $('session-phase-detail').textContent=session.paused?'Ta den tid du behöver':preparing?'Hitta en bekväm position':guided?breathing.seconds+' SEKUNDER · '+({inhale:'IN',exhale:'UT',holdIn:'EFTER IN',holdOut:'EFTER UT'}[breathing.id]):isStretch?'Följ din egen andning':'Ingenting att prestera';
    $('session-side').textContent=step?.id?.endsWith('-left')?'Vänster sida':step?.id?.endsWith('-right')?'Höger sida':'';
    $('previous-step').disabled=isStretch&&p.index===0;
    $('following-step').disabled=isStretch&&p.index===session.routine.steps.length-1;
    $('restart-step').hidden=!isStretch||!session.paused;
    document.dispatchEvent(new CustomEvent('zen:session-frame',{detail:{kind:session.routine.kind,step,index:p.index,steps:session.routine.steps||[],progress:p.spent/p.total,stepProgress:step?1-p.remaining/step.seconds:0,phase,cycle,breathing,guided,preparing,paused:session.paused,scale,volume,sound}}));
    updateBreathAudio(guided&&!preparing&&!session.paused,breathing.id);

  }
  function complete(early){
    if(!session)return;ending=false;$('session-ending').hidden=true;
    session=M.pause(session,Date.now());const seconds=Math.floor(M.practiced(session,Date.now())/1000);
    if(seconds<1){toast('Passet behöver vara minst en sekund för att sparas.');session=M.resume(session,Date.now());S.setActive(session);return;}
    S.setActive(session);pendingRecord={id:session.id,type:'session',name:session.routine.name,kind:session.routine.kind,seconds,completedAt:early?Date.now():session.anchor,updatedAt:Date.now(),note:'',feeling:''};
    $('complete-summary').textContent=mins(seconds)+' minuter · '+session.routine.name;$('session-note').value='';document.querySelectorAll('[data-feeling]').forEach(b=>b.setAttribute('aria-pressed','false'));showView('complete');$('complete-title').focus();playDing();document.title='Passet avslutat · Zen';
  }
  function saveComplete(){
    if(!pendingRecord)return;const record={...pendingRecord,note:$('session-note').value.trim(),updatedAt:Date.now()};
    if(S.put(record)){pendingRecord=null;session=null;S.setActive(null);showView('home');renderHome();$('hero-title').setAttribute('tabindex','-1');$('hero-title').focus();toast('Passet är sparat.');}
  }
  function updateSound(){setDingVolume();$('session-volume').value=volume;$('volume-value').textContent=volume+' %';$('sound-toggle').textContent=sound?'Ljud på':'Ljud av';$('sound-toggle').setAttribute('aria-pressed',String(sound));$('session-audio').dataset.enabled=String(sound);$('session-audio').querySelector('summary').setAttribute('aria-label','Ljudinställningar, ljud '+(sound?'på':'av'));}
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
  function setDingVolume(){if(dingBus)dingBus.gain.setTargetAtTime(sound&&!document.hidden?volume/100:0,audioContext.currentTime,.06);}
  function prepareDing(){
    if(!mixedAudioContext())return false;
    if(!dingBus){
      dingBus=audioContext.createGain();dingBus.gain.value=sound?volume/100:0;dingBus.connect(audioContext.destination);
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
  function updateBreathAudio(active,phase='inhale'){
    if(!active||!sound||document.hidden||view!=='session'||ending){breathSoundPhase=null;return;}
    if(phase!==breathSoundPhase){breathSoundPhase=phase;playDing();}
  }
  document.addEventListener('visibilitychange',()=>{setDingVolume();if(document.hidden)breathSoundPhase=null;});
  document.addEventListener('zen:session-view',()=>updateBreathAudio(false));
  $('show-session-summary').onclick=()=>complete(false);
  $('session-volume').oninput=()=>{volume=Number($('session-volume').value);savePrefs();updateSound();tick();};
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
    const matches=M.poses.filter(p=>(!group||p.group===group)&&(!query||(p.name+' '+p.group).toLocaleLowerCase('sv-SE').includes(query)));
    const previous=$('pose-select').value;
    $('pose-select').innerHTML=matches.length?[...new Set(matches.map(p=>p.group))].map(g=>'<optgroup label="'+escape(g)+'">'+matches.filter(p=>p.group===g).map(p=>'<option value="'+p.id+'">'+escape(p.name)+'</option>').join('')+'</optgroup>').join(''):'<option value="">Inga matchande övningar</option>';
    if(matches.some(p=>p.id===previous))$('pose-select').value=previous;
    $('pose-count').textContent=matches.length+' valbara alternativ · '+window.ZenStretch.families.length+' rörelser, med sidvarianter';
    $('add-pose').disabled=!matches.length||builder.steps.length>=20;updatePoseDescription();
  }
  function updatePoseDescription(){const pose=M.poses.find(p=>p.id===$('pose-select').value);$('pose-description').textContent=pose?pose.cue:'Prova en annan sökning eller muskelgrupp.';}
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
    $('breath-summary').textContent=!guided?'Meditation i egen takt. Timern räknar hela passlängden.':valid?M.breathingSummary(draft)+' — '+total+' sek per varv.':'In och ut: 1–30 sek. Pauser: 0–30 sek.';
    document.querySelectorAll('[data-breath-preset]').forEach(b=>b.setAttribute('aria-pressed',String(valid&&b.dataset.breathPreset===breathKeys.map(k=>draft.breathing[k]).join(','))));
    builderTotal();
  }
  function openBuilder(r,isNew){
    builder=JSON.parse(JSON.stringify(r));builderExisting=!isNew&&!M.routines.some(p=>p.id===r.id);if(!builderExisting)builder.id=id();
    $('routine-name').value=isNew?'Min '+(builder.kind==='stretch'?'stretch':'meditation'):r.name;$('builder-error').textContent='';
    $('builder-title').textContent=builder.kind==='meditation'?'Din meditation':'Anpassa pass';
    const meditation=builder.kind==='meditation';$('stretch-builder').querySelectorAll('input,select,button').forEach(el=>el.disabled=meditation);$('stretch-builder').hidden=meditation;$('meditation-builder').hidden=!meditation;
    $('meditation-minutes').disabled=!meditation;$('meditation-guidance').disabled=!meditation;$('meditation-rhythm').disabled=!meditation;
    if(meditation){$('meditation-minutes').value=builder.seconds/60;$('meditation-guidance').value=builder.guidance;const settings=M.breathingSettings(builder);breathKeys.forEach(k=>$('breath-'+k).value=settings[k]);updateBreathingBuilder();}
    else{$('pose-search').value='';$('pose-group').innerHTML='<option value="">Alla muskelgrupper</option>'+[...new Set(M.poses.map(p=>p.group))].map(g=>'<option>'+escape(g)+'</option>').join('');renderPoseOptions();}
    renderBuilder();SurfaceMotion.showDialog($('builder-dialog'));$('builder-title').focus({preventScroll:true});
  }
  function renderBuilder(){
    if(!builder)return;
    if(builder.kind==='stretch')$('builder-steps').innerHTML=builder.steps.map((s,i)=>'<div class="builder-step"><button type="button" class="step-drag-handle" aria-label="Flytta '+escape(s.name)+'. Dra eller använd piltangenterna." title="Dra för att ändra ordning">⠿</button><span class="builder-step-name">'+escape(s.name)+'<small>sekunder</small></span><input type="number" min="15" max="600" step="15" value="'+s.seconds+'" data-step-time="'+i+'" aria-label="Sekunder för '+escape(s.name)+'"><button type="button" data-remove-step="'+i+'" '+(builder.steps.length===1?'disabled':'')+' aria-label="Ta bort '+escape(s.name)+'">×</button></div>').join('');
    $('add-pose').disabled=builder.kind==='stretch'&&(builder.steps.length>=20||!$('pose-select').value);builderTotal();
  }
  function builderTotal(){if(!builder)return;const seconds=builder.kind==='stretch'?M.duration(builder):Number($('meditation-minutes').value)*60;$('builder-total').textContent=Number.isFinite(seconds)?mins(seconds)+' minuter totalt':'';}
  document.querySelectorAll('.kind-switch button').forEach(b=>b.onclick=()=>setKind(b.dataset.kind));
  $('routines').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.select){selected[kind]=b.dataset.select;savePrefs();renderHome();openBuilder(chosen(),false);}if(b.dataset.edit){const r=routines().find(r=>r.id===b.dataset.edit);if(r)openBuilder(r,false);}if(b.dataset.remove){const rid=b.dataset.remove;confirm('Ta bort passmallen?','Genomförda pass finns kvar i historiken.','Ta bort',()=>S.remove(rid));}};
  const selectedRoutine=document.querySelector('.selected-routine');
  selectedRoutine.onclick=()=>openBuilder(chosen(),false);
  selectedRoutine.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openBuilder(chosen(),false);}};
  $('routine-category').onchange=renderHome;
  $('create-routine').onclick=()=>openBuilder(kind==='stretch'?{id:id(),kind,name:'',steps:[{...M.poses[0],seconds:60},{...M.poses.find(p=>p.id==='rest'),seconds:60}]}:{id:id(),kind,name:'',seconds:600,guidance:'breath'},true);
  $('builder-steps').oninput=e=>{if(e.target.matches('[data-step-time]')){builder.steps[Number(e.target.dataset.stepTime)].seconds=Number(e.target.value);builderTotal();}};
  $('builder-steps').onclick=e=>{const b=e.target.closest('[data-remove-step]');if(b&&builder.steps.length>1){builder.steps.splice(Number(b.dataset.removeStep),1);renderBuilder();}};
  window.ZenBuilderSort.attach($('builder-steps'),(from,to)=>{const [step]=builder.steps.splice(from,1);builder.steps.splice(to,0,step);renderBuilder();$('builder-sort-status').textContent=step.name+' flyttad till plats '+(to+1);});

  $('add-pose').onclick=()=>{const pose=M.poses.find(p=>p.id===$('pose-select').value);if(pose&&builder.steps.length<20){builder.steps.push({...pose,seconds:60});renderBuilder();}};$('meditation-minutes').oninput=builderTotal;
  $('meditation-guidance').onchange=updateBreathingBuilder;breathKeys.forEach(k=>$('breath-'+k).oninput=updateBreathingBuilder);
  document.querySelectorAll('[data-breath-preset]').forEach(b=>b.onclick=()=>{const values=b.dataset.breathPreset.split(',');breathKeys.forEach((k,i)=>$('breath-'+k).value=values[i]);updateBreathingBuilder();});
  $('builder-form').onsubmit=e=>{e.preventDefault();builder.name=$('routine-name').value.trim();delete builder.description;if(builder.kind==='meditation'){builder.seconds=Number($('meditation-minutes').value)*60;builder.guidance=$('meditation-guidance').value;const breathing=readBreathing();builder.breathing=builder.guidance==='silent'&&!M.breathingValid({breathing})?M.breathingSettings(builder):breathing;}if(!M.routineValid(builder)){$('builder-error').textContent='Ange ett namn och giltiga tider för passet.';return;}if(S.put({id:builder.id,type:'routine',routine:builder,updatedAt:Date.now()})){selected[kind]=builder.id;savePrefs();if(kind==='stretch')$('routine-category').value='own';SurfaceMotion.closeDialog($('builder-dialog'));renderHome();toast(builderExisting?'Passmallen är uppdaterad.':'Passmallen är sparad.');}else $('builder-error').textContent='Vänta tills ditt konto har laddats.';};
  $('start-button').onclick=startSession;
  $('resume-button').onclick=()=>{if(S.active){const s=S.active;openSession(s.paused?M.resume(s,Date.now()):s);S.setActive(session);}};
  $('discard-button').onclick=()=>confirm('Avbryta det pågående passet?','Passet sparas inte i historiken.','Avbryt passet',()=>{session=null;S.setActive(null);});
  $('pause-session').onclick=()=>{if(!session||ending)return;if(session.paused){breathOffset=M.position(session,Date.now()).spent;session=M.resume(session,Date.now()+(session.routine.kind==='meditation'?3000:0));}else session=M.pause(session,Date.now());S.setActive(session);tick();};
  $('leave-session').onclick=()=>{session=M.pause(session,Date.now());S.setActive(session);showView('home');renderHome();};
  $('next-step').onclick=e=>{if(e.target.id==='guidance-toggle'){session.routine.guidance=session.routine.guidance==='breath'?'silent':'breath';breathOffset=M.position(session,Date.now()).spent;S.setActive(session);tick();}};
  $('finish-session').onclick=()=>{session=M.pause(session,Date.now());S.setActive(session);tick();if(view!=='session')return;confirm('Avsluta passet?','Den genomförda tiden kan sparas i historiken.','Avsluta',()=>complete(true));};
  $('sound-toggle').onclick=()=>{sound=!sound;savePrefs();updateSound();if(sound)playDing();else updateBreathAudio(false);};
  document.querySelectorAll('[data-feeling]').forEach(b=>b.onclick=()=>{if(!pendingRecord)return;pendingRecord.feeling=pendingRecord.feeling===b.dataset.feeling?'':b.dataset.feeling;document.querySelectorAll('[data-feeling]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.feeling===pendingRecord.feeling)));});
  $('save-session').onclick=saveComplete;$('cancel-complete').onclick=()=>confirm('Lämna utan att spara?','Passet läggs inte till i historiken.','Lämna',()=>{session=null;pendingRecord=null;S.setActive(null);showView('home');renderHome();});
  $('history').onclick=e=>{const b=e.target.closest('[data-delete]');if(b)confirm('Ta bort passet?','Statistik och milstolpar räknas om när passet tas bort.','Ta bort',()=>S.remove(b.dataset.delete));};$('history-more').onclick=()=>{allHistory=!allHistory;renderHome();};
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>SurfaceMotion.closeDialog($(b.dataset.close)));
  $('settings-open').onclick=$('storage-status').onclick=()=>SurfaceMotion.showDialog($('settings-dialog'));
  $('export-data').onclick=()=>{if(!S.ready){toast('Vänta tills ditt konto har laddats.');return;}const blob=new Blob([JSON.stringify(S.export(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='zen-'+S.profile+'-'+M.localDate(Date.now())+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),5000);};
  $('import-data').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>10000000)throw Error('Filen är för stor. Välj en Zen-säkerhetskopia under 10 MB.');const data=JSON.parse(await file.text());const count=S.import(data);$('import-result').textContent=count+' sparade uppgifter inlästa. Befintliga pass har behållits.';}catch(error){$('import-result').textContent=error instanceof SyntaxError?'Filen kunde inte läsas som en Zen-säkerhetskopia.':error.message;}e.target.value='';};
  document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('page-hidden',document.hidden);if(!document.hidden)tick();else updateBreathAudio(false);});
  window.addEventListener('pagehide',()=>{updateBreathAudio(false);if(session)S.setActive(session);});
  S.subscribe(()=>{$('storage-status').textContent=S.status;$('sync-description').textContent=S.description;$('start-button').disabled=!S.ready;document.dispatchEvent(new Event('zen:home-rendered'));if(S.ready&&!readyOnce){readyOnce=true;setKind(kind);}if(view==='home')renderHome();});
  setKind(kind);setInterval(()=>{if(!document.hidden)tick();else updateBreathAudio(false);},200);
})();
