import {onSchedule} from 'firebase-functions/v2/scheduler';
import {initializeApp} from 'firebase-admin/app';
import {getDatabase} from 'firebase-admin/database';
import {getMessaging} from 'firebase-admin/messaging';
import {createHash} from 'node:crypto';
import {dayTasks,validateState} from './model.mjs';
initializeApp({databaseURL:'https://frick-budget-default-rtdb.europe-west1.firebasedatabase.app'});
export const daylineReminders=onSchedule({schedule:'every 1 minutes',region:'europe-west1',timeZone:'Europe/Stockholm',maxInstances:1},async()=>{
 const db=getDatabase(),now=new Date(),parts=Object.fromEntries(new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));
 const date=`${parts.year}-${parts.month}-${parts.day}`,minute=Number(parts.hour)*60+Number(parts.minute);
 const devices=(await db.ref('dayline_push').get()).val()||{};
 for(const [uid,registered] of Object.entries(devices)){
  const targets=Object.entries(registered).filter(([,d])=>d.enabled&&typeof d.token==='string');if(!targets.length)continue;
  let state;try{state=validateState(JSON.parse((await db.ref(`daily_planner_v1/${uid}`).get()).val()));}catch{continue;}
  for(const task of dayTasks(state,date)){
   if(task.done||!(task.start||task.end))continue;
   const time=task.start||task.end,[h,m]=time.split(':').map(Number),due=h*60+m;
   if(minute<due||minute-due>5)continue;
   for(const [deviceId,device] of targets){
    const key=createHash('sha256').update(`${uid}|${task.key}|${time}|${deviceId}`).digest('hex');
    const ref=db.ref(`dayline_push_sent/${key}`),stamp=Date.now();
    const lease=await ref.transaction(value=>value?.sent||value?.pending>stamp-120000?undefined:{pending:stamp});if(!lease.committed)continue;
    try{await getMessaging().send({token:device.token,data:{title:task.title,body:`${task.start?'Startar':'Sluttid'} ${time}`,tag:`dayline-${key}`},webpush:{headers:{TTL:'300',Urgency:'high'}}});await ref.set({sent:stamp});}
    catch(error){await ref.remove();if(['messaging/registration-token-not-registered','messaging/invalid-registration-token'].includes(error.code))await db.ref(`dayline_push/${uid}/${deviceId}`).remove();else console.error('Dayline delivery failed',error.code);}
   }
  }
 }
});
