const test=require('node:test');
const assert=require('node:assert/strict');
const {suggest,cardioName}=require('../training-pass-autofill.js');
test('known cardio names set pass title and category from an empty/rest day',()=>{
 for(const name of ['Löpning','Cykling','Crosstrainer'])for(const old of ['', 'Vila'])assert.deepEqual(suggest([{name}],old,''),{name,type:'Kondition'});
 assert.equal(cardioName('  LÖPNING '),'Löpning');
});
test('automatic names follow exercise changes and multiple exercises',()=>{
 assert.equal(suggest([{name:'Cykling'}],'Löpning','Löpning').name,'Cykling');
 assert.equal(suggest([{name:'Cykling'},{name:'Löpning'},{name:''}],'Cykling','Cykling').name,'Konditionspass');
 assert.equal(suggest([{name:'Cykling'}],'Konditionspass','Konditionspass').name,'Cykling');
});
test('custom names survive, including a manual name matching an exercise',()=>{
 for(const name of ['Morgonpass','Löpning'])assert.equal(suggest([{name:'Cykling'}],name,'').name,name);
});
test('strength, mixed sessions and incomplete names do not trigger cardio metadata',()=>{
 for(const exercises of [[],[{name:'Löp'}],[{name:'Bänkpress',kind:'strength'}],[{name:'Löpning'},{name:'Bänkpress',kind:'strength'}]])assert.equal(suggest(exercises,'Vila',''),null);
});
test('builder events preserve metadata through save/reopen, manual names and Zen',async()=>{
 const vm=require('node:vm'),fs=require('node:fs');
 function field(value=''){return {value,listeners:{},addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);},dispatchEvent(e){(this.listeners[e.type]||[]).forEach(fn=>fn(e));}};}
 const name=field(),type=field(),list=field(),box={};let rows=[],observer,zen=false;
 list.querySelectorAll=()=>rows;
 const elements={'day-workout-modal':box,'day-workout-ex-list':list,'day-workout-name':name,'day-workout-type':type};
 const window={PulseZen:{builderKind:()=>zen?'stretch':''},ensureExerciseRowKind:(row,k)=>row.kind.value=k};
 const context={window,document:{getElementById:id=>elements[id]},Event:class{constructor(type){this.type=type;}},queueMicrotask,MutationObserver:class{constructor(fn){observer=fn;}observe(){}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../training-pass-autofill.js'),'utf8'),context);
 function row(value){const n=field(value),kind=field('strength');return {kind,n,querySelector:s=>s==='.dw-name'?n:kind};}
 rows=[row('Löpning')];observer();await Promise.resolve();
 assert.equal(name.value,'Löpning');assert.equal(type.value,'Kondition');assert.equal(rows[0].kind.value,'cardio');
 const saved=window.PulsePassAutofill.stamp({name:name.value});assert.equal(saved.autoPassName,'Löpning');
 window.PulsePassAutofill.reset(saved);
 rows[0].n.value='Cykling';observer();await Promise.resolve();assert.equal(name.value,'Cykling');
 name.value='Mitt pass';name.dispatchEvent(new context.Event('input'));
 rows.push(row('Crosstrainer'));observer();await Promise.resolve();assert.equal(name.value,'Mitt pass');
 assert.equal(window.PulsePassAutofill.stamp({name:'Mitt pass',autoPassName:'Cykling'}).autoPassName,undefined);
 zen=true;type.value='Stretch';rows=[row('Löpning')];observer();await Promise.resolve();assert.equal(type.value,'Stretch');
});
