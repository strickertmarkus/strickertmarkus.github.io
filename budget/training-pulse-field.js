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
    insightMode: 'chart'
  };
  var data = {};

  function byId(id) { return document.getElementById(id); }
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
      prs:readJSON('ex_prs',{}),
      vo2:readJSON('ex_vo2',[])
    };
  }

  function planForDate(value) {
    var key=isoDate(value);
    if (data.planned&&data.planned[key]) return data.planned[key];
    var d=dateAtNoon(value),index=(d.getDay()+6)%7,type=data.plan&&data.plan[dayKeys[index]];
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
    return url.pathname.split('/').pop()+url.search+url.hash;
  }
  function wireProfileLinks() {
    byId('profile-name').textContent=profile==='maja'?'Maja':'Markus Strickert';
    document.title=(profile==='maja'?'Maja':'Markus')+' Träning · Pulse Field';
    ['original-link','menu-original','next-session-link','edit-week-link','log-action-link','footer-original'].forEach(function(id){
      var link=byId(id);if(!link)return;
      var hash=link.hash,url=profileHref('exercise.html');link.href=url+hash;
    });
    byId('stretch-link').href=profileHref('exercise.html',{wellness:'stretch'});
    byId('meditation-link').href=profileHref('exercise.html',{wellness:'meditation'});
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
      byId('next-session-title').textContent='Välj dagens rörelse';
      byId('next-session-date').textContent='Nästa pass';
      byId('next-session-detail').textContent='Bygg eller välj ett upplägg';
      return;
    }
    var exercises=found.plan.exercises||[],sets=exercises.reduce(function(sum,ex){return sum+number(ex.sets);},0);
    byId('next-session-title').textContent=found.plan.type||'Planerat pass';
    byId('next-session-date').textContent=isoDate(found.date)===isoDate(today)?'I dag · '+shortDate(found.date):dayNames[(found.date.getDay()+6)%7]+' · '+shortDate(found.date);
    byId('next-session-detail').textContent=exercises.length?exercises.length+' övning'+(exercises.length===1?'':'ar')+(sets?' · '+sets+' set':''):'Planerat upplägg';
    byId('next-session-link').href=profileHref('exercise.html');
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
      var classes=['week-day'];
      if(key===today)classes.push('is-today');
      if(key===state.selectedDate)classes.push('is-selected');
      if(logged.length)classes.push('is-complete');
      markup+='<button type="button" class="'+classes.join(' ')+'" data-day="'+key+'" aria-pressed="'+(key===state.selectedDate)+'">'+
        '<span class="day-name">'+dayNames[i]+'</span><span class="day-date">'+date.getDate()+'</span><span class="day-type">'+escapeHtml(type)+'</span></button>';
    }
    byId('week-days').innerHTML=markup;
    renderSelectedDay();
  }
  function renderSelectedDay() {
    var date=dateAtNoon(state.selectedDate),plan=planForDate(date),logged=workoutsOn(date),parts=[dayNames[(date.getDay()+6)%7]+' '+shortDate(date)];
    if(plan)parts.push(plan.type||'Planerat pass');
    if(logged.length)parts.push(logged.length+' loggat pass');
    if(!plan&&!logged.length)parts.push('Återhämtning eller fri rörelse');
    byId('selected-day-copy').textContent=parts.join(' · ');
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
  function renderActivity() {
    root.dataset.fieldView=state.activityView;
    byId('activity-week-nav').hidden=state.activityView!=='week';
    document.querySelectorAll('[data-activity-view]').forEach(function(button){button.setAttribute('aria-selected',String(button.dataset.activityView===state.activityView));});
    document.querySelectorAll('[data-activity-metric]').forEach(function(button){button.setAttribute('aria-pressed',String(button.dataset.activityMetric===state.activityMetric));});
    var buckets=activityBuckets(),metric=state.activityMetric,total=buckets.reduce(function(sum,b){return sum+b[metric];},0);
    byId('activity-total').textContent=formatNumber(total,0);
    byId('activity-unit').textContent=metric==='minutes'?'minuter':'pass';
    byId('activity-caption').textContent=state.activityView==='history'?'De senaste åtta veckorna':'Samma vecka som i veckofältet';
    var values=buckets.map(function(b){return b[metric];}),max=Math.max.apply(Math,values.concat([metric==='minutes'?60:4])),width=800,height=240,left=40,right=14,top=20,bottom=37,plotW=width-left-right,plotH=height-top-bottom,step=plotW/buckets.length,barW=Math.min(18,step*.24);
    var svg='<svg viewBox="0 0 '+width+' '+height+'" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="bar-light" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff0e5"/><stop offset=".25" stop-color="#ff9a91"/><stop offset="1" stop-color="#ff657a" stop-opacity=".18"/></linearGradient><filter id="bar-glow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
    [0,.5,1].forEach(function(ratio){var y=top+plotH*(1-ratio);svg+='<line class="chart-grid" x1="'+left+'" y1="'+y+'" x2="'+(width-right)+'" y2="'+y+'"/><text class="chart-axis-label" x="'+(left-8)+'" y="'+(y+3)+'" text-anchor="end">'+Math.round(max*ratio)+'</text>';});
    buckets.forEach(function(bucket,index){
      var x=left+step*(index+.5),value=bucket[metric],barH=value?Math.max(4,plotH*value/max):0,y=top+plotH-barH;
      if(value)svg+='<rect class="activity-bar" x="'+(x-barW/2)+'" y="'+y+'" width="'+barW+'" height="'+barH+'" rx="'+(barW/2)+'" fill="url(#bar-light)" filter="url(#bar-glow)" style="animation-delay:'+(index*55)+'ms"/>'+(bucket.current?'<text class="chart-value" x="'+x+'" y="'+Math.max(13,y-9)+'" text-anchor="middle">'+formatNumber(value,0)+'</text>':'');
      else svg+='<line class="activity-zero" x1="'+(x-4)+'" y1="'+(top+plotH)+'" x2="'+(x+4)+'" y2="'+(top+plotH)+'"/>';
      svg+='<text class="chart-axis-label" x="'+x+'" y="'+(height-10)+'" text-anchor="middle">'+bucket.label+'</text>';
    });
    svg+='</svg>';
    byId('activity-chart').innerHTML=svg;
    byId('activity-chart').setAttribute('aria-label',buckets.map(function(b){return b.label+': '+b[metric]+' '+(metric==='minutes'?'minuter':'pass');}).join('. '));
  }

  function heartData() {
    return data.workouts.filter(function(w){return number(w.hrAvg)>0;}).sort(function(a,b){return String(a.date).localeCompare(String(b.date));}).slice(-14).map(function(w){return {date:w.date,value:number(w.hrAvg),min:number(w.hrMin),max:number(w.hrMax),kind:workoutKind(w),type:workoutType(w)};});
  }
  function distanceData() {
    return data.workouts.filter(function(w){return workoutDistance(w)>0;}).sort(function(a,b){return String(a.date).localeCompare(String(b.date));}).slice(-14).map(function(w){return {date:w.date,value:workoutDistance(w),pace:workoutPace(w),time:workoutRunTime(w),type:workoutType(w)};});
  }
  function vo2Data() {
    var map={};
    (data.vo2||[]).forEach(function(entry){var value=number(entry.score||entry.value||entry.vo2);if(entry.date&&value)map[entry.date]={date:entry.date,value:value,type:'VO₂-logg'};});
    data.workouts.forEach(function(w){var value=number(w.vo2);if(w.date&&value)map[w.date]={date:w.date,value:value,type:workoutType(w)};});
    return Object.keys(map).sort().map(function(key){return map[key];}).slice(-14);
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
  function emptyChart(message) {
    return '<div class="log-empty">'+escapeHtml(message)+'</div>';
  }
  function lineChart(entries,options) {
    if(!entries.length)return emptyChart(options.empty);
    var width=820,height=290,left=47,right=32,top=32,bottom=37,values=entries.map(function(e){return e.value;}),min=options.min!=null?options.min:Math.min.apply(Math,values),max=options.max!=null?options.max:Math.max.apply(Math,values);
    if(min===max){min=Math.max(0,min-1);max+=1;}
    var pad=(max-min)*.14;min=Math.max(options.floor||0,min-pad);max+=pad;
    function x(index){return left+(entries.length===1?(width-left-right)/2:index*(width-left-right)/(entries.length-1));}
    function y(value){return top+(max-value)*(height-top-bottom)/(max-min);}
    var points=entries.map(function(entry,index){return [x(index),y(entry.value)];}),path=seriesPath(points);
    var svg='<svg viewBox="0 0 '+width+' '+height+'" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="insight-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="'+options.color+'" stop-opacity=".28"/><stop offset="1" stop-color="'+options.color+'" stop-opacity="0"/></linearGradient></defs>';
    [0,.5,1].forEach(function(ratio){var value=min+(max-min)*ratio,gy=y(value);svg+='<line class="chart-grid" x1="'+left+'" y1="'+gy+'" x2="'+(width-right)+'" y2="'+gy+'"/><text class="chart-axis-label" x="'+(left-8)+'" y="'+(gy+3)+'" text-anchor="end">'+formatNumber(value,options.decimals)+'</text>';});
    if(options.goal){var goalY=y(options.goal);if(goalY>=top&&goalY<=height-bottom)svg+='<line x1="'+left+'" y1="'+goalY+'" x2="'+(width-right)+'" y2="'+goalY+'" stroke="#ffffff35" stroke-dasharray="3 7"/><text class="chart-axis-label" x="'+(width-right)+'" y="'+(goalY-7)+'" text-anchor="end">mål '+formatNumber(options.goal,1)+'</text>';}
    svg+='<path class="line-area" d="'+path+' L '+points[points.length-1][0]+' '+(height-bottom)+' L '+points[0][0]+' '+(height-bottom)+' Z" fill="url(#insight-fill)"/><path class="line-glow" d="'+path+'" style="color:'+options.color+'" stroke="'+options.color+'"/>';
    points.forEach(function(point,index){if(index===points.length-1)svg+='<circle class="last-point" cx="'+point[0]+'" cy="'+point[1]+'" r="5" fill="'+options.color+'" style="color:'+options.color+'"/>';});
    var last=entries[entries.length-1],lastPoint=points[points.length-1],labelX=clamp(lastPoint[0],left+35,width-right-2),anchor=labelX>width-120?'end':'start';
    svg+='<text class="last-label" x="'+labelX+'" y="'+clamp(lastPoint[1]-14,top+10,height-bottom-10)+'" text-anchor="'+anchor+'" fill="'+options.color+'">'+formatNumber(last.value,options.decimals)+(options.suffix||'')+'</text>';
    var indexes=entries.length<4?entries.map(function(_,i){return i;}):[0,Math.floor((entries.length-1)/2),entries.length-1];
    indexes.forEach(function(index){svg+='<text class="chart-axis-label" x="'+x(index)+'" y="'+(height-10)+'" text-anchor="middle">'+logDate(entries[index].date)+'</text>';});
    return svg+'</svg>';
  }
  function heartChart(entries) {
    if(!entries.length)return emptyChart('Pulskurvan visas när ett pass med puls är loggat.');
    var width=820,height=290,left=47,right=34,top=32,bottom=37,min=Math.max(0,Math.min.apply(Math,entries.map(function(e){return e.min||e.value;}))-15),max=Math.max.apply(Math,entries.map(function(e){return e.max||e.value;}))+15;
    min=Math.floor(min/10)*10;max=Math.ceil(max/10)*10;
    function x(index){return left+(entries.length===1?(width-left-right)/2:index*(width-left-right)/(entries.length-1));}
    function y(value){return top+(max-value)*(height-top-bottom)/(max-min);}
    var groups={cardio:[],strength:[]};entries.forEach(function(entry,index){groups[entry.kind].push({entry:entry,index:index,point:[x(index),y(entry.value)]});});
    var svg='<svg viewBox="0 0 '+width+' '+height+'" preserveAspectRatio="none" aria-hidden="true">';
    [0,.5,1].forEach(function(ratio){var value=min+(max-min)*ratio,gy=y(value);svg+='<line class="chart-grid" x1="'+left+'" y1="'+gy+'" x2="'+(width-right)+'" y2="'+gy+'"/><text class="chart-axis-label" x="'+(left-8)+'" y="'+(gy+3)+'" text-anchor="end">'+Math.round(value)+'</text>';});
    entries.forEach(function(entry,index){if(entry.min&&entry.max){var px=x(index),y1=y(entry.max),y2=y(entry.min),color=entry.kind==='cardio'?'#ff657a':'#67d4e4';svg+='<line class="range-bar" x1="'+px+'" y1="'+y1+'" x2="'+px+'" y2="'+y2+'" stroke="'+color+'"/><line class="range-cap" x1="'+(px-5)+'" y1="'+y1+'" x2="'+(px+5)+'" y2="'+y1+'" stroke="'+color+'"/><line class="range-cap" x1="'+(px-5)+'" y1="'+y2+'" x2="'+(px+5)+'" y2="'+y2+'" stroke="'+color+'"/>';}});
    [['cardio','#ff657a'],['strength','#67d4e4']].forEach(function(config,groupIndex){var points=groups[config[0]];if(!points.length)return;var path=seriesPath(points.map(function(p){return p.point;}));svg+='<path class="line-glow" d="'+path+'" stroke="'+config[1]+'" style="color:'+config[1]+'"/>';var last=points[points.length-1],labelX=clamp(last.point[0]+(groupIndex?-5:5),left+38,width-right),anchor=last.point[0]>width-115?'end':'start',offset=groupIndex?18:-12;svg+='<circle class="last-point" cx="'+last.point[0]+'" cy="'+last.point[1]+'" r="5" fill="'+config[1]+'" style="color:'+config[1]+'"/><text class="last-label" x="'+labelX+'" y="'+clamp(last.point[1]+offset,top+10,height-bottom-6)+'" text-anchor="'+anchor+'" fill="'+config[1]+'">'+Math.round(last.entry.value)+' bpm</text>';});
    var indexes=entries.length<4?entries.map(function(_,i){return i;}):[0,Math.floor((entries.length-1)/2),entries.length-1];indexes.forEach(function(index){svg+='<text class="chart-axis-label" x="'+x(index)+'" y="'+(height-10)+'" text-anchor="middle">'+logDate(entries[index].date)+'</text>';});
    return svg+'</svg>';
  }
  function renderInsightTable(entries) {
    var headers=[],rows=[];
    if(state.insight==='heart'){
      headers=['Datum','Pass','Medel','Intervall'];rows=entries.slice().reverse().map(function(e){return [logDate(e.date),e.type,Math.round(e.value)+' bpm',e.min&&e.max?Math.round(e.min)+'–'+Math.round(e.max):'—'];});
    }else if(state.insight==='distance'){
      headers=['Datum','Pass','Distans','Snittakt'];rows=entries.slice().reverse().map(function(e){return [logDate(e.date),e.type,formatNumber(e.value,2)+' km',formatPace(e.pace)];});
    }else{
      headers=['Datum','Källa','VO₂'];rows=entries.slice().reverse().map(function(e){return [logDate(e.date),e.type,formatNumber(e.value,1)+' ml/kg/min'];});
    }
    byId('insight-table-head').innerHTML='<tr>'+headers.map(function(h){return'<th>'+h+'</th>';}).join('')+'</tr>';
    byId('insight-table-body').innerHTML=rows.length?rows.map(function(row){return'<tr>'+row.map(function(cell){return'<td>'+escapeHtml(cell)+'</td>';}).join('')+'</tr>';}).join(''):'<tr><td colspan="'+headers.length+'">Inga mätvärden ännu.</td></tr>';
  }
  function renderInsight() {
    document.querySelectorAll('[data-insight]').forEach(function(button){button.setAttribute('aria-selected',String(button.dataset.insight===state.insight));});
    document.querySelectorAll('[data-insight-mode]').forEach(function(button){button.setAttribute('aria-pressed',String(button.dataset.insightMode===state.insightMode));});
    var entries,markup,name,description;
    if(state.insight==='heart'){
      entries=heartData();name='Medelpuls över tid';description='Kondition och styrka visas som två separata ljussignaler.';markup=heartChart(entries);
    }else if(state.insight==='distance'){
      entries=distanceData();name='Löpdistans över tid';description='Distanskurvan och ditt mål hålls tydligt åtskilda.';markup=lineChart(entries,{color:'#ff8f8b',goal:number(data.goals.runDistanceGoal)||10,decimals:1,suffix:' km',empty:'Distanskurvan visas när löpning har loggats.'});
    }else{
      entries=vo2Data();name='VO₂ över tid';description='Syreupptagets utveckling med senaste mätningen tydligt förankrad.';markup=lineChart(entries,{color:'#65d7a5',goal:number(data.goals.vo2Goal)||45,min:40,max:55,floor:40,decimals:1,empty:'VO₂-kurvan visas när ett värde har loggats.'});
    }
    byId('insight-name').textContent=name;byId('insight-description').textContent=description;
    byId('insight-chart').hidden=state.insightMode!=='chart';byId('insight-table-wrap').hidden=state.insightMode!=='table';
    byId('insight-chart').innerHTML=markup;renderInsightTable(entries);
    byId('insight-chart').setAttribute('aria-label',name+'. '+entries.map(function(e){return logDate(e.date)+': '+e.value;}).join('. '));
  }

  function exerciseResult(raw) {
    var ex=normalizeExercise(raw);
    if(ex.kind==='cardio')return ex.distance?formatNumber(ex.distance,2)+' km'+(ex.time?' · '+formatNumber(ex.time,0)+' min':''):(ex.time?formatNumber(ex.time,0)+' min':'Kondition');
    var pieces=[];if(ex.sets&&ex.reps)pieces.push(ex.sets+'×'+ex.reps);if(ex.weight)pieces.push(formatNumber(ex.weight,1)+' kg');return pieces.join(' · ')||'Styrka';
  }
  function exerciseSeconds(workout,raw,index) {
    var ex=normalizeExercise(raw);if(ex.durationSec)return ex.durationSec;
    var timings=workout.exerciseTimings||[],timing=Array.isArray(timings)?timings[index]:null;
    return timing&&number(timing.durationSec);
  }
  function renderLog() {
    var workouts=data.workouts.slice().sort(function(a,b){return String(b.date).localeCompare(String(a.date))||number(b.id)-number(a.id);}).slice(0,12);
    if(!workouts.length){byId('log-timeline').innerHTML='<p class="log-empty">Inga loggade pass ännu. De kommer att visas här som en tidslinje.</p>';return;}
    byId('log-timeline').innerHTML=workouts.map(function(workout,index){
      var exercises=workout.exercises||[],volume=workoutVolume(workout),distance=workoutDistance(workout),kind=workoutKind(workout),detail=exercises.length+' övning'+(exercises.length===1?'':'ar')+(number(workout.duration)?' · '+number(workout.duration)+' min':'');
      var rows=exercises.length?exercises.map(function(exercise,exerciseIndex){var seconds=exerciseSeconds(workout,exercise,exerciseIndex);return '<div class="exercise-row"><span class="exercise-index">'+(exerciseIndex+1)+'</span><span class="exercise-name">'+escapeHtml(normalizeExercise(exercise).name)+'</span><span class="exercise-result">'+escapeHtml(exerciseResult(exercise))+'</span>'+(seconds?'<time class="exercise-time">'+formatDuration(seconds)+'</time>':'')+'</div>';}).join(''):'<p class="log-empty">Passet saknar sparade övningsrader.</p>';
      return '<article class="log-card'+(index===0?' is-open':'')+'" data-log-card><button class="log-summary" type="button" aria-expanded="'+(index===0)+'"><time class="log-date">'+logDate(workout.date)+'</time><span class="log-title"><strong>'+escapeHtml(workoutType(workout))+'</strong><span>'+escapeHtml(detail)+'</span></span><span class="log-result">'+escapeHtml(workoutPrimary(workout))+'</span><span class="log-chevron" aria-hidden="true">⌄</span></button><div class="log-detail"><div class="log-vitals"><div class="vital"><span>Tid</span><strong>'+(number(workout.duration)?number(workout.duration)+' min':'—')+'</strong></div><div class="vital"><span>'+(kind==='cardio'?'Distans':'Volym')+'</span><strong>'+(kind==='cardio'?(distance?formatNumber(distance,2)+' km':'—'):(volume?formatNumber(Math.round(volume),0)+' kg':'—'))+'</strong></div><div class="vital pulse-vital"><span>Medelpuls</span><strong>'+(number(workout.hrAvg)?number(workout.hrAvg)+' bpm':'—')+'</strong></div></div><div class="exercise-stack">'+rows+'</div></div></article>';
    }).join('');
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
  function renderRecords() {
    var records=recordData();byId('record-count').textContent=records.length+' rekord';
    if(!records.length){byId('record-podium').innerHTML='';byId('record-groups').innerHTML='<p class="record-empty">Dina starkaste resultat får en egen plats här när de är loggade.</p>';return;}
    byId('record-podium').innerHTML=records.slice(0,3).map(function(record,index){return '<article class="record-feature"><span class="rank">SIGNAL '+String(index+1).padStart(2,'0')+'</span><h3>'+escapeHtml(record.name)+'</h3><strong>'+formatKg(record.value)+'</strong><p>'+(record.gain?'+'+formatNumber(record.gain,1)+' kg från första':'registrerat max')+'</p></article>';}).join('');
    var groups={};records.forEach(function(record){(groups[record.category]||(groups[record.category]=[])).push(record);});
    byId('record-groups').innerHTML=Object.keys(groups).map(function(category,index){var rows=groups[category].map(function(record){return '<div class="record-row"><span>'+escapeHtml(record.name)+(record.gain?'<small>+'+formatNumber(record.gain,1)+' kg utveckling</small>':'')+'</span><strong>'+formatKg(record.value)+'</strong></div>';}).join('');return '<details class="record-group"'+(index===0?' open':'')+'><summary><strong>'+escapeHtml(category)+'</strong><span>'+groups[category].length+' rekord</span><i>＋</i></summary><div class="record-list">'+rows+'</div></details>';}).join('');
  }

  function renderAll() {
    loadData();renderHero();renderRhythm();renderWeek();renderActivity();renderInsight();renderLog();renderRecords();
  }
  function showToast(message) {
    var toast=byId('field-toast');toast.textContent=message;toast.classList.add('is-visible');clearTimeout(showToast.timer);showToast.timer=setTimeout(function(){toast.classList.remove('is-visible');},2600);
  }
  function installEvents() {
    var toggle=byId('menu-toggle'),menu=byId('field-menu');
    function setMenu(open){menu.classList.toggle('is-open',open);menu.setAttribute('aria-hidden',String(!open));toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Stäng meny':'Öppna meny');}
    toggle.addEventListener('click',function(){setMenu(!menu.classList.contains('is-open'));});
    document.addEventListener('click',function(event){if(!menu.contains(event.target)&&!toggle.contains(event.target))setMenu(false);var logButton=event.target.closest('.log-summary');if(logButton){var card=logButton.closest('[data-log-card]'),open=!card.classList.contains('is-open');card.classList.toggle('is-open',open);logButton.setAttribute('aria-expanded',String(open));}});
    document.addEventListener('click',function(event){
      var shift=event.target.closest('[data-week-shift]');if(shift){state.weekStart=shiftDate(state.weekStart,number(shift.dataset.weekShift)*7);state.selectedDate=isoDate(state.weekStart);renderWeek();if(state.activityView==='week')renderActivity();return;}
      var day=event.target.closest('[data-day]');if(day){state.selectedDate=day.dataset.day;renderWeek();return;}
      var view=event.target.closest('[data-activity-view]');if(view){state.activityView=view.dataset.activityView;renderActivity();return;}
      var metric=event.target.closest('[data-activity-metric]');if(metric){state.activityMetric=metric.dataset.activityMetric;renderActivity();return;}
      var insight=event.target.closest('[data-insight]');if(insight){state.insight=insight.dataset.insight;renderInsight();return;}
      var insightMode=event.target.closest('[data-insight-mode]');if(insightMode){state.insightMode=insightMode.dataset.insightMode;renderInsight();return;}
    });
    window.addEventListener('firebase-sync',function(){renderAll();showToast('Träningsdata uppdaterad');});
    var resizeTimer;window.addEventListener('resize',function(){clearTimeout(resizeTimer);resizeTimer=setTimeout(function(){renderActivity();renderInsight();},180);});
  }

  function install() {
    wireProfileLinks();loadData();installEvents();renderAll();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
