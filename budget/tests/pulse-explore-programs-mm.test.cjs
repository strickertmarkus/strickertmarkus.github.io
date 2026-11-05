const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../pulse-explore.js'),'utf8');
function explorerFor(profile){
  const window={PULSE_EXPLORE_PROFILE:profile,location:{search:''}};
  vm.runInNewContext(source,{window,URLSearchParams});
  return window.PulseExplore;
}
const markus=explorerFor('markus'),maja=explorerFor('maja'),ingemar=explorerFor('ingemar');
test('Markus/Maja have their own focus-based programme catalogue',()=>{
  const expected=['Bröst + Triceps','Rygg + Biceps','Axlar + Mage + Ben','Calisthenics','Kroppsstyrka','Skivstång'];
  assert.deepEqual([...new Set(markus.programs.map(p=>p.group))],expected);
  assert.equal(markus.programs.length,26);
  assert.deepEqual(markus.programs.map(p=>p.id),maja.programs.map(p=>p.id));
  assert.ok(markus.programs.every(p=>!/\b(push|pull)\b/i.test(p.name+' '+p.group)));
  assert.equal(markus.workout({version:1,ids:[9,20]}).type,'Styrka');
});
test('Ingemar keeps all Push/Pull programmes, unaltered',()=>{
  assert.equal(ingemar.programs.length,14);
  assert.ok(ingemar.programs.some(p=>p.id==='push'));
  assert.ok(ingemar.programs.some(p=>p.id==='pull'));
  assert.equal(ingemar.workout({version:1,ids:[18,20]}).type,'Pull');
  assert.equal(markus.workout({version:1,programId:'push'}),null);
});
test('all suggested programmes have valid distinct exercises and transition stops',()=>{
  for(const explorer of [markus,maja]){
    for(const p of explorer.programs){
      assert.equal(new Set(p.ids).size,p.ids.length);
      assert.ok(p.ids.length<=20);
      for(const id of p.ids)assert.ok(explorer.exercises[id],p.name+': missing '+id);
      assert.equal(p.between.length,p.ids.length-1);
      assert.ok(p.between.includes('rope'));
      assert.ok(p.between.includes('rest'));
      const sequence=explorer.programSequence(p);
      assert.equal(sequence.filter(s=>s.kind==='exercise').length,p.ids.length);
      assert.equal(sequence.filter(s=>s.kind!=='exercise').length,p.ids.length-1);
      const plan=explorer.workout({version:1,programId:p.id});
      assert.ok(plan);
      assert.equal(plan.exercises.length,p.ids.length);
      assert.equal(plan.sequence.length,sequence.length);
      for(const segment of sequence.filter(s=>s.kind==='rope')){
        assert.equal(segment.seconds,45);
        assert.equal(segment.restSeconds,30);
      }
    }
  }
});
test('two timeline views render compact figures and interval stops only for Markus/Maja',()=>{
  const guide=fs.readFileSync(path.join(__dirname,'../pulse-exercise-guide.html'),'utf8');
  const flow=fs.readFileSync(path.join(__dirname,'../pulse-flow-layout.css'),'utf8');
  const gym=fs.readFileSync(path.join(__dirname,'../pulse-gym-scene.js'),'utf8');
  const gymCSS=fs.readFileSync(path.join(__dirname,'../pulse-gym-scene.css'),'utf8');
  assert.match(guide,/function renderProgramTimeline/);
  assert.match(guide,/timeline-recovery/);
  assert.match(guide,/program\.sequence|plan\.sequence/);
  assert.match(guide,/data\.exploreProfile=profile/);
  assert.match(gym,/st-recovery/);
  assert.match(flow,/--pose-width:108px/);
  assert.match(flow,/--pose-width:74px/);
  assert.match(gymCSS,/width:96px/);
  assert.match(gymCSS,/data-explore-profile="markus"/);
  assert.match(gymCSS,/data-explore-profile="maja"/);
});
