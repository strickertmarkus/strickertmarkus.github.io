/* Shared travel records. Each edit has its own durable outbox operation.
   Child updates never replace another trip or another record. */
(function(global){
'use strict';
const ROOT='family_travel_v1',DB='family-travel-v1';
const uid=()=>global.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
function safeURL(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch(_){return '';}}
function countdown(start,end,now=Date.now()){
 const at=new Date(start).getTime(),until=end?new Date(end+'T23:59:59').getTime():at+86400000;
 if(!Number.isFinite(at))return {label:'Välj avresedatum',parts:[]};
 if(now>=at)return {label:now<=until?'Resan pågår':'Resan är avslutad',parts:[]};
 let n=Math.floor((at-now)/1000);const days=Math.floor(n/86400);n%=86400;const hours=Math.floor(n/3600);n%=3600;
 return {label:'Till avresa',parts:[days,hours,Math.floor(n/60),n%60]};
}
function totals(rows){return rows.reduce((v,r)=>{const rate=Number(r.rate)||1;v.planned+=(Number(r.planned)||0)*rate;v.actual+=(Number(r.actual)||0)*rate;return v;},{planned:0,actual:0});}
function validateBackup(value){
 if(value?.format!=='family-travel-v1'||!Array.isArray(value.items)||value.items.length>20000)throw Error('Det här är inte en resebackup.');
 const types=['trip','activity','place','expense','booking','task','photo','document','note'];
 for(const item of value.items)if(!item||!types.includes(item.type)||typeof item.title!=='string'||!item.id||/[.#$\[\]\/]/.test(item.id))throw Error('Backupen innehåller en ogiltig post.');
 return value;
}
const API={uid,safeURL,countdown,totals,validateBackup};
if(typeof module!=='undefined')module.exports=API;
if(!global.document)return;
let dbPromise,records={},subscribers=[],ref=null,status='Öppnar sparade resor…',busy=false,authorized=false;
const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel(DB):null;
function db(){return dbPromise||(dbPromise=new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{for(const name of ['records','outbox','files'])r.result.createObjectStore(name);};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);}));}
async function tx(names,mode,run){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction(names,mode);let result;try{result=run(t);}catch(e){t.abort();reject(e);return;}t.oncomplete=()=>resolve(result);t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error||Error('Lagringen avbröts.'));});}
async function all(name){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction(name).objectStore(name).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function get(name,key){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction(name).objectStore(name).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function notify(){for(const fn of subscribers)fn();}
async function reload(){records=Object.fromEntries((await all('records')).map(x=>[x.id,x]));notify();}
async function patch(id,changes){
 const operation={id:uid(),record:id,patch:{...changes,id,updatedAt:Date.now()}};
 await tx(['records','outbox'],'readwrite',t=>{const table=t.objectStore('records'),r=table.get(id);r.onsuccess=()=>table.put({...r.result,...operation.patch,id},id);t.objectStore('outbox').put(operation,operation.id);});
 status='Sparat på enheten · väntar på synk';await reload();channel?.postMessage('changed');flush();return id;
}
async function add(type,tripId,data){return patch(uid(),{...data,type,tripId:tripId||'',deleted:false,createdAt:Date.now()});}
async function receive(snapshot){
 const remote=snapshot.val()||{};
 await tx(['records','outbox'],'readwrite',t=>{
  const out=t.objectStore('outbox'),r=out.getAll();r.onsuccess=()=>{
   const merged={...remote};for(const op of r.result)if(op.record)merged[op.record]={...merged[op.record],...op.patch,id:op.record};
   // Absence isn't a delete; deletions are explicit tombstones.
   for(const [id,row] of Object.entries(merged))t.objectStore('records').put({...row,id},id);
  };
 });await reload();
}
async function flush(){
 if(busy||!ref||!authorized)return;busy=true;
 try{
  for(const op of await all('outbox')){
   if(!authorized)break;
   if(op.file)await ref.child('files/'+op.file).set(op.data);
   else await ref.child('items/'+op.record).update(op.patch);
   await tx(['outbox'],'readwrite',t=>t.objectStore('outbox').delete(op.id));
  }
  status=(await all('outbox')).length?'Sparat på enheten · väntar på synk':'Synkat med familjen';
 }catch(e){status=/permission.denied/i.test(e.code||'')?'Sparat på enheten · Firebase-behörighet saknas':'Sparat på enheten · väntar på anslutning';}
 finally{busy=false;notify();}
}
async function putFile(data){const id=uid();await tx(['files','outbox'],'readwrite',t=>{t.objectStore('files').put(data,id);t.objectStore('outbox').put({id,file:id,data},id);});flush();return id;}
async function file(id){const cached=await get('files',id);if(cached)return cached;if(!ref)throw Error('Filen behöver hämtas när du är ansluten.');const data=(await ref.child('files/'+id).once('value')).val();if(!data)throw Error('Filen väntar på synkning från den andra enheten.');await tx(['files'],'readwrite',t=>t.objectStore('files').put(data,id));return data;}
async function exportBackup(){const items=await all('records'),files={};for(const item of items)if(item.fileId)files[item.fileId]=await file(item.fileId);return {format:'family-travel-v1',version:1,exportedAt:new Date().toISOString(),items,files};}
async function importBackup(raw){
 const data=validateBackup(raw),ids=Object.fromEntries(data.items.map(x=>[x.id,uid()])),fileIds={};
 for(const [id,content] of Object.entries(data.files||{})){if(typeof content!=='string'||!/^data:(image\/(jpeg|png|webp)|application\/pdf);base64,/.test(content)||content.length>1600000)throw Error('Ogiltig fil i backupen.');fileIds[id]=await putFile(content);}
 for(const item of data.items)await patch(ids[item.id],{...item,id:ids[item.id],tripId:ids[item.tripId]||'',fileId:fileIds[item.fileId]||'',deleted:!!item.deleted});
}
Object.assign(API,{ROOT,list:()=>Object.values(records),get:id=>records[id],status:()=>status,subscribe:fn=>{subscribers.push(fn);fn();},patch,add,remove:id=>patch(id,{deleted:true}),restore:id=>patch(id,{deleted:false}),putFile,file,exportBackup,importBackup,flush});global.TravelStore=API;
API.ready=reload().then(()=>{status='Sparat på enheten';notify();}).catch(()=>{status='Lagringen på enheten är blockerad';notify();});
channel?.addEventListener('message',()=>reload());
function start(){
 if(!global.firebase){status='Sparat på enheten · anslutning saknas';notify();return;}
 if(!firebase.apps.length)firebase.initializeApp(global.FIREBASE_CONFIG);
 firebase.auth().onAuthStateChanged(user=>{authorized=!!user;if(ref)ref.child('items').off();if(!user){ref=null;status='Logga in för att synka';notify();return;}
 ref=firebase.database().ref(ROOT);ref.child('items').on('value',s=>receive(s).catch(()=>{status='Kunde inte spara lokalt';notify();}),()=>{status='Sparat på enheten · Firebase-behörighet saknas';notify();});flush();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
global.addEventListener('online',flush);global.addEventListener('pageshow',flush);setInterval(flush,30000);
})(typeof window==='undefined'?globalThis:window);
