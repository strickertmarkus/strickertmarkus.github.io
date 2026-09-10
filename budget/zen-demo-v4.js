/* Read-only Zen demo data. Never writes sample records to localStorage or Firebase. */
(function(){
  'use strict';
  const S=window.ZenStore;
  if(!S)return;
  const descriptor=Object.getOwnPropertyDescriptor(S,'entries');
  if(!descriptor||typeof descriptor.get!=='function')return;
  const readReal=()=>descriptor.get.call(S);
  const stamp=(daysAgo,hour,minute)=>{
    const d=new Date();
    d.setHours(hour,minute,0,0);
    d.setDate(d.getDate()-daysAgo);
    return d.getTime();
  };
  const record=(id,name,kind,seconds,daysAgo,hour,minute,feeling,note='')=>({
    id:'zen_demo_v4_'+id,
    type:'session',
    name,
    kind,
    seconds,
    completedAt:stamp(daysAgo,hour,minute),
    updatedAt:stamp(daysAgo,hour,minute)+seconds*1000,
    feeling,
    note,
    demo:true
  });
  const demos={
    stretch:[
      record('stretch_1','Helkropp','stretch',480,0,7,20,'lighter'),
      record('stretch_2','Axlar & överkropp','stretch',360,1,20,10,'calm'),
      record('stretch_3','Höfter & rygg','stretch',720,2,6,55,'lighter'),
      record('stretch_4','Helkropp','stretch',540,3,21,5,'present'),
      record('stretch_5','Axlar & överkropp','stretch',420,4,19,30,'calm'),
      record('stretch_6','Helkropp','stretch',600,5,7,5,'lighter'),
      record('stretch_7','Höfter & rygg','stretch',660,6,20,25,'present')
    ],
    meditation:[
      record('meditation_1','Guidad andning','meditation',600,0,6,40,'calm'),
      record('meditation_2','Kort meditation','meditation',300,1,21,25,'present'),
      record('meditation_3','Utan guide','meditation',900,2,6,35,'calm'),
      record('meditation_4','Guidad andning','meditation',600,3,20,45,'lighter'),
      record('meditation_5','Kort meditation','meditation',300,4,7,0,'present'),
      record('meditation_6','Utan guide','meditation',720,6,21,10,'calm')
    ]
  };
  const hasRealSessions=(kind)=>readReal().some(e=>e&&e.type==='session'&&e.kind===kind&&!e.demo);
  Object.defineProperty(S,'entries',{
    configurable:true,
    enumerable:true,
    get(){
      const real=readReal();
      const out=real.slice();
      if(!hasRealSessions('stretch'))out.push(...demos.stretch);
      if(!hasRealSessions('meditation'))out.push(...demos.meditation);
      return out;
    }
  });
  const originalRemove=typeof S.remove==='function'?S.remove.bind(S):null;
  if(originalRemove)S.remove=(id)=>String(id).startsWith('zen_demo_v4_')?false:originalRemove(id);
  window.ZenDemoV4={
    demos,
    isDemoId:id=>String(id).startsWith('zen_demo_v4_'),
    isActive:kind=>!hasRealSessions(kind),
    realEntries:readReal
  };
})();
