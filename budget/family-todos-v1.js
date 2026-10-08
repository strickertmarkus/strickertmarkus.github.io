(function () {
  'use strict';
  if (window.FamilyTodos) return;

  // One shared task database for Home, Calendar and Shopping.
  // Realtime Database stores tasks by immutable ID so edits on different
  // tasks never overwrite the entire list (as cal_todos used to do).
  var ROOT = 'family_todos_v2';
  var CACHE = 'family_todos_v2_cache';
  var PENDING = 'family_todos_v2_pending';
  var MEMBERS = ['family','markus','maja','melker','mila'];
  var PRIORITIES = ['normal','important','urgent'];
  var listeners = [];
  var tasks = read(CACHE,{});
  var pending = read(PENDING,{});
  var history = [];
  var connected = false, initialized = false, dbRef = null;
  var inFlight = new Set(), refreshBusy = false;
  var status = 'local';

  function read(key,fallback) {
    try { var result=JSON.parse(localStorage.getItem(key)); return result == null ? fallback : result; }
    catch (_) { return fallback; }
  }
  function save(key,value) {
    try { localStorage.setItem(key,JSON.stringify(value)); }
    catch (_) { if (typeof window.fallbackSetItem === 'function') window.fallbackSetItem(key,JSON.stringify(value)).catch(function(){}); }
  }
  function string(value) { return String(value == null ? '' : value).trim(); }
  function pick(value,allowed,fallback){ return allowed.indexOf(value) >= 0 ? value : fallback; }
  function iso(value){ return /^\d{4}-\d{2}-\d{2}$/.test(String(value||'')) ? String(value) : ''; }
  function normalize(raw,id) {
    raw=raw||{};
    return { id:string(raw.id||id), text:string(raw.text), member:pick(raw.member,MEMBERS,'family'),
      done:!!(raw.done||raw.checked), priority:pick(raw.priority,PRIORITIES,'normal'),
      dueDate:iso(raw.dueDate), createdAt:Number(raw.createdAt)||Date.now(),
      updatedAt:Number(raw.updatedAt)||Date.now(), deleted:!!raw.deleted };
  }
  function mapTasks(value) {
    var map={};
    Object.keys(value||{}).forEach(function(id){var item=normalize(value[id],id);if(item.id && item.text) map[id]=item;});
    return map;
  }
  tasks=mapTasks(tasks);
  function notify() {
    save(CACHE,tasks);
    listeners.slice().forEach(function(callback){try{callback();}catch(e){console.warn('[FamilyTodos] render',e);}});
    window.dispatchEvent(new Event('family-todos-change'));
  }
  function visible(){return Object.keys(tasks).map(function(id){return tasks[id];}).filter(function(t){return t.text&&!t.deleted;});}
  function list() {
    return visible().sort(function(a,b){
      if (a.done!==b.done) return a.done?1:-1;
      var p={urgent:0,important:1,normal:2};
      if(p[a.priority]!==p[b.priority])return p[a.priority]-p[b.priority];
      if(a.dueDate!==b.dueDate){if(!a.dueDate)return 1;if(!b.dueDate)return -1;return a.dueDate.localeCompare(b.dueDate);}
      return a.createdAt-b.createdAt;
    });
  }
  function rebuild(remote) {
    tasks=mapTasks(remote);
    Object.keys(pending).forEach(function(id){
      var op=pending[id], prior=tasks[id]||{};
      tasks[id]=normalize(Object.assign({},prior,op.patch,{id:id}),id);
    });
    notify();
  }
  function put(id,patch,recordUndo) {
    if(!id)return;
    var previous=tasks[id] ? Object.assign({},tasks[id]) : null;
    if(recordUndo!==false){history.push({id:id,previous:previous});if(history.length>30)history.shift();}
    var clean={};
    ['text','member','done','priority','dueDate','deleted'].forEach(function(k){
      if(Object.prototype.hasOwnProperty.call(patch,k)) clean[k]=patch[k];
    });
    if(Object.prototype.hasOwnProperty.call(clean,'text')){
      clean.text=string(clean.text);
      if(!clean.text)return;
    }
    if(Object.prototype.hasOwnProperty.call(clean,'member'))clean.member=pick(clean.member,MEMBERS,'family');
    if(Object.prototype.hasOwnProperty.call(clean,'priority'))clean.priority=pick(clean.priority,PRIORITIES,'normal');
    if(Object.prototype.hasOwnProperty.call(clean,'dueDate'))clean.dueDate=iso(clean.dueDate);
    if(Object.prototype.hasOwnProperty.call(clean,'done'))clean.done=!!clean.done;
    if(Object.prototype.hasOwnProperty.call(clean,'deleted'))clean.deleted=!!clean.deleted;
    clean.updatedAt=Date.now();
    if(!previous)clean.createdAt=Date.now();
    tasks[id]=normalize(Object.assign({},previous||{},clean,{id:id}),id);
    pending[id]={patch:Object.assign({},(pending[id]&&pending[id].patch)||{},clean)};
    save(PENDING,pending);
    notify(); flush();
    return id;
  }
  function add(text,member,priority,dueDate) {
    text=string(text);if(!text)return null;
    var id='task_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);
    return put(id,{text:text,member:member||'family',priority:priority||'normal',dueDate:dueDate||'',done:false,deleted:false});
  }
  function update(id,patch){if(!tasks[id]||tasks[id].deleted)return;return put(id,patch);}
  function toggle(id){if(tasks[id])update(id,{done:!tasks[id].done});}
  function remove(id){if(tasks[id])put(id,{deleted:true});}
  function undo(){
    var entry=history.pop();if(!entry)return;
    if(!entry.previous)put(entry.id,{deleted:true},false);
    else put(entry.id,{text:entry.previous.text,member:entry.previous.member,done:entry.previous.done,
      priority:entry.previous.priority,dueDate:entry.previous.dueDate,deleted:entry.previous.deleted},false);
  }
  function flush() {
    if(!dbRef||!connected)return;
    Object.keys(pending).forEach(function(id){
      if(inFlight.has(id))return;
      var operation=pending[id], patch=Object.assign({},operation.patch);
      inFlight.add(id);
      dbRef.child('items').child(id).transaction(function(remote){
        var base=remote||{};
        return normalize(Object.assign({},base,patch,{id:id}),id);
      },undefined,false).then(function(result){
        if(result.committed){
          if(pending[id]===operation){delete pending[id];save(PENDING,pending);}
          else flush();
          status='synced';
        }
      }).catch(function(error){
        status='offline';
        console.warn('[FamilyTodos] Save failed',error);
      }).finally(function(){inFlight.delete(id);if(pending[id] && pending[id]!==operation)flush();notify();});
    });
  }
  function importLegacy(cal,shopping) {
    var imported={};
    var calendarFingerprints=new Set();
    function fingerprint(t){return String(t.text||'').toLocaleLowerCase('sv-SE')+'|'+t.member+'|'+t.done+'|'+(t.dueDate||'');}
    (Array.isArray(cal)?cal:[]).forEach(function(row,i){
      if(!row||!string(row.text))return;
      var id='legacy_cal_'+String(row.id==null?i:row.id).replace(/[^a-zA-Z0-9_-]/g,'_')+'_'+i;
      imported[id]=normalize({id:id,text:row.text,member:row.member,done:row.done,priority:row.priority,
        dueDate:row.dueDate,createdAt:Number(row.id)||Date.now()},id);
      calendarFingerprints.add(fingerprint(imported[id]));
    });
    (Array.isArray(shopping)?shopping:[]).filter(function(x){return x&&x.mode==='todo';}).forEach(function(list){
      (list.items||[]).forEach(function(item,i){
        if(!item||item.type==='category'||!string(item.text))return;
        var id='legacy_sh_'+String(list.id).replace(/[^a-zA-Z0-9_-]/g,'_')+'_'+String(item.id==null?i:item.id).replace(/[^a-zA-Z0-9_-]/g,'_');
        var migrated=normalize({id:id,text:item.text,member:item.member,done:item.checked,priority:item.priority,
          dueDate:item.dueDate},id);
        if(!calendarFingerprints.has(fingerprint(migrated))) imported[id]=migrated;
      });
    });
    return imported;
  }
  function parseRemote(snapshot,fallback) {
    if(!snapshot.exists())return fallback;
    var data=snapshot.val();
    if(typeof data==='string'){try{return JSON.parse(data);}catch(_){return fallback;}}
    return data;
  }
  async function migrate() {
    // Atomic, one-time import. Parallel devices cannot import twice or reset
    // edits/deletions because the migration marker and records commit together.
    var pair=await Promise.all([firebase.database().ref('cal_todos').once('value'),
      firebase.database().ref('sh_lists').once('value')]);
    var legacy=importLegacy(parseRemote(pair[0],read('cal_todos',[])),
      parseRemote(pair[1],read('sh_lists',[])));
    await dbRef.transaction(function(current){
      current=current||{};
      if(current.migratedLegacyV1)return;
      current.items=current.items||{};
      Object.keys(legacy).forEach(function(id){if(!current.items[id])current.items[id]=legacy[id];});
      current.migratedLegacyV1=true;
      return current;
    },undefined,false);
  }
  function apply(snapshot) {
    var data=snapshot.val()||{};
    rebuild(data.items||{});
    if(connected)flush();
  }
  async function refresh(){
    if(!dbRef||refreshBusy)return;
    refreshBusy=true;
    try {apply(await dbRef.once('value'));status=connected?'synced':'offline';}
    catch(err){status='offline';}
    finally{refreshBusy=false;}
  }
  async function connect(user){
    if(!user||initialized)return;
    initialized=true;status='connecting';
    try{
      dbRef=firebase.database().ref(ROOT);
      await migrate();
      dbRef.on('value',apply,function(e){status='offline';console.warn('[FamilyTodos] Listen',e);});
      firebase.database().ref('.info/connected').on('value',function(s){connected=!!s.val();if(connected){status='synced';flush();refresh();}else status='offline';notify();});
      refresh();flush();
    }catch(error){initialized=false;status='offline';console.warn('[FamilyTodos] Init failed',error);}
    notify();
  }
  function start() {
    if(!window.firebase||!firebase.auth||!firebase.database){status='offline';notify();return;}
    firebase.auth().onAuthStateChanged(function(user){if(user)connect(user);else{connected=false;status='local';notify();}});
  }
  window.addEventListener('pageshow',function(){if(!initialized&&window.firebase&&firebase.auth&&firebase.auth().currentUser)connect(firebase.auth().currentUser);else refresh();});
  window.addEventListener('online',function(){if(!initialized&&window.firebase&&firebase.auth&&firebase.auth().currentUser)connect(firebase.auth().currentUser);else {refresh();flush();}});
  document.addEventListener('visibilitychange',function(){if(!document.hidden)refresh();});
  window.FamilyTodos={list:list,get:function(id){return tasks[id]||null;},add:add,update:update,toggle:toggle,remove:remove,
    undo:undo,canUndo:function(){return history.length>0;},status:function(){return status;},
    subscribe:function(fn){listeners.push(fn);fn();return function(){listeners=listeners.filter(function(cb){return cb!==fn;});};},
    refresh:refresh};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();