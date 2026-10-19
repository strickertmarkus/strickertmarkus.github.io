/* Calendar geometry uses wall-clock minutes, matching TravelModel.interval. */
(function(root){
'use strict';
function segments(rows,date){
 const midnight=Date.parse(date+'T00:00:00Z');
 const minute=t=>/^\d{2}:\d{2}$/.test(t||'')&&Number(t.slice(0,2))<24&&Number(t.slice(3))<60?Number(t.slice(0,2))*60+Number(t.slice(3)):null;
 const out=rows.flatMap(row=>{
  if(row.deleted||row.timing!=='timed'||minute(row.time)===null||(row.endTime&&minute(row.endTime)===null))return [];
  const start=Date.parse(row.date+'T00:00:00Z')+minute(row.time)*60000;
  const end=row.endTime?Date.parse((row.endDate||row.date)+'T00:00:00Z')+minute(row.endTime)*60000:start+30*60000;
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=midnight||start>=midnight+86400000||end<=start)return [];
  return [{row,start:Math.max(0,(start-midnight)/60000),end:Math.min(1440,(end-midnight)/60000),continuesBefore:start<midnight,continuesAfter:end>midnight+86400000}];
 }).sort((a,b)=>a.start-b.start||b.end-a.end||String(a.row.id).localeCompare(String(b.row.id)));
 let group=[],ends=[],until=-1;
 const finish=()=>{for(const item of group)item.lanes=ends.length;group=[];ends=[];};
 for(const item of out){
  // Short events have a 30-minute visual footprint so their labels never overlap.
  item.visualEnd=Math.min(1440,Math.max(item.end,item.start+30));
  if(item.start>=until){finish();until=-1;}
  let lane=ends.findIndex(end=>end<=item.start);if(lane<0)lane=ends.length;
  item.lane=lane;ends[lane]=item.visualEnd;until=Math.max(until,item.visualEnd);group.push(item);
 }
 finish();return out;
}
// Stable deadline buckets keep undated tasks visible without inventing due dates.
function taskGroup(x,departure,today,endDate){
 if(x.done)return 'Klart';
 if(x.taskKind==='unsorted')return 'Behöver sorteras';
 if(!x.date)return 'Före avresan';
 if(x.date<today)return 'Försenat';
 if(endDate&&x.date>endDate)return 'Efter resan';
 if(x.date===departure)return 'Avresedagen';
 if(x.date>departure)return 'Under resan';
 if(!Number.isFinite(Date.parse(departure+'T12:00:00Z')))return 'Före avresan';
 const previous=new Date(Date.parse(departure+'T12:00:00Z')-86400000).toISOString().slice(0,10);
 if(x.date===previous)return 'Dagen före';
 const t=new Date(today+'T12:00:00Z'),sunday=new Date(t.getTime()+(7-(t.getUTCDay()||7))*86400000).toISOString().slice(0,10);
 return x.date<=sunday?'Den här veckan':'Före avresan';
}
// Settle rounded minor units; distribute fractional-cent rounding without creating money.
function transfers(balances){
 const entries=Object.entries(balances).filter(([,v])=>Number.isFinite(v)).map(([name,v])=>({name,cents:Math.round(v*100),value:v}));
 const residual=entries.reduce((n,x)=>n+x.cents,0),net=entries.reduce((n,x)=>n+x.value,0);
 if(Math.abs(net)>.001)return []; // An incomplete ledger must never invent a counterparty.
 if(residual&&entries.length){const largest=[...entries].sort((a,b)=>Math.abs(b.cents)-Math.abs(a.cents))[0];largest.cents-=residual;}
 const creditors=entries.filter(x=>x.cents>0).sort((a,b)=>b.cents-a.cents||a.name.localeCompare(b.name)),debtors=entries.filter(x=>x.cents<0).map(x=>({...x,cents:-x.cents})).sort((a,b)=>b.cents-a.cents||a.name.localeCompare(b.name));
 const out=[];let i=0,j=0;
 while(i<debtors.length&&j<creditors.length){const d=debtors[i],c=creditors[j],amount=Math.min(d.cents,c.cents);if(amount)out.push({from:d.name,to:c.name,amount:amount/100});d.cents-=amount;c.cents-=amount;if(!d.cents)i++;if(!c.cents)j++;}
 return out;
}
const api={segments,taskGroup,transfers};if(typeof module==='object'&&module.exports)module.exports=api;else root.TravelLayout=api;
})(typeof window==='object'?window:globalThis);
