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
  let kind=prefs.kind==='meditation'?'meditation':'stretch',selected={stretch:'forest',meditation:'water'},view='home',session=null,pendingRecord=null,builder=null,builderExisting=false,allHistory=false,sound=prefs.sound===true,audioContext=null,toastTimer,lastStep=-1,lastPhase='',confirmAction=null,readyOnce=false;
  const copy={
    stretch:{eyebrow:'RÖRLIGHET',title:'Stretch',description:'Välj ett pass för hela kroppen eller fokusera på ett område.',symbol:'✧',hint:'Övningarna kräver inga redskap.',growth:'Statistik',growthEyebrow:'ÖVERSIKT',collection:'Milstolpar',home:'← Till startsidan'},
    meditation:{eyebrow:'ANDNING & FOKUS',title:'Meditation',description:'Välj längd och meditera med andningsguide eller i egen takt.',symbol:'≈',hint:'Andningsguiden kan stängas av under passet.',growth:'Statistik',growthEyebrow:'ÖVERSIKT',collection:'Milstolpar',home:'← Till startsidan'}
  };
  function savePrefs(){prefs={kind,sound};try{localStorage.setItem(prefKey,JSON.stringify(prefs));}catch(_){} }
  function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
  function routines(){return [...M.routines,...S.entries.filter(e=>e.type==='routine').map(e=>e.routine)];}
  function chosen(){return routines().find(r=>r.id===selected[kind]&&r.kind===kind)||M.routines.find(r=>r.kind===kind);}
  function records(){return S.entries.filter(e=>e.type==='session');}
  function setKind(next){kind=next;allHistory=false;document.body.dataset.kind=kind;document.querySelector('meta[name=theme-color]').content=kind==='stretch'?'#091d18':'#a7c3bd';const c=copy[kind];
    $('hero-eyebrow').textContent=c.eyebrow;$('hero-title').innerHTML=c.title;$('hero-description').innerHTML=c.description;$('selected-symbol').textContent=c.symbol;$('start-hint').textContent=c.hint;$('growth-title').textContent=c.growth;$('growth-eyebrow').textContent=c.growthEyebrow;$('collection-title').textContent=c.collection;$('leave-session').textContent=c.home;
    document.querySelectorAll('.kind-switch button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kind===kind)));savePrefs();renderHome();
  }
  function renderHome(){
    const r=chosen();$('selected-name').textContent=r.name;$('selected-meta').textContent=mins(M.duration(r))+' min · '+(kind==='stretch'?r.steps.length+' övningar':r.guidance==='breath'?'guidad andning':'utan guide');
    const symbols=kind==='stretch'?['✧','⌁','⋮']:['≈','◌','○'];
    $('routines').innerHTML=routines().filter(r=>r.kind===kind).map((r,i)=>'<article class="ritual-card"><button class="ritual-choice" data-select="'+escape(r.id)+'" aria-pressed="'+(r.id===chosen().id)+'"><span class="ritual-top"><span class="ritual-glyph" aria-hidden="true">'+symbols[i%3]+'</span><span class="ritual-time">'+mins(M.duration(r))+' MIN'+(i>2?' · EGET PASS':'')+'</span></span><strong>'+escape(r.name)+'</strong><span class="ritual-description">'+escape(r.description||(kind==='stretch'?'Egna övningar och tider.':'Egen längd och vägledning.'))+'</span>'+(kind==='meditation'?'<span class="ritual-selection" aria-hidden="true">✓</span>':'')+'</button>'+(i>2?'<div class="ritual-tools"><button class="text-button" data-edit="'+escape(r.id)+'">Redigera</button><button class="text-button" data-remove="'+escape(r.id)+'">Ta bort</button></div>':'')+'</article>').join('');
    const st=M.stats(records(),kind,Date.now()),weekly=st.week.reduce((n,d)=>n+d.minutes,0);$('weekly-minutes').innerHTML=escape(Number(weekly.toFixed(1)).toLocaleString('sv-SE'))+'<small>minuter</small>';$('weekly-copy').textContent=weekly?'Sammanlagd tid denna vecka.':'Inga pass sparade denna vecka.';$('total-minutes').textContent=st.minutes;$('total-sessions').textContent=st.count;$('streak-days').textContent=st.streak;
    const days=['Mån','Tis','Ons','Tor','Fre','Lör','Sön'],max=Math.max(10,...st.week.map(d=>d.minutes));
    $('week-chart').innerHTML=st.week.map((d,i)=>'<div class="day-column '+(d.date===M.localDate(Date.now())?'today':'')+'"><span class="day-minutes">'+(d.minutes?Number(d.minutes.toFixed(1)).toLocaleString('sv-SE'):'·')+'</span><div class="day-track"><span class="day-fill '+(!d.minutes?'empty':'')+'" style="height:'+Math.max(4,d.minutes/max*100)+'%"></span></div><span class="day-label">'+days[i]+'</span></div>').join('');
    $('week-chart').setAttribute('aria-label','Minuter denna vecka: '+st.week.map((d,i)=>days[i]+' '+Number(d.minutes.toFixed(1))).join(', '));
    const milestones=kind==='stretch'?[['✧','Första passet','1 sparat pass',st.count,1],['⌁','5 pass','5 sparade pass',st.count,5],['✦','60 minuter','60 minuter totalt',st.minutes,60],['∞','10 dagar','10 olika dagar',st.days,10]]:[['◌','Första passet','1 sparat pass',st.count,1],['≈','5 pass','5 sparade pass',st.count,5],['☼','60 minuter','60 minuter totalt',st.minutes,60],['∞','10 dagar','10 olika dagar',st.days,10]];
    $('collection').innerHTML=milestones.map(([symbol,name,desc,value,goal])=>'<article class="keepsake '+(value>=goal?'unlocked':'')+'"><span class="keepsake-symbol" aria-hidden="true">'+symbol+'</span><h3>'+name+'</h3><p>'+desc+'</p><small>'+(value>=goal?'Uppnått':Math.min(value,goal)+' / '+goal)+'</small></article>').join('');
    const history=records().filter(r=>r.kind===kind).sort((a,b)=>b.completedAt-a.completedAt);$('history-more').hidden=history.length<=5;$('history-more').textContent=allHistory?'Visa färre':'Visa alla ('+history.length+')';
    $('history').innerHTML=history.length?(allHistory?history:history.slice(0,5)).map(r=>'<article class="history-row"><span class="small-symbol" aria-hidden="true">'+copy[kind].symbol+'</span><div><h3>'+escape(r.name)+'</h3><time datetime="'+new Date(r.completedAt).toISOString()+'">'+new Date(r.completedAt).toLocaleString('sv-SE',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})+'</time>'+(r.feeling?'<p>'+escape(feelingLabel(r.feeling))+'</p>':'')+(r.note?'<p class="history-note">'+escape(r.note)+'</p>':'')+'</div><span class="history-length">'+mins(r.seconds)+' min</span><button class="text-button" data-delete="'+escape(r.id)+'" aria-label="Ta bort '+escape(r.name)+'">×</button></article>').join(''):'<p class="history-empty">Inga sparade pass ännu.</p>';
    $('resume-banner').hidden=!S.active;$('start-button').disabled=!S.ready;
  }
  function feelingLabel(value){return {lighter:'Lite lättare',calm:'Lugnare',present:'Mer närvarande'}[value]||'';}
  function showView(next){view=next;for(const name of ['home','session','complete'])$(name+'-view').hidden=name!==next;document.body.classList.toggle('in-session',next!=='home');if(next==='home'){document.body.classList.remove('is-paused');document.title='Zen · Stretch och meditation';}window.scrollTo(0,0);}
  function confirm(title,message,yes,action){$('confirm-title').textContent=title;$('confirm-copy').textContent=message;$('confirm-yes').textContent=yes;$('confirm-no').textContent='Tillbaka';confirmAction=action;$('confirm-dialog').showModal();}
  $('confirm-yes').onclick=()=>{const action=confirmAction;confirmAction=null;$('confirm-dialog').close();if(action)action();};$('confirm-no').onclick=()=>$('confirm-dialog').close();$('confirm-dialog').addEventListener('close',()=>confirmAction=null);
  function openSession(s){session=s;setKind(s.routine.kind);lastStep=-1;lastPhase='';showView('session');$('session-routine-name').textContent=session.routine.name;updateSound();tick();$('session-title').focus();}
  function startSession(){
    if(!S.ready)return;
    if(S.active){confirm('Du har ett pågående pass','Fortsätt passet från startsidan eller avbryt det och starta ett nytt.','Starta nytt pass',()=>{S.setActive(null);startSession();});return;}
    session=M.start(chosen(),Date.now(),id());S.setActive(session);openSession(session);chime();
  }
  function tick(){
    if(view!=='session'||!session)return;
    const now=Date.now(),p=M.position(session,now);
    if(p.done){complete(false);return;}
    const isStretch=session.routine.kind==='stretch';
    if(isStretch&&lastStep!==p.index){lastStep=p.index;const step=session.routine.steps[p.index];$('session-overline').textContent='RÖRELSE '+(p.index+1)+' AV '+session.routine.steps.length;$('session-title').textContent=step.name;$('session-cue').textContent=step.cue;$('next-step').textContent=p.index+1<session.routine.steps.length?'Sedan · '+session.routine.steps[p.index+1].name:'Sista övningen i passet.';if(p.index>0)chime();}
    if(!isStretch){$('session-overline').textContent='MEDITATION';$('session-title').textContent=session.routine.guidance==='breath'?'Guidad andning':'Meditation utan guide';$('session-cue').textContent=session.routine.guidance==='breath'?'Andas in i 4 sekunder och ut i 6. Byt till egen andning om rytmen inte känns bekväm.':'Rikta uppmärksamheten mot andningen. När du märker att du tänker på annat, återgå till andetagen.';
      const action=session.routine.guidance==='breath'?'Byt till egen andning':'Visa andningsguide';if(!$('guidance-toggle')||$('guidance-toggle').textContent!==action)$('next-step').innerHTML='<button class="text-button" id="guidance-toggle">'+action+'</button>';
    }
    const cycle=(p.spent%10),guided=!isStretch&&session.routine.guidance==='breath';
    const phase=session.paused?'Pausat':guided?(cycle<4?'Andas in':'Andas ut'):isStretch?'Återstående tid':'Egen andning';
    if(phase!==lastPhase){$('breath-label').textContent=phase;lastPhase=phase;}
    const scale=guided?.84+.23*(cycle<4?(1-Math.cos(Math.PI*cycle/4))/2:(1+Math.cos(Math.PI*(cycle-4)/6))/2):1;$('breathing-field').style.setProperty('--breath-scale',scale.toFixed(4));
    $('session-clock').textContent=fmt(p.remaining);$('clock-caption').textContent=isStretch?'kvar i rörelsen':'kvar av passet';$('session-elapsed').textContent=fmt(Math.floor(p.spent))+' / '+fmt(p.total);$('session-progress-fill').style.width=(p.spent/p.total*100)+'%';document.querySelector('.session-progress').setAttribute('aria-valuenow',String(Math.round(p.spent/p.total*100)));
    $('pause-session').textContent=session.paused?'Fortsätt':'Pausa';document.body.classList.toggle('is-paused',session.paused);$('session-footnote').textContent=isStretch?'Rör dig mjukt. Backa om något känns obehagligt.':'Du får alltid andas i din egen takt.';document.title=fmt(p.total-p.spent)+' · '+session.routine.name+' · Zen';
  }
  function complete(early){
    if(!session)return;
    session=M.pause(session,Date.now());const seconds=Math.floor(M.elapsed(session,Date.now())/1000);
    if(seconds<1){toast('Passet behöver vara minst en sekund för att sparas.');session=M.resume(session,Date.now());S.setActive(session);return;}
    S.setActive(session);pendingRecord={id:session.id,type:'session',name:session.routine.name,kind:session.routine.kind,seconds,completedAt:early?Date.now():session.anchor,updatedAt:Date.now(),note:'',feeling:''};
    $('complete-summary').textContent=mins(seconds)+' minuter · '+session.routine.name;$('session-note').value='';document.querySelectorAll('[data-feeling]').forEach(b=>b.setAttribute('aria-pressed','false'));showView('complete');$('complete-title').focus();chime();document.title='Passet avslutat · Zen';
  }
  function saveComplete(){
    if(!pendingRecord)return;const record={...pendingRecord,note:$('session-note').value.trim(),updatedAt:Date.now()};
    if(S.put(record)){pendingRecord=null;session=null;S.setActive(null);showView('home');renderHome();$('hero-title').setAttribute('tabindex','-1');$('hero-title').focus();toast('Passet är sparat.');}
  }
  function updateSound(){$('sound-toggle').textContent=sound?'Klang på':'Klang av';$('sound-toggle').setAttribute('aria-pressed',String(sound));}
  function chime(){
    if(!sound||document.hidden)return;
    try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;if(!audioContext)audioContext=new Audio();if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});const now=audioContext.currentTime;[392,784,1176].forEach((f,i)=>{const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();oscillator.type='sine';oscillator.frequency.value=f;gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.075/(i+1),now+.03);gain.gain.exponentialRampToValueAtTime(.0001,now+2.7);oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(now);oscillator.stop(now+3);});}catch(_){sound=false;updateSound();toast('Klang kunde inte startas i den här webbläsaren.');}
  }
  function openBuilder(r,isNew){builder=JSON.parse(JSON.stringify(r));builderExisting=!isNew&&!M.routines.some(p=>p.id===r.id);if(!builderExisting)builder.id=id();$('routine-name').value=isNew?'Min '+(kind==='stretch'?'stretch':'meditation'):r.name;$('builder-error').textContent='';$('stretch-builder').hidden=kind!=='stretch';$('meditation-builder').hidden=kind!=='meditation';$('meditation-minutes').value=builder.seconds?builder.seconds/60:10;$('meditation-guidance').value=builder.guidance||'breath';$('pose-select').innerHTML=M.poses.map(p=>'<option value="'+p.id+'">'+escape(p.name)+'</option>').join('');renderBuilder();$('builder-dialog').showModal();}
  function renderBuilder(){
    if(!builder)return;
    if(builder.kind==='stretch')$('builder-steps').innerHTML=builder.steps.map((s,i)=>'<div class="builder-step"><span class="builder-step-name">'+escape(s.name)+'<small>sekunder</small></span><input type="number" min="15" max="600" step="15" value="'+s.seconds+'" data-step-time="'+i+'" aria-label="Sekunder för '+escape(s.name)+'"><button type="button" data-up="'+i+'" '+(i===0?'disabled':'')+' aria-label="Flytta '+escape(s.name)+' uppåt">↑</button><button type="button" data-down="'+i+'" '+(i===builder.steps.length-1?'disabled':'')+' aria-label="Flytta '+escape(s.name)+' nedåt">↓</button><button type="button" data-remove-step="'+i+'" '+(builder.steps.length===1?'disabled':'')+' aria-label="Ta bort '+escape(s.name)+'">×</button></div>').join('');
    $('add-pose').disabled=builder.kind==='stretch'&&builder.steps.length>=20;builderTotal();
  }
  function builderTotal(){if(!builder)return;const seconds=builder.kind==='stretch'?M.duration(builder):Number($('meditation-minutes').value)*60;$('builder-total').textContent=Number.isFinite(seconds)?mins(seconds)+' minuter totalt':'';}
  document.querySelectorAll('.kind-switch button').forEach(b=>b.onclick=()=>setKind(b.dataset.kind));
  $('routines').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.select){selected[kind]=b.dataset.select;renderHome();}if(b.dataset.edit){const r=routines().find(r=>r.id===b.dataset.edit);if(r)openBuilder(r,false);}if(b.dataset.remove){const rid=b.dataset.remove;confirm('Ta bort passmallen?','Genomförda pass finns kvar i historiken.','Ta bort',()=>S.remove(rid));}};
  $('selected-edit').onclick=()=>openBuilder(chosen(),false);$('create-routine').onclick=()=>openBuilder(kind==='stretch'?{id:id(),kind,name:'',steps:[{...M.poses[0],seconds:60},{...M.poses[9],seconds:60}]}:{id:id(),kind,name:'',seconds:600,guidance:'breath'},true);
  $('builder-steps').oninput=e=>{if(e.target.matches('[data-step-time]')){builder.steps[Number(e.target.dataset.stepTime)].seconds=Number(e.target.value);builderTotal();}};
  $('builder-steps').onclick=e=>{const b=e.target.closest('button');if(!b)return;for(const [attr,delta]of [['up',-1],['down',1]])if(b.dataset[attr]!==undefined){const i=Number(b.dataset[attr]),j=i+delta;if(j>=0&&j<builder.steps.length)[builder.steps[i],builder.steps[j]]=[builder.steps[j],builder.steps[i]];}if(b.dataset.removeStep!==undefined&&builder.steps.length>1)builder.steps.splice(Number(b.dataset.removeStep),1);renderBuilder();};
  $('add-pose').onclick=()=>{if(builder.steps.length<20){builder.steps.push({...M.poses.find(p=>p.id===$('pose-select').value),seconds:60});renderBuilder();}};$('meditation-minutes').oninput=builderTotal;
  $('builder-form').onsubmit=e=>{e.preventDefault();builder.name=$('routine-name').value.trim();if(builder.kind==='meditation'){builder.seconds=Number($('meditation-minutes').value)*60;builder.guidance=$('meditation-guidance').value;}if(!M.routineValid(builder)){$('builder-error').textContent='Ange ett namn och giltiga tider för passet.';return;}if(S.put({id:builder.id,type:'routine',routine:builder,updatedAt:Date.now()})){selected[kind]=builder.id;$('builder-dialog').close();renderHome();toast(builderExisting?'Passmallen är uppdaterad.':'Passmallen är sparad.');}else $('builder-error').textContent='Vänta tills ditt konto har laddats.';};
  $('start-button').onclick=startSession;
  $('resume-button').onclick=()=>{if(S.active){const s=S.active;openSession(s.paused?M.resume(s,Date.now()):s);S.setActive(session);}};
  $('discard-button').onclick=()=>confirm('Avbryta det pågående passet?','Passet sparas inte i historiken.','Avbryt passet',()=>S.setActive(null));
  $('pause-session').onclick=()=>{session=session.paused?M.resume(session,Date.now()):M.pause(session,Date.now());S.setActive(session);tick();};
  $('leave-session').onclick=()=>{session=M.pause(session,Date.now());S.setActive(session);showView('home');renderHome();};
  $('next-step').onclick=e=>{if(e.target.id==='guidance-toggle'){session.routine.guidance=session.routine.guidance==='breath'?'silent':'breath';S.setActive(session);tick();}};
  $('finish-session').onclick=()=>{session=M.pause(session,Date.now());S.setActive(session);tick();if(view!=='session')return;confirm('Avsluta passet?','Den genomförda tiden kan sparas i historiken.','Avsluta',()=>complete(true));};
  $('sound-toggle').onclick=()=>{sound=!sound;savePrefs();updateSound();if(sound)chime();};
  document.querySelectorAll('[data-feeling]').forEach(b=>b.onclick=()=>{if(!pendingRecord)return;pendingRecord.feeling=pendingRecord.feeling===b.dataset.feeling?'':b.dataset.feeling;document.querySelectorAll('[data-feeling]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.feeling===pendingRecord.feeling)));});
  $('save-session').onclick=saveComplete;$('cancel-complete').onclick=()=>confirm('Lämna utan att spara?','Passet läggs inte till i historiken.','Lämna',()=>{session=null;pendingRecord=null;S.setActive(null);showView('home');renderHome();});
  $('history').onclick=e=>{const b=e.target.closest('[data-delete]');if(b)confirm('Ta bort passet?','Statistik och milstolpar räknas om när passet tas bort.','Ta bort',()=>S.remove(b.dataset.delete));};$('history-more').onclick=()=>{allHistory=!allHistory;renderHome();};
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
  $('settings-open').onclick=$('storage-status').onclick=()=>$('settings-dialog').showModal();
  $('export-data').onclick=()=>{if(!S.ready){toast('Vänta tills ditt konto har laddats.');return;}const blob=new Blob([JSON.stringify(S.export(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='zen-'+S.profile+'-'+M.localDate(Date.now())+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),5000);};
  $('import-data').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>10000000)throw Error('Filen är för stor. Välj en Zen-säkerhetskopia under 10 MB.');const data=JSON.parse(await file.text());const count=S.import(data);$('import-result').textContent=count+' sparade uppgifter inlästa. Befintliga pass har behållits.';}catch(error){$('import-result').textContent=error instanceof SyntaxError?'Filen kunde inte läsas som en Zen-säkerhetskopia.':error.message;}e.target.value='';};
  document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('page-hidden',document.hidden);if(!document.hidden)tick();});
  window.addEventListener('pagehide',()=>{if(session)S.setActive(session);});
  $('profile-name').textContent=(S.profile==='maja'?'Maja':'Markus');
  S.subscribe(()=>{$('storage-status').textContent=S.status;$('sync-description').textContent=S.description;$('start-button').disabled=!S.ready;if(S.ready&&!readyOnce){readyOnce=true;setKind(kind);}if(view==='home')renderHome();});
  setKind(kind);setInterval(()=>{if(!document.hidden)tick();},200);
})();
