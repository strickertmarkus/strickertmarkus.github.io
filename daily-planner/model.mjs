export const TYPES = {
  work: { label: 'Arbete', color: '#f5bc7c', icon: 'briefcase' },
  personal: { label: 'Egentid', color: '#c1a6f5', icon: 'sparkles' },
  health: { label: 'Hälsa', color: '#8edbb1', icon: 'heart' },
  home: { label: 'Vardag', color: '#5e9bff', icon: 'home' },
  break: { label: 'Paus', color: '#a5b6cb', icon: 'coffee' }
};
export const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const parseDate = s => new Date(`${s}T12:00:00`);
export const shiftDate = (s, n) => { const d = parseDate(s); d.setDate(d.getDate()+n); return localDate(d); };
export const minutes = s => s ? Number(s.slice(0,2))*60+Number(s.slice(3)) : null;
export const timeString = n => `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
export const duration = n => n >= 60 ? `${Math.floor(n/60)} h${n%60 ? ` ${n%60} min` : ''}` : `${n} min`;
export const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
// Reminder choices in minutes before the task's time (start, or end when it only has an end); -1 = no notification.
export const REMINDERS = [-1,0,5,10,15,30,60,120,1440];
export const remindLabel = n => n<0 ? 'Ingen' : n===0 ? 'Vid tiden' : n===1440 ? '1 dag före' : `${duration(n)} före`;
// Project time: projects by id ({name, color, order, archived}) and minutes per day and project ({"YYYY-MM-DD": {id: min}}).
export const PROJECT_COLORS = ['#f5bc7c','#79c9f1','#8edbb1','#c1a6f5','#f29fb5','#cfe08a','#f59e7c','#a5b6cb'];
export const emptyState = () => ({version:1,tasks:[],exceptions:{},notes:{},timeProjects:{},timeLog:{},settings:{hideDone:false,defaultTimeMode:"none",defaultRemind:0}});
// "7:30", "7.30" and "730" are hours and minutes, "7,5" is decimal hours, "8" is hours. Returns minutes or null.
export function parseDuration(text) {
  const s=String(text??'').trim().replace(/\s*(h|tim|t)\s*$/i,'');
  if(!s) return 0;
  let m;
  if((m=s.match(/^(\d{1,2})[:.,](\d{2})$/))) return Number(m[2])<60 ? Number(m[1])*60+Number(m[2]) : null;
  if((m=s.match(/^(\d{1,2})[.,](\d)$/))) return Number(m[1])*60+Number(m[2])*6;
  if((m=s.match(/^(\d{1,2})(\d{2})$/))) return Number(m[2])<60 ? Number(m[1])*60+Number(m[2]) : null;
  if((m=s.match(/^\d{1,2}$/))) return Number(s)*60;
  return null;
}
export const hm = n => n ? `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}` : '';
export function isoWeek(date) { const d=parseDate(date); d.setDate(d.getDate()+3-(d.getDay()+6)%7); const jan4=new Date(d.getFullYear(),0,4); return 1+Math.round(((d-jan4)/864e5-3+(jan4.getDay()+6)%7)/7); }
function cleanTime(s) {
  const projects={};
  for(const [id,p] of Object.entries(s.timeProjects&&typeof s.timeProjects==='object'?s.timeProjects:{})) {
    if(id.length>=100||!p||typeof p.name!=='string'||!p.name.trim()||p.name.length>60)continue;
    projects[id]={name:p.name,color:PROJECT_COLORS.includes(p.color)?p.color:PROJECT_COLORS[0],order:Number.isFinite(p.order)?p.order:0,archived:!!p.archived};
  }
  const log={};
  for(const [date,day] of Object.entries(s.timeLog&&typeof s.timeLog==='object'?s.timeLog:{})) {
    if(!validDate(date)||!day||typeof day!=='object')continue;
    const kept=Object.fromEntries(Object.entries(day).filter(([id,min])=>projects[id]&&Number.isInteger(min)&&min>0&&min<=1440));
    if(Object.keys(kept).length)log[date]=kept;
  }
  return {timeProjects:projects,timeLog:log};
}
export function validDate(s) { return typeof s==='string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(parseDate(s)) && localDate(parseDate(s))===s; }
export function validTask(t) {
  const validTime = s => s==='' || (typeof s==='string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s));
  return !!(t && typeof t.id==='string' && t.id.length<100 && typeof t.title==='string' && t.title.trim().length>0 && t.title.length<=160 && validDate(t.date) && Object.hasOwn(TYPES,t.type) && validTime(t.start) && validTime(t.end) && (!t.start || !t.end || minutes(t.end)>minutes(t.start)) && ['none','daily','weekdays','weekly'].includes(t.repeat) && ['normal','high'].includes(t.priority) && (t.remind===undefined || REMINDERS.includes(t.remind)) && typeof t.note==='string' && t.note.length<=3000 && typeof t.done==='boolean');
}
export function validateState(s) {
  if(!s || s.version!==1 || !Array.isArray(s.tasks) || s.tasks.length>10000 || !s.tasks.every(validTask) || new Set(s.tasks.map(t=>t.id)).size!==s.tasks.length) throw Error('Filen innehåller inte en giltig Dayline-säkerhetskopia.');
  if(!s.exceptions || typeof s.exceptions!=='object' || Array.isArray(s.exceptions) || !s.notes || typeof s.notes!=='object' || Array.isArray(s.notes)) throw Error('Ogiltigt format.');
  for(const [key,value] of Object.entries(s.exceptions)) {
    const date=key.slice(-10), id=key.slice(0,-11), base=s.tasks.find(t=>t.id===id);
    if(!base || !validDate(date) || !value || typeof value!=='object' || !Object.keys(value).every(k=>['title','type','start','end','note','priority','remind','done','deleted'].includes(k)) || ('deleted' in value && typeof value.deleted!=='boolean') || !validTask({...base,...value})) throw Error('Ogiltig återkommande aktivitet.');
  }
  for(const [d,note] of Object.entries(s.notes)) if(!validDate(d) || typeof note!=='string' || note.length>5000) throw Error('Ogiltig dagsanteckning.');
  return {...s,...cleanTime(s),settings:{hideDone:!!s.settings?.hideDone,defaultTimeMode:['none','start','end','range'].includes(s.settings?.defaultTimeMode)?s.settings.defaultTimeMode:'none',defaultRemind:REMINDERS.includes(s.settings?.defaultRemind)?s.settings.defaultRemind:0}};
}
export function occurs(t,date) {
  if(date<t.date) return false;
  if(t.repeat==='none') return date===t.date;
  if(t.repeat==='daily') return true;
  const day=parseDate(date).getDay();
  return t.repeat==='weekdays' ? day!==0 && day!==6 : day===parseDate(t.date).getDay();
}
export function dayTasks(state,date) {
  return state.tasks.filter(t=>occurs(t,date)).map(t=>({...t,...state.exceptions[`${t.id}@${date}`],date,key:`${t.id}@${date}`,seriesDate:t.date})).filter(t=>!t.deleted).sort((a,b)=>(minutes(a.start||a.end)??1500)-(minutes(b.start||b.end)??1500) || Number(b.priority==='high')-Number(a.priority==='high') || a.title.localeCompare(b.title,'sv'));
}
export function focusTasks(tasks,minute) {
  const timed=tasks.filter(t=>t.start).sort((a,b)=>minutes(a.start)-minutes(b.start));
  const active=timed.filter(t=>!t.done && minutes(t.start)<=minute && (t.end ? minutes(t.end) : minutes(timed.find(n=>minutes(n.start)>minutes(t.start))?.start)??1440)>minute);
  const future=tasks.filter(t=>!t.done && (t.start||t.end) && minutes(t.start||t.end)>minute).sort((a,b)=>minutes(a.start||a.end)-minutes(b.start||b.end));
  return {active,next:future.filter(t=>(t.start||t.end)===(future[0]?.start||future[0]?.end))};
}
export function overlapKeys(tasks) {
  const keys=new Set(); const timed=tasks.filter(t=>t.start && t.end && !t.done);
  for(let i=0;i<timed.length;i++) for(let j=i+1;j<timed.length;j++) if(minutes(timed[i].start)<minutes(timed[j].end) && minutes(timed[j].start)<minutes(timed[i].end)) { keys.add(timed[i].key);keys.add(timed[j].key); }
  return keys;
}
export function plannedMinutes(tasks) {
  const ranges=tasks.filter(t=>t.start&&t.end).map(t=>[minutes(t.start),minutes(t.end)]).sort((a,b)=>a[0]-b[0]);
  let end=0,total=0; for(const [a,b] of ranges){total+=Math.max(0,b-Math.max(a,end));end=Math.max(end,b);} return total;
}
// Apply only locally changed records to the latest server state.
// Different activities/dates merge; the last write wins for the same record.
export function mergeStates(base, local, remote) {
  const result=structuredClone(remote);
  const mergeMap=(before,after,target)=>{
    const merged=new Map(Object.entries(target));
    for(const key of new Set([...Object.keys(before),...Object.keys(after)])) {
      if(JSON.stringify(before[key])===JSON.stringify(after[key]))continue;
      if(Object.hasOwn(after,key))merged.set(key,structuredClone(after[key]));else merged.delete(key);
    }
    return Object.fromEntries(merged);
  };
  const taskMap=tasks=>Object.fromEntries(tasks.map(t=>[t.id,t]));
  result.tasks=Object.values(mergeMap(taskMap(base.tasks),taskMap(local.tasks),taskMap(remote.tasks)));
  for(const key of ['exceptions','notes','settings','timeProjects','timeLog'])result[key]=mergeMap(base[key]||{},local[key]||{},remote[key]||{});
  const ids=new Set(result.tasks.map(t=>t.id));
  result.exceptions=Object.fromEntries(Object.entries(result.exceptions).filter(([key])=>ids.has(key.slice(0,-11))));
  return validateState(result);
}
