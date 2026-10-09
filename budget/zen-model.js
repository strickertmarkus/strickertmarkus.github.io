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
    {id:'water',kind:'meditation',name:'Guidad andning',description:'10 minuter med andningsguide.',seconds:600,guidance:'breath'},
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
  const duration=r=>r.kind==='stretch'?r.steps.reduce((sum,s)=>sum+s.seconds,0):r.seconds;
  const clone=o=>JSON.parse(JSON.stringify(o));
  function routineValid(r){
    return !!r&&typeof r.id==='string'&&r.id.length<100&&typeof r.name==='string'&&r.name.trim().length>0&&r.name.length<=80&&
      ((r.kind==='stretch'&&Array.isArray(r.steps)&&r.steps.length>0&&r.steps.length<=20&&r.steps.every(s=>s&&typeof s.name==='string'&&s.name.length<=100&&typeof s.cue==='string'&&s.cue.length<=500&&Number.isInteger(s.seconds)&&s.seconds>=15&&s.seconds<=600))||
      (r.kind==='meditation'&&Number.isInteger(r.seconds)&&r.seconds>=60&&r.seconds<=3600&&['breath','silent'].includes(r.guidance)));
  }
  function start(r,now,id){if(!routineValid(r))throw Error('Ogiltig rutin');return {id,routine:clone(r),startedAt:now,anchor:now,elapsedMs:0,workMs:0,workAnchor:now,paused:false};}
  function elapsed(s,now){return Math.min(duration(s.routine)*1000,Math.max(0,s.elapsedMs+(s.paused?0:Math.max(0,now-s.anchor))));}
  function practiced(s,now){
    if(!Number.isFinite(s.workMs))return elapsed(s,now);
    return s.workMs+(s.paused?0:Math.min(Math.max(0,now-(s.workAnchor??s.anchor)),Math.max(0,duration(s.routine)*1000-s.elapsedMs)));
  }
  function pause(s,now){return {...s,workMs:practiced(s,now),workAnchor:now,elapsedMs:elapsed(s,now),anchor:now,paused:true};}
  function resume(s,now){return {...s,anchor:now,workAnchor:now,paused:false};}
  function seek(s,index,now){
    if(s.routine.kind!=='stretch')return s;
    const target=Math.max(0,Math.min(s.routine.steps.length-1,index));
    const offset=s.routine.steps.slice(0,target).reduce((n,step)=>n+step.seconds*1000,0);
    return {...s,workMs:practiced(s,now),workAnchor:now,elapsedMs:offset,anchor:now};
  }
  function position(s,now){
    const spent=elapsed(s,now)/1000,total=duration(s.routine);
    if(s.routine.kind==='meditation')return {index:0,spent,total,remaining:Math.max(0,total-spent),done:spent>=total};
    let cursor=0;
    for(let i=0;i<s.routine.steps.length;i++){const step=s.routine.steps[i];if(spent<cursor+step.seconds)return {index:i,spent,total,remaining:cursor+step.seconds-spent,done:false};cursor+=step.seconds;}
    return {index:s.routine.steps.length-1,spent,total,remaining:0,done:true};
  }
  function activeValid(s){return !!s&&typeof s.id==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(s.id)&&routineValid(s.routine)&&Number.isFinite(s.startedAt)&&Number.isFinite(s.anchor)&&Number.isFinite(s.elapsedMs)&&s.elapsedMs>=0&&typeof s.paused==='boolean';}
  function localDate(ms){const d=new Date(ms);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function week(records,kind,now){
    const monday=new Date(now);monday.setHours(0,0,0,0);monday.setDate(monday.getDate()-(monday.getDay()+6)%7);
    return Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(d.getDate()+i);const key=localDate(d);return {date:key,minutes:records.filter(r=>r.kind===kind&&localDate(r.completedAt)===key).reduce((sum,r)=>sum+r.seconds/60,0)};});
  }
  function stats(records,kind,now){
    const selected=records.filter(r=>r.kind===kind),days=new Set(selected.map(r=>localDate(r.completedAt))),cursor=new Date(now);cursor.setHours(12,0,0,0);
    if(!days.has(localDate(cursor)))cursor.setDate(cursor.getDate()-1);
    let streak=0;while(days.has(localDate(cursor))){streak++;cursor.setDate(cursor.getDate()-1);}
    return {count:selected.length,minutes:Math.round(selected.reduce((sum,r)=>sum+r.seconds/60,0)),streak,days:days.size,week:week(records,kind,now)};
  }
  function entryValid(e){
    if(!e||typeof e.id!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(e.id)||['__proto__','constructor','prototype'].includes(e.id)||!Number.isFinite(e.updatedAt)||e.updatedAt<0)return false;
    if(e.deleted===true)return true;
    if(e.type==='routine')return routineValid(e.routine)&&e.routine.id===e.id;
    return e.type==='session'&&['stretch','meditation'].includes(e.kind)&&typeof e.name==='string'&&e.name.length<=80&&Number.isFinite(e.completedAt)&&e.completedAt>0&&e.completedAt<=8640000000000000&&Number.isFinite(e.seconds)&&e.seconds>=1&&e.seconds<=12000&&typeof e.note==='string'&&e.note.length<=500&&['','lighter','calm','present'].includes(e.feeling);
  }
  function merge(a,b){const result={};for(const source of [a,b])for(const [id,e]of Object.entries(source||{})){if(e&&e.id===id&&entryValid(e)&&(!result[id]||e.updatedAt>result[id].updatedAt))result[id]=e;}return result;}
  return {poses,routines,duration,start,elapsed,practiced,pause,resume,seek,position,activeValid,routineValid,localDate,week,stats,entryValid,merge};
});
