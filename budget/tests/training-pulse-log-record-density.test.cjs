const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'pulse-environment/environment.css'),'utf8');
const html=fs.readFileSync(path.join(root,'exercise.html'),'utf8');
test('Pulse records remain 3 columns with readable category headings and rows',()=>{
 assert.match(css,/#pulse-home \.record-row-v52\{[^}]*min-height:64px!important;[^}]*padding:16px!important/);
 assert.match(css,/#pulse-home \.record-group-toggle-v52\{[^}]*min-height:44px!important/);
 assert.match(css,/#pulse-home \.record-row-v52\{[^}]*grid-template-columns:minmax\(0,1fr\) 88px 120px!important/);
});
test('Pulse log cards preserve all six cells with consistent spacing',()=>{
 assert.match(css,/#pulse-home \.log-main-row\{[^}]*padding:20px 4px;/);
 assert.match(css,/#pulse-home \.log-del\{width:44px!important;height:44px!important/);
 assert.match(css,/#pulse-home \.log-ex-row-v7\{min-height:44px!important/);
 assert.match(html,/class="log-table"/);
});
test('Pulse mobile log has two rows and records retain progress',()=>{
 for(const i of [1,2,3,4,5,6]){
  assert.match(css,new RegExp('\\.log-main-row>td:nth-child\\('+i+'\\)\\{grid-column:[^}]+grid-row:[12]'));
 }
 assert.match(css,/#pulse-home \.record-row-v52\{grid-template-columns:minmax\(0,1fr\) 80px!important;min-height:64px!important/);
 assert.match(css,/#pulse-home \.record-progress-v52\{grid-column:1\/-1/);
});
test('Pulse-only owner and cache version are updated',()=>{
 assert.match(css,/#pulse-home :is\(\.pulse-records,\.pulse-log\)>\.section-hdr\{margin-bottom:24px!important\}/);
 assert.match(html,/pulse-environment\/environment\.css\?v=20260919-observatory-polish-1/);
});
