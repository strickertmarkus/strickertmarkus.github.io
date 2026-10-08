const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../zen-model.js');
const start=100000;
test('skipping exercises changes position without recording unpracticed time',()=>{
 let s=M.start(M.routines[0],start,'skip');s=M.seek(s,3,start+10000);
 assert.equal(M.position(s,start+10000).index,3);assert.equal(M.practiced(s,start+10000),10000);
 s=M.pause(s,start+15000);assert.equal(M.practiced(s,start+90000),15000);
 s=M.resume(s,start+90000);s=M.seek(s,1,start+95000);
 assert.equal(M.practiced(s,start+95000),20000);assert.equal(M.position(s,start+95000).index,1);
});
test('preparation and preparation after pause do not count toward practiced time',()=>{
 let s=M.start(M.routines[0],start+5000,'prep');assert.equal(M.elapsed(s,start+3000),0);assert.equal(M.practiced(s,start+3000),0);
 s=M.pause(s,start+15000);s=M.resume(s,start+20000);assert.equal(M.practiced(s,start+18000),10000);assert.equal(M.practiced(s,start+25000),15000);
});
test('finishing after a background delay only counts until the last step finishes',()=>{
 let s=M.start(M.routines[0],start,'background');s=M.seek(s,7,start+12000);
 assert.equal(M.practiced(s,start+300000),72000);assert.ok(M.position(s,start+300000).done);
 const restored=JSON.parse(JSON.stringify(M.pause(s,start+300000)));assert.equal(M.practiced(restored,start+400000),72000);
});
