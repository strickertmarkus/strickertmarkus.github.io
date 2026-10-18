/* Calendar geometry uses wall-clock minutes, matching TravelModel.interval. */
(function(root){
'use strict';
function segments(rows,date){
 const midnight=Date.parse(date+'T00:00:00Z');
 const minute=t=>/^\d{2}:\d{2}$/.test(t||'')?Number(t.slice(0,2))*60+Number(t.slice(3)):null;
 const out=rows.flatMap(row=>{
  if(row.deleted||row.timing!=='timed'||minute(row.time)===null)return [];
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
const api={segments};if(typeof module==='object'&&module.exports)module.exports=api;else root.TravelLayout=api;
})(typeof window==='object'?window:globalThis);
