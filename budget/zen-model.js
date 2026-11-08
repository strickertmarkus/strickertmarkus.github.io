(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./zen-stretch-library.js'));else root.ZenModel=factory(root.ZenStretch);
})(typeof globalThis!=='undefined'?globalThis:this,function(library){
  'use strict';
  const poses=library.poses;
  const makeSteps=(ids,seconds)=>ids.map(id=>({...poses.find(p=>p.id===id),seconds}));
  const stretchTemplate=(id,name,category,description,ids)=>({id,kind:'stretch',name,category,description,steps:makeSteps(ids,60)});
  const routines=[
    {id:'forest',kind:'stretch',name:'Helkropp',description:'8 övningar för axlar, rygg och ben.',steps:makeSteps(['arrive','neck','side-left','side-right','cat','child','fold','rest'],60)},
    {id:'shoulders',kind:'stretch',name:'Axlar & överkropp',description:'5 övningar med fokus på överkroppen.',steps:makeSteps(['arrive','neck','side-left','side-right','child'],60)},
    {id:'roots',kind:'stretch',name:'Höfter & rygg',description:'6 övningar, 2 minuter per övning.',steps:makeSteps(['cat','child','hip-left','hip-right','fold','rest'],120)},
    {id:'water',kind:'meditation',name:'Andningsguide',description:'10 minuter med visuell andningsguide.',seconds:600,guidance:'breath'},
    {id:'light',kind:'meditation',name:'Kort meditation',description:'5 minuter med andningsguide.',seconds:300,guidance:'breath'},
    {id:'silence',kind:'meditation',name:'Utan guide',description:'15 minuter med timer och egen andning.',seconds:900,guidance:'silent'},
    stretchTemplate("chest-short","Bröst & triceps · Kort","chest","6 minuter med bröstöppning, axlar och triceps.",["neck", "chest-open", "triceps-left", "triceps-right", "goalpost", "rest"]),
    stretchTemplate("chest-standard","Bröst & triceps · Fokus","chest","8 minuter med extra utrymme för axlarna.",["neck", "chest-open", "triceps-left", "triceps-right", "goalpost", "cross-arm-left", "cross-arm-right", "rest"]),
    stretchTemplate("chest-long","Bröst & triceps · Lugn avslutning","chest","12 minuter med bröst, triceps och sidorna av ryggen.",["arrive", "neck", "chest-open", "triceps-left", "triceps-right", "goalpost", "cross-arm-left", "cross-arm-right", "puppy", "lat-reach-left", "lat-reach-right", "rest"]),
    stretchTemplate("back-short","Biceps & rygg · Kort","back","6 minuter för framsida arm, rygg och sidor.",["biceps", "cat", "child", "lat-reach-left", "lat-reach-right", "rest"]),
    stretchTemplate("back-standard","Biceps & rygg · Fokus","back","8 minuter med rotation för bröstryggen.",["biceps", "cat", "child", "lat-reach-left", "lat-reach-right", "thread-left", "thread-right", "rest"]),
    stretchTemplate("back-long","Biceps & rygg · Lugn avslutning","back","12 minuter med biceps, skuldror och ryggrotation.",["arrive", "biceps", "cat", "child", "lat-reach-left", "lat-reach-right", "thread-left", "thread-right", "self-hug", "open-book-left", "open-book-right", "rest"]),
    stretchTemplate("legs-short","Axlar, mage & ben · Kort","legs","8 minuter med axlar, framsida bål, höfter och lår.",["neck", "cross-arm-left", "cross-arm-right", "sphinx", "hip-left", "hip-right", "fold", "rest"]),
    stretchTemplate("legs-standard","Axlar, mage & ben · Helhet","legs","12 minuter som även ger framsida lår och vader plats.",["neck", "cross-arm-left", "cross-arm-right", "sphinx", "hip-left", "hip-right", "fold", "standing-quad-left", "standing-quad-right", "calf-left", "calf-right", "rest"]),
    stretchTemplate("legs-long","Axlar, mage & ben · Lugn avslutning","legs","16 minuter med hela underkroppen, bål och axlar.",["neck", "cross-arm-left", "cross-arm-right", "sphinx", "hip-left", "hip-right", "fold", "standing-quad-left", "standing-quad-right", "calf-left", "calf-right", "lat-reach-left", "lat-reach-right", "butterfly", "knee-sways", "rest"]),
    stretchTemplate("cardio-run","Efter löpning","cardio","8 minuter med vader, framsida och baksida lår samt höfter.",["standing-quad-left", "standing-quad-right", "calf-left", "calf-right", "hip-left", "hip-right", "fold", "rest"]),
    stretchTemplate("cardio-cross","Efter crosstrainer","cardio","8 minuter med höfter, säte, bröst och rygg.",["hip-left", "hip-right", "figure-four-left", "figure-four-right", "chest-open", "cat", "side-left", "side-right"]),
    stretchTemplate("cardio-long","Kondition · Lugn avslutning","cardio","12 minuter med extra fokus på vader och säte.",["standing-quad-left", "standing-quad-right", "calf-left", "calf-right", "hip-left", "hip-right", "fold", "soleus-left", "soleus-right", "figure-four-left", "figure-four-right", "rest"]),
  ];
  // S05: a stretch session may carry switchSeconds, time to change position between movements.
  // It lengthens the session but is never credited to a movement or to the minute statistics.
  const switchOf=r=>r.kind==='stretch'&&Number.isInteger(r.switchSeconds)?r.switchSeconds:0;
  const duration=r=>r.kind==='stretch'?r.steps.reduce((sum,s)=>sum+s.seconds,0)+switchOf(r)*Math.max(0,r.steps.length-1):r.seconds;
  // Start of each movement on the session timeline, in seconds.
  const stepStarts=r=>{let t=0;return r.steps.map(step=>{const at=t;t+=step.seconds+switchOf(r);return at;});};
  const clone=o=>JSON.parse(JSON.stringify(o));
  const defaultBreathing={inhale:4,holdIn:0,exhale:6,holdOut:0};
  const breathingSettings=r=>({...defaultBreathing,...r.breathing});
  function breathingValid(r){
    if(r.breathing!==undefined&&(!r.breathing||typeof r.breathing!=='object'||Array.isArray(r.breathing)))return false;
    const b=breathingSettings(r);
    return Object.keys(defaultBreathing).every(k=>Number.isInteger(b[k])&&b[k]>=(k==='inhale'||k==='exhale'?1:0)&&b[k]<=30);
  }
  function breathState(r,elapsed){
    const b=breathingSettings(r),phases=[['inhale','Andas in',b.inhale],['holdIn','Håll',b.holdIn],['exhale','Andas ut',b.exhale],['holdOut','Håll',b.holdOut]].filter(p=>p[2]>0);
    const total=phases.reduce((n,p)=>n+p[2],0),cycle=Math.max(0,elapsed)%total;
    let offset=0;
    for(const [id,label,seconds] of phases){
      if(cycle<offset+seconds){const progress=(cycle-offset)/seconds,smooth=(1-Math.cos(Math.PI*progress))/2;
        const expansion=id==='inhale'?smooth:id==='exhale'?1-smooth:id==='holdIn'?1:0;
        return {id,label,seconds,progress,cycle,total,scale:.84+.23*expansion};
      }offset+=seconds;
    }
  }
  function breathingSummary(r){
    if(r.guidance==='silent')return 'Egen andning · utan guide';
    const b=breathingSettings(r);
    // M02: the phases in the order they happen, each named.
    return ['In '+b.inhale+' s',b.holdIn?'håll '+b.holdIn+' s':null,'ut '+b.exhale+' s',b.holdOut?'håll '+b.holdOut+' s':null].filter(Boolean).join(' → ');
  }
  function routineValid(r){
    return !!r&&typeof r.id==='string'&&r.id.length<100&&typeof r.name==='string'&&r.name.trim().length>0&&r.name.length<=80&&
      ((r.kind==='stretch'&&(r.switchSeconds===undefined||[0,3,5,10].includes(r.switchSeconds))&&Array.isArray(r.steps)&&r.steps.length>0&&r.steps.length<=20&&r.steps.every(s=>s&&typeof s.name==='string'&&s.name.length<=100&&typeof s.cue==='string'&&s.cue.length<=500&&Number.isInteger(s.seconds)&&s.seconds>=15&&s.seconds<=600))||
      (r.kind==='meditation'&&Number.isInteger(r.seconds)&&r.seconds>=60&&r.seconds<=3600&&['breath','silent'].includes(r.guidance)&&breathingValid(r)));
  }
  function start(r,now,id){if(!routineValid(r))throw Error('Ogiltig rutin');return {id,routine:clone(r),startedAt:now,anchor:now,elapsedMs:0,workMs:0,workAnchor:now,paused:false,stepMs:r.kind==='stretch'?r.steps.map(()=>0):undefined,creditFrom:0};}
  // Actual stretch time per step: the timeline only moves forward between checkpoints (pause, seek, complete),
  // so the stretch since the last checkpoint is spread over the steps it passed. Countdown and pauses add nothing.
  function credit(s,now){
    if(s.routine.kind!=='stretch')return s;
    const to=elapsed(s,now),from=Math.min(to,Number.isFinite(s.creditFrom)?s.creditFrom:0),steps=s.routine.steps;
    const stepMs=steps.map((_,i)=>Number(s.stepMs&&s.stepMs[i])||0),starts=stepStarts(s.routine);
    for(let i=0;i<steps.length;i++){const begin=starts[i]*1000,end=begin+steps[i].seconds*1000,overlap=Math.min(end,to)-Math.max(begin,from);if(overlap>0)stepMs[i]+=overlap;}
    return {...s,stepMs,creditFrom:to};
  }
  function actualSteps(s,now){
    if(s.routine.kind!=='stretch')return undefined;
    const ms=credit(s,now).stepMs;
    return s.routine.steps.map((step,i)=>({id:step.id||'',name:step.name,seconds:Math.round(ms[i]/1000),planned:step.seconds})).filter(step=>step.seconds>0);
  }
  function elapsed(s,now){return Math.min(duration(s.routine)*1000,Math.max(0,s.elapsedMs+(s.paused?0:Math.max(0,now-s.anchor))));}
  function practiced(s,now){
    if(!Number.isFinite(s.workMs))return elapsed(s,now);
    return s.workMs+(s.paused?0:Math.min(Math.max(0,now-(s.workAnchor??s.anchor)),Math.max(0,duration(s.routine)*1000-s.elapsedMs)));
  }
  function pause(s,now){s=credit(s,now);return {...s,workMs:practiced(s,now),workAnchor:now,elapsedMs:elapsed(s,now),anchor:now,paused:true};}
  function resume(s,now){return {...s,anchor:now,workAnchor:now,paused:false};}
  function seek(s,index,now){
    if(s.routine.kind!=='stretch')return s;
    const target=Math.max(0,Math.min(s.routine.steps.length-1,index));
    const offset=stepStarts(s.routine)[target]*1000;
    s=credit(s,now);
    return {...s,workMs:practiced(s,now),workAnchor:now,elapsedMs:offset,anchor:now,creditFrom:offset};
  }
  function position(s,now){
    const spent=elapsed(s,now)/1000,total=duration(s.routine);
    if(s.routine.kind==='meditation')return {index:0,spent,total,remaining:Math.max(0,total-spent),done:spent>=total};
    const steps=s.routine.steps,starts=stepStarts(s.routine),sw=switchOf(s.routine);
    for(let i=0;i<steps.length;i++){
      const end=starts[i]+steps[i].seconds;
      if(spent<starts[i])return {index:i,spent,total,remaining:starts[i]-spent,done:false,switching:true};
      if(spent<end)return {index:i,spent,total,remaining:end-spent,done:false,switching:false};
    }
    return {index:steps.length-1,spent,total,remaining:0,done:true,switching:false};
  }
  function activeValid(s){return !!s&&typeof s.id==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(s.id)&&routineValid(s.routine)&&Number.isFinite(s.startedAt)&&Number.isFinite(s.anchor)&&Number.isFinite(s.elapsedMs)&&s.elapsedMs>=0&&typeof s.paused==='boolean';}
  function localDate(ms){const d=new Date(ms);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function week(records,kind,now){
    const monday=new Date(now);monday.setHours(0,0,0,0);monday.setDate(monday.getDate()-(monday.getDay()+6)%7);
    return Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(d.getDate()+i);const key=localDate(d);return {date:key,minutes:records.filter(r=>r.kind===kind&&localDate(r.completedAt)===key).reduce((sum,r)=>sum+r.seconds/60,0)};});
  }
  // Minutes per bar for a period: this week by day, this month by day, or this year by month.
  function period(records,kind,now,range){
    const selected=records.filter(r=>r.kind===kind),sum=test=>selected.filter(test).reduce((n,r)=>n+r.seconds/60,0);
    if(range==='year'){const year=new Date(now).getFullYear();return Array.from({length:12},(_,m)=>({key:year+'-'+String(m+1).padStart(2,'0'),month:m,minutes:sum(r=>{const d=new Date(r.completedAt);return d.getFullYear()===year&&d.getMonth()===m;})}));}
    if(range==='month'){const first=new Date(now);first.setHours(12,0,0,0);first.setDate(1);const days=new Date(first.getFullYear(),first.getMonth()+1,0).getDate();
      return Array.from({length:days},(_,i)=>{const d=new Date(first);d.setDate(i+1);const key=localDate(d);return {date:key,day:i+1,minutes:sum(r=>localDate(r.completedAt)===key)};});}
    return week(records,kind,now);
  }
  // Seconds of stretching per muscle group in a period, from the movements saved with each pass.
  function groups(records,now,range){
    const start=new Date(now);start.setHours(0,0,0,0);
    if(range==='year'){start.setMonth(0,1);}else if(range==='month'){start.setDate(1);}else start.setDate(start.getDate()-(start.getDay()+6)%7);
    const byId=new Map(poses.map(p=>[p.id,p.group])),totals={};
    for(const r of records)if(r.kind==='stretch'&&r.completedAt>=start.getTime()&&Array.isArray(r.steps)&&!r.stepsUnverified)for(const step of r.steps){const g=byId.get(step.id);if(g&&g!=='Helkropp')totals[g]=(totals[g]||0)+(Number(step.seconds)||0);}
    return Object.entries(totals).map(([group,seconds])=>({group,seconds})).sort((a,b)=>b.seconds-a.seconds);
  }
  function stats(records,kind,now){
    const selected=records.filter(r=>r.kind===kind),days=new Set(selected.map(r=>localDate(r.completedAt))),cursor=new Date(now);cursor.setHours(12,0,0,0);
    if(!days.has(localDate(cursor)))cursor.setDate(cursor.getDate()-1);
    let streak=0;while(days.has(localDate(cursor))){streak++;cursor.setDate(cursor.getDate()-1);}
    return {count:selected.length,minutes:Math.round(selected.reduce((sum,r)=>sum+r.seconds/60,0)),streak,days:days.size,week:week(records,kind,now)};
  }
  const milestoneMetrics={count:'sparade pass',minutes:'minuter totalt',days:'olika dagar',streak:'dagar i rad'};
  function milestoneValid(m){return !!m&&['stretch','meditation'].includes(m.kind)&&Number.isInteger(m.slot)&&m.slot>=0&&m.slot<4&&typeof m.name==='string'&&m.name.trim().length>0&&m.name.length<=80&&Object.hasOwn(milestoneMetrics,m.metric)&&Number.isInteger(m.goal)&&m.goal>=1&&m.goal<=100000;}
  function milestones(kind,entries=[]){
    return [['Första passet','count',1],['5 pass','count',5],['60 minuter','minutes',60],['10 dagar','days',10]].map(([name,metric,goal],slot)=>{
      const id='milestone_'+kind+'_'+slot,entry=entries.find(e=>e.id===id&&!e.deleted&&e.type==='milestone'&&milestoneValid(e.milestone));
      return {id,...(entry?entry.milestone:{kind,slot,name,metric,goal}),custom:!!entry};
    });
  }
  function entryValid(e){
    if(!e||typeof e.id!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(e.id)||['__proto__','constructor','prototype'].includes(e.id)||!Number.isFinite(e.updatedAt)||e.updatedAt<0)return false;
    if(e.deleted===true)return true;
    if(e.type==='milestone')return milestoneValid(e.milestone)&&e.id==='milestone_'+e.milestone.kind+'_'+e.milestone.slot;
    if(e.type==='routine')return routineValid(e.routine)&&e.routine.id===e.id;
    if(e.type!=='session'||!['stretch','meditation'].includes(e.kind)||typeof e.name!=='string'||e.name.length>80||!Number.isFinite(e.completedAt)||e.completedAt<=0||e.completedAt>8640000000000000||!Number.isFinite(e.seconds)||e.seconds<1||e.seconds>12000||typeof e.note!=='string'||e.note.length>500||!feelings.includes(e.feeling))return false;
    if(e.manual!==undefined&&typeof e.manual!=='boolean')return false;
    // M05: a meditation keeps the guidance and rhythm it actually used.
    if(e.guidance!==undefined&&(e.kind!=='meditation'||!['breath','silent'].includes(e.guidance)||!breathingValid({breathing:e.breathing})||(e.guidanceChanged!==undefined&&typeof e.guidanceChanged!=='boolean')))return false;
    if(e.plannedSeconds!==undefined&&(!Number.isInteger(e.plannedSeconds)||e.plannedSeconds<1||e.plannedSeconds>12000))return false;
    // The planned movements, so "Gör samma pass igen" does not depend on the template still existing.
    if(e.plan!==undefined&&(e.kind!=='stretch'||!Array.isArray(e.plan)||!e.plan.length||e.plan.length>20||!e.plan.every(x=>x&&typeof x.id==='string'&&x.id.length<=100&&Number.isInteger(x.seconds)&&x.seconds>=15&&x.seconds<=600)))return false;
    // Historical sessions have no steps. New stretch sessions retain a snapshot
    // so later changes to a routine do not rewrite the exercise history.
    return e.steps===undefined||(e.kind==='stretch'&&Array.isArray(e.steps)&&e.steps.length<=20&&e.steps.every(s=>s&&typeof s.name==='string'&&s.name.length>0&&s.name.length<=100&&typeof s.id==='string'&&s.id.length<=100&&Number.isInteger(s.seconds)&&s.seconds>=1&&s.seconds<=600));
  }
  const feelings=['','lighter','calm','present','same','unfocused'];
  const feelingLabels={lighter:'Lite lättare',calm:'Lugnare',present:'Mer närvarande',same:'Som innan',unfocused:'Svårt att fokusera'};
  // A routine to run again from a saved session: its own snapshot, never the current template.
  function redoRoutine(e){
    if(!e||e.type!=='session')return null;
    const id='again_'+e.id.slice(0,90);
    if(e.kind==='meditation'){
      const seconds=Math.min(3600,Math.max(60,Math.round((e.plannedSeconds||e.seconds)/60)*60));
      const r={id,kind:'meditation',name:e.name,seconds,guidance:e.guidance||'breath',...(e.breathing?{breathing:{...e.breathing}}:{})};
      return routineValid(r)?r:null;
    }
    const source=e.plan||(Array.isArray(e.steps)?e.steps.map(x=>({id:x.id,seconds:x.planned||x.seconds})):[]);
    const steps=source.map(x=>{const pose=poses.find(p=>p.id===x.id);return pose?{...pose,seconds:Math.min(600,Math.max(15,Math.round(x.seconds/15)*15||60))}:null;}).filter(Boolean);
    const r={id,kind:'stretch',name:e.name,steps};
    return steps.length&&routineValid(r)?r:null;
  }
  function merge(a,b){const result={};for(const source of [a,b])for(const [id,e]of Object.entries(source||{})){if(e&&e.id===id&&entryValid(e)&&(!result[id]||e.updatedAt>result[id].updatedAt))result[id]=e;}return result;}
  return {feelings,feelingLabels,redoRoutine,stepStarts,credit,actualSteps,period,groups,milestoneMetrics,milestoneValid,milestones,poses,routines,breathingSettings,breathingValid,breathState,breathingSummary,duration,start,elapsed,practiced,pause,resume,seek,position,activeValid,routineValid,localDate,week,stats,entryValid,merge};
});
