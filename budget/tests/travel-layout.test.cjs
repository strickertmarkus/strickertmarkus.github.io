const {test}=require('node:test'),assert=require('node:assert/strict');
const {segments}=require('../travel-layout.js');
const activity=(id,time,endTime,extra={})=>({id,date:'2026-11-02',timing:'timed',time,endTime,...extra});
test('Calendar distributes overlap chains into consistent lanes and releases them at exact boundaries',()=>{
 const rows=segments([activity('a','09:00','11:00'),activity('b','09:30','10:00'),activity('c','10:00','12:00'),activity('d','12:00','13:00')],'2026-11-02');
 assert.deepEqual(rows.map(x=>[x.row.id,x.lane,x.lanes]),[['a',0,2],['b',1,2],['c',1,2],['d',0,1]]);
});
test('Overnight travel clips at midnight and carries into the next day',()=>{
 const row=activity('train','23:00','02:00',{endDate:'2026-11-03'});
 const [first]=segments([row],'2026-11-02'),[second]=segments([row],'2026-11-03');
 assert.equal(first.start,1380);assert.equal(first.end,1440);assert(first.continuesAfter);
 assert.equal(second.start,0);assert.equal(second.end,120);assert(second.continuesBefore);
 assert.equal(segments([row],'2026-11-04').length,0);
});
test('Small events have readable non-overlapping footprints, invalid and floating rows are excluded',()=>{
 const rows=segments([activity('a','10:00','10:05'),activity('b','10:10','10:15'),activity('c','10:30','10:45'),activity('bad','12:00','11:00'),activity('badClock','09:99','12:00'),activity('badEnd','09:00','99:00'),activity('flex','','',{timing:'flex'}),activity('deleted','09:00','10:00',{deleted:true})],'2026-11-02');
 assert.equal(rows.length,3);assert.equal(rows[0].visualEnd,630);assert.equal(rows[1].lane,1);assert.equal(rows[2].lane,0);
});
