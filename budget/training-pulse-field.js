(function () {
  'use strict';

  var root = document.documentElement;
  var params = new URLSearchParams(location.search);
  var profile = params.get('user') === 'maja' ? 'maja' : 'markus';
var monthNames = ['jan.','feb.','mars','apr.','maj','juni','juli','aug.','sep.','okt.','nov.','dec.'];
  var dayNames = ['Mån','Tis','Ons','Tor','Fre','Lör','Sön'];
  var dayKeys = ['mon','tue','wed','thu','fri','sat','sun'];
  var state = {
    weekStart: startOfWeek(new Date()),
    selectedDate: isoDate(new Date()),
    activityView: 'history',
    activityMetric: 'minutes',
    insight: 'heart',
    insightMode: 'chart',
    chartRange: 'all',
    openLogId: null,
    logTouched: false,
    logVisibleCount: 12,
  };
  var data = {};

  function byId(id) { return document.getElementById(id); }
  var compactHost=null;
  function updateCompactControl(open) {
    var button=byId('training-overview-toggle');
    if(!button)return;
    button.setAttribute('aria-pressed',String(!!open));
    button.setAttribute('aria-label',open?'Compact vy aktiv. Byt till Pulse Field':'Aktivera Compact vy');
    button.title=open?'Compact vy aktiv':'Compact vy';
  }
  function compactFrameUrl() {
    var url=new URL('archive/exercise.html',location.href);
    url.searchParams.set('overview','compact');
    url.searchParams.set('compactHost','1');
    url.searchParams.set('v','20261026-energy-loop-4');
    if(profile==='maja')url.searchParams.set('user','maja');
    return url.href;
  }
  function openOriginalCompact() {
    if(compactHost)return;
    compactHost=document.createElement('section');
    compactHost.id='field-compact-host';
    compactHost.className='field-compact-host';
    compactHost.setAttribute('aria-label','Compact träningsvy');
    var frame=document.createElement('iframe');
    frame.className='field-compact-frame';
    frame.title='Compact träningsvy';
    frame.src=compactFrameUrl();
    frame.setAttribute('loading','eager');
    compactHost.appendChild(frame);
    document.body.appendChild(compactHost);
    window.TrainingOverlay.acquire('compact');
    document.body.classList.add('field-compact-active');
    updateCompactControl(true);
  }
  function closeOriginalCompact() {
    if(compactHost){compactHost.remove();compactHost=null;}
    document.body.classList.remove('field-compact-active');
    window.TrainingOverlay.release('compact');
    updateCompactControl(false);
    var button=byId('training-overview-toggle');
    if(button)button.focus({preventScroll:true});
  }
  function installCompactBridge() {
    window.addEventListener('message',function(event){
      if(event.origin!==location.origin||!compactHost)return;
      var frame=compactHost.querySelector('iframe');
      if(!frame||event.source!==frame.contentWindow)return;
      if(event.data&&event.data.type==='pulse-field:exit-compact')closeOriginalCompact();
    });
    document.addEventListener('keydown',function(event){
      if(event.key==='Escape'&&compactHost)closeOriginalCompact();
    });
  }
  function setFieldSceneVisible(visible) {
    var next=visible?'true':'false';
    if(root.dataset.fieldSceneVisible!==next)root.dataset.fieldSceneVisible=next;
  }
  function installFieldSceneVisibility() {
    var scene=document.querySelector('.space-scene');
    if(!scene)return;
    var pageVisible=!document.hidden;
    var sceneVisible=true;
    function syncScene(){setFieldSceneVisible(pageVisible&&sceneVisible);}
    if('IntersectionObserver' in window){
      var observer=new IntersectionObserver(function(entries){
        sceneVisible=!!(entries[0]&&entries[0].isIntersecting);
        syncScene();
      },{root:null,rootMargin:'0px',threshold:0});
      observer.observe(scene);
    }
    document.addEventListener('visibilitychange',function(){
      pageVisible=!document.hidden;
      syncScene();
    });
    syncScene();
  }
  function number(value) { var n = Number(value); return Number.isFinite(n) ? n : 0; }
  function clamp(value,min,max) { return Math.max(min,Math.min(max,value)); }
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function readJSON(key,fallback) {
    try { var value=JSON.parse(localStorage.getItem(key)); return value == null ? fallback : value; }
    catch (_) { return fallback; }
  }
  function dateAtNoon(value) {
    if (value instanceof Date) return new Date(value.getFullYear(),value.getMonth(),value.getDate(),12);
    var parts=String(value||'').split('-').map(Number);
    return parts.length===3 ? new Date(parts[0],parts[1]-1,parts[2],12) : new Date();
  }
  function isoDate(value) {
    var d=dateAtNoon(value);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  function shiftDate(value,days) { var d=dateAtNoon(value);d.setDate(d.getDate()+days);return d; }
  function startOfWeek(value) {
    var d=dateAtNoon(value),offset=(d.getDay()+6)%7;
    d.setDate(d.getDate()-offset);
    return d;
  }
  function sameWeek(a,b) { return isoDate(startOfWeek(a))===isoDate(startOfWeek(b)); }
  function weekNumber(value) {
    var d=dateAtNoon(value),utc=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
    utc.setUTCDate(utc.getUTCDate()+4-(utc.getUTCDay()||7));
    var yearStart=new Date(Date.UTC(utc.getUTCFullYear(),0,1));
    return Math.ceil((((utc-yearStart)/86400000)+1)/7);
  }
  function shortDate(value) { var d=dateAtNoon(value);return d.getDate()+' '+monthNames[d.getMonth()]; }
  function logDate(value) { var d=dateAtNoon(value);return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0'); }
  function formatNumber(value,digits) { return number(value).toLocaleString('sv-SE',{maximumFractionDigits:digits==null?1:digits}); }
  function formatDuration(seconds) {
    seconds=Math.max(0,Math.round(number(seconds)));
    return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
  }
  function formatPace(value) {
    if (!(value>0)) return '—';
    var seconds=Math.round(value*60);
    return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')+' /km';
  }
  function formatKg(value) { return value>0 ? formatNumber(value,1)+' kg' : '—'; }

  function normalizeExercise(exercise) {
    exercise=exercise||{};
    var kind=exercise.kind || ((exercise.distance||exercise.time)?'cardio':'strength');
    return {
      kind:kind,
      name:String(exercise.name||exercise.exercise||'Övning'),
      sets:number(exercise.sets)||1,
      reps:number(exercise.reps),
      weight:number(exercise.weight||exercise.actualWeight||exercise.maxWeight),
      distance:number(exercise.distance),
      time:number(exercise.time),
      durationSec:number(exercise.durationSec)
    };
  }
  function workoutVolume(workout) {
    return (workout.exercises||[]).reduce(function(sum,raw){
      var ex=normalizeExercise(raw);
      return sum+(ex.kind==='strength'?ex.sets*ex.reps*ex.weight:0);
    },0);
  }
  function workoutDistance(workout) {
    var explicit=number(workout.runDistance);
    if (explicit>0) return explicit;
    return (workout.exercises||[]).reduce(function(sum,raw){var ex=normalizeExercise(raw);return sum+(ex.kind==='cardio'?ex.distance:0);},0);
  }
  function workoutRunTime(workout) {
    var explicit=number(workout.runTime);
    if (explicit>0) return explicit;
    return (workout.exercises||[]).reduce(function(sum,raw){var ex=normalizeExercise(raw);return sum+(ex.kind==='cardio'?ex.time:0);},0);
  }
  function workoutPace(workout) {
    var distance=workoutDistance(workout),time=workoutRunTime(workout);
    return number(workout.avgPaceKm)||(distance>0&&time>0?time/distance:0);
  }
  function workoutType(workout) {
    return String(workout.type||workout.name||'Träningspass');
  }
  function workoutKind(workout) {
    var type=workoutType(workout).toLowerCase();
    if (/kondition|löp|run|cardio|hopprep|cykel/.test(type)) return 'cardio';
    var exercises=(workout.exercises||[]).map(normalizeExercise);
    return exercises.length&&exercises.every(function(ex){return ex.kind==='cardio';})?'cardio':'strength';
  }
  function workoutPrimary(workout) {
    var volume=workoutVolume(workout),distance=workoutDistance(workout);
    if (volume>0) return formatNumber(Math.round(volume),0)+' kg';
    if (distance>0) return formatNumber(distance,2)+' km';
    if (number(workout.duration)>0) return formatNumber(workout.duration,0)+' min';
    return '—';
  }

  function demoData() {
    var today=isoDate(new Date()),workouts=[];
    var types=['Bröst + Triceps','Kondition','Axlar + Mage','Rygg + Biceps','Ben + Axlar','Helkropp'];
    [1,3,7,11,16,23,31,38,46,54].forEach(function(offset,index){
      var cardio=index%3===1;
      workouts.push({
        id:9000+index,date:isoDate(shiftDate(today,-offset)),type:types[index%types.length],duration:cardio?38:52,
        hrAvg:cardio?142-index:118+index*2,hrMin:cardio?92:78,hrMax:cardio?174-index:148+index,
        vo2:cardio?47.2+index*.16:null,runDistance:cardio?4.2+index*.35:0,runTime:cardio?29+index:0,
        exercises:cardio?
          [{kind:'cardio',name:'Löpning',distance:4.2+index*.35,time:29+index}]:
          [{kind:'strength',name:index%2?'Bicepscurls':'Hantelpress',sets:3,reps:8,weight:12+index},{kind:'strength',name:'Dips',sets:3,reps:10,weight:78}]
      });
    });
    var planned={};
    planned[today]={type:'Bröst + Triceps',exercises:[{kind:'strength',name:'Hantelpress',sets:3,reps:8,weight:20},{kind:'strength',name:'Dips',sets:3,reps:10,weight:78}]};
    planned[isoDate(shiftDate(today,2))]={type:'Kondition',exercises:[{kind:'cardio',name:'Löpning',distance:5,time:30}]};
    return {workouts:workouts,planned:planned,goals:{weeklyWk:4,runDistanceGoal:10,vo2Goal:50},prs:{Dips:78},plan:{mon:'Bröst + Triceps',tue:'Rygg + Biceps',wed:'Vila',thu:'Kondition',fri:'Helkropp',sat:'Vila',sun:'Vila'},vo2:[]};
  }

  function loadData() {
    if (params.get('demo')==='1') { data=demoData();return; }
    data={
      workouts:readJSON('ex_wk',[]),
      goals:readJSON('ex_goals',{weeklyWk:4,runDistanceGoal:10,vo2Goal:45}),
      planned:readJSON('ex_plannedSessions',{}),
      plan:readJSON('ex_plan',{mon:'Bröst + Triceps',tue:'Rygg + Biceps',wed:'Ben + Axlar',thu:'Kondition',fri:'Helkropp',sat:'Vila',sun:'Vila'}),
      weekPlans:readJSON('ex_weekPlans',{}),
      prs:readJSON('ex_prs',{}),
      vo2:readJSON('ex_vo2',[]),
      hiddenExerciseNames:readJSON('ex_hiddenExerciseNamesV1',{})
    };
  }

  function planForDate(value) {
    var key=isoDate(value);
    if (data.planned&&data.planned[key]) return data.planned[key];
    var d=dateAtNoon(value),index=(d.getDay()+6)%7,week=data.weekPlans&&data.weekPlans[isoDate(startOfWeek(d))],type=(week||data.plan||{})[dayKeys[index]];
    if (!type||/^vila$/i.test(type)) return null;
    return {type:type,exercises:[]};
  }
  function workoutsOn(value) { var key=isoDate(value);return data.workouts.filter(function(w){return w.date===key;}); }
  function workoutsInWeek(value) {
    var start=isoDate(startOfWeek(value)),end=isoDate(shiftDate(start,6));
    return data.workouts.filter(function(w){return w.date>=start&&w.date<=end;});
  }

  function profileHref(file,extra) {
    var url=new URL(file,location.href);
    if (profile==='maja') url.searchParams.set('user','maja');
    if (extra) Object.keys(extra).forEach(function(key){if(extra[key])url.searchParams.set(key,extra[key]);});
    return file+url.search+url.hash;
  }
  function wireProfileLinks() {
    byId('profile-name').textContent=profile==='maja'?'Maja':'Markus Strickert';
    document.querySelectorAll('[data-field-profile]').forEach(function(link){
      var target=new URL(location.href);
      if(link.dataset.fieldProfile==='maja')target.searchParams.set('user','maja');else target.searchParams.delete('user');
      link.href=target.pathname.split('/').pop()+target.search+target.hash;
      if(link.dataset.fieldProfile===profile)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');
    });
    document.title=(profile==='maja'?'Maja':'Markus')+' Träning · Pulse Field';
    // All pass tools live in this document. Only cross-section and profile
    // navigation change URLs; editing controls use native Pulse Field dialogs.
    byId('stretch-link').href=profileHref('zen.html',{wellness:'stretch'});
    byId('meditation-link').href=profileHref('zen.html',{wellness:'meditation'});
    byId('pulse-explore-link').href=profileHref('pulse-exercise-guide.html');
    byId('menu-explore-training').href=profileHref('pulse-exercise-guide.html');
    document.querySelector('.field-brand').href=profileHref('home.html');
    document.querySelector('#field-menu a[href="home.html"]').href=profileHref('home.html');
    var current=new URL(location.href);if(profile==='maja')current.searchParams.set('user','maja');
    document.querySelector('.kind-switch .is-active').href=current.pathname.split('/').pop()+current.search;
  }

  function renderHero() {
    var today=new Date(),found=null;
    for(var i=0;i<14;i++){
      var date=shiftDate(today,i),plan=planForDate(date);
      if(plan){found={date:date,plan:plan};break;}
    }
    if(!found){
      byId('next-session-link').dataset.fieldDate=isoDate(today);
      byId('next-session-title').textContent='Välj dagens rörelse';
      byId('next-session-meta').textContent='Nästa pass · Bygg eller välj ett upplägg';
      return;
    }
    var exercises=found.plan.exercises||[],sets=exercises.reduce(function(sum,ex){return sum+number(ex.sets);},0);
    var dateLabel=isoDate(found.date)===isoDate(today)?'I dag · '+shortDate(found.date):dayNames[(found.date.getDay()+6)%7]+' · '+shortDate(found.date);
    var detail=exercises.length?exercises.length+' övning'+(exercises.length===1?'':'ar')+(sets?' · '+sets+' set':''):'Planerat upplägg';
    byId('next-session-title').textContent=found.plan.type||'Planerat pass';
    byId('next-session-meta').textContent=dateLabel+' · '+detail;
    byId('next-session-link').dataset.fieldDate=isoDate(found.date);
  }

  function renderRhythm() {
    var week=workoutsInWeek(new Date()),goal=Math.max(1,number(data.goals.weeklyWk)||4);
    var minutes=week.reduce(function(sum,w){return sum+number(w.duration);},0);
    var volume=week.reduce(function(sum,w){return sum+workoutVolume(w);},0);
    var sorted=data.workouts.slice().sort(function(a,b){return String(b.date).localeCompare(String(a.date));});
    byId('week-count').textContent=week.length;
    byId('week-goal').textContent=goal;
    byId('week-minutes').textContent=formatNumber(minutes,0);
    byId('week-volume').textContent=volume?formatNumber(Math.round(volume),0)+' kg':'—';
    byId('latest-workout').textContent=sorted.length?workoutType(sorted[0]):'—';
    byId('rhythm-message').textContent=week.length>=goal?'Veckomålet lyser klart. Allt mer är bonus.':week.length===0?'Din vecka börjar med ett pass.':(goal-week.length)+' pass kvar tills rytmen är komplett.';
    var markup='';for(var i=0;i<goal;i++)markup+='<i'+(i<week.length?' class="is-lit"':'')+'></i>';
    byId('rhythm-track').innerHTML=markup;
  }

  function updateWeekNavigators() {
    var start=state.weekStart,end=shiftDate(start,6),label='Vecka '+weekNumber(start),range=shortDate(start)+' – '+shortDate(end)+(start.getFullYear()!==new Date().getFullYear()?' '+start.getFullYear():'');
    document.querySelectorAll('[data-week-label]').forEach(function(node){node.textContent=label;});
    document.querySelectorAll('[data-week-range]').forEach(function(node){node.textContent=range;});
  }
  function renderWeek() {
    updateWeekNavigators();
    var today=isoDate(new Date()),markup='';
    for(var i=0;i<7;i++){
      var date=shiftDate(state.weekStart,i),key=isoDate(date),plan=planForDate(date),logged=workoutsOn(date);
      var type=plan&&plan.type || (logged[0]&&workoutType(logged[0])) || 'Vila';
      var displayName=String(plan&&plan.name || type).trim()||String(type);
      var lowerType=String(type).trim().toLocaleLowerCase('sv-SE');
      var signalKind=/^(vila|vilodag|ledig|återhämtning)$/.test(lowerType)?'rest':/kondition|löp|run|cardio|cykel|hopprep|roddmaskin|crosstrainer|intervall/.test(lowerType)?'cardio':'strength';
      // One colour meaning across the training pages: red strength, cyan cardio, grey rest.
      var signalColor=signalKind==='rest'?'rest':signalKind==='cardio'?'cyan':'red';
      var classes=['week-day'];
      if(key===today)classes.push('is-today');
      if(key===state.selectedDate)classes.push('is-selected');
      if(logged.length)classes.push('is-complete');
      markup+='<div class="'+classes.join(' ')+'" data-plan-kind="'+signalKind+'" data-plan-color="'+signalColor+'" data-day="'+key+'" role="button" tabindex="0" aria-label="'+dayNames[i]+' '+date.getDate()+', '+escapeHtml(displayName)+'. Öppna passbyggaren." aria-pressed="'+(key===state.selectedDate)+'">'+
        '<span class="day-name">'+dayNames[i]+'</span><span class="day-date">'+date.getDate()+'</span>'+
        '<span class="day-type">'+escapeHtml(displayName)+'</span></div>';
    }
    byId('week-days').innerHTML=markup;
    var selected=state.selectedDate||today,chosen=dateAtNoon(selected),chosenPlan=planForDate(chosen),chosenLogged=workoutsOn(chosen);
    var chosenType=chosenPlan&&chosenPlan.type || (chosenLogged[0]&&workoutType(chosenLogged[0])) || 'Vila';
    var chosenName=String(chosenPlan&&chosenPlan.name || chosenType).trim()||'Vila';
    var fullDay=selected===today?'IDAG · '+dayNames[(chosen.getDay()+6)%7]+' '+chosen.getDate():'VALD DAG · '+dayNames[(chosen.getDay()+6)%7]+' '+chosen.getDate();
    var dayLabel=byId('week-selected-day-v3'),nameLabel=byId('week-selected-name-v3');
    if(dayLabel)dayLabel.textContent=fullDay;
    if(nameLabel)nameLabel.textContent=chosenName;
    // Today's pass as a row: artwork, name, what it holds, and a play button to start it.
    var chosenLower=String(chosenType).trim().toLocaleLowerCase('sv-SE');
    var chosenRest=!chosenPlan&&!chosenLogged.length||/^(vila|vilodag|ledig|återhämtning)$/.test(chosenLower);
    var chosenCardio=/kondition|löp|run|cardio|cykel|hopprep|roddmaskin|crosstrainer|intervall/.test(chosenLower);
    var planned=(chosenPlan&&Array.isArray(chosenPlan.exercises))?chosenPlan.exercises:[];
    var sets=planned.reduce(function(n,ex){var e=normalizeExercise(ex);return n+(e.kind==='strength'?Math.max(1,number(e.sets)):0);},0);
    var cardioMin=planned.reduce(function(n,ex){var e=normalizeExercise(ex);return n+(e.kind==='cardio'?number(e.time):0);},0);
    var estimate=Math.round((sets*2.5+cardioMin)/5)*5;
    var meta=chosenLogged.length?'Klart · '+(number(chosenLogged[0].duration)?formatNumber(chosenLogged[0].duration,0)+' min':workoutPrimary(chosenLogged[0])):
      chosenRest?'Återhämtning':planned.length?planned.length+(planned.length===1?' övning':' övningar')+(estimate?' · ca '+estimate+' min':''):'Bygg passet för dagen';
    var box=byId('week-selected-session-v3'),thumb=byId('week-selected-thumb-v3'),metaLabel=byId('week-selected-meta-v3');
    if(box){
      box.dataset.kind=chosenRest?'rest':chosenCardio?'cardio':'strength';
      box.style.setProperty('--today-x',(((chosen.getDay()+6)%7)+.5)/7*100+'%');
      if(chosenRest&&!chosenPlan)nameLabel.textContent='Vila';
      if(metaLabel)metaLabel.textContent=meta;
      if(thumb)thumb.innerHTML=chosenRest?'<span class="pk-thumb is-rest">'+PK_MOON+'</span>':pkThumb(chosenName+' '+chosenType,chosenCardio?'cardio':'strength');
      ['week-selected-open-v3','week-selected-play-v3'].forEach(function(id){var b=byId(id);if(b)b.dataset.fieldDate=selected;});
      var play=byId('week-selected-play-v3');if(play)play.hidden=chosenRest||!!chosenLogged.length;
    }
    var startLink=byId('next-session-link');
    if(startLink)startLink.dataset.fieldDate=state.selectedDate;
  }

  function activityBuckets() {
    if(state.activityView==='week'){
      return Array.from({length:7},function(_,index){
        var date=shiftDate(state.weekStart,index),sessions=workoutsOn(date);
        return {label:dayNames[index],date:isoDate(date),sessions:sessions.length,minutes:sessions.reduce(function(sum,w){return sum+number(w.duration);},0),current:isoDate(date)===isoDate(new Date())};
      });
    }
    return Array.from({length:8},function(_,index){
      var start=shiftDate(startOfWeek(new Date()),(index-7)*7),end=shiftDate(start,6),startKey=isoDate(start),endKey=isoDate(end);
      var sessions=data.workouts.filter(function(w){return w.date>=startKey&&w.date<=endKey;});
      return {label:'v'+weekNumber(start),date:startKey,sessions:sessions.length,minutes:sessions.reduce(function(sum,w){return sum+number(w.duration);},0),current:index===7};
    });
  }
  function chartAxisUnit(label,left,top) {
    return '<text class="chart-axis-unit" x="'+left+'" y="'+(top-12)+'" text-anchor="start">'+escapeHtml(label)+'</text>';
  }

  function chartTipAttrs(title,value,detail,color) {
    return ' data-chart-tip="1" data-chart-tip-title="'+escapeHtml(title)+'" data-chart-tip-value="'+escapeHtml(value)+'" data-chart-tip-detail="'+escapeHtml(detail||'')+'"'+(color?' data-chart-tip-color="'+escapeHtml(color)+'"':'')+' tabindex="0"';
  }
  function ensureChartTooltip() {
    var tip=byId('field-chart-tooltip');
    if(tip)return tip;
    tip=document.createElement('div');
    tip.id='field-chart-tooltip';
    tip.className='field-chart-tooltip';
    tip.setAttribute('role','status');
    tip.setAttribute('aria-live','polite');
    tip.hidden=true;
    tip.innerHTML='<strong></strong><span></span><small></small>';
    document.body.appendChild(tip);
    var focus=document.createElement('div');focus.id='field-chart-focus';focus.className='field-chart-focus';focus.hidden=true;focus.setAttribute('aria-hidden','true');
    focus.innerHTML='<i class="field-chart-guide"></i><b class="field-chart-ring"></b>';
    document.body.appendChild(focus);
    return tip;
  }
  function showChartTooltip(target,event,pinned) {
    if(!target)return;
    var tip=ensureChartTooltip(),rect=target.getBoundingClientRect();
    tip.querySelector('strong').textContent=target.dataset.chartTipTitle||'';
    tip.querySelector('span').textContent=target.dataset.chartTipValue||'';
    var detail=target.dataset.chartTipDetail||'',small=tip.querySelector('small');
    small.textContent=detail;small.hidden=!detail;
    var color=target.dataset.chartTipColor||'#ff9a91';
    tip.style.setProperty('--tip-color',color);
    tip.hidden=false;tip.classList.add('is-visible');
    // A point anchors the bubble at its centre; a bar or zone at the pointer.
    var isPoint=target.tagName.toLowerCase()==='circle';
    var x=isPoint?rect.left+rect.width/2:event&&Number.isFinite(event.clientX)&&event.clientX?event.clientX:rect.left+rect.width/2;
    var y=isPoint?rect.top+rect.height/2:event&&Number.isFinite(event.clientY)&&event.clientY?event.clientY:rect.top+rect.height/2;
    var focus=byId('field-chart-focus'),svg=target.closest('svg');
    if(focus&&svg){
      var box=svg.getBoundingClientRect();
      focus.style.setProperty('--tip-color',color);
      focus.style.left=(x+window.scrollX)+'px';focus.style.top=(y+window.scrollY)+'px';
      focus.style.setProperty('--guide',Math.max(0,box.bottom-28-y)+'px');
      focus.classList.toggle('is-point',isPoint);
      focus.hidden=false;
    }
    tip.style.setProperty('--arrow-x','50%');
    var half=Math.min(138,Math.max(84,tip.offsetWidth/2));
    var anchorX=x;
    x=clamp(x,half+8,window.innerWidth-half-8);
    tip.style.setProperty('--arrow-x',clamp(anchorX-(x-tip.offsetWidth/2),16,tip.offsetWidth-16)+'px');
    y=clamp(y-18,52,window.innerHeight-24);
    // Placed in page coordinates so the bubble scrolls with its chart.
    tip.style.left=(x+window.scrollX)+'px';tip.style.top=(y+window.scrollY)+'px';
    clearTimeout(showChartTooltip.timer);
    if(pinned)showChartTooltip.timer=setTimeout(hideChartTooltip,2600);
  }
  function hideChartTooltip() {
    var tip=byId('field-chart-tooltip');if(!tip)return;
    tip.classList.remove('is-visible');clearTimeout(showChartTooltip.timer);
    var focus=byId('field-chart-focus');if(focus)focus.hidden=true;
    setTimeout(function(){if(!tip.classList.contains('is-visible'))tip.hidden=true;},160);
  }

  function renderActivity() {
    root.dataset.fieldView=state.activityView;
    byId('activity-week-nav').hidden=state.activityView!=='week';
    document.querySelectorAll('[data-activity-view]').forEach(function(button){button.setAttribute('aria-selected',String(button.dataset.activityView===state.activityView));});
    document.querySelectorAll('[data-activity-metric]').forEach(function(button){button.setAttribute('aria-pressed',String(button.dataset.activityMetric===state.activityMetric));});
    var buckets=activityBuckets(),metric=state.activityMetric,total=buckets.reduce(function(sum,b){return sum+b[metric];},0);
    byId('activity-total').textContent=formatNumber(total,0);
    byId('activity-unit').textContent=metric==='minutes'?'minuter':'pass';
    byId('activity-caption').textContent=state.activityView==='history'?'De senaste åtta veckorna':'Samma vecka som i veckofältet';
    var values=buckets.map(function(b){return b[metric];}),max=Math.max.apply(Math,values.concat([metric==='minutes'?60:4])),width=clamp(byId('activity-chart').clientWidth||800,320,1600),height=clamp(byId('activity-chart').clientHeight||180,164,275),left=27,right=9,top=26,bottom=38,plotW=width-left-right,plotH=height-top-bottom,step=plotW/buckets.length,barW=Math.min(18,step*.24),highestValue=Math.max.apply(Math,values.concat([0])),highestBarH=highestValue?Math.max(4,plotH*highestValue/max):4,gradientBottom=top+plotH,gradientTop=gradientBottom-highestBarH;
    var svg='<svg viewBox="0 0 '+width+' '+height+'" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="bar-light" gradientUnits="userSpaceOnUse" x1="0" y1="'+gradientBottom+'" x2="0" y2="'+gradientTop+'"><stop stop-color="#ff657a"/><stop offset="1" stop-color="#ffd1ba"/></linearGradient></defs>';
    svg+=chartAxisUnit(metric==='minutes'?'MIN':'PASS',left,top);
    [0,.5,1].forEach(function(ratio){var y=top+plotH*(1-ratio);svg+='<line class="chart-grid" x1="'+left+'" y1="'+y+'" x2="'+(width-right)+'" y2="'+y+'"/><text class="chart-axis-label" x="'+(left-8)+'" y="'+(y+3)+'" text-anchor="end">'+Math.round(max*ratio)+'</text>';});
    buckets.forEach(function(bucket,index){
      var x=left+step*(index+.5),value=bucket[metric],barH=value?Math.max(4,plotH*value/max):0,y=top+plotH-barH;
      if(value)svg+='<rect class="activity-bar" x="'+(x-barW/2)+'" y="'+y+'" width="'+barW+'" height="'+barH+'" rx="'+(barW/2)+'" fill="url(#bar-light)"/>'+(bucket.current?'<text class="chart-value" x="'+x+'" y="'+clamp(y-8,top+9,height-bottom-8)+'" text-anchor="middle">'+formatNumber(value,0)+'</text>':'');
      else svg+='<line class="activity-zero" x1="'+(x-4)+'" y1="'+(top+plotH)+'" x2="'+(x+4)+'" y2="'+(top+plotH)+'"/>';
      svg+='<rect class="chart-hit-zone" x="'+(left+step*index)+'" y="'+top+'" width="'+step+'" height="'+plotH+'"'+chartTipAttrs(bucket.label,formatNumber(value,0)+' '+(metric==='minutes'?'min':'pass'),state.activityView==='week'?shortDate(bucket.date):'Vecka '+bucket.label.replace(/^v/,''),'#ff9a91')+'/>';
      svg+='<text class="chart-axis-label" x="'+x+'" y="'+(height-10)+'" text-anchor="middle">'+bucket.label+'</text>';
    });
    svg+='</svg>';
    byId('activity-chart').innerHTML=svg;
    byId('activity-chart').setAttribute('aria-label',buckets.map(function(b){return b.label+': '+b[metric]+' '+(metric==='minutes'?'minuter':'pass');}).join('. '));
    scheduleChartCanvasGlow('activity-chart');
  }

  function chartRangeStart() {
    var today=new Date();
    today.setHours(12,0,0,0);
    today.setDate(today.getDate()-30);
    return isoDate(today);
  }
  function withinChartRange(entry) {
    return state.chartRange==='all'||String(entry&&entry.date||'')>=chartRangeStart();
  }
  function filterChartEntries(entries) {
    return entries.filter(withinChartRange);
  }
  function heartData() {
    return data.workouts.slice().sort(function(a,b){return String(a.date).localeCompare(String(b.date))||number(a.id)-number(b.id);}).filter(function(w){return number(w.hrAvg)>0;}).map(function(w){return {date:w.date,value:number(w.hrAvg),min:number(w.hrMin),max:number(w.hrMax),kind:workoutKind(w),type:workoutType(w)};});
  }
  function distanceData() {
    return data.workouts.filter(function(w){return workoutDistance(w)>0;}).sort(function(a,b){return String(a.date).localeCompare(String(b.date));}).map(function(w){return {date:w.date,value:workoutDistance(w),pace:workoutPace(w),time:workoutRunTime(w),type:workoutType(w)};});
  }
  function paceData() {
    return distanceData().filter(function(entry){return entry.pace>0;}).map(function(entry){
      return {date:entry.date,value:entry.pace,distance:entry.value,time:entry.time,type:entry.type};
    });
  }
  function vo2Data() {
    var map={};
    (data.vo2||[]).forEach(function(entry){var value=number(entry.score||entry.value||entry.vo2);if(entry.date&&value)map[entry.date]={date:entry.date,value:value,type:'VO₂-logg'};});
    data.workouts.forEach(function(w){var value=number(w.vo2);if(w.date&&value)map[w.date]={date:w.date,value:value,type:workoutType(w)};});
    return Object.keys(map).sort().map(function(key){return map[key];});
  }
  function trainingGroupName(workout) {
    var raw=workoutType(workout).trim();
    var shortMap={H:'Helkropp',B:'Bröst + Triceps',R:'Rygg + Biceps',L:'Ben + Axlar',O:'Övrigt','Ö':'Överkropp',U:'Underkropp'};
    return shortMap[raw]||raw||'Övrigt';
  }
  function trainingGroupVolumeSeries() {
    var map={};
    data.workouts.forEach(function(workout){
      var volume=workoutVolume(workout);
      if(!(volume>0)||!workout.date)return;
      var name=trainingGroupName(workout),key=name.toLocaleLowerCase('sv-SE');
      if(!map[key])map[key]={key:key,name:name,byDate:{},lastDate:'',sessionCount:0};
      map[key].sessionCount+=1;
      map[key].byDate[workout.date]=(map[key].byDate[workout.date]||0)+volume;
      if(String(workout.date)>map[key].lastDate)map[key].lastDate=String(workout.date);
    });
    return Object.keys(map).map(function(key){
      var item=map[key];
      item.entries=Object.keys(item.byDate).sort().map(function(date){return {date:date,value:item.byDate[date]};});
      item.count=item.entries.length;
      return item;
    }).filter(function(group){
      // A workout group needs two logged strength sessions with recorded
      // volume to qualify, regardless of which date range is selected.
      return group.sessionCount>=2;
    }).sort(function(a,b){
      return b.count-a.count||String(b.lastDate).localeCompare(String(a.lastDate))||a.name.localeCompare(b.name,'sv');
    });
  }
  function groupVolumeColor(index) {
    return ['#ff657a','#67d4e4','#ffd2bd','#65d7a5','#a78bfa','#f6c977','#ff9a91','#8ab4f8'][index%8];
  }
  function groupVolumeChart(series) {
    var chart=byId('volume-chart');
    if(!series.length)return '<div class="volume-empty">Passvolym visas när samma träningsgrupp har loggats minst två gånger med registrerad viktvolym.</div>';
    var dates={},values=[];
    series.forEach(function(group){
      group.entries.filter(withinChartRange).forEach(function(entry){dates[entry.date]=true;values.push(entry.value);});
    });
    var dateKeys=Object.keys(dates).sort();
    if(!dateKeys.length)return '<div class="volume-empty">Ingen passvolym finns att visa ännu.</div>';
    var width=clamp(chart.clientWidth||820,320,1600),height=clamp(chart.clientHeight||272,230,440),left=53,right=22,top=24,bottom=38,plotW=width-left-right,plotH=height-top-bottom;
    var firstDate=dateAtNoon(dateKeys[0]).getTime(),lastDate=dateAtNoon(dateKeys[dateKeys.length-1]).getTime(),span=Math.max(1,lastDate-firstDate);
    // Start the volume axis at 1000 kg for typical strength sessions,
    // expanding downward only when recorded values would otherwise be clipped.
    // Keep about 250 kg above the highest visible result.
    var lowest=Math.min.apply(Math,values),highest=Math.max.apply(Math,values);
    var axisMin=lowest>=1000?1000:Math.max(0,Math.floor((lowest-250)/50)*50);
    var axisMax=Math.ceil((highest+250)/50)*50;
    if(axisMax<=axisMin)axisMax=axisMin+500;
    function x(date){return dateKeys.length===1?left+plotW/2:left+(dateAtNoon(date).getTime()-firstDate)*plotW/span;}
    function y(value){return top+(axisMax-value)*plotH/(axisMax-axisMin);}
    var svg='<svg viewBox="0 0 '+width+' '+height+'" preserveAspectRatio="xMidYMid meet" aria-hidden="true">';
    svg+=chartAxisUnit('KG',left,top);
    [0,.5,1].forEach(function(ratio){var value=axisMin+(axisMax-axisMin)*ratio,gy=y(value);svg+='<line class="chart-grid" x1="'+left+'" y1="'+gy+'" x2="'+(width-right)+'" y2="'+gy+'"/><text class="chart-axis-label" x="'+(left-8)+'" y="'+(gy+3)+'" text-anchor="end">'+formatNumber(Math.round(value),0)+'</text>';});
    series.forEach(function(group,index){
      var color=groupVolumeColor(index),points=group.entries.filter(withinChartRange).map(function(entry){return [x(entry.date),y(entry.value),entry];});
      if(points.length>1)svg+=glowingLine(seriesPath(points),color,'group-volume-line');
      points.forEach(function(point){svg+='<circle class="group-volume-point" cx="'+point[0]+'" cy="'+point[1]+'" r="3.7" fill="'+color+'" style="color:'+color+'"'+chartTipAttrs(group.name,formatNumber(Math.round(point[2].value),0)+' kg',logDate(point[2].date),color)+'/>';});
    });
    var daySpan=Math.round((dateAtNoon(dateKeys[dateKeys.length-1])-dateAtNoon(dateKeys[0]))/86400000);
    var tickCount=daySpan===0?1:Math.min(5,daySpan+1);
    for(var tick=0;tick<tickCount;tick++){
      var dayOffset=tickCount===1?0:Math.round(daySpan*tick/(tickCount-1));
      var tickDate=isoDate(shiftDate(dateKeys[0],dayOffset));
      svg+='<text class="chart-axis-label volume-date-label" x="'+x(tickDate)+'" y="'+(height-10)+'" text-anchor="middle">'+logDate(tickDate)+'</text>';
    }
    return svg+'</svg>';
  }
  function seriesPath(points) {
    if(!points.length)return'';
    if(points.length===1)return'M '+points[0][0]+' '+points[0][1];
    var path='M '+points[0][0]+' '+points[0][1];
    for(var i=1;i<points.length;i++){
      var prev=points[i-1],point=points[i],mid=(prev[0]+point[0])/2;
      path+=' C '+mid+' '+prev[1]+', '+mid+' '+point[1]+', '+point[0]+' '+point[1];
    }
    return path;
  }
  function glowingLine(path,color,coreClass) {
    var extra=coreClass?' '+coreClass:'';
    // Keep the solid curve crisp. The separate moving highlight provides
    // perceptible flow on macOS Safari without animating SVG drop-shadow filters.
    return '<path class="line-glow'+extra+'" d="'+path+'" stroke="'+color+'" style="color:'+color+'"/>'+
      '<path class="chart-flow-tracer" d="'+path+'" pathLength="100" stroke="'+color+'" style="color:'+color+'"/>';
  }
  function glowingPoint(x,y,r,color,coreClass) {
    var extra=coreClass?' '+coreClass:'';
    return '<circle class="last-point'+extra+'" cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+color+'" style="color:'+color+'"/>';
  }

  // iOS/WebKit can flatten SVG filter glows into visible bands. This mirrors the
  // proven training-mode timer solution: the SVG stays crisp while a Canvas 2D
  // layer underneath paints real shadowBlur light.
  // Use the same Canvas neon layer on desktop Safari and mobile, rather than
  // relying on WebKit's SVG drop-shadow rendering only on large screens.
  var chartGlowMq={matches:true};
  var chartGlowRaf=0;
  var chartGlowDirty=new Set();
  var chartMiniGlowDirty=false;
  var chartGlowDpr=Math.min(1.35,Math.max(1,Number(window.devicePixelRatio)||1));

  function glowRgb(value,fallback) {
    value=String(value||'').trim();
    var hex=value.match(/^#([0-9a-f]{6})$/i);
    if(hex)return [
      parseInt(hex[1].slice(0,2),16),
      parseInt(hex[1].slice(2,4),16),
      parseInt(hex[1].slice(4,6),16)
    ];
    var rgb=value.match(/rgba?\(\s*([\d.]+)[, ]+\s*([\d.]+)[, ]+\s*([\d.]+)/i);
    if(rgb)return [Number(rgb[1]),Number(rgb[2]),Number(rgb[3])];
    return fallback||[255,101,122];
  }
  function glowRgba(rgb,a){return 'rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+a+')';}
  function chartGlowCanvas(container) {
    if(!container)return null;
    var canvas=Array.prototype.find.call(container.children,function(el){return el.matches&&el.matches('canvas.chart-canvas-glow');});
    if(!canvas){
      canvas=document.createElement('canvas');
      canvas.className='chart-canvas-glow';
      canvas.setAttribute('aria-hidden','true');
      canvas.setAttribute('role','presentation');
      container.insertBefore(canvas,container.firstChild||null);
    }
    return canvas;
  }
  function sizeChartGlowCanvas(canvas) {
    var rect=canvas.getBoundingClientRect(),cssW=Math.max(1,rect.width),cssH=Math.max(1,rect.height);
    var w=Math.max(1,Math.round(cssW*chartGlowDpr)),h=Math.max(1,Math.round(cssH*chartGlowDpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    return {rect:rect,scale:chartGlowDpr};
  }
  function screenPointToCanvas(element,x,y,canvasRect,scale) {
    var ctm=null;
    try{ctm=element.getScreenCTM();}catch(_){}
    if(ctm&&window.DOMPoint){
      var p=new DOMPoint(x,y).matrixTransform(ctm);
      return {x:(p.x-canvasRect.left)*scale,y:(p.y-canvasRect.top)*scale};
    }
    var rect=element.ownerSVGElement?element.ownerSVGElement.getBoundingClientRect():element.getBoundingClientRect();
    return {x:(rect.left-canvasRect.left+x)*scale,y:(rect.top-canvasRect.top+y)*scale};
  }
  function sampleGlowPath(path,canvasRect,scale,steps) {
    if(!path||typeof path.getTotalLength!=='function')return null;
    var len=0;try{len=path.getTotalLength();}catch(_){return null;}
    if(!(len>0))return null;
    var pts=[];steps=Math.max(12,steps||48);
    for(var i=0;i<=steps;i++){
      var p;try{p=path.getPointAtLength(len*i/steps);}catch(_){return null;}
      pts.push(screenPointToCanvas(path,p.x,p.y,canvasRect,scale));
    }
    return pts;
  }
  function buildGlowPolyline(ctx,points){
    if(!points||points.length<2)return false;
    ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);
    for(var i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);
    return true;
  }
  function canvasNeonPass(ctx,points,rgb,width,blur,alpha){
    if(!buildGlowPolyline(ctx,points))return;
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    ctx.lineCap='round';ctx.lineJoin='round';
    ctx.lineWidth=width*chartGlowDpr;
    ctx.strokeStyle=glowRgba(rgb,.96);
    ctx.shadowColor=glowRgba(rgb,alpha);
    ctx.shadowBlur=blur*chartGlowDpr;
    ctx.stroke();
    ctx.restore();
  }
  function canvasNeonLine(ctx,points,rgb){
    canvasNeonPass(ctx,points,rgb,1.15,32,.46);
    canvasNeonPass(ctx,points,rgb,1.50,20,.82);
    canvasNeonPass(ctx,points,rgb,1.90,10,1);
    canvasNeonPass(ctx,points,rgb,2.15,5,1);
  }
  function canvasNeonDot(ctx,x,y,r,rgb){
    [[32,.46,1.28],[20,.82,1.10],[10,1,.94],[5,1,.80]].forEach(function(pass){
      ctx.save();
      ctx.globalCompositeOperation='lighter';
      ctx.beginPath();ctx.arc(x,y,Math.max(1,r*pass[2]*chartGlowDpr),0,Math.PI*2);
      ctx.fillStyle=glowRgba(rgb,.80);
      ctx.shadowColor=glowRgba(rgb,pass[1]);
      ctx.shadowBlur=pass[0]*chartGlowDpr;
      ctx.fill();
      ctx.restore();
    });
  }
  function roundedGlowRect(ctx,x,y,w,h,r){
    r=Math.max(0,Math.min(r,Math.min(w,h)/2));
    ctx.beginPath();
    ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
  }
  function canvasNeonBar(ctx,rect,canvasRect,rgb){
    var x=(rect.left-canvasRect.left)*chartGlowDpr,y=(rect.top-canvasRect.top)*chartGlowDpr;
    var w=rect.width*chartGlowDpr,h=rect.height*chartGlowDpr,r=Math.min(rect.width/2,9)*chartGlowDpr;
    [[38,.42,.20],[24,.76,.29],[13,1,.38],[6,1,.42]].forEach(function(pass){
      ctx.save();
      ctx.globalCompositeOperation='lighter';
      roundedGlowRect(ctx,x,y,w,h,r);
      ctx.fillStyle=glowRgba(rgb,pass[2]);
      ctx.shadowColor=glowRgba(rgb,pass[1]);
      ctx.shadowBlur=pass[0]*chartGlowDpr;
      ctx.fill();
      ctx.restore();
    });
  }
  function paintChartCanvasGlow(container){
    if(!container||container.hidden)return;
    var svg=container.querySelector('svg');
    if(!svg)return;
    var canvas=chartGlowCanvas(container),size=sizeChartGlowCanvas(canvas),ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    container.querySelectorAll('path.line-glow').forEach(function(path){
      var pts=sampleGlowPath(path,size.rect,size.scale,64);
      if(pts)canvasNeonLine(ctx,pts,glowRgb(path.getAttribute('stroke'),[255,101,122]));
    });
    container.querySelectorAll('circle.last-point,circle.group-volume-point').forEach(function(dot){
      var cx=Number(dot.getAttribute('cx')),cy=Number(dot.getAttribute('cy')),r=Number(dot.getAttribute('r'))||4;
      var p=screenPointToCanvas(dot,cx,cy,size.rect,size.scale);
      canvasNeonDot(ctx,p.x,p.y,r,glowRgb(dot.getAttribute('fill'),[255,101,122]));
    });
    container.querySelectorAll('rect.activity-bar').forEach(function(bar){
      canvasNeonBar(ctx,bar.getBoundingClientRect(),size.rect,[255,101,122]);
    });
  }
  function paintMiniIntervalGlows() {
    document.querySelectorAll('#log-timeline .log-card.is-open .log-mini-signal').forEach(function(signal){
      var dot=signal.querySelector('.log-mini-point');
      if(!dot)return;
      var canvas=signal.querySelector('canvas.log-mini-canvas-glow');
      if(!canvas){
        canvas=document.createElement('canvas');
        canvas.className='log-mini-canvas-glow';
        canvas.setAttribute('aria-hidden','true');
        signal.insertBefore(canvas,signal.firstChild);
      }
      var rect=canvas.getBoundingClientRect(),scale=chartGlowDpr;
      var width=Math.max(1,Math.round(rect.width*scale)),height=Math.max(1,Math.round(rect.height*scale));
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
      var ctx=canvas.getContext('2d');ctx.clearRect(0,0,width,height);
      var dotRect=dot.getBoundingClientRect();
      var p={x:(dotRect.left+dotRect.width/2-rect.left)*scale,y:(dotRect.top+dotRect.height/2-rect.top)*scale};
      var rgb=glowRgb(getComputedStyle(signal.closest('.log-mini-meter').querySelector('strong')).color,[255,101,122]);
      var radius=15*scale,gradient=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,radius);
      gradient.addColorStop(0,glowRgba(rgb,.9));
      gradient.addColorStop(.2,glowRgba(rgb,.48));
      gradient.addColorStop(.48,glowRgba(rgb,.19));
      gradient.addColorStop(1,glowRgba(rgb,0));
      ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fill();
    });
  }

  function removeChartCanvasGlow(){
    document.querySelectorAll('canvas.chart-canvas-glow,canvas.log-mini-canvas-glow').forEach(function(canvas){canvas.remove();});
  }
  function paintScheduledChartGlows(){
    chartGlowRaf=0;
    if(!chartGlowMq.matches){removeChartCanvasGlow();chartGlowDirty.clear();chartMiniGlowDirty=false;return;}
    var ids=chartGlowDirty.size?Array.from(chartGlowDirty):['activity-chart','insight-chart','volume-chart'];
    ids.forEach(function(id){paintChartCanvasGlow(byId(id));});
    if(chartMiniGlowDirty||!chartGlowDirty.size)paintMiniIntervalGlows();
    chartGlowDirty.clear();chartMiniGlowDirty=false;
  }
  function scheduleChartCanvasGlow(id){
    if(id==='log')chartMiniGlowDirty=true;
    else if(id)chartGlowDirty.add(id);
    else {
      ['activity-chart','insight-chart','volume-chart'].forEach(function(chartId){chartGlowDirty.add(chartId);});
      chartMiniGlowDirty=true;
    }
    if(chartGlowRaf)return;
    chartGlowRaf=requestAnimationFrame(paintScheduledChartGlows);
  }

  function emptyChart(message) {
    return '<div class="log-empty">'+escapeHtml(message)+'</div>';
  }
  function metricChartFrame(width,height,left,right,top,bottom,options,y,min,max) {
    var plotRight=width-right,baseY=height-bottom,svg='',tickCount=Math.max(2,options.tickCount||5);
    for(var i=0;i<tickCount;i++){
      var ratio=i/(tickCount-1),value=min+(max-min)*ratio,gy=y(value);
      svg+='<line class="metric-chart-grid" x1="'+left+'" y1="'+gy+'" x2="'+plotRight+'" y2="'+gy+'" stroke="'+(options.gridColor||'#ffffff12')+'"/>'+
        '<text class="metric-chart-y-label" x="'+(left-8)+'" y="'+(gy+3)+'" text-anchor="end" fill="'+(options.axisColor||'#9da7b2')+'">'+escapeHtml(options.axisFormatter?options.axisFormatter(value):formatNumber(value,options.decimals))+'</text>';
    }
    svg+='<line class="metric-chart-axis-line" x1="'+left+'" y1="'+top+'" x2="'+left+'" y2="'+baseY+'"/>'+
      '<line class="metric-chart-axis-line" x1="'+left+'" y1="'+baseY+'" x2="'+plotRight+'" y2="'+baseY+'"/>';
    if(options.unit||options.axisUnit)svg+=chartAxisUnit(options.axisUnit||options.unit,left,top);
    return svg;
  }
  function lineChart(entries,options) {
    if(!entries.length)return emptyChart(options.empty);
    var container=byId(options.containerId||'insight-chart');
    var width=clamp(container.clientWidth||820,320,1600),height=clamp(container.clientHeight||276,230,440),left=47,right=32,top=32,bottom=37,values=entries.map(function(e){return e.value;}),min=options.min!=null?options.min:Math.min.apply(Math,values),max=options.max!=null?options.max:Math.max.apply(Math,values);
    if(min===max){var samePad=Math.max(Math.abs(min)*.04,1);min=Math.max(options.floor||0,min-samePad);max+=samePad;}
    var range=Math.max(.0001,max-min),pad=range*.14;
    if(options.min==null)min=Math.max(options.floor||0,min-pad);
    if(options.max==null)max+=pad;
    function x(index){return left+(entries.length===1?(width-left-right)/2:index*(width-left-right)/(entries.length-1));}
    function y(value){return options.reverse?top+(value-min)*(height-top-bottom)/(max-min):top+(max-value)*(height-top-bottom)/(max-min);}
    function valueLabel(value){return options.formatter?options.formatter(value):formatNumber(value,options.decimals)+(options.suffix||'');}
    var points=entries.map(function(entry,index){return [x(index),y(entry.value)];}),path=seriesPath(points);
    var gradientId=options.gradientId||'insight-fill';
    var svg='<svg class="metric-axis-chart" viewBox="0 0 '+width+' '+height+'" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><linearGradient id="'+gradientId+'" x1="0" y1="0" x2="0" y2="1"><stop stop-color="'+options.color+'" stop-opacity=".28"/><stop offset="1" stop-color="'+options.color+'" stop-opacity="0"/></linearGradient></defs>';
    svg+=metricChartFrame(width,height,left,right,top,bottom,options,y,min,max);
    if(options.goal){var goalY=y(options.goal);if(goalY>=top&&goalY<=height-bottom)svg+='<line class="metric-goal-line" x1="'+left+'" y1="'+goalY+'" x2="'+(width-right)+'" y2="'+goalY+'"/><text class="metric-goal-label" x="'+(width-right)+'" y="'+(goalY-7)+'" text-anchor="end">mål '+formatNumber(options.goal,1)+'</text>';}
    svg+='<path class="line-area" d="'+path+' L '+points[points.length-1][0]+' '+(height-bottom)+' L '+points[0][0]+' '+(height-bottom)+' Z" fill="url(#'+gradientId+')"/>'+glowingLine(path,options.color,'');
    points.forEach(function(point,index){
      svg+=glowingPoint(point[0],point[1],index===points.length-1?4.7:3.2,options.color,' metric-data-point');
      svg+='<circle class="chart-hit-point" cx="'+point[0]+'" cy="'+point[1]+'" r="14"'+chartTipAttrs(logDate(entries[index].date)+(entries[index].type?' · '+entries[index].type:''),valueLabel(entries[index].value),'')+'/>';
    });
    var last=entries[entries.length-1],lastPoint=points[points.length-1],labelX=clamp(lastPoint[0],left+35,width-right-2),anchor=labelX>width-120?'end':'start';
    svg+='<text class="last-label" x="'+labelX+'" y="'+clamp(lastPoint[1]-14,top+10,height-bottom-10)+'" text-anchor="'+anchor+'" fill="'+options.color+'">'+escapeHtml(valueLabel(last.value))+'</text>';
    var desired=width<480?4:6,indexes=[];
    if(entries.length<=desired)indexes=entries.map(function(_,i){return i;});
    else{
      for(var i=0;i<desired;i++)indexes.push(Math.round(i*(entries.length-1)/(desired-1)));
      indexes=indexes.filter(function(index,pos,array){return pos===0||index!==array[pos-1];});
    }
    indexes.forEach(function(index){svg+='<text class="metric-chart-x-label" x="'+x(index)+'" y="'+(height-10)+'" text-anchor="middle">'+logDate(entries[index].date)+'</text>';});
    return svg+'</svg>';
  }
  function heartChart(entries) {
    var valid=entries.filter(function(entry){return entry.value!=null&&entry.value>0;});
    if(!valid.length)return emptyChart('Pulskurvan visas när ett pass med puls är loggat.');
    var width=clamp(byId('insight-chart').clientWidth||820,320,1600),height=clamp(byId('insight-chart').clientHeight||276,230,440),left=47,right=34,top=32,bottom=37;
    var min=Math.max(0,Math.min.apply(Math,valid.map(function(e){return e.min||e.value;}))-15);
    var max=Math.max.apply(Math,valid.map(function(e){return e.max||e.value;}))+15;
    min=Math.floor(min/10)*10;max=Math.ceil(max/10)*10;
    if(max<=min)max=min+10;
    function x(index){return left+(entries.length===1?(width-left-right)/2:index*(width-left-right)/(entries.length-1));}
    function y(value){return top+(max-value)*(height-top-bottom)/(max-min);}
    var groups={cardio:[[]],strength:[[]]};
    var svg='<svg viewBox="0 0 '+width+' '+height+'" preserveAspectRatio="xMidYMid meet" aria-hidden="true">';
    svg+=chartAxisUnit('BPM',left,top);
    [0,.5,1].forEach(function(ratio){var value=min+(max-min)*ratio,gy=y(value);svg+='<line class="chart-grid" x1="'+left+'" y1="'+gy+'" x2="'+(width-right)+'" y2="'+gy+'"/><text class="chart-axis-label" x="'+(left-8)+'" y="'+(gy+3)+'" text-anchor="end">'+Math.round(value)+'</text>';});
    entries.forEach(function(entry,index){
      if(entry.value==null||!(entry.value>0)){groups.cardio.push([]);groups.strength.push([]);return;}
      var px=x(index),py=y(entry.value),color=entry.kind==='cardio'?'#ff657a':'#67d4e4';
      groups[entry.kind][groups[entry.kind].length-1].push([px,py]);
      if(entry.min>0&&entry.max>=entry.min){
        var y1=y(entry.max),y2=y(entry.min);
        var cap=Math.max(1,Math.min(5,(width-left-right)/Math.max(entries.length,1)*.32));
        svg+='<line class="range-bar" x1="'+px+'" y1="'+y1+'" x2="'+px+'" y2="'+y2+'" stroke="'+color+'"/><line class="range-cap" x1="'+(px-cap)+'" y1="'+y1+'" x2="'+(px+cap)+'" y2="'+y1+'" stroke="'+color+'"/><line class="range-cap" x1="'+(px-cap)+'" y1="'+y2+'" x2="'+(px+cap)+'" y2="'+y2+'" stroke="'+color+'"/>';
      }
    });
    [['cardio','#ff657a'],['strength','#67d4e4']].forEach(function(config){
      groups[config[0]].forEach(function(points){
        if(points.length>1)svg+=glowingLine(seriesPath(points),config[1],'');
      });
    });
    var previouslyLabelled=[],heartLabels='',heartMarkers='',heartHits='';
    entries.forEach(function(entry,index){
      if(entry.value==null||!(entry.value>0))return;
      var px=x(index),py=y(entry.value),color=entry.kind==='cardio'?'#ff657a':'#67d4e4';
      // Always render a visible marker for every saved heart-rate measurement.
      // Keep labels and transparent hit zones on separate layers so labels never cover the markers.
      heartMarkers+=glowingPoint(px,py,4,color,'heart-point');
      heartHits+='<circle class="chart-hit-point" cx="'+px+'" cy="'+py+'" r="14"'+chartTipAttrs(logDate(entry.date)+' · '+entry.type,Math.round(entry.value)+' bpm',entry.min>0&&entry.max>=entry.min?'Intervall '+Math.round(entry.min)+'–'+Math.round(entry.max)+' bpm':'',color)+'/>';
      var labelInterval=Math.max(1,Math.ceil(entries.length/(width<560?3:6)));
      if(index!==0&&index!==entries.length-1&&index%labelInterval!==0)return;
      var labelText=Math.round(entry.value)+' bpm';
      var above=index%2===0;
      if(previouslyLabelled.length&&Math.abs(py-previouslyLabelled[previouslyLabelled.length-1][1])<18)above=!previouslyLabelled[previouslyLabelled.length-1][2];
      var labelY=clamp(py+(above?-18:26),top+11,height-bottom-8);
      var labelX=clamp(px,left+24,width-right-24);
      heartLabels+='<text class="last-label" x="'+labelX+'" y="'+labelY+'" text-anchor="middle" fill="'+color+'">'+labelText+'</text>';
      previouslyLabelled.push([px,py,above]);
    });
    svg+=heartLabels+heartMarkers+heartHits;
    var indexes=entries.length<4?entries.map(function(_,i){return i;}):[0,Math.floor((entries.length-1)/2),entries.length-1];
    indexes.forEach(function(index){svg+='<text class="chart-axis-label" x="'+x(index)+'" y="'+(height-10)+'" text-anchor="middle">'+logDate(entries[index].date)+'</text>';});
    return svg+'</svg>';
  }

  function renderInsightTable(entries) {
    var headers=[],rows=[];
    if(state.insight==='heart'){
      headers=['Datum','Pass','Medel','Intervall'];rows=entries.slice().reverse().map(function(e){return [logDate(e.date),e.type,e.value!=null?Math.round(e.value)+' bpm':'—',e.min&&e.max?Math.round(e.min)+'–'+Math.round(e.max):'—'];});
    }else if(state.insight==='pace'){
      headers=['Datum','Pass','Snittakt','Distans'];rows=entries.slice().reverse().map(function(e){return [logDate(e.date),e.type,formatPace(e.value),formatNumber(e.distance,2)+' km'];});
    }else{
      headers=['Datum','Källa','VO₂'];rows=entries.slice().reverse().map(function(e){return [logDate(e.date),e.type,formatNumber(e.value,1)+' ml/kg/min'];});
    }
    byId('insight-table-head').innerHTML='<tr>'+headers.map(function(h){return'<th>'+h+'</th>';}).join('')+'</tr>';
    byId('insight-table-body').innerHTML=rows.length?rows.map(function(row){return'<tr>'+row.map(function(cell){return'<td>'+escapeHtml(cell)+'</td>';}).join('')+'</tr>';}).join(''):'<tr><td colspan="'+headers.length+'">Inga mätvärden ännu.</td></tr>';
  }
  function renderInsightSpecial(entries) {
    var panel=byId('insight-special'),copy=byId('insight-copy');
    var special=state.insightMode==='chart'&&(state.insight==='pace'||state.insight==='vo2');
    panel.hidden=!special;
    copy.hidden=special;
    if(!special){
      panel.removeAttribute('data-kind');
      byId('insight-special-summary').innerHTML='';
      byId('insight-special-chart-title').textContent='';
      byId('insight-special-chart-unit').textContent='';
      byId('insight-special-legend').innerHTML='';
      return;
    }
    panel.dataset.kind=state.insight;
    var summary=byId('insight-special-summary'),title=byId('insight-special-chart-title'),unit=byId('insight-special-chart-unit'),legend=byId('insight-special-legend');
    var latest=entries.length?entries[entries.length-1]:null;
    if(state.insight==='pace'){
      var goalDistance=number(data.goals.runDistanceGoal)||10;
      var allRuns=data.workouts.filter(function(workout){return withinChartRange(workout);}).map(workoutDistance).filter(function(distance){return distance>0;});
      var maxDistance=allRuns.length?Math.max.apply(Math,allRuns):0;
      var totalDistance=allRuns.reduce(function(total,distance){return total+distance;},0);
      var distanceRatio=clamp(maxDistance/goalDistance*100,0,100);
      summary.innerHTML='<p class="insight-special-section-label">Löpning &amp; registrerade värden</p>'+
        '<div class="insight-special-goal-title">Längsta löppass <span>(km)</span></div>'+
        '<div class="insight-special-progress" style="--metric-progress:'+distanceRatio.toFixed(2)+'%" role="progressbar" aria-label="Längsta löppass mot distansmål" aria-valuemin="0" aria-valuemax="'+goalDistance+'" aria-valuenow="'+maxDistance+'">'+
          '<div class="insight-special-progress-track"><i></i><b></b></div>'+
          '<div class="insight-special-progress-scale"><span>0 km</span><strong>'+formatNumber(maxDistance,1)+' km</strong>'+(distanceRatio<82?'<span>'+formatNumber(goalDistance,1)+' km</span>':'')+'</div>'+
        '</div>'+
        '<div class="insight-special-distance-total">'+(state.chartRange==='month'?'Totalt senaste 30 dagarna: ':'Totalt loggat: ')+formatNumber(totalDistance,1)+' km</div>';
      title.textContent='Löpdistans över tid';
      unit.textContent='KM';
      if(!entries.length){legend.innerHTML='<strong>Inga registrerade värden</strong>';return;}
      var pr=paceRange(entries);
      legend.innerHTML='<div class="pace-heat-scale" role="img" aria-label="Färgskala för snittakt: ljust guld är snabbast, '+escapeHtml(formatPace(pr.min))+', djupt rosa långsammast, '+escapeHtml(formatPace(pr.max))+'.">'+
        '<span>Snabbast <b>'+escapeHtml(formatPace(pr.min).replace(' /km',''))+'</b></span>'+
        '<i style="background:linear-gradient(90deg,'+[0,1/3,2/3,1].map(paceHeat).join(',')+')"></i>'+
        '<span>Långsammast <b>'+escapeHtml(formatPace(pr.max).replace(' /km',''))+'</b></span></div>'+
        '<strong>Senast '+formatNumber(latest.distance,1)+' km · '+escapeHtml(formatPace(latest.value))+'</strong>';
      return;
    }
    var goal=number(data.goals.vo2Goal)||45;
    var maxValue=entries.reduce(function(max,entry){return Math.max(max,number(entry.value));},0);
    var scaleMin=Math.min(40,goal-1),range=Math.max(1,goal-scaleMin);
    var progress=maxValue>0?clamp((maxValue-scaleMin)/range*100,0,100):0;
    var longestRun=data.workouts.filter(withinChartRange).reduce(function(max,workout){return Math.max(max,workoutRunTime(workout));},0);
    summary.innerHTML=
      '<div class="insight-special-goal-title">Högsta VO₂ <span>(ml/kg/min)</span></div>'+
      '<div class="insight-special-progress" style="--metric-progress:'+progress.toFixed(2)+'%" role="progressbar" aria-label="VO₂ mot mål" aria-valuemin="'+scaleMin+'" aria-valuemax="'+goal+'" aria-valuenow="'+formatNumber(maxValue,1)+'">'+
        '<div class="insight-special-progress-track"><i></i><b></b></div>'+
        '<div class="insight-special-progress-scale"><span>'+formatNumber(scaleMin,0)+'</span><strong>'+formatNumber(maxValue,1)+'</strong><span>'+formatNumber(goal,1)+'</span></div>'+
      '</div>'+
      '<div class="insight-special-stats">'+
        '<div><span>Högsta VO₂</span><strong>'+(maxValue?formatNumber(maxValue,1)+' ml/kg/min':'—')+'</strong></div>'+
        '<div><span>Längsta löptid</span><strong>'+(longestRun?formatNumber(longestRun,0)+' min':'—')+'</strong></div>'+
      '</div>';
    title.textContent='VO₂ över tid';
    unit.textContent='ML/KG/MIN';
    legend.innerHTML='<span class="insight-special-key"><i></i>VO₂ max</span><span class="insight-special-goal-key">Mål '+formatNumber(goal,1)+'</span><strong>'+(latest?'Senast '+formatNumber(latest.value,1)+' ml/kg/min':'Inga registrerade värden')+'</strong>';
  }


  /* Pace as heat: fast runs glow pale gold, slow ones deep rose (t 0 → 1). */
  var PACE_HEAT=[[255,227,163],[255,154,107],[255,95,126],[176,74,154]];
  function paceHeat(t) {
    t=clamp(t,0,1)*(PACE_HEAT.length-1);
    var i=Math.min(PACE_HEAT.length-2,Math.floor(t)),f=t-i,a=PACE_HEAT[i],b=PACE_HEAT[i+1];
    return '#'+[0,1,2].map(function(k){return Math.round(a[k]+(b[k]-a[k])*f).toString(16).padStart(2,'0');}).join('');
  }
  function paceRange(entries) {
    var paces=entries.map(function(e){return e.value;});
    return {min:Math.min.apply(Math,paces),max:Math.max.apply(Math,paces)};
  }
  function paceT(pace,range){return range.max>range.min?(pace-range.min)/(range.max-range.min):0;}
  /* Distance per run over time; each point's colour is that run's pace. */
  function runDistanceChart(entries) {
    if(!entries.length)return emptyChart('Löpdistansen visas när ett löppass med distans och tid har loggats.');
    var container=byId('insight-chart');
    var width=clamp(container.clientWidth||820,320,1600),height=clamp(container.clientHeight||276,230,440),left=47,right=32,top=32,bottom=37;
    var range=paceRange(entries),dists=entries.map(function(e){return e.distance;});
    // Same autoscale as the VO2 chart: the range of the runs plus a margin, not from zero.
    var min=Math.min.apply(Math,dists),max=Math.max.apply(Math,dists);
    if(min===max){min=Math.max(0,min-1);max+=1;}
    var pad=(max-min)*.14;min=Math.max(0,min-pad);max+=pad;
    function x(index){return left+(entries.length===1?(width-left-right)/2:index*(width-left-right)/(entries.length-1));}
    function y(value){return top+(max-value)*(height-top-bottom)/(max-min);}
    var points=entries.map(function(e,i){return [x(i),y(e.distance)];}),path=seriesPath(points);
    var colors=entries.map(function(e){return paceHeat(paceT(e.value,range));});
    var span=Math.max(1,width-left-right);
    var stops=points.map(function(pt,i){return '<stop offset="'+clamp((pt[0]-left)/span,0,1).toFixed(4)+'" stop-color="'+colors[i]+'"/>';}).join('');
    var svg='<svg class="metric-axis-chart run-heat-chart" viewBox="0 0 '+width+' '+height+'" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs>'+
      '<linearGradient id="run-heat-stroke" gradientUnits="userSpaceOnUse" x1="'+left+'" y1="0" x2="'+(width-right)+'" y2="0">'+stops+'</linearGradient>'+
      '<linearGradient id="run-heat-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ff9a6b" stop-opacity=".16"/><stop offset="1" stop-color="#ff9a6b" stop-opacity="0"/></linearGradient></defs>';
    svg+=metricChartFrame(width,height,left,right,top,bottom,{tickCount:5,gridColor:'#ff9a6b12',axisColor:'#b9898e',axisUnit:'KM',decimals:1},y,min,max);
    if(points.length>1)svg+='<path class="line-area" d="'+path+' L '+points[points.length-1][0]+' '+(height-bottom)+' L '+points[0][0]+' '+(height-bottom)+' Z" fill="url(#run-heat-fill)"/><path class="run-heat-line" d="'+path+'" stroke="url(#run-heat-stroke)"/>';
    points.forEach(function(pt,i){
      var e=entries[i];
      svg+='<circle class="run-heat-ring" cx="'+pt[0]+'" cy="'+pt[1]+'" r="'+(i===points.length-1?7:5.6)+'"/>'+glowingPoint(pt[0],pt[1],i===points.length-1?5:4,colors[i],' metric-data-point');
      svg+='<circle class="chart-hit-point" cx="'+pt[0]+'" cy="'+pt[1]+'" r="14"'+chartTipAttrs(logDate(e.date)+(e.type?' · '+e.type:''),formatNumber(e.distance,2)+' km',formatPace(e.value)+' · '+formatNumber(e.time,0)+' min',colors[i])+'/>';
    });
    var last=entries[entries.length-1],lp=points[points.length-1],labelX=clamp(lp[0],left+35,width-right-2);
    svg+='<text class="last-label" x="'+labelX+'" y="'+clamp(lp[1]-14,top+10,height-bottom-10)+'" text-anchor="'+(labelX>width-120?'end':'start')+'" fill="'+colors[colors.length-1]+'">'+escapeHtml(formatPace(last.value))+'</text>';
    var desired=width<480?4:6,indexes=[];
    if(entries.length<=desired)indexes=entries.map(function(_,i){return i;});
    else{for(var i=0;i<desired;i++)indexes.push(Math.round(i*(entries.length-1)/(desired-1)));indexes=indexes.filter(function(v,pos,arr){return pos===0||v!==arr[pos-1];});}
    indexes.forEach(function(index){svg+='<text class="metric-chart-x-label" x="'+x(index)+'" y="'+(height-10)+'" text-anchor="middle">'+logDate(entries[index].date)+'</text>';});
    return svg+'</svg>';
  }

  function renderInsight() {
    document.querySelectorAll('[data-insight]').forEach(function(button){button.setAttribute('aria-selected',String(button.dataset.insight===state.insight));});
    document.querySelectorAll('[data-insight-mode]').forEach(function(button){button.setAttribute('aria-pressed',String(button.dataset.insightMode===state.insightMode));});
    document.querySelectorAll('[data-chart-range]').forEach(function(button){button.setAttribute('aria-pressed',String(button.dataset.chartRange===state.chartRange));});
    var entries,markup,name,description;
    if(state.insight==='heart'){
      entries=filterChartEntries(heartData());name='Medelpuls över tid';description='Kondition och styrka visas som två separata ljussignaler.';markup=heartChart(entries);
    }else if(state.insight==='pace'){
      entries=filterChartEntries(paceData());name='Löpdistans över tid';description='Varje punkt är ett löppass; färgen visar snittakten.';markup=runDistanceChart(entries);
    }else{
      entries=filterChartEntries(vo2Data());name='VO₂ över tid';description='Samma autoskalning som originalvyn, anpassad efter dina loggade VO₂-värden.';markup=lineChart(entries,{color:'#65d7a5',axisColor:'#65d7a5',gridColor:'#65d7a514',axisUnit:'ML/KG/MIN',tickCount:5,goal:number(data.goals.vo2Goal)||45,decimals:1,suffix:' ml/kg/min',empty:'VO₂-kurvan visas när ett värde har loggats.'});
    }
    byId('insight-name').textContent=name;byId('insight-description').textContent=description;
    byId('insight-chart').hidden=state.insightMode!=='chart';byId('insight-table-wrap').hidden=state.insightMode!=='table';
    renderInsightSpecial(entries);
    byId('insight-chart').innerHTML=markup;renderInsightTable(entries);
    byId('insight-chart').setAttribute('aria-label',name+'. '+entries.map(function(e){return logDate(e.date)+': '+(e.value==null?'saknas':e.value);}).join('. '));
    scheduleChartCanvasGlow('insight-chart');
  }

  function renderVolume() {
    var legend=byId('volume-legend'),chart=byId('volume-chart'),series=trainingGroupVolumeSeries().filter(function(group){return group.entries.some(withinChartRange);});
    document.querySelectorAll('[data-chart-range]').forEach(function(button){button.setAttribute('aria-pressed',String(button.dataset.chartRange===state.chartRange));});
    if(!series.length){
      legend.innerHTML='';
      chart.innerHTML='<div class="volume-empty">'+(state.chartRange==='month'?'Inga styrkepass med registrerad volym senaste 30 dagarna.':'Passvolym visas när samma träningsgrupp har loggats minst två gånger med registrerad viktvolym.')+'</div>';
      chart.setAttribute('aria-label','Ingen passvolym att visa ännu.');
      return;
    }
    legend.innerHTML=series.map(function(group,index){
      var color=groupVolumeColor(index);
      return '<span><i style="--legend-color:'+color+'"></i>'+escapeHtml(group.name)+'</span>';
    }).join('');
    chart.innerHTML=groupVolumeChart(series);
    chart.setAttribute('aria-label','Passvolym per träningsgrupp. '+series.map(function(group){
      return group.name+': '+group.entries.map(function(entry){return logDate(entry.date)+' '+Math.round(entry.value)+' kg';}).join(', ');
    }).join('. '));
    scheduleChartCanvasGlow('volume-chart');
  }

  function exerciseResult(raw) {
    var ex=normalizeExercise(raw);
    if(ex.kind==='cardio')return ex.distance?formatNumber(ex.distance,2)+' km'+(ex.time?' · '+formatNumber(ex.time,0)+' min':''):(ex.time?formatNumber(ex.time,0)+' min':'Kondition');
    var pieces=[];if(ex.sets&&ex.reps)pieces.push(ex.sets+'×'+ex.reps);if(ex.weight)pieces.push(formatNumber(ex.weight,1)+' kg');return pieces.join(' · ')||'Styrka';
  }
  function exerciseSeconds(workout,raw,index) {
    var ex=normalizeExercise(raw);if(ex.durationSec)return ex.durationSec;
    var timings=Array.isArray(workout.exerciseTimings)?workout.exerciseTimings:[];
    var timing=timings.find(function(item){return item&&number(item.exerciseIndex)===index;});
    if(!timing&&timings[index]&&timings[index].exerciseIndex==null)timing=timings[index];
    return timing?number(timing.durationSec):0;
  }
  function workoutMiniIntervals(workout) {
    var min=number(workout.hrMin),avg=number(workout.hrAvg),max=number(workout.hrMax);
    var saved=(data.vo2||[]).find(function(item){return item&&item.date===workout.date;});
    var vo2=number(workout.vo2)||number(saved&&(saved.score||saved.value||saved.vo2));
    var pace=workoutPace(workout),goal=number(data.goals.vo2Goal)||45;
    function chart(type,label,value,position,low,high,unit){
      var pct=clamp((position-9)/86*100,0,100);
      return '<div class="log-mini-meter log-mini-meter--'+type+'" role="img" aria-label="'+escapeHtml(label+': '+value+' '+unit+'. Skala '+low+' till '+high)+'">'+
        '<div class="log-mini-reading"><span class="log-mini-label">'+label+'</span><strong>'+escapeHtml(value)+'<small>'+unit+'</small></strong></div>'+
        '<div class="log-mini-signal"><div class="log-mini-track"><span class="log-mini-point" style="left:'+pct.toFixed(2)+'%"></span></div></div>'+
        '<div class="log-mini-scale"><span>'+escapeHtml(low)+'</span><span>'+escapeHtml(high)+'</span></div></div>';
    }
    var charts=[];
    if(avg>0){
      var pulsePos=min>0&&max>=min?(min===max?52:9+clamp((avg-min)/(max-min),0,1)*86):52;
      charts.push(chart('heart','Puls',Math.round(avg),pulsePos,min>0?String(Math.round(min)):'min',max>0?String(Math.round(max)):'max','bpm'));
    }
    if(vo2>0){
      var vo2Pos=9+clamp((vo2-40)/(Math.max(40.1,goal)-40),0,1)*86;
      charts.push(chart('vo2','VO₂',formatNumber(vo2,1),vo2Pos,'40',formatNumber(goal,1)+' mål','ml/kg/min'));
    }
    if(pace>0){
      var pacePos=9+clamp((7-pace)/4,0,1)*86;
      charts.push(chart('pace','Snittakt',formatPace(pace).replace(' /km',''),pacePos,'7:00','3:00','min/km'));
    }
    return charts.length?'<div class="log-mini-intervals" data-count="'+charts.length+'" aria-label="Registrerade mätvärden">'+charts.join('')+'</div>':'';
  }

  function isHistoricExerciseName(name,kind,type) {
    var key=String(type||'').replace(/\s+/g,' ').trim().toLocaleLowerCase('sv-SE')+'|'+(kind==='cardio'?'cardio':'strength')+'|'+encodeURIComponent(String(name||'').replace(/\s+/g,' ').trim().toLocaleLowerCase('sv-SE'));
    return !!(data.hiddenExerciseNames&&data.hiddenExerciseNames[key]);
  }
  /* Shared look (pulse-kit.css): drawn icons and the round muscle artwork
     the pass builder and the exercise explorer use. */
  var PK_ICON={
    chevron:'<svg class="pk-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    down:'<svg class="pk-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
    clock:'<svg class="pk-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    pencil:'<svg class="pk-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 19.5l1-4L15.8 5.2a2 2 0 0 1 2.9 0l.1.1a2 2 0 0 1 0 2.9L8.5 18.5z"/><path d="M13.5 7.5l3 3"/></svg>'
  };
  var PK_ART=[[/triceps|dips/,'triceps'],[/biceps|curl/,'biceps'],[/bröst|press|fly|armhäv|push/,'chest'],[/rygg|rodd|lats|pull/,'back'],[/axl|axel|shoulder/,'shoulders'],[/mage|core|plank/,'abs'],[/säte|höft|glute/,'glutes'],[/baksida|lårcurl|marklyft/,'hamstrings'],[/vad/,'calves'],[/ben|knä|utfall|squat|lår|underkropp|helkropp/,'quads']];
  var PK_MOON='<svg class="pk-icon pk-thumb-icon" viewBox="0 0 24 24"><path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/></svg>';
  var PK_CARDIO='<svg class="pk-icon pk-thumb-icon" viewBox="0 0 24 24"><path d="M3 12h4l2-5 4 10 2-5h6"/></svg>';
  function pkThumb(text,kind) {
    if(kind==='cardio')return '<span class="pk-thumb is-cardio" aria-hidden="true">'+PK_CARDIO+'</span>';
    var lower=String(text||'').toLocaleLowerCase('sv-SE'),slug='';
    for(var i=0;i<PK_ART.length&&!slug;i++)if(PK_ART[i][0].test(lower))slug=PK_ART[i][1];
    return '<span class="pk-thumb" aria-hidden="true"><img src="assets/atlas-art-v1/'+(slug||'chest')+'.webp" alt="" loading="lazy" decoding="async"></span>';
  }

  function renderLog() {
    var allWorkouts=data.workouts.slice().sort(function(a,b){
      return String(b.date).localeCompare(String(a.date))||number(b.id)-number(a.id);
    });
    var workouts=allWorkouts.slice(0,state.logVisibleCount);
    var timeline=byId('log-timeline');
    if(!workouts.length){
      timeline.innerHTML='<p class="log-empty">Inga loggade pass ännu. De kommer att visas här som en tidslinje.</p>';
      return;
    }
    if(params.get('demo')==='1'&&!state.logTouched&&state.openLogId===null) {
      state.openLogId='field-log-'+String(workouts[0].id||workouts[0].date+'-0').replace(/[^a-zA-Z0-9_-]/g,'-');
    }
    timeline.innerHTML=workouts.map(function(workout,index){
      var id='field-log-'+String(workout.id||workout.date+'-'+index).replace(/[^a-zA-Z0-9_-]/g,'-');
      var open=state.openLogId===id;
      var exercises=Array.isArray(workout.exercises)?workout.exercises:[],volume=workoutVolume(workout),distance=workoutDistance(workout),kind=workoutKind(workout);
      var secondary=number(workout.duration)?formatNumber(workout.duration,0)+' min':number(workout.hrAvg)?Math.round(number(workout.hrAvg))+' bpm':'—';
      var detail=exercises.length+' övning'+(exercises.length===1?'':'ar');
      var rows=exercises.length?exercises.map(function(exercise,exerciseIndex){
        var seconds=exerciseSeconds(workout,exercise,exerciseIndex),normalized=normalizeExercise(exercise);
        var retired=isHistoricExerciseName(normalized.name,normalized.kind,workoutType(workout));
        return '<button type="button" class="exercise-row" data-field-action="edit-log" data-workout-id="'+escapeHtml(String(workout.id))+'" data-exercise-index="'+exerciseIndex+'" aria-label="Redigera passet, '+escapeHtml(normalized.name)+(retired?' (äldre övningsnamn)':'')+'"><span class="exercise-index">'+(exerciseIndex+1)+'</span><span class="exercise-name'+(retired?' is-retired-exercise':'')+'"'+(retired?' title="Äldre övningsnamn – borttaget från listan"':'')+'>'+escapeHtml(normalized.name)+'</span><span class="exercise-performance"><span class="exercise-result">'+escapeHtml(exerciseResult(exercise))+'</span>'+(seconds?'<time class="exercise-time">'+PK_ICON.clock+formatDuration(seconds)+'</time>':'')+'</span></button>';
      }).join(''):'<p class="log-empty">Passet saknar sparade övningsrader.</p>';
      var intervals=workoutMiniIntervals(workout);
      var notes=workout.notes?'<p class="log-secondary">'+escapeHtml(workout.notes)+'</p>':'';
      return '<article class="log-card'+(open?' is-open':'')+(kind==='cardio'?' is-cardio':'')+'" data-log-card data-log-id="'+id+'" data-workout-id="'+escapeHtml(String(workout.id))+'"><button class="log-summary" type="button" aria-controls="'+id+'-panel" aria-expanded="'+open+'"><time class="log-date">'+logDate(workout.date)+'</time>'+pkThumb(workoutType(workout),kind)+'<span class="log-title"><strong>'+escapeHtml(workoutType(workout))+'</strong><span class="log-meta">'+escapeHtml(detail+' · '+(kind==='cardio'?'Kondition':'Styrka'))+'</span></span><span class="log-result"><strong>'+escapeHtml(workoutPrimary(workout))+'</strong><small>'+secondary+'</small></span><span class="log-chevron" aria-hidden="true">'+PK_ICON.chevron+'</span></button><div class="log-detail" id="'+id+'-panel"'+(open?'':' hidden')+'><div class="log-detail-overview"><div class="log-vitals" aria-label="Passets sammanfattning"><div class="vital"><span>Tid</span><strong>'+(number(workout.duration)?formatNumber(workout.duration,0)+' min':'—')+'</strong></div><div class="vital"><span>'+(kind==='cardio'?'Distans':'Volym')+'</span><strong>'+(kind==='cardio'?(distance?formatNumber(distance,2)+' km':'—'):(volume?formatNumber(Math.round(volume),0)+' kg':'—'))+'</strong></div></div>'+intervals+'</div><div class="exercise-stack">'+rows+notes+'</div></div></article>';
    }).join('');
    if(allWorkouts.length>workouts.length){
      var more=allWorkouts.length-workouts.length;
      timeline.insertAdjacentHTML('beforeend','<button class="log-more-button" type="button" data-log-more aria-label="Visa fler sparade träningspass">Visa äldre pass <span>'+more+' kvar</span>'+PK_ICON.down+'</button>');
    }
    if(chartGlowMq.matches)paintMiniIntervalGlows();
  }

  function recordCategory(name) {
    name=String(name).toLowerCase();
    if(/biceps|triceps|curl|dips/.test(name))return'Armar';
    if(/bröst|press|fly|armhäv/.test(name))return'Bröst';
    if(/ben|knä|marklyft|utfall|squat/.test(name))return'Ben';
    if(/rygg|rodd|lats|pull/.test(name))return'Rygg';
    if(/axel|shoulder/.test(name))return'Axlar';
    return'Övrigt';
  }
  function recordData() {
    var map={};
    data.workouts.slice().sort(function(a,b){return String(a.date).localeCompare(String(b.date));}).forEach(function(workout){
      (workout.exercises||[]).forEach(function(raw){var ex=normalizeExercise(raw);if(ex.kind!=='strength'||!ex.name||!(ex.weight>0))return;var key=ex.name.trim().toLowerCase();if(!map[key])map[key]={name:ex.name,value:0,first:0,history:[],category:recordCategory(ex.name)};if(!map[key].first)map[key].first=ex.weight;map[key].value=Math.max(map[key].value,ex.weight);map[key].history.push(ex.weight);});
    });
    Object.keys(data.prs||{}).forEach(function(name){var value=number(data.prs[name]);if(!value)return;var key=name.toLowerCase();if(!map[key])map[key]={name:name,value:value,first:value,history:[value],category:recordCategory(name)};else map[key].value=Math.max(map[key].value,value);});
    return Object.keys(map).map(function(key){var record=map[key];record.gain=Math.max(0,record.value-record.first);return record;}).sort(function(a,b){return b.value-a.value;});
  }
  function featuredRecordKeys(records) {
    var available=records.map(function(record){return record.name.toLocaleLowerCase('sv-SE');});
    var stored=readJSON('pulseFieldFeaturedRecords_'+profile,[]);
    var selected=[];
    if(Array.isArray(stored))stored.forEach(function(key){if(typeof key==='string'&&available.includes(key)&&!selected.includes(key)&&selected.length<3)selected.push(key);});
    available.forEach(function(key){if(selected.length<3&&!selected.includes(key))selected.push(key);});
    return selected;
  }
  function setFeaturedRecord(slot,key) {
    var records=recordData(),keys=featuredRecordKeys(records),oldKey=keys[slot],otherSlot=keys.indexOf(key);
    if(!records.some(function(record){return record.name.toLocaleLowerCase('sv-SE')===key;}))return;
    if(otherSlot>=0&&otherSlot!==slot)keys[otherSlot]=oldKey||'';
    keys[slot]=key;
    try{localStorage.setItem('pulseFieldFeaturedRecords_'+profile,JSON.stringify(keys));}catch(_){}
    renderRecords();
  }
  function setRecordPicker(open,slot) {
    var picker=byId('record-picker'),toggle=byId('record-customize');
    var apply=function(){picker.hidden=!open;if(open)picker.setAttribute('data-pm-unfold','');toggle.setAttribute('aria-expanded',String(open));};
    if(window.PulseMotion&&picker.parentElement)window.PulseMotion.measure(picker.parentElement,apply);else apply();
    if(open&&slot!=null){
      var control=picker.querySelector('[data-featured-select="'+slot+'"]');
      if(control)control.focus();
    }
  }

  function renderRecords() {
    var records=recordData();byId('record-count').textContent=records.length+' rekord';
    if(!records.length){
      byId('record-podium').innerHTML='';byId('record-picker-fields').innerHTML='';
      byId('record-customize').disabled=true;
      byId('record-groups').innerHTML='<p class="record-empty">Dina starkaste resultat får en egen plats här när de är loggade.</p>';return;
    }
    byId('record-customize').disabled=false;
    var keys=featuredRecordKeys(records),byKey={};
    records.forEach(function(record){byKey[record.name.toLocaleLowerCase('sv-SE')]=record;});
    byId('record-podium').innerHTML=keys.map(function(key,index){
      var record=byKey[key];
      // The three chosen records lead as glowing rows, in the builder's row style.
      return '<article class="record-feature">'+pkThumb(record.name,'strength')+'<div class="record-feature-copy"><span class="rank">'+String(index+1).padStart(2,'0')+'</span><h3>'+escapeHtml(record.name)+'</h3><p>'+(record.gain?'+'+formatNumber(record.gain,1)+' kg från första':'registrerat max')+'</p></div><strong>'+formatKg(record.value)+'</strong>'+
        '<button type="button" class="record-feature-edit" data-record-edit-slot="'+index+'" aria-label="Byt rekord för plats '+(index+1)+'">'+PK_ICON.pencil+'</button></article>';
    }).join('');
    byId('record-picker-fields').innerHTML=[0,1,2].map(function(slot){
      return '<label class="record-picker-field"><span>Plats '+String(slot+1).padStart(2,'0')+'</span><select data-featured-select="'+slot+'" aria-label="Välj rekord för plats '+(slot+1)+'">'+
        records.map(function(record){var key=record.name.toLocaleLowerCase('sv-SE');return '<option value="'+escapeHtml(key)+'"'+(keys[slot]===key?' selected':'')+'>'+escapeHtml(record.name)+'</option>';}).join('')+
      '</select></label>';
    }).join('');
    var groups={};records.forEach(function(record){(groups[record.category]||(groups[record.category]=[])).push(record);});
    byId('record-groups').innerHTML=Object.keys(groups).map(function(category,index){var rows=groups[category].map(function(record){return '<button type="button" class="record-row" data-field-action="edit-record" data-record-name="'+escapeHtml(record.name)+'" data-record-value="'+record.value+'" aria-label="Redigera rekord '+escapeHtml(record.name)+'">'+pkThumb(record.name,'strength')+'<span>'+escapeHtml(record.name)+(record.gain?'<small>+'+formatNumber(record.gain,1)+' kg utveckling</small>':'')+'</span><strong>'+formatKg(record.value)+'</strong></button>';}).join('');return '<details class="record-group"'+(index===0?' open':'')+'><summary><strong>'+escapeHtml(category)+'</strong><span>'+groups[category].length+' rekord</span><i>'+PK_ICON.chevron+'</i></summary><div class="record-list">'+rows+'</div></details>';}).join('');
  }

  var renderPending=false;
  function renderAll() {
    if(window.TrainingOverlay.isLocked()){renderPending=true;return;}
    renderPending=false;
    loadData();renderHero();renderRhythm();renderWeek();renderActivity();renderInsight();renderVolume();renderLog();renderRecords();
  }
  function showToast(message) {
    var toast=byId('field-toast');toast.textContent=message;toast.classList.add('is-visible');clearTimeout(showToast.timer);showToast.timer=setTimeout(function(){toast.classList.remove('is-visible');},2600);
  }
  function installEvents() {
    var toggle=byId('menu-toggle'),menu=byId('field-menu');
    function setMenu(open){if(open===menu.classList.contains('is-open'))return;menu.classList.toggle('is-open',open);menu.setAttribute('aria-hidden',String(!open));toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Stäng meny':'Öppna meny');}
    toggle.addEventListener('click',function(){setMenu(!menu.classList.contains('is-open'));});
    window.addEventListener('pulse-field:close-menu',function(){setMenu(false);});
    document.addEventListener('keydown',function(event){if(event.key==='Escape'&&menu.classList.contains('is-open')){setMenu(false);toggle.focus({preventScroll:true});}});
    menu.addEventListener('click',function(event){if(event.target.closest('a'))setMenu(false);});
    var compactToggle=byId('training-overview-toggle');
    if(compactToggle)compactToggle.addEventListener('click',openOriginalCompact);
    byId('record-customize').addEventListener('click',function(){setRecordPicker(byId('record-picker').hidden);});
    byId('record-picker-close').addEventListener('click',function(){setRecordPicker(false);});
    byId('record-picker-fields').addEventListener('change',function(event){
      var select=event.target.closest('[data-featured-select]');
      if(select)setFeaturedRecord(number(select.dataset.featuredSelect),select.value);
    });
    byId('record-podium').addEventListener('click',function(event){
      var edit=event.target.closest('[data-record-edit-slot]');
      if(edit)setRecordPicker(true,number(edit.dataset.recordEditSlot));
    });
    document.addEventListener('click',function(event){
      if(!menu.contains(event.target)&&!toggle.contains(event.target))setMenu(false);
      var loadMore=event.target.closest('[data-log-more]');
      if(loadMore){
        state.logVisibleCount+=12;
        renderLog();
        return;
      }
      var logButton=event.target.closest('.log-summary');
      if(logButton){
        var card=logButton.closest('[data-log-card]'),id=card.dataset.logId;
        state.logTouched=true;state.openLogId=state.openLogId===id?null:id;
        // The list grows and shrinks around the entry instead of jumping.
        var applyLog=function(){document.querySelectorAll('[data-log-card]').forEach(function(item){
          var open=item.dataset.logId===state.openLogId;
          item.classList.toggle('is-open',open);
          item.querySelector('.log-summary').setAttribute('aria-expanded',String(open));
          var detail=item.querySelector('.log-detail');detail.hidden=!open;
          if(open)detail.setAttribute('data-pm-unfold','');else detail.removeAttribute('data-pm-unfold');
        });};
        var logList=card.parentElement;
        if(window.PulseMotion)window.PulseMotion.measure(logList,applyLog);else applyLog();
        if(chartGlowMq.matches)paintMiniIntervalGlows();
        scheduleChartCanvasGlow('log');
      }
    });
    document.addEventListener('click',function(event){
var shift=event.target.closest('[data-week-shift]');if(shift){state.weekStart=shiftDate(state.weekStart,number(shift.dataset.weekShift)*7);state.selectedDate=isoDate(state.weekStart);renderWeek();if(state.activityView==='week')renderActivity();return;}
      var day=event.target.closest('[data-day]');if(day){state.selectedDate=day.dataset.day;renderWeek();window.dispatchEvent(new CustomEvent('pulse-field:open-tool',{detail:{tool:'edit-day',date:state.selectedDate}}));return;}
      var view=event.target.closest('[data-activity-view]');if(view){state.activityView=view.dataset.activityView;renderActivity();return;}
      var metric=event.target.closest('[data-activity-metric]');if(metric){state.activityMetric=metric.dataset.activityMetric;renderActivity();return;}
      var range=event.target.closest('[data-chart-range]');
    if(range){
      state.chartRange=range.dataset.chartRange==='month'?'month':'all';
      renderInsight();
      renderVolume();
      return;
    }
      var insight=event.target.closest('[data-insight]');if(insight){state.insight=insight.dataset.insight;renderInsight();return;}
      var insightMode=event.target.closest('[data-insight-mode]');if(insightMode){state.insightMode=insightMode.dataset.insightMode;renderInsight();return;}
    });
    byId('week-days').addEventListener('keydown',function(event){
      var day=event.target.closest('[data-day]');
      if(!day||!['Enter',' '].includes(event.key))return;
      event.preventDefault();day.click();
    });
    var chartHoverMq=window.matchMedia&&window.matchMedia('(hover:hover) and (pointer:fine)');
    if(!chartHoverMq||chartHoverMq.matches){
      document.addEventListener('pointerover',function(event){var target=event.target.closest&&event.target.closest('[data-chart-tip]');if(target)showChartTooltip(target,event,false);});
      document.addEventListener('pointermove',function(event){var target=event.target.closest&&event.target.closest('[data-chart-tip]');if(target)showChartTooltip(target,event,false);});
      document.addEventListener('pointerout',function(event){if(event.target.closest&&event.target.closest('[data-chart-tip]')&&!(event.relatedTarget&&event.relatedTarget.closest&&event.relatedTarget.closest('[data-chart-tip]')))hideChartTooltip();});
    }
    document.addEventListener('focusin',function(event){var target=event.target.closest&&event.target.closest('[data-chart-tip]');if(target)showChartTooltip(target,null,false);});
    document.addEventListener('focusout',function(event){if(event.target.closest&&event.target.closest('[data-chart-tip]'))hideChartTooltip();});
    document.addEventListener('click',function(event){var target=event.target.closest&&event.target.closest('[data-chart-tip]');if(target)showChartTooltip(target,event,true);});
    // Firebase can emit one event per storage key at login. Only six keys
    // contribute to this overview; combine their initial burst into one render.
    var fieldKeys=new Set(['ex_wk','ex_goals','ex_plannedSessions','ex_plan','ex_weekPlans','ex_prs','ex_vo2','ex_hiddenExerciseNamesV1']);
    var firebaseRenderTimer=0;
    window.addEventListener('firebase-sync',function(event){
      if(!event.detail||!fieldKeys.has(event.detail.key))return;
      clearTimeout(firebaseRenderTimer);
      firebaseRenderTimer=setTimeout(function(){
        firebaseRenderTimer=0;
        renderAll();
      },80);
    });
    window.addEventListener('pulse-field:data-change',renderAll);
    window.addEventListener('training-overlay:change',function(event){if(event.detail.locked)hideChartTooltip();else if(renderPending)requestAnimationFrame(renderAll);});
    window.addEventListener('storage',function(event){if(event.key&&fieldKeys.has(profile==='maja'&&event.key.endsWith('_maja')?event.key.slice(0,-5):event.key))renderAll();});
    var layoutWidth=document.documentElement.clientWidth,resizeTimer;
    window.addEventListener('resize',function(){
      // Ignore mobile Safari toolbar collapse: viewport height changes, chart width does not.
      var width=document.documentElement.clientWidth;
      if(width===layoutWidth)return;
      layoutWidth=width;
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(function(){renderActivity();renderInsight();renderVolume();},150);
    });
    if(chartGlowMq.addEventListener)chartGlowMq.addEventListener('change',scheduleChartCanvasGlow);
    else if(chartGlowMq.addListener)chartGlowMq.addListener(scheduleChartCanvasGlow);
  }

  function install() {
    updateCompactControl(false);
    installCompactBridge();
    installFieldSceneVisibility();
    wireProfileLinks();loadData();installEvents();renderAll();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
