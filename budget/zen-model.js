(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports)module.exports=factory();else root.ZenModel=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const poses=[
    {id:'arrive',name:'Stående avslappning',cue:'Stå bekvämt. Låt axlarna sjunka och känn fötterna mot marken.'},
    {id:'neck',name:'Axelrullningar',cue:'Rulla axlarna långsamt bakåt. Släpp ned dem mellan varje rörelse.'},
    {id:'side-left',name:'Sidosträck · vänster',cue:'Sträck höger arm uppåt och luta mjukt åt vänster. Andas normalt.'},
    {id:'side-right',name:'Sidosträck · höger',cue:'Sträck vänster arm uppåt och luta mjukt åt höger. Håll axlarna avslappnade.'},
    {id:'cat',name:'Katt & ko',cue:'På alla fyra: runda ryggen långsamt, mjukna sedan åt andra hållet. Följ din egen takt.'},
    {id:'child',name:'Barnets position',cue:'Låt höfterna sjunka bakåt mot hälarna. Vila överkroppen där det känns bekvämt.'},
    {id:'hip-left',name:'Höftöppnare · vänster',cue:'Vänster fot fram, höger knä i golvet på ett mjukt underlag. För vikten varsamt framåt.'},
    {id:'hip-right',name:'Höftöppnare · höger',cue:'Höger fot fram, vänster knä i golvet på ett mjukt underlag. Hitta ett behagligt läge.'},
    {id:'fold',name:'Sittande framåtfällning',cue:'Sitt med benen framför dig och lätt böjda knän. Fäll fram från höften så långt det känns mjukt.'},
    {id:'rest',name:'Liggande vila',cue:'Lägg dig bekvämt på rygg. Släpp vikten mot underlaget och låt andetagen komma av sig själva.'}
  ];
  const makeSteps=(ids,seconds)=>ids.map(id=>({...poses.find(p=>p.id===id),seconds}));
  const routines=[
    {id:'forest',kind:'stretch',name:'Helkropp',description:'8 övningar för axlar, rygg och ben.',steps:makeSteps(['arrive','neck','side-left','side-right','cat','child','fold','rest'],60)},
    {id:'shoulders',kind:'stretch',name:'Axlar & överkropp',description:'5 övningar med fokus på överkroppen.',steps:makeSteps(['arrive','neck','side-left','side-right','child'],60)},
    {id:'roots',kind:'stretch',name:'Höfter & rygg',description:'6 övningar, 2 minuter per övning.',steps:makeSteps(['cat','child','hip-left','hip-right','fold','rest'],120)},
    {id:'water',kind:'meditation',name:'Guidad andning',description:'10 minuter med andningsguide.',seconds:600,guidance:'breath'},
    {id:'light',kind:'meditation',name:'Kort meditation',description:'5 minuter med andningsguide.',seconds:300,guidance:'breath'},
    {id:'silence',kind:'meditation',name:'Utan guide',description:'15 minuter med timer och egen andning.',seconds:900,guidance:'silent'}
  ];
  const duration=r=>r.kind==='stretch'?r.steps.reduce((sum,s)=>sum+s.seconds,0):r.seconds;
  const clone=o=>JSON.parse(JSON.stringify(o));
  function routineValid(r){
    return !!r&&typeof r.id==='string'&&r.id.length<100&&typeof r.name==='string'&&r.name.trim().length>0&&r.name.length<=80&&
      ((r.kind==='stretch'&&Array.isArray(r.steps)&&r.steps.length>0&&r.steps.length<=20&&r.steps.every(s=>s&&typeof s.name==='string'&&s.name.length<=100&&typeof s.cue==='string'&&s.cue.length<=500&&Number.isInteger(s.seconds)&&s.seconds>=15&&s.seconds<=600))||
      (r.kind==='meditation'&&Number.isInteger(r.seconds)&&r.seconds>=60&&r.seconds<=3600&&['breath','silent'].includes(r.guidance)));
  }
  function start(r,now,id){if(!routineValid(r))throw Error('Ogiltig rutin');return {id,routine:clone(r),startedAt:now,anchor:now,elapsedMs:0,paused:false};}
  function elapsed(s,now){return Math.min(duration(s.routine)*1000,Math.max(0,s.elapsedMs+(s.paused?0:Math.max(0,now-s.anchor))));}
  function pause(s,now){return {...s,elapsedMs:elapsed(s,now),anchor:now,paused:true};}
  function resume(s,now){return {...s,anchor:now,paused:false};}
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
  return {poses,routines,duration,start,elapsed,pause,resume,position,activeValid,routineValid,localDate,week,stats,entryValid,merge};
});
