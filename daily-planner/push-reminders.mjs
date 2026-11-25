import {createHash} from 'node:crypto';
import {dayTasks,validateState} from './model.mjs';
// Runs inside budget/push-worker.mjs using its existing Admin app and minute trigger.
export async function processDaylineReminders(db,fcm){
 let sent=0,failed=0;
 const now=new Date(),parts=Object.fromEntries(new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));
 const date=`${parts.year}-${parts.month}-${parts.day}`,minute=Number(parts.hour)*60+Number(parts.minute);
 const devices=(await db.ref('dayline_push').get()).val()||{};
 for(const [uid,registered] of Object.entries(devices)){
  const targets=Object.entries(registered).filter(([,d])=>d.enabled&&typeof d.token==='string');if(!targets.length)continue;
  const stored=(await db.ref(`daily_planner_v1/${uid}`).get()).val();
  if(stored==null)continue;
  let state;try{state=validateState(typeof stored==='string'?JSON.parse(stored):stored);}catch{console.warn('[dayline] Skipping invalid planner state');continue;}
  for(const task of dayTasks(state,date)){
   if(task.done||!(task.start||task.end))continue;
   const time=task.start||task.end,[h,m]=time.split(':').map(Number),due=h*60+m;
   if(minute<due||minute-due>5)continue;
   for(const [deviceId,device] of targets){
    const key=createHash('sha256').update(`${uid}|${task.key}|${time}|${deviceId}`).digest('hex');
    const ref=db.ref(`dayline_push_sent/${key}`),stamp=Date.now();
    const lease=await ref.transaction(value=>value?.sent||value?.pending>stamp-120000?undefined:{pending:stamp});if(!lease.committed)continue;
    try{await fcm.send({token:device.token,data:{title:task.title,body:`${task.start?'Startar':'Sluttid'} ${time}`,tag:`dayline-${key}`},webpush:{headers:{TTL:'300',Urgency:'high'}}});await ref.set({sent:stamp});sent++;}
    catch(error){await ref.remove();if(['messaging/registration-token-not-registered','messaging/invalid-registration-token'].includes(error.code))await db.ref(`dayline_push/${uid}/${deviceId}`).remove();else {failed++;console.error('[dayline] delivery failed',error.code);}}
   }
  }
 }
 console.log(`[dayline] ${sent} sent, ${failed} failed`);
 if(failed)throw Error(`Dayline: ${failed} deliveries failed`);
}
