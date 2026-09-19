const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'pulse-environment/environment.css'),'utf8');
const html=fs.readFileSync(path.join(root,'exercise.html'),'utf8');
test('Pulse records remain 3 columns with compact category headings and rows',()=>{
 assert.match(css,/#pulse-home \.record-row-v52\{[^}]*min-height:48px!important;[^}]*padding:8px 14px!important/);
 assert.match(css,/#pulse-home \.record-group-toggle-v52\{[^}]*min-height:42px!important/);
 assert.match(css,/#pulse-home \.record-row-v52\{[^}]*grid-template-columns:minmax\(0,1fr\) 76px 120px!important/);
});
test('Pulse log cards preserve all six cells while reducing padding',()=>{
 assert.match(css,/#pulse-home \.log-main-row\{[^}]*padding:11px 14px;/);
 assert.match(css,/#pulse-home \.log-del\{width:30px!important;height:30px!important/);
 assert.match(css,/#pulse-home \.log-ex-row-v7\{min-height:44px!important/);
 assert.match(html,/class="log-table"/);
});
test('Pulse mobile log has two rows and records retain progress',()=>{
 for(const i of [1,2,3,4,5,6]){
  assert.match(css,new RegExp('\\.log-main-row>td:nth-child\\('+i+'\\)\\{grid-column:[^}]+grid-row:[12]'));
 }
 assert.match(css,/#pulse-home \.record-row-v52\{grid-template-columns:minmax\(0,1fr\) 68px!important;min-height:0!important/);
 assert.match(css,/#pulse-home \.record-progress-v52\{grid-column:1\/-1/);
});
test('Pulse-only owner and cache version are updated',()=>{
 assert.match(css,/#pulse-home :is\(\.pulse-records,\.pulse-log\)>\.section-hdr\{margin-bottom:13px!important\}/);
 assert.match(html,/pulse-environment\/environment\.css\?v=20260919-pulse-log-pr-density-1/);
});
