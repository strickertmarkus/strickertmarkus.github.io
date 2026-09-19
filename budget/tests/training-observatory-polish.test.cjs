const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const dashboard = fs.readFileSync(path.join(root,'exercise-dashboard.js'),'utf8');
const adapter = dashboard.slice(dashboard.indexOf('/* ── Observatory presentation adapter'), dashboard.indexOf('/* ── Canonical weekly plan'));
function pluginHarness(mode='observatory') {
  let plugin;
  const Chart = {register(value) { plugin = value; }};
  const window = {Chart};
  const document = {documentElement:{dataset:{trainingOverview:mode}}, readyState:'loading',addEventListener(){}};
  vm.runInNewContext(adapter, {window,document,Chart,matchMedia:()=>({matches:false}),Intl,Set,Number,Object,Array});
  return {plugin,window,document};
}
function chart(id, data=[48,50]) {
  const attributes={};
  return {canvas:{id,closest:()=>true,setAttribute:(name,value)=>attributes[name]=value},attributes,
    data:{labels:['18 sep','19 sep'],datasets:[{label:'Test',data,pointRadius:3,borderColor:'#ffffff'}]},
    options:{scales:{x:{ticks:{font:{size:8}},grid:{}},y:{ticks:{},grid:{}}},plugins:{legend:{labels:{}},tooltip:{callbacks:{}}}},
    ctx:{save(){},restore(){},fillText(){},createLinearGradient:()=>({addColorStop(){}})},chartArea:{left:0,right:300,top:0,bottom:200}};
}
test('chart theme preserves metric units, readable axes and touch targets',()=>{
 const {plugin}=pluginHarness();
 for(const [id,color,unit] of [['chart-bw','#65d7a5','ml/kg/min'],['chart-sessions','#70aaff','pass']]){
  const c=chart(id);plugin.beforeUpdate(c);
  assert.equal(c.data.datasets[0].borderColor,color);
  assert.equal(c.options.scales.x.ticks.font.size,12);
  assert.equal(c.data.datasets[0].pointHitRadius,16);
  assert.ok(c.options.events.includes('touchstart'));
  assert.match(c.options.plugins.tooltip.callbacks.label({dataset:c.data.datasets[0],parsed:{y:48.5}}),new RegExp(unit));
  assert.ok(c.attributes['aria-label'].includes(unit));
 }
});
test('heart rate tooltip keeps min/max and pace keeps time formatting',()=>{
 const {plugin}=pluginHarness();
 for(const id of ['chart-hr-combined','chart-run-pace']){
  const c=chart(id);const callback=()=>id==='chart-run-pace'?'5:30 min/km':'145 bpm (95–170)';
  c.options.plugins.tooltip.callbacks.label=callback;plugin.beforeUpdate(c);
  assert.equal(c.options.plugins.tooltip.callbacks.label,callback);
 }
});
test('empty charts have an accessible explanation while numeric zero remains real data',()=>{
 const {plugin,window}=pluginHarness();const c=chart('chart-bw',[null,null]);
 plugin.beforeUpdate(c);plugin.afterDraw(c);assert.match(c.attributes['aria-label'],/Ingen träningsdata/);
 const zero=chart('chart-sessions',[0,0]);window.getWorkouts=()=>[{id:'fixture'}];
 plugin.beforeUpdate(zero);plugin.afterDraw(zero);assert.doesNotMatch(zero.attributes['aria-label'],/Ingen träningsdata/);
 window.getWorkouts=()=>[];plugin.afterDraw(zero);assert.match(zero.attributes['aria-label'],/Ingen träningsdata/);
});
test('theme does not touch Compact or charts outside the overview',()=>{
 const {plugin}=pluginHarness('compact');const c=chart('chart-bw');const initial=JSON.stringify(c.options);
 plugin.beforeUpdate(c);assert.equal(JSON.stringify(c.options),initial);assert.equal(c.data.datasets[0].borderColor,'#ffffff');
 const obs=pluginHarness();c.canvas.closest=()=>null;obs.plugin.beforeUpdate(c);assert.equal(c.data.datasets[0].borderColor,'#ffffff');
});
test('real CSS breakpoints use valid lengths and readable orb labels',()=>{
 const css=fs.readFileSync(path.join(root,'pulse-observatory/observatory.css'),'utf8');
 assert.doesNotMatch(css,/@media\([^)]*(?:min|max)-width:\s*(?:none|auto)/);
 assert.match(css,/@media\(max-width:360px\)/);
 assert.match(css,/observatory-next-orb-label\{[^}]*font-size:14px/);
 assert.doesNotMatch(css,/observatory-next-orb-meta/);
});
