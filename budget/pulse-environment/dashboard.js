// ══ THREE.JS ════════════════════════════════════════════════════
(function(){
  if(typeof THREE==='undefined') return;
  var canvas=document.getElementById('three-canvas');
  var renderer=new THREE.WebGLRenderer({canvas:canvas,alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(innerWidth,innerHeight);
  var scene=new THREE.Scene();
  var camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,200);
  camera.position.z=35;

  // Circular texture
  var cc=document.createElement('canvas'); cc.width=cc.height=64;
  var cx=cc.getContext('2d');
  var cg=cx.createRadialGradient(32,32,0,32,32,32);
  cg.addColorStop(0,'rgba(255,255,255,1)'); cg.addColorStop(.4,'rgba(255,255,255,.8)'); cg.addColorStop(1,'rgba(255,255,255,0)');
  cx.fillStyle=cg; cx.beginPath(); cx.arc(32,32,32,0,Math.PI*2); cx.fill();
  var ptTex=new THREE.CanvasTexture(cc);

  // Particles
  var COUNT=160, ptGeo=new THREE.BufferGeometry(), ptPos=new Float32Array(COUNT*3), ptVel=[];
  for(var i=0;i<COUNT;i++){
    ptPos[i*3]=(Math.random()-.5)*110; ptPos[i*3+1]=(Math.random()-.5)*70; ptPos[i*3+2]=(Math.random()-.5)*30;
    ptVel.push((Math.random()-.5)*.013,(Math.random()-.5)*.009);
  }
  ptGeo.setAttribute('position',new THREE.BufferAttribute(ptPos,3));
  scene.add(new THREE.Points(ptGeo,new THREE.PointsMaterial({color:0x22D3EE,map:ptTex,size:.55,transparent:true,opacity:.35,sizeAttenuation:true,alphaTest:.01})));

  // Large wireframe icosahedron
  var bigIco=new THREE.Mesh(new THREE.IcosahedronGeometry(14,1),new THREE.MeshBasicMaterial({color:0x22D3EE,wireframe:true,transparent:true,opacity:.04}));
  bigIco.position.set(26,-10,-20); scene.add(bigIco);

  // Spinning gems
  var gemGeos=[new THREE.OctahedronGeometry(1),new THREE.TetrahedronGeometry(.9),new THREE.IcosahedronGeometry(.85)];
  var gemCols=[0x22D3EE,0xA78BFA,0x34D399,0xFBBF24,0xF9A8B8];
  var gems=[];
  for(var g=0;g<6;g++){
    var gm=new THREE.Mesh(gemGeos[g%3],new THREE.MeshBasicMaterial({color:gemCols[g%5],wireframe:true,transparent:true,opacity:.18}));
    gm.position.set((Math.random()-.5)*80,(Math.random()-.5)*50,(Math.random()-.5)*15);
    gm.userData.rx=(Math.random()-.5)*.013; gm.userData.ry=(Math.random()-.5)*.018;
    gm.userData.vx=(Math.random()-.5)*.005; gm.userData.vy=(Math.random()-.5)*.004;
    scene.add(gm); gems.push(gm);
  }

  // Torus rings
  var rings=[];
  for(var r=0;r<4;r++){
    var rm=new THREE.Mesh(new THREE.TorusGeometry(2+Math.random()*3,.04,8,40),new THREE.MeshBasicMaterial({color:0x22D3EE,transparent:true,opacity:.1}));
    rm.position.set((Math.random()-.5)*70,(Math.random()-.5)*45,(Math.random()-.5)*10);
    rm.userData.ry=(Math.random()-.5)*.018; rm.userData.rz=(Math.random()-.5)*.014;
    rm.userData.vx=(Math.random()-.5)*.004; rm.userData.vy=(Math.random()-.5)*.003;
    scene.add(rm); rings.push(rm);
  }

  // Data streams
  var streams=[], stTimer=0;
  function spawnStream(){
    var y=-30+Math.random()*60;
    var sg=new THREE.BufferGeometry();
    sg.setAttribute('position',new THREE.BufferAttribute(new Float32Array([-62,y,5,-57+Math.random()*8,y,5]),3));
    var sl=new THREE.Line(sg,new THREE.LineBasicMaterial({color:0x22D3EE,transparent:true,opacity:.65}));
    sl.userData.vx=.55+Math.random()*.8; sl.userData.fade=.013+Math.random()*.012;
    scene.add(sl); streams.push(sl);
  }

  // Bubbles
  var bc=document.createElement('canvas'); bc.width=bc.height=128;
  var bx=bc.getContext('2d'), bg2=bx.createRadialGradient(64,64,6,64,64,62);
  bg2.addColorStop(0,'rgba(255,255,255,0)'); bg2.addColorStop(.65,'rgba(255,255,255,.04)'); bg2.addColorStop(.88,'rgba(255,255,255,.2)'); bg2.addColorStop(1,'rgba(255,255,255,0)');
  bx.fillStyle=bg2; bx.beginPath(); bx.arc(64,64,64,0,Math.PI*2); bx.fill();
  var btex=new THREE.CanvasTexture(bc), bubbles=[];
  for(var b=0;b<5;b++){
    var sz=2+Math.random()*5;
    var bub=new THREE.Mesh(new THREE.PlaneGeometry(sz,sz),new THREE.MeshBasicMaterial({map:btex,transparent:true,opacity:.22+Math.random()*.15,depthWrite:false}));
    bub.position.set((Math.random()-.5)*90,(Math.random()-.5)*55,(Math.random()-.5)*10);
    bub.userData.vy=.006+Math.random()*.01; bub.userData.vx=(Math.random()-.5)*.005;
    scene.add(bub); bubbles.push(bub);
  }

  function animate(){
    requestAnimationFrame(animate);
    for(var i=0;i<COUNT;i++){
      ptPos[i*3]+=ptVel[i*2]; ptPos[i*3+1]+=ptVel[i*2+1];
      if(ptPos[i*3]>55)ptPos[i*3]=-55; if(ptPos[i*3]<-55)ptPos[i*3]=55;
      if(ptPos[i*3+1]>35)ptPos[i*3+1]=-35; if(ptPos[i*3+1]<-35)ptPos[i*3+1]=35;
    }
    ptGeo.attributes.position.needsUpdate=true;
    bigIco.rotation.x+=.002; bigIco.rotation.y+=.003;
    gems.forEach(function(g){
      g.rotation.x+=g.userData.rx; g.rotation.y+=g.userData.ry;
      g.position.x+=g.userData.vx; g.position.y+=g.userData.vy;
      if(g.position.x>50)g.position.x=-50; if(g.position.x<-50)g.position.x=50;
      if(g.position.y>35)g.position.y=-35; if(g.position.y<-35)g.position.y=35;
    });
    rings.forEach(function(r){
      r.rotation.y+=r.userData.ry; r.rotation.z+=r.userData.rz;
      r.position.x+=r.userData.vx; r.position.y+=r.userData.vy;
      if(r.position.x>50)r.position.x=-50; if(r.position.x<-50)r.position.x=50;
      if(r.position.y>35)r.position.y=-35; if(r.position.y<-35)r.position.y=35;
    });
    stTimer++;
    if(stTimer>80+Math.random()*130){spawnStream();stTimer=0;}
    for(var i=streams.length-1;i>=0;i--){
      var s=streams[i]; s.position.x+=s.userData.vx; s.material.opacity-=s.userData.fade;
      if(s.material.opacity<=0){scene.remove(s);streams.splice(i,1);}
    }
    bubbles.forEach(function(b){
      b.position.y+=b.userData.vy; b.position.x+=b.userData.vx;
      if(b.position.y>42){b.position.y=-42;b.position.x=(Math.random()-.5)*90;}
    });
    renderer.render(scene,camera);
  }
  animate();
  window.addEventListener('resize',function(){ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
})();

// ══ DATA ════════════════════════════════════════════════════════
var DB={get:function(k){return JSON.parse(localStorage.getItem('ex_'+k)||'null');},set:function(k,v){localStorage.setItem('ex_'+k,JSON.stringify(v));}};
function getWorkouts(){return DB.get('wk')||[];}
function saveWorkouts(w){DB.set('wk',w);}
function getGoals(){return DB.get('goals')||{weeklyWk:4,runDistanceGoal:10,vo2Goal:45};}
function getTemplates(){return DB.get('templates')||[];}
function saveTemplates(t){DB.set('templates',t);}
function getWeekTemplates(){return DB.get('weekTemplates')||[];}
function saveWeekTemplates(t){DB.set('weekTemplates',t);}
function getPlannedSessions(){return DB.get('plannedSessions')||{};}
function savePlannedSessions(p){DB.set('plannedSessions',p);}
// function getBW(){return DB.get('bw')||[];}
function getPRs(){return DB.get('prs')||{};}
function getPlan(){return DB.get('plan')||{mon:'Bröst + Triceps',tue:'Rygg + Biceps',wed:'Ben + Axlar',thu:'Kondition',fri:'Helkropp',sat:'Vila',sun:'Vila'};}

var DAYS=['Mån','Tis','Ons','Tor','Fre','Lör','Sön'];
var DAY_KEYS=['mon','tue','wed','thu','fri','sat','sun'];
var WORKOUT_TYPES=['Bröst + Triceps','Rygg + Biceps','Ben + Axlar','Helkropp','Kondition','Överkropp','Underkropp','Stretching / Rörlighet','Vila','Övrigt'];
var EXERCISE_KINDS=[{value:'strength',label:'Styrka'},{value:'cardio',label:'Kondition'}];

function pad2(n){return (n<10?'0':'')+n;}
function toISODate(d){return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate());}
function parseISODate(iso){var p=String(iso||'').split('-');return new Date(+p[0],(+p[1]||1)-1,+p[2]||1);}
function todayISO(){return toISODate(new Date());}
function mondayOf(d){var x=new Date(d.getFullYear(),d.getMonth(),d.getDate());var dow=x.getDay()===0?6:x.getDay()-1;x.setDate(x.getDate()-dow);return x;}
function weekStartISO(){return toISODate(mondayOf(new Date()));}
function mondayISOOf(iso){return toISODate(mondayOf(parseISODate(iso)));}
function shiftISODate(iso,days){var d=parseISODate(iso);d.setDate(d.getDate()+days);return toISODate(d);}
function dayKeyFromISO(iso){var d=parseISODate(iso);return DAY_KEYS[d.getDay()===0?6:d.getDay()-1];}
function dayLabelFromISO(iso){var d=parseISODate(iso);return DAYS[d.getDay()===0?6:d.getDay()-1];}
function byId(){for(var i=0;i<arguments.length;i++){var el=document.getElementById(arguments[i]);if(el)return el;}return null;}
function getWeekPlans(){return DB.get('weekPlans')||{};}
function saveWeekPlans(p){DB.set('weekPlans',p);}
function getPlanForWeek(mondayISO){var stored=getWeekPlans()[mondayISO];return stored?stored:getPlan();}
function setPlanForWeek(mondayISO,plan){
  var all=getWeekPlans();
  all[mondayISO]=plan;
  saveWeekPlans(all);
  if(mondayISO===weekStartISO()) DB.set('plan',plan);
}
function formatWeekLabel(mondayISO){
  var start=parseISODate(mondayISO), end=parseISODate(shiftISODate(mondayISO,6));
  var months=['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'];
  return {title:'Vecka '+getWeekNum(start), sub:start.getDate()+' '+months[start.getMonth()]+' – '+end.getDate()+' '+months[end.getMonth()]};
}
function fillWeekLabel(mondayISO,titleId,subId,dateId){
  var info=formatWeekLabel(mondayISO);
  var title=byId(titleId); if(title) title.textContent=info.title;
  var sub=byId(subId); if(sub) sub.textContent=info.sub;
  var dateEl=byId(dateId); if(dateEl) dateEl.value=mondayISO;
}
var viewedMondayISO=null, templateTargetMondayISO=null, templateEditorMondayISO=null, planTargetMondayISO=null;
function getViewedMondayISO(){if(!viewedMondayISO) viewedMondayISO=weekStartISO();return viewedMondayISO;}
function goToWeek(mondayISO){viewedMondayISO=mondayISO;renderWeekGrid();}
function shiftViewedWeek(delta){goToWeek(shiftISODate(getViewedMondayISO(),delta*7));}
function goToCurrentWeek(){goToWeek(weekStartISO());}
function applyPlanToWeek(mondayISO,plan){
  setPlanForWeek(mondayISO,plan);
  var planned=getPlannedSessions();
  DAY_KEYS.forEach(function(key,i){
    var iso=shiftISODate(mondayISO,i);
    var type=plan[key]||'Vila';
    if(type==='Vila'){
      if(planned[iso]&&!(planned[iso].exercises||[]).length) delete planned[iso];
      return;
    }
    planned[iso]=planned[iso]||{type:type,exercises:[]};
    planned[iso].type=type;
  });
  savePlannedSessions(planned);
}
function syncTemplateWeekUI(){
  if(!templateTargetMondayISO) templateTargetMondayISO=getViewedMondayISO();
  fillWeekLabel(templateTargetMondayISO,'template-week-label','template-week-sub','template-week-date');
}
function shiftTemplateTargetWeek(delta){
  if(!templateTargetMondayISO) templateTargetMondayISO=getViewedMondayISO();
  templateTargetMondayISO=shiftISODate(templateTargetMondayISO,delta*7);
  syncTemplateWeekUI();
}
function onTemplateWeekDateChange(){
  var el=byId('template-week-date'); if(!el||!el.value)return;
  templateTargetMondayISO=mondayISOOf(el.value);
  syncTemplateWeekUI();
}
function syncTemplateEditorWeekUI(){
  if(!templateEditorMondayISO) templateEditorMondayISO=getViewedMondayISO();
  fillWeekLabel(templateEditorMondayISO,'week-template-week-label','week-template-week-sub','week-template-week-date');
}
function shiftTemplateEditorWeek(delta){
  if(!templateEditorMondayISO) templateEditorMondayISO=getViewedMondayISO();
  templateEditorMondayISO=shiftISODate(templateEditorMondayISO,delta*7);
  syncTemplateEditorWeekUI();
}
function onTemplateEditorWeekDateChange(){
  var el=byId('week-template-week-date'); if(!el||!el.value)return;
  templateEditorMondayISO=mondayISOOf(el.value);
  syncTemplateEditorWeekUI();
}
function fillPlanDays(mondayISO){
  var plan=getPlanForWeek(mondayISO), cont=byId('plan-days','plan-days');
  if(!cont)return;
  cont.innerHTML='';
  DAYS.forEach(function(d,i){
    var fg=document.createElement('div'); fg.className='form-group';
    fg.innerHTML='<label>'+d+'</label><input type="text" data-day="'+DAY_KEYS[i]+'" list="type-suggestions" value="'+escHtml(plan[DAY_KEYS[i]]||'Vila')+'" placeholder="Ex: Rygg + Triceps">';
    cont.appendChild(fg);
  });
}
function syncPlanWeekUI(){
  if(!planTargetMondayISO) planTargetMondayISO=getViewedMondayISO();
  fillWeekLabel(planTargetMondayISO,'plan-week-label','plan-week-sub','plan-week-date');
  fillPlanDays(planTargetMondayISO);
}
function shiftPlanTargetWeek(delta){
  if(!planTargetMondayISO) planTargetMondayISO=getViewedMondayISO();
  planTargetMondayISO=shiftISODate(planTargetMondayISO,delta*7);
  syncPlanWeekUI();
}
function onPlanWeekDateChange(){
  var el=byId('plan-week-date'); if(!el||!el.value)return;
  planTargetMondayISO=mondayISOOf(el.value);
  syncPlanWeekUI();
}
function normalizeExercise(ex){
  ex=ex||{};
  var kind=ex.kind||((ex.distance||ex.time)?'cardio':'strength');
  if(kind==='cardio'){
    return {kind:'cardio',name:ex.name||'',distance:+ex.distance||0,time:+ex.time||0};
  }
  return {kind:'strength',name:ex.name||'',sets:+ex.sets||1,reps:+ex.reps||0,weight:+ex.weight||0};
}
function calcVol(wk){var v=0;(wk.exercises||[]).forEach(function(ex){var e=normalizeExercise(ex);if(e.kind==='strength')v+=(e.sets||0)*(e.reps||0)*(e.weight||0);});return v;}
function fmtDate(iso){if(!iso)return'—';var p=iso.split('-');return p[2]+'/'+p[1];}
function daysSince(iso){if(!iso)return null;return Math.floor((Date.now()-new Date(iso).getTime())/86400000);}
function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function fmtSec(sec){sec=Math.max(0,Math.floor(sec||0));var m=Math.floor(sec/60),s=sec%60;return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');}
function formatCardioTime(min){return min?min+' min':'—';}
function isRunningLabel(value){
  return /(^|[^a-zåäö])(löp|jogg|running|run|treadmill|löpband)/i.test(String(value||''));
}
function workoutRunMetrics(workout){
  workout=workout||{};
  var explicitDistance=Number(workout.runDistance)||0;
  var explicitTime=Number(workout.runTime)||0;
  var typeIsRunning=isRunningLabel(workout.type);
  var exerciseDistance=0,exerciseTime=0;
  (workout.exercises||[]).forEach(function(exercise){
    var ex=normalizeExercise(exercise);
    if(ex.kind!=='cardio'||(!typeIsRunning&&!isRunningLabel(ex.name)))return;
    exerciseDistance+=Number(ex.distance)||0;
    exerciseTime+=Number(ex.time)||0;
  });
  var distance=explicitDistance>0?explicitDistance:exerciseDistance;
  var time=explicitTime>0?explicitTime:exerciseTime;
  var pace=distance>0&&time>0?time/distance:(Number(workout.avgPaceKm)||0);
  return {
    distance:+Math.max(0,distance).toFixed(2),
    time:+Math.max(0,time).toFixed(2),
    pace:pace>0?+pace.toFixed(4):0
  };
}
function formatRunningPace(minutesPerKm){
  var value=Number(minutesPerKm);
  if(!(value>0)||!Number.isFinite(value))return '—';
  var totalSeconds=Math.round(value*60);
  return Math.floor(totalSeconds/60)+':'+String(totalSeconds%60).padStart(2,'0')+' /km';
}
function renderRunPaceChart(entries){
  if(typeof window.Chart!=='function')return;
  var canvas=document.getElementById('chart-run-pace');
  if(!canvas)return;
  var existing=typeof Chart.getChart==='function'?Chart.getChart(canvas):null;
  if(existing)existing.destroy();
  if(chartRunPace&&chartRunPace!==existing){try{chartRunPace.destroy();}catch(_e){}}
  var paced=(entries||[]).filter(function(entry){return entry.metrics.pace>0;}).slice(-14);
  var labels=paced.length?paced.map(function(entry){return fmtDate(entry.workout.date);}):['—'];
  var values=paced.length?paced.map(function(entry){return entry.metrics.pace;}):[null];
  chartRunPace=new Chart(canvas.getContext('2d'),{
    type:'line',
    data:{labels:labels,datasets:[{
      label:'Snittakt',
      data:values,
      borderColor:'#F87171',
      backgroundColor:'rgba(239,68,68,.12)',
      pointBackgroundColor:'#FCA5A5',
      pointBorderColor:'#7F1D1D',
      pointRadius:3,
      pointHoverRadius:5,
      borderWidth:2.5,
      tension:.3,
      fill:true,
      spanGaps:true
    }]},
    options:{
      responsive:true,
      maintainAspectRatio:false,
      interaction:{mode:'nearest',intersect:false},
      plugins:{
        legend:{display:false},
        tooltip:{
          backgroundColor:'#161B22',
          titleColor:'#FCA5A5',
          bodyColor:'#E5E7EB',
          borderColor:'rgba(248,113,113,.22)',
          borderWidth:1,
          callbacks:{label:function(context){return 'Snittakt: '+formatRunningPace(context.parsed.y);}}
        }
      },
      scales:{
        x:{ticks:{color:'#7F8A99',font:{family:'Inter',size:8},maxRotation:0},grid:{display:false}},
        y:{reverse:true,ticks:{color:'#B9898E',font:{family:'Inter',size:8},callback:function(value){return formatRunningPace(value).replace(' /km','');}},grid:{color:'rgba(248,113,113,.07)'}}
      }
    }
  });
}

function canonicalWorkoutType(type, exercises){
  var raw=(type||'').trim();
  if(!raw)return 'Övrigt';
  if(raw.length>1)return raw;
  var map={
    'H':'Helkropp',
    'K':'Kondition',
    'B':'Bröst + Triceps',
    'R':'Rygg + Biceps',
    'L':'Ben + Axlar',
    'O':'Övrigt',
    'V':'Vila',
    'Ö':'Överkropp',
    'U':'Underkropp',
    'S':'Stretching / Rörlighet'
  };
  if(map[raw])return map[raw];
  var onlyCardio=(exercises||[]).length>0 && (exercises||[]).every(function(ex){return normalizeExercise(ex).kind==='cardio';});
  return onlyCardio?'Kondition':'Övrigt';
}

function workoutKindSummary(workout){
  var cardio=false,strength=false;
  (workout&&workout.exercises||[]).forEach(function(exercise){
    var kind=normalizeExercise(exercise).kind;
    if(kind==='cardio')cardio=true;
    if(kind==='strength')strength=true;
  });
  var type=String(workout&&workout.type||'').trim().toLocaleLowerCase('sv-SE');
  if(!cardio&&!strength){
    if(/kondition|cardio|löp|jogg|intervall|cross[ -]?trainer|crosstrainer|ellipt|cyk|spinning|rodd|promenad/.test(type))cardio=true;
    else if(/styrka|helkropp|överkropp|underkropp|bröst|rygg|axel|arm|biceps|triceps|ben/.test(type))strength=true;
  }
  return {cardio:cardio,strength:strength};
}
function isCardioWorkout(workout){
  var kinds=workoutKindSummary(workout);
  return kinds.cardio&&!kinds.strength;
}
function exerciseTargetText(exercise){
  var ex=normalizeExercise(exercise);
  if(ex.kind==='cardio'){
    var cardioParts=[];
    if(ex.distance)cardioParts.push(String(ex.distance).replace(/\.0$/,'')+' km');
    if(ex.time)cardioParts.push(String(ex.time).replace(/\.0$/,'')+' min');
    return cardioParts.join(' · ')||'Kondition';
  }
  var strengthParts=[String(ex.sets||1)+'×'+String(ex.reps||0)];
  if(ex.weight||ex.weight===0)strengthParts.push(String(ex.weight).replace(/\.0$/,'')+' kg');
  return strengthParts.join(' · ');
}
function workoutTimingForExercise(workout,exercise,index,used){
  var timings=workout&&Array.isArray(workout.exerciseTimings)?workout.exerciseTimings:[];
  var wanted=String(exercise&&exercise.name||'').trim().toLocaleLowerCase('sv-SE');
  var found=-1;
  timings.some(function(timing,timingIndex){
    if(used[timingIndex])return false;
    if(Number(timing&&timing.exerciseIndex)===index){
      found=timingIndex;
      return true;
    }
    if(String(timing&&timing.name||'').trim().toLocaleLowerCase('sv-SE')===wanted){
      found=timingIndex;
      return true;
    }
    return false;
  });
  if(found<0&&timings[index]&&!used[index])found=index;
  if(found<0)return null;
  used[found]=true;
  return timings[found];
}
function exerciseDurationSeconds(value){
  var numeric=parseInt(value,10);
  return Number.isFinite(numeric)&&numeric>0?numeric:0;
}
function workoutPulseIntervalMarkup(workout){
  var avg=Math.round(Number(workout&&workout.hrAvg)||0);
  var min=Math.round(Number(workout&&workout.hrMin)||0);
  var max=Math.round(Number(workout&&workout.hrMax)||0);
  var minLabel=min?String(min):'—';
  var avgLabel=avg?String(avg):'—';
  var maxLabel=max?String(max):'—';
  var title=avg?'Puls min '+minLabel+', medel '+avgLabel+', max '+maxLabel:'Ingen puls registrerad';
  return '<span class="log-pulse-interval-v9'+(min&&avg&&max?' has-range':' is-incomplete')+'" role="img" aria-label="'+title+'" title="'+title+'">'
    +'<svg viewBox="0 0 84 25" aria-hidden="true">'
    +'<line class="pulse-range-v9" x1="8" y1="7" x2="76" y2="7"></line>'
    +'<line class="pulse-cap-v9" x1="8" y1="3" x2="8" y2="11"></line>'
    +'<line class="pulse-cap-v9" x1="76" y1="3" x2="76" y2="11"></line>'
    +'<circle class="pulse-edge-v9" cx="8" cy="7" r="2"></circle>'
    +'<circle class="pulse-average-v9" cx="42" cy="7" r="3.2"></circle>'
    +'<circle class="pulse-edge-v9" cx="76" cy="7" r="2"></circle>'
    +'<text x="8" y="22" text-anchor="start">'+minLabel+'</text>'
    +'<text class="pulse-average-label-v9" x="42" y="22" text-anchor="middle">'+avgLabel+'</text>'
    +'<text x="76" y="22" text-anchor="end">'+maxLabel+'</text>'
    +'</svg></span>';
}
function workoutVo2GoalIntervalMarkup(workout){
  workout=workout||{};
  var value=Number(workout.vo2)||0;
  if(!value&&workout.date){
    var entry=(DB.get('vo2')||[]).find(function(item){return item&&item.date===workout.date;});
    value=Number(entry&&entry.score)||0;
  }
  if(!value)return '';
  var goal=Number(getGoals().vo2Goal)||45;
  var floor=40;
  var effectiveGoal=Math.max(floor+.1,goal);
  var ratio=(value-floor)/(effectiveGoal-floor);
  ratio=Math.max(0,Math.min(1,ratio));
  var markerX=8+Math.min(70,ratio*70);
  var valueLabel=String(+value.toFixed(1)).replace(/\.0$/,'');
  var goalLabel=String(+goal.toFixed(1)).replace(/\.0$/,'');
  var title='VO₂ '+valueLabel+', mål '+goalLabel;
  return '<span class="log-vo2-goal-v36" role="img" aria-label="'+title+'" title="'+title+'">'
    +'<svg viewBox="0 0 92 30" aria-hidden="true">'
    +'<line class="vo2-track-v36" x1="8" y1="12" x2="84" y2="12"></line>'
    +'<line class="vo2-goal-cap-v36" x1="84" y1="7" x2="84" y2="17"></line>'
    +'<circle class="vo2-value-dot-v36" cx="'+markerX.toFixed(1)+'" cy="12" r="3.4"></circle>'
    +'<circle class="vo2-goal-dot-v36" cx="84" cy="12" r="2.3"></circle>'
    +'<text class="vo2-value-label-v36" x="'+markerX.toFixed(1)+'" y="5" text-anchor="middle">'+valueLabel+'</text>'
    +'<text class="vo2-floor-label-v36" x="8" y="27" text-anchor="start">VO₂</text>'
    +'<text class="vo2-goal-label-v36" x="84" y="27" text-anchor="end">'+goalLabel+' mål</text>'
    +'</svg></span>';
}
function workoutPaceIntervalMarkup(workout){
  workout=workout||{};
  var metrics=workoutRunMetrics(workout);
  var pace=metrics.pace||0;
  if(pace<=0)return '';
  var goal=4.0;
  var floor=3.0;
  var ceiling=7.0;
  var ratio=(pace-floor)/(ceiling-floor);
  ratio=Math.max(0,Math.min(1,ratio));
  var markerX=76-Math.min(68,ratio*68);
  var paceMin=Math.floor(pace);
  var paceSec=Math.round((pace-paceMin)*60);
  var paceStr=paceMin+':'+String(paceSec).padStart(2,'0');
  var goalMin=Math.floor(goal);
  var goalSec=Math.round((goal-goalMin)*60);
  var goalStr=goalMin+':'+String(goalSec).padStart(2,'0');
  var title='Löpact: '+paceStr+' min/km, mål '+goalStr+' min/km';
  return '<span class="log-pace-interval-v37" role="img" aria-label="'+title+'" title="'+title+'">'
    +'<svg viewBox="0 0 84 25" aria-hidden="true">'
    +'<line class="pace-range-v37" x1="8" y1="10" x2="76" y2="10"></line>'
    +'<line class="pace-cap-v37" x1="76" y1="6" x2="76" y2="14"></line>'
    +'<circle class="pace-edge-v37" cx="8" cy="10" r="2"></circle>'
    +'<circle class="pace-average-v37" cx="'+markerX.toFixed(1)+'" cy="10" r="2.2"></circle>'
    +'<text class="pace-average-label-v37" x="'+markerX.toFixed(1)+'" y="4" text-anchor="middle">'+paceMin+'</text>'
    +'<text class="pace-average-label-v37" x="'+markerX.toFixed(1)+'" y="21" text-anchor="middle">min/km</text>'
    +'</svg></span>';
}
function addExerciseTimingEditor(row,timing){
  if(!row)return;
  var editor=document.createElement('label');
  editor.className='ex-duration-editor-v7';
  editor.innerHTML='<span>Tid för övningen</span><input type="number" min="0" step="1" inputmode="numeric" class="ex-duration-seconds-v7" placeholder="0" value="'+(timing&&exerciseDurationSeconds(timing.durationSec)||'')+'"><small>sek</small>';
  row.appendChild(editor);
}

function buildExerciseEditorRowHtml(prefix, ex, removeHandler){
  var e=normalizeExercise(ex);
  var hasExplicitSets=ex&&Object.prototype.hasOwnProperty.call(ex,'sets');
  var hasExplicitReps=ex&&Object.prototype.hasOwnProperty.call(ex,'reps');
  var hasExplicitWeight=ex&&Object.prototype.hasOwnProperty.call(ex,'weight');
  var strengthCls=e.kind==='strength'?'':' ex-cell-hidden';
  return '<div class="ex-row-head">'
      +'<input type="hidden" class="'+prefix+'-kind" value="'+e.kind+'">'
      +'<button class="ex-kind-btn'+(e.kind==='strength'?' active':'')+'" type="button" onclick="setExerciseKind(this,\'strength\')">Styrka</button>'
      +'<button class="ex-kind-btn'+(e.kind==='cardio'?' active':'')+'" type="button" onclick="setExerciseKind(this,\'cardio\')">Kondition</button>'
    +'</div>'
    +'<div class="ex-row">'
      +'<input type="text" class="'+prefix+'-name" placeholder="Övning" value="'+escHtml(e.name||'')+'">'
      +'<input type="number" class="'+prefix+'-metric1" data-role="'+(e.kind==='cardio'?'distance':'sets')+'" placeholder="'+(e.kind==='cardio'?'Distans':'Sets')+'" min="0" step="'+(e.kind==='cardio'?'0.1':'1')+'" value="'+(e.kind==='cardio'?(e.distance||''):(hasExplicitSets?(ex.sets||''):''))+'">'
      +'<input type="number" class="'+prefix+'-metric2" data-role="'+(e.kind==='cardio'?'time':'reps')+'" placeholder="'+(e.kind==='cardio'?'Tid':'Reps')+'" min="0" step="'+(e.kind==='cardio'?'0.1':'1')+'" value="'+(e.kind==='cardio'?(e.time||''):(hasExplicitReps?(ex.reps||''):''))+'">'
      +'<input type="number" class="'+prefix+'-metric3'+strengthCls+'" data-role="weight" placeholder="kg" min="0" step="0.5" value="'+(e.kind==='strength'?(hasExplicitWeight?(ex.weight||''):''):'')+'">'
      +'<button class="ex-del" type="button" onclick="'+removeHandler+'">✕</button>'
    +'</div>';
}

function setExerciseKind(el,kind){
  var wrap=el.closest('.inline-ex-row, .ex-row-wrap, .ex-row-item');
  if(!wrap)return;
  var hidden=wrap.querySelector('[class$="-kind"]');
  if(hidden)hidden.value=kind;
  wrap.classList.remove('is-strength','is-cardio');
  wrap.classList.add('is-'+kind);
  wrap.querySelectorAll('.ex-kind-btn').forEach(function(btn){btn.classList.toggle('active',btn===el);});
  var metric1=wrap.querySelector('[class*="-metric1"]');
  var metric2=wrap.querySelector('[class*="-metric2"]');
  var metric3=wrap.querySelector('[class*="-metric3"]');
  if(metric1){metric1.dataset.role=kind==='cardio'?'distance':'sets';metric1.placeholder=kind==='cardio'?'Distans':'Sets';metric1.step=kind==='cardio'?'0.1':'1';metric1.value='';}
  if(metric2){metric2.dataset.role=kind==='cardio'?'time':'reps';metric2.placeholder=kind==='cardio'?'Tid':'Reps';metric2.step=kind==='cardio'?'0.1':'1';metric2.value='';}
  if(metric3){metric3.classList.toggle('ex-cell-hidden',kind==='cardio');}
  if(metric3)metric3.value='';
}

function parseExerciseRow(row,prefix){
  var nameEl=row.querySelector('.'+prefix+'-name');
  if(!nameEl)return null;
  var name=nameEl.value.trim();
  if(!name)return null;
  var kindEl=row.querySelector('.'+prefix+'-kind');
  var kind=kindEl?kindEl.value:'strength';
  if(kind==='cardio'){
    return normalizeExercise({kind:'cardio',name:name,distance:+row.querySelector('.'+prefix+'-metric1').value||0,time:+row.querySelector('.'+prefix+'-metric2').value||0});
  }
  return normalizeExercise({kind:'strength',name:name,sets:+row.querySelector('.'+prefix+'-metric1').value||1,reps:+row.querySelector('.'+prefix+'-metric2').value||0,weight:+row.querySelector('.'+prefix+'-metric3').value||0});
}

function upsertVO2ForDate(date,val){
  if(!val&&val!==0)return;
  var v=parseFloat(val);
  if(isNaN(v)||v<10||v>100)return;
  var data=DB.get('vo2')||[];
  var idx=data.findIndex(function(e){return e.date===date;});
  if(idx>=0)data[idx].score=v; else data.push({date:date,score:v});
  data.sort(function(a,b){return a.date.localeCompare(b.date);});
  DB.set('vo2',data);
}

function getTypeSuggestions(){
  var set={};
  WORKOUT_TYPES.forEach(function(t){set[t]=true;});
  var plan=getPlan();
  Object.keys(plan).forEach(function(k){if(plan[k])set[plan[k]]=true;});
  getWorkouts().forEach(function(w){if(w.type)set[w.type]=true;});
  return Object.keys(set);
}

function refreshTypeSuggestions(){
  var list=document.getElementById('type-suggestions');
  if(!list)return;
  list.innerHTML='';
  getTypeSuggestions().forEach(function(t){
    var o=document.createElement('option');
    o.value=t;
    list.appendChild(o);
  });
}

// ══ STATS ═══════════════════════════════════════════════════════
function refreshStats(){
  var wks=getWorkouts(), ws=weekStartISO();
  var thisWk=wks.filter(function(w){return w.date>=ws;});
  var goals=getGoals();
  document.getElementById('sw-cnt').textContent=thisWk.length;
  document.getElementById('sw-goal-lbl').textContent=goals.weeklyWk||4;
  var goalText=document.getElementById('week-goal-text');
  if(goalText){goalText.style.color=thisWk.length>=(goals.weeklyWk||4)?'var(--green)':'';}
  document.getElementById('total-cnt').textContent=wks.length;
  var weekDur=thisWk.reduce(function(s,w){return s+(w.duration||0);},0);
  document.getElementById('dur-wk').textContent=Math.round(weekDur).toLocaleString('sv');
  if(wks.length){
    var sorted=wks.slice().sort(function(a,b){return b.date.localeCompare(a.date);});
    var days=daysSince(sorted[0].date);
    document.getElementById('last-d').textContent=days===0?'Idag':days;
    document.getElementById('last-sub').textContent=days===0?'':'dagar sedan';
  }
  document.getElementById('streak-count').textContent=calcStreak(wks);
}
function calcStreak(wks){
  if(!wks.length)return 0;
  var dates=[...new Set(wks.map(function(w){return w.date;}))].sort().reverse();
  var streak=0, check=todayISO();
  for(var i=0;i<dates.length;i++){
    if(dates[i]===check){streak++;var d=new Date(check);d.setDate(d.getDate()-1);check=d.toISOString().slice(0,10);}
    else break;
  }
  return streak;
}

// ══ WEEKLY GRID ══════════════════════════════════════════════════
function renderWeekGrid(){
  var mondayISO=getViewedMondayISO();
  var plan=getPlanForWeek(mondayISO), wks=getWorkouts(), planned=getPlannedSessions(), today=todayISO();
  var weekNo=getWeekNum(parseISODate(mondayISO));
  fillWeekLabel(mondayISO,'week-nav-label','week-nav-sub');
  var grid=byId('week-grid'); if(!grid)return; grid.innerHTML='';
  DAY_KEYS.forEach(function(key,i){
    var iso=shiftISODate(mondayISO,i);
    var d=parseISODate(iso);
    var isToday=iso===today, isDone=wks.some(function(w){return w.date===iso;}), isPending=(iso<=today&&!isDone);
    var type=(planned[iso]&&planned[iso].type)||plan[key]||'Vila';
    var div=document.createElement('div');
    div.className='week-day'+(isToday?' today':'')+(isDone?' done':'')+(isPending?' pending':'');
    div.innerHTML='<div class="wd-status">'+(isDone?'✓':(isPending?'✕':''))+'</div><div class="wd-week">v.'+weekNo+'</div><div class="wd-name">'+DAYS[i]+'</div><div class="wd-date">'+d.getDate()+'</div><div class="wd-type">'+escHtml(type)+'</div>';
    (function(k,lbl,dateISO){div.addEventListener('click',function(){openDayConfig(k,lbl,dateISO);});})(key,DAYS[i],iso);
    grid.appendChild(div);
  });
}

// ══ GOALS ════════════════════════════════════════════════════════
function fitScaleNumberInput(input){
  if(!input)return;
  var chars=String(input.value==null?'':input.value).length;
  input.style.setProperty('width',Math.max(1.8,Math.min(5.2,chars*.62+.75))+'em','important');
}
function getVo2Timeline(){
  var byDate={};
  (DB.get('vo2')||[]).forEach(function(e){var v=Number(e&&e.score)||0; if(e&&e.date&&v>0)byDate[e.date]=v;});
  getWorkouts().forEach(function(w){var v=Number(w.vo2)||0; if(v>0&&w.date)byDate[w.date]=v;});
  return Object.keys(byDate).sort().map(function(d){return {date:d,score:byDate[d]};});
}
function refreshGoals(){
  var goals=getGoals(), wks=getWorkouts(), ws=weekStartISO();
  var thisWk=wks.filter(function(w){return w.date>=ws;});
  var runEntries=wks.map(function(workout){
    return {workout:workout,metrics:workoutRunMetrics(workout),total:0};
  }).filter(function(entry){return entry.metrics.distance>0;}).sort(function(a,b){
    return String(a.workout.date||'').localeCompare(String(b.workout.date||''))||Number(a.workout.id||0)-Number(b.workout.id||0);
  });
  var totalDistance=0;
  runEntries.forEach(function(entry){totalDistance+=entry.metrics.distance;entry.total=+totalDistance.toFixed(2);});
  var longest=runEntries.reduce(function(best,entry){return entry.metrics.distance>(best&&best.metrics.distance||0)?entry:best;},null);
  document.getElementById('g1-goal').value=goals.weeklyWk||4;
  document.getElementById('g2-goal').value=goals.runDistanceGoal||10;
  document.getElementById('g3-goal').value=goals.vo2Goal||45;
  fitScaleNumberInput(document.getElementById('g2-goal'));
  fitScaleNumberInput(document.getElementById('g3-goal'));
  var cw=thisWk.length;
  document.getElementById('g1-cur').value=cw;
  document.getElementById('g1-bar').style.width=Math.min(100,(cw/(goals.weeklyWk||4))*100)+'%';
  var g1nums=document.getElementById('g1-cur').closest('.goal-nums');
  if(g1nums){g1nums.classList.toggle('goal-hit',cw>=(goals.weeklyWk||4));}
  var longDist=longest?longest.metrics.distance:0;
  document.getElementById('g2-cur').textContent=longDist?String(+longDist.toFixed(1)).replace(/\.0$/,''):0;
  var barPercent=Math.min(100,(longDist/(goals.runDistanceGoal||10))*100);
  document.getElementById('g2-bar').style.width=barPercent+'%';
  var markerEl=document.getElementById('g2-marker');
  if(markerEl){markerEl.style.left=barPercent+'%';markerEl.style.display=longDist>0?'block':'none';}
  var g2CurWrap=document.getElementById('g2-cur-wrap');
  if(g2CurWrap)g2CurWrap.style.left=barPercent+'%';
  var totalEl=document.getElementById('g2-total-distance');
  if(totalEl)totalEl.textContent=String(+totalDistance.toFixed(1)).replace(/\.0$/,'')+' km';
  var bestPace=runEntries.reduce(function(best,entry){return entry.metrics.pace>0&&(!best||entry.metrics.pace<best)?entry.metrics.pace:best;},0);
  var bestPaceEl=document.getElementById('g2-best-pace');
  if(bestPaceEl)bestPaceEl.textContent=formatRunningPace(bestPace);

  var historyBody=document.getElementById('run-history-body');
  historyBody.innerHTML='';
  runEntries.slice().reverse().slice(0,10).forEach(function(entry){
    var w=entry.workout,m=entry.metrics;
    var tr=document.createElement('tr');
    tr.innerHTML='<td>'+fmtDate(w.date)+'</td>'
      +'<td>'+String(+m.distance.toFixed(1)).replace(/\.0$/,'')+' km</td>'
      +'<td>'+(m.time?String(+m.time.toFixed(1)).replace(/\.0$/,'')+' min':'—')+'</td>'
      +'<td>'+formatRunningPace(m.pace)+'</td>'
      +'<td>'+String(+entry.total.toFixed(1)).replace(/\.0$/,'')+' km</td>';
    historyBody.appendChild(tr);
  });
  if(!runEntries.length){
    var tr=document.createElement('tr');
    tr.innerHTML='<td colspan="5" style="color:var(--text-dim)">Ingen löpdata loggad.</td>';
    historyBody.appendChild(tr);
  }
  renderRunPaceChart(runEntries);

  var vo2Timeline=getVo2Timeline();
  var curKond=vo2Timeline.length?Math.max.apply(null,vo2Timeline.map(function(e){return e.score;})):0;
  document.getElementById('g3-cur').textContent=curKond?String(+curKond.toFixed(1)).replace(/\.0$/,''):0;
  var kondGoal=goals.vo2Goal||45;
  var kondScaleMin=Math.min(40,kondGoal-1);
  var kondRange=Math.max(1,kondGoal-kondScaleMin);
  var kondP=curKond>0?Math.max(0,Math.min(100,((curKond-kondScaleMin)/kondRange)*100)):0;
  document.getElementById('g3-bar').style.width=kondP+'%';
  var markerG3=document.getElementById('g3-marker');
  if(markerG3){markerG3.style.left=kondP+'%';markerG3.style.display=curKond>0?'block':'none';}
  var g3CurWrap=document.getElementById('g3-cur-wrap');
  if(g3CurWrap)g3CurWrap.style.left=kondP+'%';
  var longestRunTime=0;
  wks.forEach(function(w){var m=workoutRunMetrics(w); if(m.time>longestRunTime)longestRunTime=m.time;});
  var maxVo2El=document.getElementById('g3-max-vo2');
  if(maxVo2El)maxVo2El.textContent=curKond?String(+curKond.toFixed(1)).replace(/\.0$/,'')+' ml/kg/min':'— ml/kg/min';
  var longestRunEl=document.getElementById('g3-longest-run');
  if(longestRunEl)longestRunEl.textContent=longestRunTime?String(+longestRunTime.toFixed(1)).replace(/\.0$/,'')+' min':'— min';
}
function saveGoals(){
  DB.set('goals',{
    weeklyWk:+(document.getElementById('g1-goal').value)||4,
    runDistanceGoal:+(document.getElementById('g2-goal').value)||10,
    vo2Goal:+(document.getElementById('g3-goal').value)||45
  });
  refreshAll(); showToast('Mål sparade.');
}
function logKondition(){
  var v=parseFloat(document.getElementById('kondition-inp').value);
  if(isNaN(v)||v<10||v>100){showToast('Ange ett giltigt värde (10–100)');return;}
  var data=DB.get('vo2')||[], today=todayISO(), idx=data.findIndex(function(e){return e.date===today;});
  if(idx>=0)data[idx].score=v; else data.push({date:today,score:v});
  data.sort(function(a,b){return a.date.localeCompare(b.date);});
  DB.set('vo2',data); document.getElementById('kondition-inp').value='';
  renderCharts(); refreshGoals(); showToast('VO2 loggad.');
}
var editingDayKey=null, editingDayISO=null;
var editingWorkoutId=null;
var editingWorkoutTargetIndex=null;
var singleExerciseEditState=null;
var sessionState=null;
var sessionTickHandle=null;
function openDayConfig(key,label,iso){
  editingDayKey=key; editingDayISO=iso;
  var title=byId('day-modal-title','day-modal-title');
  if(title) title.textContent=label+' · '+fmtDate(iso);
  var plan=getPlanForWeek(mondayISOOf(iso)), sel=byId('day-modal-type','day-modal-type');
  refreshTypeSuggestions();
  var planned=getPlannedSessions()[iso];
  sel.value=(planned&&planned.type)||plan[key]||'Vila';
  var today=todayISO(), logBtn=byId('day-modal-log','day-modal-log');
  var editBtn=byId('day-modal-edit','day-modal-edit');
  var startBtn=byId('day-modal-start','day-modal-start');
  if(editBtn) editBtn.onclick=function(){openDayWorkoutBuilder(label,iso);};
  if(startBtn) startBtn.onclick=function(){startWorkoutSessionForDate(iso);};
  if(logBtn){
    if(iso<=today){
      logBtn.style.display='';
      logBtn.onclick=function(){closeModal('day-modal');var type=sel.value;var typeEl=byId('wk-type','wk-type');var dateEl=byId('wk-date','wk-date');if(typeEl)typeEl.value=type;if(dateEl)dateEl.value=iso;openWorkoutModal();};
    } else { logBtn.style.display='none'; }
  }
  byId('day-modal','day-modal').classList.add('show');
}
function saveDayType(){
  if(!editingDayKey||!editingDayISO)return;
  var type=byId('day-modal-type','day-modal-type').value;
  var mondayISO=mondayISOOf(editingDayISO);
  var plan=Object.assign({}, getPlanForWeek(mondayISO));
  plan[editingDayKey]=type;
  applyPlanToWeek(mondayISO, plan);
  refreshTypeSuggestions(); renderWeekGrid(); closeModal('day-modal'); showToast('Dag uppdaterad.');
}

function addDayWorkoutExRow(ex){
  var list=byId('day-workout-ex-list','day-workout-ex-list','day-workout-ex-list');
  if(!list)return;
  var row=document.createElement('div');
  row.className='ex-row-item is-'+normalizeExercise(ex).kind;
  row.innerHTML=buildExerciseEditorRowHtml('dw',ex,"this.closest('.ex-row-item').remove()");
  list.appendChild(row);
}

function loadDayWorkoutBuilder(iso){
  editingDayISO=iso;
  editingDayKey=dayKeyFromISO(iso);
  var label=dayLabelFromISO(iso);
  var plan=getPlanForWeek(mondayISOOf(iso));
  var byDate=getPlannedSessions();
  var p=byDate[iso]||{type:plan[editingDayKey]||'Övrigt',exercises:[]};
  var title=byId('day-workout-title','day-workout-title');
  if(title) title.textContent='Passupplägg · '+label+' '+fmtDate(iso);
  var typeEl=byId('day-workout-type','day-workout-type');
  if(typeEl) typeEl.value=p.type||'Övrigt';
  var list=byId('day-workout-ex-list','day-workout-ex-list','day-workout-ex-list');
  if(list){
    list.innerHTML='';
    (p.exercises||[]).forEach(function(ex){addDayWorkoutExRow(ex);});
    if(!(p.exercises||[]).length)addDayWorkoutExRow();
  }
  var modal=byId('day-workout-modal','day-workout-modal');
  if(modal) modal.dataset.date=iso;
  var dateEl=byId('day-workout-date');
  if(dateEl) dateEl.value=iso;
  fillWeekLabel(mondayISOOf(iso),'day-workout-week-label','day-workout-week-sub');
}
function openDayWorkoutBuilder(label,iso){
  closeModal('day-modal');
  refreshTypeSuggestions();
  loadDayWorkoutBuilder(iso);
  byId('day-workout-modal','day-workout-modal').classList.add('show');
}
function onDayWorkoutDateChange(){
  var dateEl=byId('day-workout-date');
  if(!dateEl||!dateEl.value)return;
  loadDayWorkoutBuilder(dateEl.value);
}
function shiftDayWorkoutWeek(delta){
  var modal=byId('day-workout-modal','day-workout-modal');
  var iso=(modal&&modal.dataset.date)||todayISO();
  loadDayWorkoutBuilder(shiftISODate(iso,delta*7));
}

function saveDayWorkoutPlan(){
  return persistDayWorkoutPlan({startAfterSave:false});
}

function persistDayWorkoutPlan(opts){
  opts=opts||{};
  var modal=document.getElementById('day-workout-modal');
  var date=modal.dataset.date;
  if(!date)return false;
  var type=(document.getElementById('day-workout-type').value||'Övrigt').trim()||'Övrigt';
  var ex=[];
  document.querySelectorAll('#day-workout-ex-list .ex-row-item').forEach(function(row){
    var parsed=parseExerciseRow(row,'dw');
    if(parsed)ex.push(parsed);
  });
  if(!ex.length){showToast('Lägg till minst en övning.');return false;}
  var dateInput=byId('day-workout-date');
  if(dateInput&&dateInput.value) date=dateInput.value;
  modal.dataset.date=date;
  var byDate=getPlannedSessions();
  byDate[date]={type:type,exercises:ex};
  savePlannedSessions(byDate);
  var mondayISO=mondayISOOf(date);
  var key=dayKeyFromISO(date);
  var plan=Object.assign({}, getPlanForWeek(mondayISO));
  plan[key]=type;
  setPlanForWeek(mondayISO,plan);
  viewedMondayISO=mondayISO;
  refreshTypeSuggestions();
  renderWeekGrid();
  closeModal('day-workout-modal');
  showToast(opts.startAfterSave?'Passupplägg sparat. Startar pass...':'Passupplägg sparat.');
  return true;
}

function startDayWorkoutFromBuilder(){
  var modal=document.getElementById('day-workout-modal');
  var date=modal.dataset.date;
  if(!date)return;
  var ok=persistDayWorkoutPlan({startAfterSave:true});
  if(!ok)return;
  startWorkoutSessionForDate(date);
}

function startWorkoutSessionForDate(iso){
  var byDate=getPlannedSessions();
  var planned=byDate[iso];
  if(!planned||!(planned.exercises||[]).length){
    showToast('Skapa passupplägg först.');
    return;
  }
  closeModal('day-modal');
  sessionState={
    date:iso,
    type:planned.type||'Övrigt',
    exercises:(planned.exercises||[]).map(function(ex){
      var norm=normalizeExercise(ex);
      return norm.kind==='cardio'
        ? {kind:'cardio',name:norm.name,distance:norm.distance,time:norm.time,plannedSets:1}
        : {kind:'strength',name:norm.name,plannedSets:+norm.sets||1,reps:+norm.reps||0,weight:+norm.weight||0};
    }),
    exerciseIndex:0,
    currentSet:1,
    setRunning:false,
    setStartedAt:null,
    passStartedAt:Date.now(),
    awaitingDecision:false,
    logs:[]
  };
  sessionState.exercises.forEach(function(){sessionState.logs.push([]);});
  document.getElementById('session-hr').value='';
  document.getElementById('session-vo2').value='';
  document.getElementById('session-complete-box').classList.remove('show');
  document.getElementById('session-modal').classList.add('show');
  renderSessionMode();
  startSessionTimerLoop();
}

function startSessionTimerLoop(){
  stopSessionTimerLoop();
  sessionTickHandle=setInterval(updateSessionTimers,1000);
  updateSessionTimers();
}

function stopSessionTimerLoop(){
  if(sessionTickHandle){clearInterval(sessionTickHandle);sessionTickHandle=null;}
}

function updateSessionTimers(){
  if(!sessionState)return;
  var passSec=(Date.now()-sessionState.passStartedAt)/1000;
  var setSec=sessionState.setRunning?(Date.now()-sessionState.setStartedAt)/1000:0;
  var passEl=document.getElementById('session-pass-timer');
  var setEl=document.getElementById('session-set-timer');
  if(passEl)passEl.textContent=fmtSec(passSec);
  if(setEl)setEl.textContent=fmtSec(setSec);
}

function renderSessionMode(){
  if(!sessionState)return;
  var doneAll=sessionState.exerciseIndex>=sessionState.exercises.length;
  var subtitle=document.getElementById('session-subtitle');
  subtitle.textContent=fmtDate(sessionState.date)+' - '+sessionState.type;
  var controls=document.getElementById('session-controls');
  var currentExEl=document.getElementById('session-current-ex');
  var currentTargetEl=document.getElementById('session-current-target');
  var setLog=document.getElementById('session-set-log');
  controls.innerHTML='';
  setLog.innerHTML='';

  if(doneAll){
    controls.className='session-cta-row';
    currentExEl.textContent='Alla övningar klara';
    currentTargetEl.textContent='Kontrollera puls/VO2 och spara passet.';
    document.getElementById('session-complete-box').classList.add('show');
  } else {
    document.getElementById('session-complete-box').classList.remove('show');
    var ex=sessionState.exercises[sessionState.exerciseIndex];
    var targetSets=ex.plannedSets;
    currentExEl.textContent=ex.name;
    currentTargetEl.textContent=ex.kind==='cardio'
      ? 'Kondition - '+(ex.distance?ex.distance+' km':'—')+' / '+formatCardioTime(ex.time)
      : 'Set '+sessionState.currentSet+' av '+targetSets+' - '+ex.reps+' reps @ '+ex.weight+' kg';

    if(sessionState.setRunning){
      controls.className='session-cta-row';
      controls.innerHTML='<button class="session-cta primary" type="button" onclick="completeCurrentSet()">Klar med set</button>';
    } else if(sessionState.awaitingDecision){
      controls.className='session-cta-row decision-row';
      var btns='';
      if(sessionState.currentSet<targetSets){
        btns+='<button class="session-cta primary" type="button" onclick="startNextSet()">Starta nästa set</button>';
      }
      btns+='<button class="session-cta warn" type="button" onclick="addExtraSet()">Extra set</button>';
      btns+='<button class="session-cta success" type="button" onclick="finishCurrentExercise()">Övning klar</button>';
      controls.innerHTML=btns;
    } else {
      controls.className='session-cta-row';
      controls.innerHTML='<button class="session-cta primary" type="button" onclick="startCurrentSet()">Starta set</button>';
    }

    var logs=sessionState.logs[sessionState.exerciseIndex]||[];
    logs.forEach(function(l,idx){
      var row=document.createElement('div');
      row.className='set-log-item';
      row.innerHTML=ex.kind==='cardio'
        ? '<div class="set-tag">Runda '+l.setNo+'</div>'
          +'<input type="number" value="'+(l.actualDistance||0)+'" min="0" step="0.1" onchange="updateSetLog('+sessionState.exerciseIndex+','+idx+',\'actualDistance\',this.value)">'
          +'<input type="number" value="'+(l.actualTime||0)+'" min="0" step="0.1" onchange="updateSetLog('+sessionState.exerciseIndex+','+idx+',\'actualTime\',this.value)">'
          +'<input type="text" value="'+fmtSec(l.durationSec)+'" readonly>'
        : '<div class="set-tag">Set '+l.setNo+'</div>'
          +'<input type="number" value="'+l.actualReps+'" min="0" onchange="updateSetLog('+sessionState.exerciseIndex+','+idx+',\'actualReps\',this.value)">'
          +'<input type="number" value="'+l.actualWeight+'" min="0" step=".5" onchange="updateSetLog('+sessionState.exerciseIndex+','+idx+',\'actualWeight\',this.value)">'
          +'<input type="text" value="'+fmtSec(l.durationSec)+'" readonly>';
      setLog.appendChild(row);
    });
    if(!logs.length){
      setLog.innerHTML='<div style="font-size:12px;color:var(--text-dim)">Inga set loggade ännu.</div>';
    }
  }

  var tbody=document.getElementById('session-plan-table');
  tbody.innerHTML='';
  sessionState.exercises.forEach(function(ex,i){
    var logs=sessionState.logs[i]||[];
    var dur=logs.reduce(function(s,x){return s+(x.durationSec||0);},0);
    var tr=document.createElement('tr');
    tr.innerHTML='<td>'+escHtml(ex.name)+'</td><td>'+(ex.kind==='cardio'?((ex.distance?ex.distance+' km':'—')+' / '+formatCardioTime(ex.time)):(ex.plannedSets+'x'+ex.reps+' @ '+ex.weight))+'</td><td>'+logs.length+'</td><td>'+fmtSec(dur)+'</td>';
    tbody.appendChild(tr);
  });
}

function updateSetLog(exIdx,logIdx,key,val){
  if(!sessionState||!sessionState.logs[exIdx]||!sessionState.logs[exIdx][logIdx])return;
  var n=(key==='actualWeight'||key==='actualDistance'||key==='actualTime')?parseFloat(val):parseInt(val,10);
  sessionState.logs[exIdx][logIdx][key]=isNaN(n)?0:n;
}

function startCurrentSet(){
  if(!sessionState||sessionState.exerciseIndex>=sessionState.exercises.length)return;
  if(sessionState.setRunning)return;
  sessionState.setRunning=true;
  sessionState.awaitingDecision=false;
  sessionState.setStartedAt=Date.now();
  renderSessionMode();
}

function completeCurrentSet(){
  if(!sessionState||!sessionState.setRunning)return;
  var ex=sessionState.exercises[sessionState.exerciseIndex];
  var dur=Math.max(1,Math.round((Date.now()-sessionState.setStartedAt)/1000));
  sessionState.logs[sessionState.exerciseIndex].push(ex.kind==='cardio' ? {
    setNo:sessionState.currentSet,
    actualDistance:ex.distance||0,
    actualTime:ex.time||+(dur/60).toFixed(2),
    durationSec:dur
  } : {
    setNo:sessionState.currentSet,
    targetReps:ex.reps,
    targetWeight:ex.weight,
    actualReps:ex.reps,
    actualWeight:ex.weight,
    durationSec:dur
  });
  sessionState.setRunning=false;
  sessionState.setStartedAt=null;
  sessionState.awaitingDecision=true;
  renderSessionMode();
}

function startNextSet(){
  if(!sessionState)return;
  sessionState.currentSet+=1;
  sessionState.awaitingDecision=false;
  renderSessionMode();
}

function addExtraSet(){
  if(!sessionState)return;
  var ex=sessionState.exercises[sessionState.exerciseIndex];
  ex.plannedSets+=1;
  sessionState.currentSet+=1;
  sessionState.awaitingDecision=false;
  renderSessionMode();
}

function finishCurrentExercise(){
  if(!sessionState)return;
  sessionState.setRunning=false;
  sessionState.setStartedAt=null;
  sessionState.awaitingDecision=false;
  sessionState.exerciseIndex+=1;
  sessionState.currentSet=1;
  renderSessionMode();
}

function stopSessionMode(confirmClose){
  if(confirmClose&&sessionState){
    var ok=confirm('Avsluta passläge utan att spara?');
    if(!ok)return;
  }
  stopSessionTimerLoop();
  sessionState=null;
  closeModal('session-modal');
}

function saveSessionWorkout(){
  if(!sessionState)return;
  var totalSec=Math.max(60,Math.round((Date.now()-sessionState.passStartedAt)/1000));
  var exercises=[];
  var exerciseTimings=[];
  sessionState.exercises.forEach(function(ex,i){
    var logs=sessionState.logs[i]||[];
    if(!logs.length)return;
    var dur=logs.reduce(function(s,l){return s+(l.durationSec||0);},0);
    if(ex.kind==='cardio'){
      exercises.push(normalizeExercise({name:ex.name,kind:'cardio',distance:logs.reduce(function(s,l){return s+(l.actualDistance||0);},0),time:logs.reduce(function(s,l){return s+(l.actualTime||0);},0)}));
    } else {
      var sets=logs.length;
      var reps=Math.round(logs.reduce(function(s,l){return s+(l.actualReps||0);},0)/sets);
      var weight=+(logs.reduce(function(s,l){return s+(l.actualWeight||0);},0)/sets).toFixed(1);
      exercises.push(normalizeExercise({name:ex.name,kind:'strength',sets:sets,reps:reps,weight:weight}));
    }
    exerciseTimings.push({name:ex.name,durationSec:dur,exerciseIndex:exercises.length-1});
  });
  if(!exercises.length){showToast('Inga set loggade ännu.');return;}
  var hrAvg=parseInt(document.getElementById('session-hr').value,10)||null;
  var vo2=parseFloat(document.getElementById('session-vo2').value);
  vo2=isNaN(vo2)?null:vo2;
  var sessionType=canonicalWorkoutType(sessionState.type,sessionState.exercises);
  var sessionRunMetrics=workoutRunMetrics({type:sessionType,exercises:exercises});
  var wk={
    id:Date.now(),
    date:sessionState.date,
    type:sessionType,
    exercises:exercises,
    duration:Math.round(totalSec/60),
    hrAvg:hrAvg,
    vo2:vo2,
    runDistance:sessionRunMetrics.distance||0,
    runTime:sessionRunMetrics.time||null,
    avgPaceKm:sessionRunMetrics.pace||null,
    runMetricsDerived:sessionRunMetrics.distance>0,
    notes:'Skapad i passläge',
    exerciseTimings:exerciseTimings
  };
  var wks=getWorkouts();
  wks.push(wk);
  saveWorkouts(wks);
  if(vo2!==null)upsertVO2ForDate(sessionState.date,vo2);
  refreshTypeSuggestions();
  refreshAll();
  stopSessionMode(false);
  showToast('Pass sparat från passläge.');
}

// ══ CHARTS ══════════════════════════════════════════════════════
var chartSessions, chartVO2, chartHR, chartRunPace;
function getWeekNum(d){var d2=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));d2.setUTCDate(d2.getUTCDate()+4-(d2.getUTCDay()||7));var ys=new Date(Date.UTC(d2.getUTCFullYear(),0,1));return Math.ceil(((d2-ys)/86400000+1)/7);}
function renderCharts(){
  var wks=getWorkouts();
  var weekStats={};
  wks.forEach(function(w){
    var d=new Date(w.date), dow=d.getDay()===0?6:d.getDay()-1, ws=new Date(d); ws.setDate(d.getDate()-dow);
    var wk=ws.toISOString().slice(0,10);
    if(!weekStats[wk])weekStats[wk]={sessions:0,duration:0};
    weekStats[wk].sessions+=1;
    weekStats[wk].duration+=(w.duration||0);
  });
  var wkKeys=Object.keys(weekStats).sort().slice(-10);
  var wkLabels=wkKeys.map(function(k){return 'v'+getWeekNum(new Date(k));});
  var sessionsVals=wkKeys.map(function(k){return weekStats[k].sessions;});
  var avgSessions=0;
  if(sessionsVals.length){avgSessions=sessionsVals.reduce(function(sum,val){return sum+val;},0)/sessionsVals.length;}
  var avgVals=wkKeys.map(function(){return +avgSessions.toFixed(2);});
  var peakVal=Math.max(0,
    sessionsVals.length?Math.max.apply(null,sessionsVals):0,
    avgVals.length?Math.ceil(Math.max.apply(null,avgVals)):0
  );
  var yMax=Math.max(4,peakVal+1);
  var note=document.getElementById('sessions-total-note');
  if(note)note.textContent='Totalt pass: '+wks.length;
  var sessionsCtx=document.getElementById('chart-sessions').getContext('2d');
  if(chartSessions)chartSessions.destroy();
  chartSessions=new Chart(sessionsCtx,{type:'line',data:{labels:wkLabels.length?wkLabels:['—'],datasets:[{label:'Pass / vecka',data:sessionsVals.length?sessionsVals:[0],borderColor:'#22D3EE',backgroundColor:'rgba(34,211,238,.15)',pointBackgroundColor:'#ECFEFF',pointBorderColor:'#22D3EE',pointRadius:3,pointHoverRadius:5,borderWidth:2.5,tension:.3,fill:true,spanGaps:true,yAxisID:'y',order:2},{label:'Medel pass / vecka',data:avgVals.length?avgVals:[0],borderColor:'#EF4444',backgroundColor:'transparent',tension:0,pointRadius:0,pointHoverRadius:0,borderWidth:2.5,borderDash:[6,4],fill:false,yAxisID:'y',order:1}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,labels:{color:'#8B949E',font:{family:'Inter',size:11}}},tooltip:{backgroundColor:'#161B22',titleColor:'#C9D1DC',bodyColor:'#C9D1DC',borderColor:'rgba(255,255,255,.08)',borderWidth:1}},scales:{x:{ticks:{color:'#8B949E',font:{family:'Inter',size:11}},grid:{color:'rgba(255,255,255,.05)'}},y:{beginAtZero:true,max:yMax,ticks:{stepSize:1,precision:0,color:'#8B949E',font:{family:'Inter',size:11},callback:function(v){return Number.isInteger(v)?v:'';}},grid:{color:'rgba(255,255,255,.05)'}}}}});
  var bwCtx=document.getElementById('chart-bw').getContext('2d');
  var existingVO2=typeof Chart.getChart==='function'?Chart.getChart(bwCtx.canvas):null;
  if(existingVO2)existingVO2.destroy();
  if(chartVO2&&chartVO2!==existingVO2){try{chartVO2.destroy();}catch(_vo2DestroyError){}}
  chartVO2=null;
  var vo2Data=getVo2Timeline().slice(-14);
  var goals=getGoals(), goalVal=goals.vo2Goal||45;
  var vo2Labels=vo2Data.length?vo2Data.map(function(e){return fmtDate(e.date);}):['—'];
  var vo2Vals=vo2Data.length?vo2Data.map(function(e){return Number(e.score)||null;}):[null];
  var runTimeByDate={},workoutsByDate={};
  wks.forEach(function(workout){
    var metrics=workoutRunMetrics(workout);
    if(metrics.time>0)runTimeByDate[workout.date]=(runTimeByDate[workout.date]||0)+metrics.time;
    if(workout.date){
      if(!workoutsByDate[workout.date])workoutsByDate[workout.date]=[];
      workoutsByDate[workout.date].push(workout);
    }
  });
  chartVO2=new Chart(bwCtx,{
    type:'line',
    data:{labels:vo2Labels,datasets:[
      {label:'VO₂ max',data:vo2Vals,borderColor:'#10B981',backgroundColor:'rgba(16,185,129,.15)',pointBackgroundColor:'#ECFDF5',pointBorderColor:'#047857',pointRadius:3,pointHoverRadius:5,borderWidth:2.5,tension:.3,fill:true,spanGaps:true,yAxisID:'y',order:1}
    ]},
    options:{
      responsive:true,
      maintainAspectRatio:false,
      interaction:{mode:'index',intersect:false},
      plugins:{
        legend:{display:false},
        tooltip:{
          backgroundColor:'#161B22',titleColor:'#DDD6FE',bodyColor:'#C9D1DC',borderColor:'rgba(167,139,250,.20)',borderWidth:1,
          callbacks:{label:function(context){
            if(context.dataset.yAxisID==='yRun')return context.parsed.y===null?'Löptid: —':'Löptid: '+String(+Number(context.parsed.y).toFixed(1)).replace(/\.0$/,'')+' min';
            return context.dataset.label+': '+(context.parsed.y===null?'—':String(+Number(context.parsed.y).toFixed(1)).replace(/\.0$/,''));
          }}
        }
      },
      scales:{
        x:{ticks:{color:'#6B7280',font:{family:'Inter',size:8},maxRotation:0},grid:{display:false}},
        y:{position:'left',ticks:{color:'#10B981',font:{family:'Inter',size:8}},grid:{color:'rgba(16,185,129,.08)'}}
      }
    }
  });
  var vo2HistoryBody=document.getElementById('vo2-history-body');
  if(vo2HistoryBody){
    vo2HistoryBody.innerHTML='';
    vo2Data.slice().reverse().slice(0,10).forEach(function(entry){
      var val=Number(entry.score)||0;
      var runTime=runTimeByDate[entry.date]||0;
      var sameDateWorkouts=workoutsByDate[entry.date]||[];
      var vo2SessionHeartRates=sameDateWorkouts.filter(function(workout){
        return Number(workout.vo2)>0&&Number(workout.hrAvg)>0;
      }).map(function(workout){return Number(workout.hrAvg);});
      if(!vo2SessionHeartRates.length&&sameDateWorkouts.length===1&&Number(sameDateWorkouts[0].hrAvg)>0){
        vo2SessionHeartRates=[Number(sameDateWorkouts[0].hrAvg)];
      }
      var avgHeartRate=vo2SessionHeartRates.length
        ?Math.round(vo2SessionHeartRates.reduce(function(sum,heartRate){return sum+heartRate;},0)/vo2SessionHeartRates.length)
        :0;
      var tr=document.createElement('tr');
      tr.innerHTML='<td>'+fmtDate(entry.date)+'</td>'
        +'<td>'+(val?String(+val.toFixed(1)).replace(/\.0$/,''):'—')+'</td>'
        +'<td>'+(runTime?String(+runTime.toFixed(1)).replace(/\.0$/,'')+' min':'—')+'</td>'
        +'<td>'+(avgHeartRate?avgHeartRate+' bpm':'—')+'</td>'
        +'<td>'+String(+goalVal.toFixed(1)).replace(/\.0$/,'')+'</td>';
      vo2HistoryBody.appendChild(tr);
    });
    if(!vo2Data.length){
      var tr=document.createElement('tr');
      tr.innerHTML='<td colspan="5" style="color:var(--text-dim)">Ingen VO₂-data loggad.</td>';
      vo2HistoryBody.appendChild(tr);
    }
  }


}

// ══ VO₂-MAX ══════════════════════════════════════════════════════
function logVO2(){
  var v=parseFloat(document.getElementById('bw-inp').value);
  if(isNaN(v)||v<10||v>100){showToast('Ange ett giltigt värde (10–100)');return;}
  var data=DB.get('vo2')||[], today=todayISO(), idx=data.findIndex(function(e){return e.date===today;});
  if(idx>=0)data[idx].score=v; else data.push({date:today,score:v});
  data.sort(function(a,b){return a.date.localeCompare(b.date);});
  DB.set('vo2',data); document.getElementById('bw-inp').value='';
  renderCharts(); refreshGoals(); showToast('VO2 loggad.');
}

// ══ PRs ══════════════════════════════════════════════════════════
var editingPRName=null;
function renderPRs(){
  var prs=getPRs(), grid=document.getElementById('pr-grid'), keys=Object.keys(prs);
  if(!keys.length){grid.innerHTML='<p style="color:var(--text-dim);font-size:13px;padding:10px">Inga PR:n sparade. Klicka &quot;+ Nytt PR&quot; för att börja.</p>';return;}
  keys.sort(function(a,b){return String(a).localeCompare(String(b),'sv');});
  var html='<table class="pr-table"><thead><tr><th>Övning</th><th>PR</th></tr></thead><tbody>';
  keys.forEach(function(k){html+='<tr onclick="openEditPR(\''+escHtml(k)+'\','+prs[k]+')"><td class="pr-ex-name">'+escHtml(k)+'</td><td class="pr-ex-val">'+prs[k]+'</td></tr>';});
  html+='</tbody></table>';
  grid.innerHTML=html;
}
function openPRModal(){editingPRName=null;document.getElementById('pr-name').value='';document.getElementById('pr-val').value='';document.getElementById('pr-del-btn').style.display='none';document.getElementById('pr-modal').classList.add('show');}
function openEditPR(name,val){editingPRName=name;document.getElementById('pr-name').value=name;document.getElementById('pr-val').value=val;document.getElementById('pr-del-btn').style.display='';document.getElementById('pr-modal').classList.add('show');}
function savePR(){var n=document.getElementById('pr-name').value.trim(),v=parseFloat(document.getElementById('pr-val').value);if(!n||isNaN(v))return;var prs=getPRs();if(editingPRName&&editingPRName!==n)delete prs[editingPRName];prs[n]=v;DB.set('prs',prs);renderPRs();closeModal('pr-modal');showToast('PR sparat.');}
function deletePR(){if(!editingPRName)return;var prs=getPRs();delete prs[editingPRName];DB.set('prs',prs);renderPRs();closeModal('pr-modal');showToast('PR borttaget');}

// ══ WORKOUT LOG ══════════════════════════════════════════════════
function renderLog(){
  var wks=getWorkouts().slice().sort(function(a,b){
    return String(b.date||'').localeCompare(String(a.date||''))||Number(b.id||0)-Number(a.id||0);
  });
  var tbody=document.getElementById('log-body'),empty=document.getElementById('log-empty');
  if(!wks.length){tbody.innerHTML='';empty.style.display='';return;}
  empty.style.display='none';
  var openIds={};
  document.querySelectorAll('.log-detail.show').forEach(function(row){openIds[row.id]=true;});
  var html='';
  wks.forEach(function(w){
    var typeDisp=canonicalWorkoutType(w.type,w.exercises);
    var cardioPass=isCardioWorkout(w);
    var runMetrics=workoutRunMetrics(w);
    var volume=calcVol(w);
    var cardioDistance=(w.exercises||[]).reduce(function(sum,exercise){
      var ex=normalizeExercise(exercise);
      return sum+(ex.kind==='cardio'?(parseFloat(ex.distance)||0):0);
    },0);
    var distanceForDisplay=cardioDistance>0?cardioDistance:runMetrics.distance;
    var volumeDisp=volume>0
      ? Math.round(volume).toLocaleString('sv-SE')+' kg'
      : (distanceForDisplay>0?String(+distanceForDisplay.toFixed(2)).replace(/\.0$/,'')+' km':'—');
    var volumeMarkup='<span>'+volumeDisp+'</span>'+(runMetrics.pace?'<small class="log-main-pace-v34">'+formatRunningPace(runMetrics.pace)+'</small>':'');
    var durationDisp=w.duration?w.duration+' min':'—';
    var pulseDisp=w.hrAvg?w.hrAvg+' bpm':'—';
    var detailId='detail-'+w.id;
    var detailOpen=!!openIds[detailId];
    var rowClass='log-main-row'+(cardioPass?' log-pass-cardio-v7':'');
    html+='<tr class="'+rowClass+'" data-workout-id="'+w.id+'" aria-expanded="'+(detailOpen?'true':'false')+'" onclick="toggleWorkoutDetails('+w.id+')">'
      +'<td>'+fmtDate(w.date)+'</td>'
      +'<td><span class="log-tag">'+escHtml(typeDisp||'—')+'</span></td>'
      +'<td class="log-volume-v34">'+volumeMarkup+'</td><td>'+durationDisp+'</td><td>'+pulseDisp+'</td>'
      +'<td class="log-actions"><button class="log-del" type="button" onclick="event.stopPropagation();deleteWorkout('+w.id+')" aria-label="Ta bort pass" title="Ta bort">×</button></td>'
      +'</tr>';

    var usedTimings={};
    var exerciseRows=(w.exercises||[]).map(function(exercise,index){
      var ex=normalizeExercise(exercise);
      var timing=workoutTimingForExercise(w,ex,index,usedTimings);
      var duration=timing&&exerciseDurationSeconds(timing.durationSec)?fmtSec(timing.durationSec):'—';
      return '<button type="button" class="log-ex-row-v7 is-'+ex.kind+'" role="row" onclick="event.stopPropagation();editWorkoutExercise('+w.id+','+index+')" aria-label="Redigera '+escHtml(ex.name||'övning')+'">'
        +'<span class="log-ex-index-v7" role="cell">'+(index+1)+'</span>'
        +'<strong class="log-ex-name-v7" role="cell">'+escHtml(ex.name||'Övning')+'</strong>'
        +'<span class="log-ex-target-v7" role="cell">'+escHtml(exerciseTargetText(ex))+'</span>'
        +'<time class="log-ex-time-v7" role="cell">'+duration+'</time>'
        +'<span class="log-ex-chevron-v7" aria-hidden="true">›</span>'
        +'</button>';
    }).join('');
    if(!exerciseRows){
      exerciseRows='<button type="button" class="log-ex-empty-v7" onclick="event.stopPropagation();editWorkout('+w.id+')">Inga övningar sparade · tryck för att lägga till</button>';
    }

    var metaMarkup='<div class="log-detail-meta-v8">'
      +'<span class="log-meta-date-v8">'+fmtDate(w.date)+'</span>'
      +(w.duration?'<span class="log-meta-time-v8">'+w.duration+' min</span>':'')
      +workoutPulseIntervalMarkup(w)
      +workoutVo2GoalIntervalMarkup(w)
      +workoutPaceIntervalMarkup(w)
      +'</div>';
    html+='<tr id="'+detailId+'" class="log-detail'+(detailOpen?' show':'')+'" data-workout-id="'+w.id+'"><td colspan="6">'
      +'<div class="log-detail-box">'
      +'<div class="log-detail-head-v7"><div class="log-detail-copy-v8"><strong>'+escHtml(typeDisp||'Pass')+'</strong>'+metaMarkup+'</div>'
      +'<div class="log-detail-actions-v8"><button type="button" class="log-add-workout-v8" onclick="event.stopPropagation();openWorkoutModal()" aria-label="Logga nytt pass" title="Logga nytt pass">+</button>'
      +'<button type="button" class="log-edit-pass-v7" onclick="event.stopPropagation();editWorkout('+w.id+')">Redigera pass</button></div></div>'
      +'<div class="log-ex-table-v7" role="table" aria-label="Övningar">'
      +'<div class="log-ex-head-v7" role="row"><span role="columnheader">#</span><span role="columnheader">Övning</span><span role="columnheader">Resultat</span><span role="columnheader">Tid</span><span></span></div>'
      +exerciseRows+'</div>'
      +(w.notes?'<p class="log-note-v7">'+escHtml(w.notes)+'</p>':'')
      +'</div></td></tr>';
  });
  tbody.innerHTML=html;
  document.body.classList.toggle('exercise-log-detail-open-v7',!!document.querySelector('.log-detail.show'));
}
function toggleWorkoutDetails(id){
  var row=document.getElementById('detail-'+id);
  if(!row)return;
  var shouldOpen=!row.classList.contains('show');
  var commit=function(){
    document.querySelectorAll('.log-detail.show').forEach(function(openRow){
      openRow.classList.remove('show');
      var trigger=document.querySelector('.log-main-row[data-workout-id="'+openRow.dataset.workoutId+'"]');
      if(trigger)trigger.setAttribute('aria-expanded','false');
    });
    if(shouldOpen){
      row.classList.add('show');
      var trigger=document.querySelector('.log-main-row[data-workout-id="'+id+'"]');
      if(trigger)trigger.setAttribute('aria-expanded','true');
    }
    document.body.classList.toggle('exercise-log-detail-open-v7',shouldOpen);
  };
  if(typeof window.runExerciseMorph==='function')window.runExerciseMorph('log',commit);
  else commit();
}
function timingMatchForWorkoutExercise(workout,index){
  var used={};
  var timing=null;
  for(var i=0;i<=index;i++){
    timing=workoutTimingForExercise(workout,(workout.exercises||[])[i],i,used);
  }
  var timings=Array.isArray(workout&&workout.exerciseTimings)?workout.exerciseTimings:[];
  return {timing:timing,index:timing?timings.indexOf(timing):-1};
}
function ensureSingleExerciseEditModal(){
  var overlay=document.getElementById('exercise-edit-modal-v9');
  if(overlay)return overlay;
  overlay=document.createElement('div');
  overlay.id='exercise-edit-modal-v9';
  overlay.className='modal-overlay';
  overlay.innerHTML='<div class="modal single-exercise-modal-v9">'
    +'<button class="modal-close" type="button" onclick="closeSingleExerciseEdit()">✕</button>'
    +'<div class="single-exercise-kicker-v9">Övning</div>'
    +'<h2>Redigera övning</h2>'
    +'<div class="single-exercise-context-v9" id="single-exercise-context-v9"></div>'
    +'<div id="single-exercise-editor-v9"></div>'
    +'<div class="modal-footer"><button class="btn-ghost" type="button" onclick="closeSingleExerciseEdit()">Avbryt</button>'
    +'<button class="btn-primary" type="button" onclick="saveSingleExerciseEdit()">Spara övning</button></div>'
    +'</div>';
  overlay.addEventListener('click',function(event){
    if(event.target===overlay)closeSingleExerciseEdit();
  });
  document.body.appendChild(overlay);
  return overlay;
}
function closeSingleExerciseEdit(){
  var overlay=document.getElementById('exercise-edit-modal-v9');
  if(overlay)overlay.classList.remove('show');
  singleExerciseEditState=null;
}
function editWorkoutExercise(id,index){
  var workouts=getWorkouts();
  var workout=workouts.find(function(item){return Number(item.id)===Number(id);});
  var exercise=workout&&(workout.exercises||[])[index];
  if(!workout||!exercise)return;
  singleExerciseEditState={workoutId:workout.id,exerciseIndex:index};
  var overlay=ensureSingleExerciseEditModal();
  var context=document.getElementById('single-exercise-context-v9');
  if(context)context.textContent=(workout.type||'Pass')+' · '+fmtDate(workout.date);
  var editor=document.getElementById('single-exercise-editor-v9');
  var row=document.createElement('div');
  row.className='ex-row-item single-exercise-edit-row-v9 is-'+normalizeExercise(exercise).kind;
  row.innerHTML=buildExerciseEditorRowHtml('single',exercise,'void 0');
  var remove=row.querySelector('.ex-del');
  if(remove)remove.remove();
  var timingInfo=timingMatchForWorkoutExercise(workout,index);
  addExerciseTimingEditor(row,timingInfo.timing);
  editor.innerHTML='';
  editor.appendChild(row);
  overlay.classList.add('show');
}
function saveSingleExerciseEdit(){
  var state=singleExerciseEditState;
  if(!state)return;
  var workouts=getWorkouts();
  var workoutIndex=workouts.findIndex(function(item){return Number(item.id)===Number(state.workoutId);});
  if(workoutIndex<0)return;
  var workout=workouts[workoutIndex];
  var row=document.querySelector('#single-exercise-editor-v9 .single-exercise-edit-row-v9');
  var parsed=row&&parseExerciseRow(row,'single');
  if(!parsed){showToast('Övningen behöver ett namn.');return;}
  var exerciseIndex=Number(state.exerciseIndex);
  var timingInfo=timingMatchForWorkoutExercise(workout,exerciseIndex);
  var timings=Array.isArray(workout.exerciseTimings)?workout.exerciseTimings.slice():[];
  var durationInput=row.querySelector('.ex-duration-seconds-v7');
  var durationSec=exerciseDurationSeconds(durationInput&&durationInput.value);
  workout.exercises=Array.isArray(workout.exercises)?workout.exercises.slice():[];
  workout.exercises[exerciseIndex]=parsed;
  if(workout.runMetricsDerived){
    workout.runDistance=0;
    workout.runTime=null;
    workout.avgPaceKm=null;
    var updatedRunMetrics=workoutRunMetrics(workout);
    workout.runDistance=updatedRunMetrics.distance||0;
    workout.runTime=updatedRunMetrics.time||null;
    workout.avgPaceKm=updatedRunMetrics.pace||null;
  }
  if(timingInfo.index>=0){
    if(durationSec)timings[timingInfo.index]={name:parsed.name,durationSec:durationSec,exerciseIndex:exerciseIndex};
    else timings.splice(timingInfo.index,1);
  }else if(durationSec){
    timings.push({name:parsed.name,durationSec:durationSec,exerciseIndex:exerciseIndex});
  }
  workout.exerciseTimings=timings;
  workouts[workoutIndex]=workout;
  saveWorkouts(workouts);
  closeSingleExerciseEdit();
  refreshAll();
  showToast('Övningen är uppdaterad.');
}


function deleteWorkout(id){var wks=getWorkouts().filter(function(w){return w.id!==id;});saveWorkouts(wks);refreshAll();showToast('Pass borttaget');}

function editWorkout(id){
  var wks=getWorkouts();
  var wk=wks.find(function(x){return x.id===id;});
  if(!wk)return;
  editingWorkoutId=id;
  openWorkoutModal({editing:true,skipBlank:true});
  var modalTitle=document.querySelector('#wk-modal .modal > h2');
  if(modalTitle)modalTitle.textContent='Redigera pass';
  document.getElementById('wk-date').value=wk.date||todayISO();
  document.getElementById('wk-type').value=wk.type||'Övrigt';
  document.getElementById('wk-dur').value=wk.duration||'';
  document.getElementById('wk-run-km').value=wk.runDistance||'';
  document.getElementById('wk-run-min').value=wk.runTime||'';
  document.getElementById('wk-hr-avg').value=wk.hrAvg||'';
  document.getElementById('wk-vo2').value=wk.vo2||'';
  document.getElementById('wk-notes').value=wk.notes||'';
  var list=document.getElementById('ex-list');
  list.innerHTML='';
  var usedTimings={};
  (wk.exercises||[]).forEach(function(exercise,index){
    addExRow(exercise,workoutTimingForExercise(wk,exercise,index,usedTimings));
  });
  if(!(wk.exercises||[]).length)addExRow();
}

// ══ WORKOUT MODAL ════════════════════════════════════════════════
function openWorkoutModal(options){
  options=options||{};
  if(!options.editing)editingWorkoutId=null;
  editingWorkoutTargetIndex=null;
  var modalTitle=document.querySelector('#wk-modal .modal > h2');
  if(modalTitle)modalTitle.textContent=options.editing?'Redigera pass':'Logga träning';
  document.getElementById('wk-date').value=todayISO();
  document.getElementById('wk-type').value='Övrigt';
  document.getElementById('wk-dur').value='';
  document.getElementById('wk-run-km').value='';
  document.getElementById('wk-run-min').value='';
  document.getElementById('wk-hr-avg').value='';
  document.getElementById('wk-vo2').value='';
  document.getElementById('wk-notes').value='';
  document.getElementById('ex-list').innerHTML='';
  if(!options.skipBlank)addExRow();
  refreshTemplateSelectors();
  document.getElementById('wk-modal').classList.add('show');
}
function addExRow(ex,timing){
  var list=document.getElementById('ex-list');
  var row=document.createElement('div');
  row.className='ex-row-item is-'+normalizeExercise(ex).kind;
  row.innerHTML=buildExerciseEditorRowHtml('ex',ex,"this.closest('.ex-row-item').remove()");
  addExerciseTimingEditor(row,timing);
  list.appendChild(row);
  if(!ex){
    var nameInput=row.querySelector('.ex-name');
    if(nameInput)nameInput.focus();
  }
}
function saveWorkout(){
  var date=document.getElementById('wk-date').value;
  var typeRaw=document.getElementById('wk-type').value;
  var dur=parseInt(document.getElementById('wk-dur').value)||null;
  var hrAvg=parseInt(document.getElementById('wk-hr-avg').value)||null;
  var vo2=parseFloat(document.getElementById('wk-vo2').value)||null;
  var runKm=parseFloat(document.getElementById('wk-run-km').value)||0;
  var runMin=parseFloat(document.getElementById('wk-run-min').value)||null;
  var notes=document.getElementById('wk-notes').value.trim();
  var rows=document.querySelectorAll('#ex-list .ex-row-item');
  var exercises=[];
  var exerciseTimings=[];
  rows.forEach(function(row){
    var parsed=parseExerciseRow(row,'ex');
    if(!parsed)return;
    exercises.push(parsed);
    var timingInput=row.querySelector('.ex-duration-seconds-v7');
    var durationSec=exerciseDurationSeconds(timingInput&&timingInput.value);
    if(durationSec)exerciseTimings.push({name:parsed.name,durationSec:durationSec,exerciseIndex:exercises.length-1});
  });
  var type=canonicalWorkoutType(typeRaw,exercises);
  var exerciseRunMetrics=workoutRunMetrics({type:type,exercises:exercises});
  var finalRunKm=runKm>0?runKm:exerciseRunMetrics.distance;
  var finalRunMin=runMin>0?runMin:exerciseRunMetrics.time;
  var finalRunPace=finalRunKm>0&&finalRunMin>0?+(finalRunMin/finalRunKm).toFixed(4):null;
  var wk={id:editingWorkoutId||Date.now(),date:date,type:type,exercises:exercises,duration:dur,hrAvg:hrAvg,vo2:vo2,runDistance:finalRunKm||0,runTime:finalRunMin||null,avgPaceKm:finalRunPace,runMetricsDerived:!(runKm>0)&&exerciseRunMetrics.distance>0,notes:notes,exerciseTimings:exerciseTimings};
  var wks=getWorkouts();
  if(editingWorkoutId){
    wks=wks.map(function(x){return x.id===editingWorkoutId?wk:x;});
  } else {
    wks.push(wk);
  }
  saveWorkouts(wks);
  if(vo2)upsertVO2ForDate(date,vo2);
  editingWorkoutId=null;
  refreshTypeSuggestions();
  closeModal('wk-modal'); refreshAll(); showToast('Träning sparad.');
}

function refreshTemplateSelectors(){
  var templates=getTemplates();
  var ids=['wk-template-select','template-pick'];
  ids.forEach(function(id){
    var sel=document.getElementById(id);
    if(!sel)return;
    sel.innerHTML='';
    var ph=document.createElement('option');
    ph.value='';
    ph.textContent='Välj mall';
    sel.appendChild(ph);
    templates.forEach(function(t){
      var o=document.createElement('option');
      o.value=t.id;
      o.textContent=t.name;
      sel.appendChild(o);
    });
  });
}

function saveCurrentAsTemplate(){
  var name=prompt('Namn på mallpass:', document.getElementById('wk-type').value||'Mallpass');
  if(!name)return;
  var rows=document.querySelectorAll('#ex-list .ex-row-item');
  var exercises=[];
  rows.forEach(function(row){
    var parsed=parseExerciseRow(row,'ex');
    if(parsed)exercises.push(parsed);
  });
  if(!exercises.length){showToast('Lägg till minst en övning.');return;}
  var templates=getTemplates();
  templates.push({
    id:Date.now(),
    name:name,
    type:document.getElementById('wk-type').value||'Övrigt',
    duration:+(document.getElementById('wk-dur').value)||null,
    exercises:exercises
  });
  saveTemplates(templates);
  refreshTemplateSelectors();
  showToast('Mall sparad.');
}

function applyTemplateToWorkout(){
  var id=+(document.getElementById('wk-template-select').value||0);
  if(!id)return;
  var tpl=getTemplates().find(function(t){return t.id===id;});
  if(!tpl)return;
  document.getElementById('wk-type').value=tpl.type||'Övrigt';
  if(tpl.duration)document.getElementById('wk-dur').value=tpl.duration;
  var list=document.getElementById('ex-list');
  list.innerHTML='';
  (tpl.exercises||[]).forEach(function(e){
    addExRow(e);
  });
  showToast('Mall inläst.');
}

function openTemplateModal(){
  refreshWeekTemplateSelectors();
  templateTargetMondayISO=getViewedMondayISO();
  syncTemplateWeekUI();
  document.getElementById('template-modal').classList.add('show');
}

function refreshWeekTemplateSelectors(){
  var templates=getWeekTemplates();
  var sel=document.getElementById('template-pick');
  if(!sel)return;
  sel.innerHTML='';
  var ph=document.createElement('option');
  ph.value='';
  ph.textContent=templates.length?'Välj veckomall':'Inga veckomallar ännu';
  sel.appendChild(ph);
  templates.forEach(function(t){
    var o=document.createElement('option');
    o.value=t.id;
    o.textContent=t.name;
    sel.appendChild(o);
  });
}

function openWeekTemplateEditor(){
  closeModal('template-modal');
  refreshTypeSuggestions();
  var box=document.getElementById('week-template-save-box');
  box.classList.remove('saved');
  document.getElementById('week-template-name').value='';
  var plan=getPlan(), cont=document.getElementById('week-template-days');
  cont.innerHTML='';
  DAYS.forEach(function(d,i){
    var fg=document.createElement('div'); fg.className='form-group';
    fg.innerHTML='<label>'+d+'</label><input type="text" data-day="'+DAY_KEYS[i]+'" list="type-suggestions" value="'+escHtml(plan[DAY_KEYS[i]]||'Vila')+'" placeholder="Ex: Rygg + Triceps">';
    cont.appendChild(fg);
  });
  document.getElementById('week-template-modal').classList.add('show');
  templateEditorMondayISO=getViewedMondayISO();
  syncTemplateEditorWeekUI();
}

function saveWeekTemplateFromEditor(){
  var name=document.getElementById('week-template-name').value.trim();
  if(!name){showToast('Ange namn på veckomallen.');return;}
  var plan={};
  document.querySelectorAll('#week-template-days input[data-day]').forEach(function(inp){
    plan[inp.dataset.day]=(inp.value||'Vila').trim()||'Vila';
  });
  var templates=getWeekTemplates();
  templates.push({id:Date.now(),name:name,plan:plan});
  saveWeekTemplates(templates);
  var target=templateEditorMondayISO||getViewedMondayISO();
  applyPlanToWeek(target,plan);
  goToWeek(target);
  refreshTypeSuggestions();
  refreshWeekTemplateSelectors();
  var box=document.getElementById('week-template-save-box');
  box.classList.remove('saved');
  void box.offsetWidth;
  box.classList.add('saved');
  showToast('Veckomall sparad.');
  setTimeout(function(){
    closeModal('week-template-modal');
    openTemplateModal();
    document.getElementById('template-pick').value=String(templates[templates.length-1].id);
  },700);
}

function deleteTemplate(){
  var id=+(document.getElementById('template-pick').value||0);
  if(!id)return;
  if(!confirm('Ta bort vald mall?'))return;
  var templates=getWeekTemplates().filter(function(t){return t.id!==id;});
  saveWeekTemplates(templates);
  refreshWeekTemplateSelectors();
  showToast('Mall borttagen.');
}

function planWeekFromTemplate(){
  var pick=byId('template-pick','template-pick');
  var id=+(pick&&pick.value||0);
  if(!id){showToast('Skapa eller välj en veckomall först.');openWeekTemplateEditor();return;}
  var tpl=getWeekTemplates().find(function(t){return t.id===id;});
  if(!tpl)return;
  var plan=tpl.plan||{};
  var target=templateTargetMondayISO||getViewedMondayISO();
  applyPlanToWeek(target,plan);
  goToWeek(target);
  refreshTypeSuggestions();
  closeModal('template-modal');
  showToast('Veckopass sparade på '+formatWeekLabel(target).title);
}

// ══ PLAN MODAL ═══════════════════════════════════════════════════
function openPlanModal(){
  refreshTypeSuggestions();
  planTargetMondayISO=getViewedMondayISO();
  syncPlanWeekUI();
  document.getElementById('plan-modal').classList.add('show');
}
function savePlan(){
  var plan={};
  document.querySelectorAll('#plan-days input[data-day], #plan-days input[data-day]').forEach(function(s){plan[s.dataset.day]=(s.value||'Vila').trim()||'Vila';});
  var target=planTargetMondayISO||getViewedMondayISO();
  applyPlanToWeek(target,plan);
  goToWeek(target);
  closeModal('plan-modal');
  showToast('Plan sparad på '+formatWeekLabel(target).title);
  refreshTypeSuggestions();
}

// ══ MODAL HELPERS ════════════════════════════════════════════════
function closeModal(id){document.getElementById(id).classList.remove('show');}
document.querySelectorAll('.modal-overlay').forEach(function(o){o.addEventListener('click',function(e){if(e.target===o)o.classList.remove('show');});});

// ══ NAV ══════════════════════════════════════════════════════════
function toggleNavMenu(){document.getElementById('nav-menu').classList.toggle('show');}
window.addEventListener('click',function(e){var w=document.querySelector('.nav-dropdown-wrapper');if(w&&!w.contains(e.target)){var m=document.getElementById('nav-menu');if(m)m.classList.remove('show');}});

// ══ TOAST ════════════════════════════════════════════════════════
function showToast(msg){
  var t=document.getElementById('toast');
  if(!t){t=document.createElement('div');t.id='toast';Object.assign(t.style,{position:'fixed',bottom:'90px',left:'50%',transform:'translateX(-50%)',background:'#161B22',border:'1px solid rgba(34,211,238,.35)',color:'#22D3EE',padding:'10px 20px',borderRadius:'20px',fontSize:'13px',fontWeight:'600',zIndex:'9999',transition:'opacity .3s',boxShadow:'0 4px 20px rgba(0,0,0,.4)',fontFamily:'Inter,sans-serif'});document.body.appendChild(t);}
  t.textContent=msg; t.style.opacity='1'; clearTimeout(t._t); t._t=setTimeout(function(){t.style.opacity='0';},2600);
}

// ══ SCROLL FADE ══════════════════════════════════════════════════
function initFade(){
  var obs=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});},{threshold:.06});
  document.querySelectorAll('.fade-in').forEach(function(el){obs.observe(el);});
}

// ══ REFRESH ALL ══════════════════════════════════════════════════
function refreshAll(){refreshStats();renderWeekGrid();refreshGoals();renderCharts();renderPRs();renderLog();document.dispatchEvent(new Event('pulse:dashboard-refreshed'));}

document.addEventListener('DOMContentLoaded',function(){refreshAll();initFade();});
document.addEventListener('DOMContentLoaded',function(){refreshTypeSuggestions();refreshWeekTemplateSelectors();});
window.addEventListener('firebase-sync',function(event){
  var key = event.detail && event.detail.key;
  if (key && key.indexOf('ex_') === 0) {
    refreshTypeSuggestions();
    refreshWeekTemplateSelectors();
    refreshAll();
  }
});
// ══ RIPPLE ═════════════════════════════════════════════════════════
(function(){
  document.querySelectorAll('button,.stat-card,.pr-card,.week-day').forEach(function(el){
    if (el.closest('.observatory-stage')) return;
    el.classList.add('ripple-host');
    el.addEventListener('click',function(e){
      var r=el.getBoundingClientRect(), d=Math.max(el.clientWidth,el.clientHeight);
      var rw=document.createElement('span'); rw.className='ripple-wave';
      rw.style.cssText='width:'+d+'px;height:'+d+'px;left:'+(e.clientX-r.left-d/2)+'px;top:'+(e.clientY-r.top-d/2)+'px';
      el.appendChild(rw); rw.addEventListener('animationend',function(){rw.remove();});
    });
  });
})();
