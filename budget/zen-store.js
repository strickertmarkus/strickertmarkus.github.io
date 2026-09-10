/* Zen owns this namespace. No exercise keys, training templates or training sync. */
(function(){
  'use strict';
  const M=window.ZenModel,profile=new URLSearchParams(location.search).get('user')==='maja'?'maja':'markus';
  let entries={},active=null,key='',ref=null,connected=false,loaded=false,blocked=false,ready=false,storageOK=true,pending=0,epoch=0,authError=false;
  const listeners=new Set(),inFlight=new Map();let syncQueued=false,lastRemote={};
  const emit=()=>listeners.forEach(fn=>fn());
  function read(k,fallback){try{const value=localStorage.getItem(k);return value?JSON.parse(value):fallback;}catch(_){storageOK=false;return fallback;}}
  function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(_){storageOK=false;return false;}}
  function status(){
    if(authError)return 'Kontot kunde inte laddas · försök ladda om';
    if(!ready)return 'Ansluter…';
    if(!storageOK)return loaded&&connected&&!blocked&&!pending?'Sparat på kontot · enhetslagring saknas':'Kunde inte spara på enheten · hämta säkerhetskopia';
    if(blocked)return 'Sparat på den här enheten';
    if(!connected)return 'Sparat på enheten · väntar på anslutning';
    if(pending||!loaded)return 'Sparat på enheten · synkar…';
    return 'Sparat på ditt konto';
  }
  function push(entry){
    if(!ref||blocked||!loaded||!connected||inFlight.has(entry.id))return;
    const atEpoch=epoch;inFlight.set(entry.id,entry.updatedAt);pending++;emit();
    ref.child(entry.id).set(entry).then(()=>{if(atEpoch===epoch){pending--;inFlight.delete(entry.id);if(entries[entry.id]&&entries[entry.id].updatedAt>entry.updatedAt)push(entries[entry.id]);emit();}}).catch(()=>{if(atEpoch===epoch){pending--;inFlight.delete(entry.id);blocked=true;emit();}});
  }
  function catchUp(remote){lastRemote=remote;if(syncQueued)return;syncQueued=true;const atEpoch=epoch;queueMicrotask(()=>{syncQueued=false;if(atEpoch!==epoch)return;for(const e of Object.values(entries))if(!lastRemote[e.id]||e.updatedAt>lastRemote[e.id].updatedAt)push(e);});}
  function connect(user){
    epoch++;if(ref)ref.off();inFlight.clear();syncQueued=false;lastRemote={};entries={};active=null;ready=false;loaded=false;blocked=false;pending=0;ref=null;
    if(!user){emit();return;}
    key='zen_v1_'+user.uid+'_'+profile;
    entries=M.merge({},read(key+'_entries',{}));const saved=read(key+'_active',null);active=M.activeValid(saved)?saved:null;ready=true;emit();
    try{
      ref=firebase.database().ref('zen_v1/'+user.uid+'/'+profile+'/entries');
      ref.on('value',snapshot=>{
        const remote=M.merge({},snapshot.val());entries=M.merge(entries,remote);loaded=true;write(key+'_entries',entries);catchUp(remote);emit();
      },()=>{blocked=true;emit();});
    }catch(_){blocked=true;emit();}
  }
  function put(entry){if(!ready||!M.entryValid(entry))return false;entries=M.merge(M.merge(entries,read(key+'_entries',{})),{[entry.id]:entry});write(key+'_entries',entries);push(entry);emit();return true;}
  window.ZenStore={
    profile,get ready(){return ready;},get active(){return active;},get status(){return status();},
    get description(){return blocked?'Molnsynk är inte tillgänglig för Zen på det här kontot just nu. Dina pass sparas på den här enheten. Hämta gärna en säkerhetskopia.':status()+'. Zen synkar i en egen del av ditt konto, separat från träningen.';},
    get entries(){return Object.values(entries).filter(e=>!e.deleted);},
    subscribe(fn){listeners.add(fn);fn();return()=>listeners.delete(fn);},
    put,
    remove(id){return put({id,deleted:true,updatedAt:Date.now()});},
    setActive(s){if(!ready)return;active=s;write(key+'_active',s);emit();},
    export(){return {app:'zen',version:1,profile,exportedAt:Date.now(),entries};},
    import(data){
      if(!ready)throw Error('Vänta tills ditt konto har laddats.');
      if(!data||data.app!=='zen'||data.version!==1||data.profile!==profile||!data.entries||typeof data.entries!=='object'||Array.isArray(data.entries))throw Error('Välj en Zen-säkerhetskopia för '+(profile==='maja'?'Maja':'Markus')+'.');
      const values=Object.values(data.entries);if(values.length>20000||values.some(e=>!M.entryValid(e))||Object.entries(data.entries).some(([id,e])=>id!==e.id))throw Error('Säkerhetskopian innehåller ogiltiga uppgifter.');
      entries=M.merge(entries,data.entries);write(key+'_entries',entries);values.forEach(e=>push(entries[e.id]));emit();return values.filter(e=>!e.deleted).length;
    }
  };
  if(window.firebase){
    try{firebase.database().ref('.info/connected').on('value',s=>{connected=s.val()===true;if(connected&&ready&&loaded&&!blocked)ref.once('value').then(s=>catchUp(M.merge({},s.val()))).catch(()=>{blocked=true;emit();});emit();});firebase.auth().onAuthStateChanged(connect,()=>{authError=true;emit();});}catch(_){authError=true;emit();}
  }else{authError=true;emit();}
  if(window.addEventListener)window.addEventListener('storage',event=>{if(ready&&event.key===key+'_entries'){entries=M.merge(entries,read(key+'_entries',{}));emit();}});
})();
