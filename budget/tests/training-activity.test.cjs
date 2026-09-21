const test=require('node:test');
const assert=require('node:assert/strict');
const {build}=require('../training-activity.js');

test('daily activity aggregates saved minutes and counts each logged session once',()=>{
  const rows=[{date:'2026-09-21',duration:30},{date:'2026-09-21',duration:12.5},{date:'2026-09-22',duration:0},
    {date:'2026-09-22'},{date:'2026-09-22',duration:-10},{date:'2026-09-22',duration:'bad'},
    {date:'2026-09-20',duration:90},{date:'2026-09-24',duration:90},{date:'2026-02-31',duration:99}];
  const before=JSON.stringify(rows),result=build(rows,{today:'2026-09-23'});
  assert.equal(result.buckets.length,7);assert.equal(result.start,'2026-09-21');assert.equal(result.end,'2026-09-27');
  assert.equal(result.sessions,6);assert.equal(result.minutes,42.5);assert.equal(result.missing,3);
  assert.equal(result.buckets[0].minutes,42.5);assert.equal(result.buckets[1].sessions,4);
  assert.equal(result.buckets[2].current,true);assert.equal(result.buckets[2].minutes,0);
  assert.equal(JSON.stringify(rows),before,'presentation must not mutate saved records');
});

test('history fills empty weeks and labels the ISO week across the year boundary',()=>{
  const result=build([{date:'2020-12-31',duration:20},{date:'2021-01-01',duration:40}],{today:'2021-01-04',view:'history'});
  assert.equal(result.buckets.length,8);assert.equal(result.buckets[6].label,'v53');assert.equal(result.buckets[6].minutes,60);
  assert.equal(result.buckets[7].label,'v1');assert.equal(result.buckets[7].sessions,0);assert.equal(result.buckets[7].current,true);
  assert.equal(result.minutes,60);assert.equal(result.sessions,2);
});

test('calendar buckets remain correct through daylight-saving transitions',()=>{
  for(const today of ['2026-03-29','2026-10-25']){
    const result=build([{date:today,duration:25}],{today});
    assert.equal(result.buckets[6].date,today);assert.equal(result.buckets[6].minutes,25);
    assert.equal(new Set(result.buckets.map(b=>b.date)).size,7);
  }
});

test('older periods retain real zeroes and independent totals',()=>{
  const rows=[{date:'2026-09-21',duration:45},{date:'2026-09-14',duration:20}];
  assert.equal(build(rows,{today:'2026-09-21',offset:-1}).minutes,20);
  assert.equal(build(rows,{today:'2026-09-21',view:'history',offset:-8}).minutes,0);
  assert.equal(build([],{today:'2026-09-21'}).buckets.every(b=>b.minutes===0&&b.sessions===0),true);
});
