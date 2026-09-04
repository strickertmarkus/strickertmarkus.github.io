(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseLogPrV52Installed) return;
  window.__exerciseLogPrV52Installed = true;

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function number(value) {
    var n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  function round1(value) { return Math.round(number(value) * 10) / 10; }
  function fmtWeight(value) {
    var n = number(value);
    return n > 0 ? round1(n).toLocaleString('sv-SE',{maximumFractionDigits:1}) + ' kg' : '—';
  }
  function ascii(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  }
  function normalizeName(value) {
    return ascii(value)
      .replace(/[()\[\]{}_,.;:/\\|+]/g,' ')
      .replace(/[-–—]/g,' ')
      .replace(/\b(barebell|barbel|barbell|skivstang)\b/g,'skivstang')
      .replace(/\b(dumbell|dumbbell|dumbbells|hantlar|hantel)\b/g,'hantel')
      .replace(/\b(incline|lutande)\b/g,'lutande')
      .replace(/\b(cable|cables|kabel)\b/g,'kabel')
      .replace(/\b(push\s*down|pushdown)\b/g,'pushdown')
      .replace(/\b(push\s*ups?|pushups?|armhavningar?)\b/g,'armhavning')
      .replace(/\b(flyes?|flies?|flys?)\b/g,'flies')
      .replace(/\b(deadlifts?|mark\s*lyft|marklyft)\b/g,'marklyft')
      .replace(/\b(jump\s*rope|jumprope|skipping)\b/g,'hopprep')
      .replace(/\b(hanging\s*leg\s*raises?|hanging\s*legraise)\b/g,'hangande benlyft')
      .replace(/\b(biceps?\s*curls?|bicep\s*curls?|bicepscurl|bicepcurl)\b/g,'bicepscurl')
      .replace(/\s+/g,' ')
      .trim();
  }

  var SECTIONS = [
    {name:'Armar', items:[
      {key:'biceps-barbell', label:'Biceps skivstång stående', match:function(s){return /biceps|bicep|bicepscurl/.test(s) && /skivstang/.test(s) && !/lutande/.test(s);}},
      {key:'biceps-incline', label:'Bicepcurls lutande bänk', match:function(s){return /biceps|bicep|bicepscurl/.test(s) && /lutande/.test(s);}},
      {key:'triceps-cable', label:'Triceps kabeldrag', match:function(s){return /triceps|tricep/.test(s) && /(kabel|pushdown)/.test(s);}},
      {key:'dips', label:'Dips', match:function(s){return /(^| )dips?( |$)/.test(s);}}
    ]},
    {name:'Bröst', items:[
      {key:'pushups', label:'Armhävningar', match:function(s){return /armhavning/.test(s);}},
      {key:'incline-db-press', label:'Hantelpress lutande', match:function(s){return /hantel/.test(s) && /press/.test(s) && /lutande/.test(s);}},
      {key:'lying-flies', label:'Flies liggande', match:function(s){return /flies/.test(s) && /(liggande|hantel|brost|chest)/.test(s);}}
    ]},
    {name:'Ben', items:[
      {key:'sumo-deadlift', label:'Marklyft sumo', match:function(s){return /marklyft/.test(s) && /sumo/.test(s);}}
    ]},
    {name:'Övrigt', items:[
      {key:'jump-rope', label:'Hopprep', match:function(s){return /hopprep/.test(s);}},
      {key:'hanging-leg-raise', label:'Hängande benlyft', match:function(s){return /hangande/.test(s) && /benlyft|leg raise/.test(s);}}
    ]}
  ];

  var ITEM_BY_KEY = Object.create(null);
  SECTIONS.forEach(function(section){ section.items.forEach(function(item){ ITEM_BY_KEY[item.key]=item; }); });

  function matchTarget(rawName) {
    var s = normalizeName(rawName);
    for (var i=0;i<SECTIONS.length;i++) {
      for (var j=0;j<SECTIONS[i].items.length;j++) {
        if (SECTIONS[i].items[j].match(s)) return SECTIONS[i].items[j].key;
      }
    }
    return null;
  }
  function collectWeights(exercise) {
    var out=[];
    function add(v){ var n=number(v); if(n>0) out.push(n); }
    add(exercise && exercise.weight);
    add(exercise && exercise.actualWeight);
    add(exercise && exercise.maxWeight);
    ['sets','logs','setLogs','setLog'].forEach(function(key){
      var rows=exercise && exercise[key];
      if(!Array.isArray(rows)) return;
      rows.forEach(function(row){ if(!row||typeof row!=='object') return; add(row.actualWeight); add(row.weight); add(row.maxWeight); });
    });
    return out;
  }
  function getWorkoutsSafe() {
    try {
      if (typeof window.getWorkouts === 'function') return window.getWorkouts() || [];
      if (typeof getWorkouts === 'function') return getWorkouts() || [];
    } catch (_) {}
    return [];
  }
  function workoutTime(workout,index) {
    var raw=workout && (workout.date || workout.datetime || workout.createdAt || workout.id);
    var parsed=raw ? Date.parse(raw) : NaN;
    if(Number.isFinite(parsed)) return parsed;
    var n=Number(raw);
    return Number.isFinite(n)&&n>100000 ? n : index;
  }
  function buildRecords() {
    var map=Object.create(null);
    SECTIONS.forEach(function(section){
      section.items.forEach(function(item){ map[item.key]={key:item.key,label:item.label,section:section.name,max:0,history:[],seen:false}; });
    });
    getWorkoutsSafe().slice().map(function(workout,index){return {workout:workout,index:index,time:workoutTime(workout,index)};})
      .sort(function(a,b){return a.time-b.time;})
      .forEach(function(entry){
        var perWorkout=Object.create(null);
        var exercises=Array.isArray(entry.workout && entry.workout.exercises) ? entry.workout.exercises : [];
        exercises.forEach(function(exercise){
          var name=String(exercise && (exercise.name || exercise.exercise) || '').trim();
          if(!name) return;
          var key=matchTarget(name);
          if(!key) return;
          var weights=collectWeights(exercise);
          var best=weights.length ? Math.max.apply(Math,weights) : 0;
          if(!perWorkout[key]) perWorkout[key]={best:best,seen:true};
          else perWorkout[key].best=Math.max(perWorkout[key].best,best);
        });
        Object.keys(perWorkout).forEach(function(key){
          var rec=map[key]; if(!rec) return;
          rec.seen=true;
          if(perWorkout[key].best>0){ rec.max=Math.max(rec.max,perWorkout[key].best); rec.history.push(perWorkout[key].best); }
        });
      });
    Object.keys(map).forEach(function(key){
      var rec=map[key];
      rec.first=rec.history.length?rec.history[0]:0;
      rec.latest=rec.history.length?rec.history[rec.history.length-1]:0;
      rec.delta=rec.first>0&&rec.max>rec.first?rec.max-rec.first:0;
    });
    return map;
  }
  function sparkline(values,hasGain) {
    values=(values||[]).filter(function(v){return number(v)>0;}).map(number);
    if(values.length<2) return '<span class="record-spark-empty-v52">—</span>';
    var w=64,h=22,p=3,min=Math.min.apply(Math,values),max=Math.max.apply(Math,values),span=Math.max(1,max-min);
    var pts=values.map(function(v,i){
      var x=p+i*(w-p*2)/(values.length-1);
      var y=h-p-((v-min)/span)*(h-p*2);
      return x.toFixed(1)+','+y.toFixed(1);
    }).join(' ');
    var last=pts.split(' ').pop().split(',');
    return '<svg class="record-spark-v52'+(hasGain?' has-gain':'')+'" viewBox="0 0 '+w+' '+h+'" aria-hidden="true"><polyline points="'+pts+'"></polyline><circle cx="'+last[0]+'" cy="'+last[1]+'" r="2.2"></circle></svg>';
  }

  var collapsedGroups=Object.create(null);
  var sectionCollapsed=false;
  var lastSignature='';

  function sessionOpen(){ var modal=document.getElementById('session-modal'); return !!(modal&&modal.classList.contains('show')); }
  function renderRow(rec) {
    var firstToMax=rec.first>0&&rec.max>0 ? round1(rec.first).toLocaleString('sv-SE',{maximumFractionDigits:1})+' → '+round1(rec.max).toLocaleString('sv-SE',{maximumFractionDigits:1}) : '—';
    var gain=rec.delta>0 ? '<span class="record-gain-v52">+'+round1(rec.delta).toLocaleString('sv-SE',{maximumFractionDigits:1})+' kg</span>' : '<span class="record-flat-v52">'+(rec.history.length>1?'stabil':(rec.seen?'registrerad':'—'))+'</span>';
    return '<div class="record-row-v52">'
      +'<div class="record-name-v52">'+esc(rec.label)+'</div>'
      +'<div class="record-max-v52">'+esc(fmtWeight(rec.max))+'</div>'
      +'<div class="record-progress-v52">'+sparkline(rec.history,rec.delta>0)+'<div class="record-progress-copy-v52"><span>'+esc(firstToMax)+'</span>'+gain+'</div></div>'
      +'</div>';
  }
  function renderGroup(section,map) {
    var collapsed=!!collapsedGroups[section.name];
    return '<section class="record-group-v52'+(collapsed?' is-collapsed':'')+'" data-record-category="'+esc(section.name)+'">'
      +'<button type="button" class="record-group-toggle-v52" data-record-toggle="'+esc(section.name)+'" aria-expanded="'+(!collapsed)+'">'
      +'<span>'+esc(section.name)+'</span><span class="record-group-count-v52">'+section.items.length+'</span><span class="record-chevron-v52">⌄</span></button>'
      +'<div class="record-group-body-v52">'+section.items.map(function(item){return renderRow(map[item.key]);}).join('')+'</div></section>';
  }
  function ensureHeader() {
    var header=Array.prototype.find.call(document.querySelectorAll('.section-hdr'),function(node){var h=node.querySelector('h2');return h&&/personliga rekord/i.test(h.textContent||'');});
    if(!header) return;
    Array.prototype.forEach.call(header.querySelectorAll('button'),function(btn){ if(!btn.classList.contains('records-master-toggle-v52')) btn.style.display='none'; });
    var oldSub=header.querySelector('.records-subtitle-v51'); if(oldSub) oldSub.remove();
    header.classList.add('records-header-v52');
    var master=header.querySelector('.records-master-toggle-v52');
    if(!master){
      master=document.createElement('button'); master.type='button'; master.className='records-master-toggle-v52'; master.setAttribute('aria-label','Fäll ihop personliga rekord'); header.appendChild(master);
    }
    master.textContent=sectionCollapsed?'›':'⌄';
    master.setAttribute('aria-expanded',sectionCollapsed?'false':'true');
  }
  function renderStrengthRecords(force) {
    if(sessionOpen()&&!force) return;
    var grid=document.getElementById('pr-grid'); if(!grid) return;
    var map=buildRecords();
    var signature=JSON.stringify(SECTIONS.map(function(section){return section.items.map(function(item){var r=map[item.key];return [r.key,r.max,r.first,r.latest,r.history,r.seen];});}));
    if(!force&&signature===lastSignature&&grid.classList.contains('records-log-wrap-v52')) return;
    lastSignature=signature;
    ensureHeader();
    grid.className='pr-grid fade-in records-log-wrap-v52'+(sectionCollapsed?' records-section-collapsed-v52':'');
    grid.innerHTML='<div class="records-log-table-v52"><div class="records-columns-v52"><span>Övning</span><span>Max</span><span>Utveckling</span></div>'
      +SECTIONS.map(function(section){return renderGroup(section,map);}).join('')+'</div>';
  }
  window.renderStrengthRecordsV52=renderStrengthRecords;

  function formatSummaryDate(raw){ if(!raw) return ''; var p=String(raw).split('-'); return p.length===3?p[2]+'/'+p[1]:String(raw); }
  function resetAddExerciseModal(){
    var overlay=document.getElementById('wk-modal'); if(!overlay) return;
    overlay.classList.remove('log-add-mode-v52');
    overlay.querySelectorAll('.log-add-hidden-v52').forEach(function(node){node.classList.remove('log-add-hidden-v52');});
    var summary=overlay.querySelector('.log-add-summary-v52'); if(summary) summary.remove();
    delete overlay.dataset.logAddExistingCountV52;
    var list=document.getElementById('ex-list'); var group=list&&(list.closest('.form-group')||list.parentElement); var label=group&&group.querySelector(':scope > label'); if(label) label.textContent='Övningar';
    var footer=overlay.querySelector('.modal-footer'); if(footer) footer.querySelectorAll('button').forEach(function(button){if(button.dataset.originalTextV52){button.textContent=button.dataset.originalTextV52;delete button.dataset.originalTextV52;}});
  }
  function syncAddExerciseModal(){
    var overlay=document.getElementById('wk-modal'); if(!overlay) return;
    var modal=overlay.querySelector('.modal')||overlay.firstElementChild; var title=modal&&modal.querySelector(':scope > h2');
    var addMode=!!(overlay.classList.contains('show')&&title&&/^lägg till övning$/i.test(String(title.textContent||'').trim()));
    if(!addMode){resetAddExerciseModal();return;}
    overlay.classList.add('log-add-mode-v52');
    var list=document.getElementById('ex-list'); if(!list) return;
    var exerciseGroup=list.closest('.form-group')||list.parentElement;
    if(!overlay.dataset.logAddExistingCountV52) overlay.dataset.logAddExistingCountV52=String(Math.max(0,list.querySelectorAll('.ex-row-item').length-1));
    var existingCount=Number(overlay.dataset.logAddExistingCountV52)||0;
    list.querySelectorAll('.ex-row-item').forEach(function(row,index){row.classList.toggle('log-add-hidden-v52',index<existingCount);});
    modal.querySelectorAll('.form-group').forEach(function(group){group.classList.toggle('log-add-hidden-v52',group!==exerciseGroup);});
    var summary=overlay.querySelector('.log-add-summary-v52');
    if(!summary){summary=document.createElement('div');summary.className='log-add-summary-v52';exerciseGroup.parentNode.insertBefore(summary,exerciseGroup);}
    var date=document.getElementById('wk-date'),type=document.getElementById('wk-type'),duration=document.getElementById('wk-dur');
    summary.innerHTML='<span>Lägger till i</span><strong>'+esc(type&&type.value?type.value:'Pass')+'</strong>'+(date&&date.value?'<span>'+esc(formatSummaryDate(date.value))+'</span>':'')+(duration&&duration.value?'<span>'+esc(duration.value)+' min</span>':'');
    var label=exerciseGroup.querySelector(':scope > label'); if(label) label.textContent='Ny övning';
    var footer=modal.querySelector('.modal-footer'); if(footer) footer.querySelectorAll('button').forEach(function(button){var text=String(button.textContent||'').trim();if(/spara/i.test(text)&&!/mall/i.test(text)){if(!button.dataset.originalTextV52)button.dataset.originalTextV52=text;button.textContent='Lägg till';}});
  }

  function addStyles(){
    if(document.getElementById('exercise-log-pr-v52-style')) return;
    var style=document.createElement('style'); style.id='exercise-log-pr-v52-style';
    style.textContent=`
      .records-header-v52{display:flex!important;align-items:center!important;justify-content:space-between!important}.records-master-toggle-v52{display:flex!important;align-items:center;justify-content:center;width:32px;height:32px;border:1px solid rgba(148,163,184,.16);border-radius:8px;background:transparent;color:#8B949E;font:700 18px/1 Inter,sans-serif;cursor:pointer}
      #pr-grid.records-log-wrap-v52{display:block!important;margin-top:8px!important}.records-log-table-v52{border-top:1px solid rgba(148,163,184,.22);border-bottom:1px solid rgba(148,163,184,.22)}.records-section-collapsed-v52{display:none!important}
      .records-columns-v52,.record-row-v52{display:grid;grid-template-columns:minmax(0,1.35fr) 76px minmax(132px,1fr);align-items:center;column-gap:10px}.records-columns-v52{min-height:42px;padding:0 12px;border-bottom:1px solid rgba(148,163,184,.24);font-size:9px;font-weight:850;letter-spacing:.11em;text-transform:uppercase;color:#6D7888}.records-columns-v52 span:nth-child(2),.records-columns-v52 span:nth-child(3){text-align:right}
      .record-group-v52{border-bottom:1px solid rgba(148,163,184,.18)}.record-group-v52:last-child{border-bottom:0}.record-group-toggle-v52{width:100%;min-height:42px;padding:0 12px;border:0;border-bottom:1px solid rgba(148,163,184,.13);background:rgba(255,255,255,.012);color:#D6DEE9;display:grid;grid-template-columns:minmax(0,1fr) auto 20px;align-items:center;gap:8px;text-align:left;font:800 11px/1 Inter,sans-serif;letter-spacing:.03em;cursor:pointer}.record-group-count-v52{color:#657184;font-size:9px;font-weight:700}.record-chevron-v52{color:#758195;font-size:16px;text-align:right;transition:transform .16s ease}.record-group-v52.is-collapsed .record-chevron-v52{transform:rotate(-90deg)}.record-group-v52.is-collapsed .record-group-body-v52{display:none}
      .record-row-v52{min-height:56px;padding:7px 12px;border-bottom:1px solid rgba(148,163,184,.13)}.record-row-v52:last-child{border-bottom:0}.record-name-v52{min-width:0;color:#E7ECF3;font-size:11.5px;font-weight:650;line-height:1.25}.record-max-v52{text-align:right;color:#F0F6FC;font-size:12px;font-weight:750;font-variant-numeric:tabular-nums}.record-progress-v52{display:flex;align-items:center;justify-content:flex-end;gap:7px;min-width:0}.record-spark-v52{width:56px;height:20px;flex:0 0 56px;overflow:visible}.record-spark-v52 polyline{fill:none;stroke:#22D3EE;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;opacity:.78}.record-spark-v52 circle{fill:#22D3EE}.record-spark-v52.has-gain polyline{stroke:#34D399}.record-spark-v52.has-gain circle{fill:#34D399}.record-spark-empty-v52{width:56px;text-align:center;color:#4A5568;font-size:10px}.record-progress-copy-v52{display:flex;min-width:56px;flex-direction:column;align-items:flex-end;gap:1px;font-size:8px;color:#737F90;font-weight:650;white-space:nowrap}.record-gain-v52{color:#34D399;font-weight:800}.record-flat-v52{color:#657184}
      #wk-modal.log-add-mode-v52 .modal{width:min(620px,calc(100vw - 24px))!important;max-height:min(78vh,720px)!important;padding:18px!important;border-color:rgba(34,211,238,.18)!important;background:linear-gradient(180deg,#181E27,#141922)!important}#wk-modal.log-add-mode-v52 .modal>h2{font-size:20px!important;margin:0 42px 14px 0!important}.log-add-hidden-v52{display:none!important}.log-add-summary-v52{display:flex;align-items:center;gap:8px;min-height:36px;margin:0 0 12px;padding:8px 10px;border:1px solid rgba(34,211,238,.13);border-radius:10px;background:rgba(34,211,238,.035);font-size:10px;color:#8391A4}.log-add-summary-v52 strong{color:#DDF8FC;font-size:12px}.log-add-summary-v52>span:first-child{text-transform:uppercase;letter-spacing:.08em;font-size:8px;font-weight:850;color:#5D6C80}#wk-modal.log-add-mode-v52 #ex-list{border:1px solid rgba(148,163,184,.12);border-radius:12px;overflow:hidden;background:rgba(255,255,255,.015)}#wk-modal.log-add-mode-v52 #ex-list .ex-row-item{padding:9px 10px!important;background:linear-gradient(180deg,rgba(255,255,255,.025),rgba(255,255,255,.012))!important}#wk-modal.log-add-mode-v52 .form-group>label{font-size:9px!important;letter-spacing:.11em!important;color:#7C899B!important}#wk-modal.log-add-mode-v52 .modal-footer{margin-top:14px!important;padding-top:12px!important;border-top:1px solid rgba(148,163,184,.10)!important}
      @media(max-width:520px){.records-columns-v52,.record-row-v52{grid-template-columns:minmax(0,1.08fr) 62px minmax(118px,1fr);column-gap:6px}.records-columns-v52,.record-row-v52{padding-left:10px;padding-right:10px}.record-name-v52{font-size:10.5px}.record-max-v52{font-size:11px}.record-spark-v52,.record-spark-empty-v52{width:46px;flex-basis:46px}.record-progress-copy-v52{min-width:48px;font-size:7.4px}#wk-modal.log-add-mode-v52 .modal{padding:14px!important;width:calc(100vw - 16px)!important;max-height:82vh!important}}
    `;
    document.head.appendChild(style);
  }
  function wrapRefreshAll(){
    var original=window.refreshAll;
    if(typeof original!=='function'||original.__recordV52Wrapped) return;
    var wrapped=function(){var result=original.apply(this,arguments);setTimeout(function(){renderStrengthRecords(false);},0);return result;};
    wrapped.__recordV52Wrapped=true; wrapped.__recordV52Original=original; window.refreshAll=wrapped;
  }
  function install(){
    addStyles(); renderStrengthRecords(true); wrapRefreshAll();
    setTimeout(function(){wrapRefreshAll();renderStrengthRecords(false);},250);
    setTimeout(function(){wrapRefreshAll();renderStrengthRecords(false);},900);
    document.addEventListener('click',function(event){
      var master=event.target&&event.target.closest?event.target.closest('.records-master-toggle-v52'):null;
      if(master){sectionCollapsed=!sectionCollapsed;ensureHeader();var grid=document.getElementById('pr-grid');if(grid)grid.classList.toggle('records-section-collapsed-v52',sectionCollapsed);return;}
      var group=event.target&&event.target.closest?event.target.closest('.record-group-toggle-v52'):null;
      if(group){var name=group.getAttribute('data-record-toggle');collapsedGroups[name]=!collapsedGroups[name];var section=group.closest('.record-group-v52');if(section)section.classList.toggle('is-collapsed',!!collapsedGroups[name]);group.setAttribute('aria-expanded',collapsedGroups[name]?'false':'true');return;}
      var target=event.target&&event.target.closest?event.target.closest('.log-add-workout-v8,#wk-modal button'):null;
      if(target){setTimeout(syncAddExerciseModal,0);setTimeout(syncAddExerciseModal,80);if(target.closest&&target.closest('#wk-modal')&&/lägg till|spara/i.test(String(target.textContent||'')))setTimeout(function(){renderStrengthRecords(false);},140);}
      var sessionButton=event.target&&event.target.closest?event.target.closest('#session-modal button'):null;
      if(sessionButton&&/avsluta|spara/i.test(String(sessionButton.textContent||'').toLowerCase()))setTimeout(function(){renderStrengthRecords(false);},500);
    },true);
    window.addEventListener('firebase-sync',function(){setTimeout(function(){renderStrengthRecords(false);},60);});
    document.addEventListener('firebase-sync',function(){setTimeout(function(){renderStrengthRecords(false);},60);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
