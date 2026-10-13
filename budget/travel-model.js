/* Travel domain rules shared by every view, storage migration and tests. */
(function(g){
'use strict';
const DAY=86400000,types=['trip','activity','place','expense','booking','task','packing','packTemplate','categoryBudget','photo','document','note'];
const categories=['Transport','Boende','Mat','Aktiviteter','Shopping','Övrigt'];
const people=['Melker','Mila','Maja','Markus','Övrigt'];
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
const addDays=(s,n)=>s?new Date(Date.parse(s.slice(0,10)+'T12:00:00Z')+n*DAY).toISOString().slice(0,10):'';
const dayDiff=(a,b)=>Math.round((Date.parse(b.slice(0,10)+'T12:00:00Z')-Date.parse(a.slice(0,10)+'T12:00:00Z'))/DAY);
function today(zone='Europe/Stockholm',now=new Date()){try{return new Intl.DateTimeFormat('sv-SE',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}catch(_){return today('Europe/Stockholm',now);}}
function timeIn(zone='Europe/Stockholm',now=new Date()){return new Intl.DateTimeFormat('sv-SE',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);}
function zonedISO(local,zone){
 if(!local)return '';const target=Date.parse(local+'Z');if(!Number.isFinite(target))throw Error('Välj ett giltigt datum och klockslag.');
 const formatter=new Intl.DateTimeFormat('sv-SE',{timeZone:zone||'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 const wall=t=>{const p=Object.fromEntries(formatter.formatToParts(new Date(t)).map(x=>[x.type,x.value]));return Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);};
 let at=target;for(let i=0;i<4;i++)at+=target-wall(at);
 if(wall(at)!==target)throw Error('Klockslaget finns inte i vald tidszon (sommartidsbyte). Välj en annan tid.');return new Date(at).toISOString();
}
const minutes=s=>/^\d{2}:\d{2}$/.test(s||'')?Number(s.slice(0,2))*60+Number(s.slice(3)):null;
const clock=n=>String(Math.floor(n/60)%24).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
function normalize(raw){const x={...raw};
 if(x.type==='task'&&!x.taskKind){if(/^(packlista|packning)$/i.test(x.category||'')){x.type='packing';x.quantity=x.quantity||1;}else x.taskKind=/^att ?göra$/i.test(x.category||'')?'todo':'unsorted';}
 if(x.type==='packing'){x.quantity=x.quantity??1;x.owner=x.owner||'Övrigt';x.category=/^(packlista|packning)$/i.test(x.category||'')?'Övrigt':x.category||'Övrigt';}
 if(x.type==='activity'){x.timing=x.timing||(x.time?'timed':'flex');if(x.time&&x.endTime&&!x.endDate&&x.endTime<x.time)x.endDate=addDays(x.date,1);}
 if(x.type==='booking'&&x.status==='Betalt'){x.status='Bokat';x.paymentStatus=x.paymentStatus||'Betalt';}
 if(x.type==='expense'){x.entryKind=x.entryKind||'legacy';if(x.actual===undefined||x.actual==='')x.actual=null;}
 return x;
}
function interval(a){if(a.timing!=='timed'||!a.date||minutes(a.time)===null)return null;const start=Date.parse(a.date+'T00:00:00Z')+minutes(a.time)*60000;let end=start+30*60000;if(a.endTime)end=Date.parse((a.endDate||a.date)+'T00:00:00Z')+minutes(a.endTime)*60000;return {start,end};}
function activitySort(a,b){return (a.date||'9999').localeCompare(b.date||'9999')||(a.timing==='allDay'?-1:b.timing==='allDay'?1:0)||(a.time||'99:99').localeCompare(b.time||'99:99')||Number(a.order||0)-Number(b.order||0);}
function overlaps(a,rows){const x=interval(a);return x?rows.filter(b=>{const y=interval(b);return a.id!==b.id&&y&&x.start<y.end&&y.start<x.end;}):[];}
function moveActivity(a,date,time){const out={date,time,timing:time?'timed':'flex',order:null};const x=interval(a);if(time&&x&&a.endTime){const end=Date.parse(date+'T00:00:00Z')+minutes(time)*60000+(x.end-x.start);out.endDate=new Date(end).toISOString().slice(0,10);out.endTime=new Date(end).toISOString().slice(11,16);}else if(!time){out.endTime='';out.endDate='';}return out;}
function tripState(t,now=new Date()){if(t.archived)return 'Arkiverade';const d=today(t.timezone,now);if(d<(t.departure||'').slice(0,10))return 'Kommande';if(d<=(t.endDate||(t.departure||'').slice(0,10)))return 'Pågående';return 'Tidigare';}
function shifted(rows,delta){return rows.filter(x=>!x.deleted&&x.type==='activity').map(x=>({id:x.id,changes:{date:addDays(x.date,delta),endDate:addDays(x.endDate,delta)}}));}
function amount(x){return x.actual===null||x.actual===undefined||x.actual===''?0:Number(x.actual)*(Number(x.rate)||1);}
function budget(rows,plans=[]){const expense=rows.filter(x=>!x.deleted),groups={};let planned=0,actual=0;for(const x of expense){const key=x.category||'Övrigt';groups[key]??={planned:0,actual:0};groups[key].planned+=(Number(x.planned)||0)*(Number(x.rate)||1);groups[key].actual+=amount(x);actual+=amount(x);}
 for(const p of plans.filter(x=>!x.deleted)){const key=p.title;groups[key]??={planned:0,actual:0};groups[key].planned=Number(p.amount)||0;}
 for(const group of Object.values(groups))planned+=group.planned;return {planned,actual,groups};}
function settlement(rows){const balances={},paid={};for(const x of rows){const sum=amount(x),splits=Array.isArray(x.splits)?x.splits:[];if(!x.payer||!splits.length)continue;paid[x.payer]=(paid[x.payer]||0)+sum;balances[x.payer]=(balances[x.payer]||0)+sum;const total=splits.reduce((n,s)=>n+Number(s.weight||0),0);if(!total)continue;for(const s of splits)balances[s.name]=(balances[s.name]||0)-sum*Number(s.weight)/total;}
 return {paid,balances};}
function parseSplits(text){if(!String(text||'').trim())return [];const rows=String(text).split(/[,\n]/).filter(x=>x.trim()).map(x=>{const [name,weight='1']=x.split(':');return {name:name.trim(),weight:Number(weight.trim())};});if(rows.some(x=>!x.name||!Number.isFinite(x.weight)||x.weight<=0)||new Set(rows.map(x=>x.name)).size!==rows.length)throw Error('Ange unika namn med positiva andelar, t.ex. Markus:1, Maja:1.');return rows;}
function bookingSchedule(x,zone){const out={title:x.title,date:x.date||'',time:x.time||'',endDate:x.endDate||'',endTime:x.endTime||'',location:x.location||'',url:x.url||''};
 for(const [d,t,z] of [['date','time','timezone'],['endDate','endTime','arrivalTimezone']])if(x[d]&&x[t]){const instant=new Date(zonedISO(x[d]+'T'+x[t],x[z]||x.timezone||zone));out[d]=today(zone,instant);out[t]=timeIn(zone,instant);}return out;}
function cloneTrip(t,rows,options,id){const map={[t.id]:id()},selected=rows.filter(x=>!x.deleted&&x.tripId===t.id&&((options.schedule&&['activity','place','booking','note','document','photo'].includes(x.type))||(options.packing&&x.type==='packing')||(options.budget&&['categoryBudget','expense'].includes(x.type))));selected.forEach(x=>map[x.id]=id());const result=[{...t,id:map[t.id],title:options.title||t.title+' · kopia',archived:false,deleted:false,coverId:options.schedule?t.coverId||'':'',budget:options.budget?t.budget||0:0}];
 for(const raw of selected){const x={...raw,id:map[raw.id],tripId:map[t.id],deleted:false};for(const key of ['placeId','bookingId','receiptId','sourceId'])if(x[key])x[key]=map[x[key]]||'';if(x.type==='packing')x.done=false;if(x.type==='expense'){x.actual=null;x.payer='';x.splits=[];x.entryKind='plan';if(!(Number(x.planned)>0))continue;}if(x.type==='booking'){x.status='Att boka';x.paymentStatus='Obetalt';x.reference='';}result.push(x);}return result;
}
function validate(x){if(!types.includes(x.type))throw Error('Okänd posttyp.');if(!String(x.title||'').trim())throw Error('Ange ett namn.');for(const k of ['date','endDate'])if(x[k]&&!validDate(x[k]))throw Error('Välj ett giltigt datum.');
 if(x.type==='trip'){if(!x.departure)throw Error('Välj avresa.');if(x.endDate&&x.endDate<x.departure.slice(0,10))throw Error('Hemresan kan inte vara före avresan.');zonedISO(x.departure,x.timezone);}
 if(x.type==='activity'){if(!validDate(x.date))throw Error('Välj dag för aktiviteten.');if(x.timing==='timed'){const i=interval(x);if(!i)throw Error('Välj starttid.');if(i.end<=i.start)throw Error('Sluttiden måste vara efter starten. Välj slutdatum för aktiviteter över midnatt.');}}
 if(x.type==='expense'){if(!Number.isFinite(Number(x.rate))||Number(x.rate)<=0)throw Error('Ange en växelkurs större än noll.');for(const k of ['planned','actual'])if(x[k]!=null&&!Number.isFinite(Number(x[k])))throw Error('Ange ett giltigt belopp.');if(Number(x.planned)<0)throw Error('Planerat belopp kan inte vara negativt.');}
 if(x.type==='packing'&&(!Number.isFinite(Number(x.quantity))||Number(x.quantity)<=0))throw Error('Antal måste vara större än noll.');
 if(x.type==='place'){const lat=x.lat,lng=x.lng;if((lat!==''&&lat!=null)||(lng!==''&&lng!=null)){if(lat===''||lng===''||lat==null||lng==null||!Number.isFinite(Number(lat))||!Number.isFinite(Number(lng))||Math.abs(Number(lat))>90||Math.abs(Number(lng))>180)throw Error('Ange både latitud (−90 till 90) och longitud (−180 till 180).');}}
 return x;
}
const api={types,categories,people,normalize,validDate,addDays,dayDiff,today,timeIn,zonedISO,minutes,clock,interval,activitySort,overlaps,moveActivity,tripState,shifted,amount,budget,settlement,parseSplits,bookingSchedule,cloneTrip,validate};if(typeof module!=='undefined')module.exports=api;g.TravelModel=api;
})(typeof window==='undefined'?globalThis:window);
