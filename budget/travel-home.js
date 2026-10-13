/* Family task views read travel tasks from the same records as the planner. No mirrored copy. */
(function(){
'use strict';
const S=window.TravelStore,F=window.FamilyTodos;if(!S||!F?.addProvider)return;
function rows(){return S.list().filter(x=>x.type==='task'&&!x.deleted&&x.showHome&&x.taskKind!=='unsorted').filter(x=>{const trip=S.get(x.tripId);return trip&&!trip.deleted&&!trip.archived;}).map(x=>({id:'travel:'+x.id,text:x.title,member:['markus','maja','melker','mila'].includes((x.owner||'').toLowerCase())?x.owner.toLowerCase():'family',priority:x.priority||'normal',dueDate:x.date||'',done:!!x.done,createdAt:x.createdAt||0,updatedAt:x.updatedAt||0,tripName:S.get(x.tripId).title,tripURL:'travel.html?trip='+encodeURIComponent(x.tripId)+'&tab=task'}));}
F.addProvider({list:rows,owns:id=>id.startsWith('travel:'),update:async(id,changes)=>{const key=id.slice(7),patch={};for(const [k,v] of Object.entries(changes)){if(k==='text')patch.title=v;else if(k==='member')patch.owner=v==='family'?'Övrigt':v.charAt(0).toUpperCase()+v.slice(1);else if(k==='dueDate')patch.date=v;else if(['done','deleted','priority'].includes(k))patch[k]=v;}await S.patch(key,patch);},status:()=>/saknas|blockerad|väntar|Kunde/.test(S.status())?'offline':'synced',subscribe:fn=>S.subscribe(fn)});
})();
