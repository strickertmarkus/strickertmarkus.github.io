/* Month and week views share the existing date-keyed session drafts and saver. */
function pulsePlanSetView(view){
  pulsePlanCaptureV2();pulsePlanView=view==='month'?'month':'week';
  if(!pulsePlanSelected)pulsePlanSelected=planTargetMondayISO;
  if(!pulsePlanMonth)pulsePlanMonth=pulsePlanSelected.slice(0,7)+'-01';
  pulsePlanExpandedV2=-1;syncPlanWeekUI();
}
function pulsePlanEntryForDate(date){
  return pulsePlanWeekDraftV2(mondayISOOf(date))[DAY_KEYS.indexOf(dayKeyFromISO(date))];
}
function pulsePlanSwapDates(from,to){
  if(from===to)return;
  pulsePlanCaptureV2();
  var a=mondayISOOf(from),b=mondayISOOf(to),ai=DAY_KEYS.indexOf(dayKeyFromISO(from)),bi=DAY_KEYS.indexOf(dayKeyFromISO(to));
  var first=pulsePlanWeekDraftV2(a),second=pulsePlanWeekDraftV2(b),keep=first[ai];
  first[ai]=second[bi];second[bi]=keep;
  pulsePlanDirtyWeeks[a]=true;pulsePlanDirtyWeeks[b]=true;
  pulsePlanSelected=to;planTargetMondayISO=b;pulsePlanExpandedV2=-1;
  syncPlanWeekUI();
}
function pulsePlanRenderMonth(){
  var box=document.getElementById('plan-days'),first=parseISODate(pulsePlanMonth),start=mondayISOOf(pulsePlanMonth);
  var days=new Date(first.getFullYear(),first.getMonth()+1,0).getDate(),offset=(first.getDay()+6)%7;
  var count=Math.ceil((offset+days)/7)*7,today=todayISO(),active=0,exerciseCount=0;
  var html='<div class="planner-month-grid" aria-label="Månadskalender">'+DAYS.map(function(day){return '<span class="planner-weekday">'+day+'</span>';}).join('');
  for(var i=0;i<count;i++){
    var date=shiftISODate(start,i),entry=pulsePlanEntryForDate(date),rest=pulsePlanKindV2(entry.type)==='rest';
    var inMonth=date.slice(0,7)===pulsePlanMonth.slice(0,7),exercises=pulsePlanExerciseListV2(entry);
    var name=entry.session&&entry.session.name||entry.type||'Vila';
    if(inMonth&&!rest){active++;exerciseCount+=exercises.length;}
    var selected=date===pulsePlanSelected,copy=pulsePlanCopied&&pulsePlanCopied.date!==date;
    html+='<div class="planner-month-day'+(!inMonth?' is-outside':'')+(selected?' is-selected':'')+'" data-calendar-date="'+date+'" data-kind="'+pulsePlanKindV2(entry.type)+'">'+
      '<button type="button" class="planner-day-open" data-plan-date="'+date+'" aria-pressed="'+selected+'"'+(today===date?' aria-current="date"':'')+' aria-label="'+escHtml(parseISODate(date).toLocaleDateString('sv-SE',{weekday:'long',day:'numeric',month:'long'})+', '+name+(exercises.length?', '+exercises.length+' övningar':''))+'">'+
      '<span class="planner-day-number">'+parseISODate(date).getDate()+'</span><span class="planner-day-name">'+escHtml(name)+'</span>'+
      (!rest?'<span class="planner-day-count">'+exercises.length+' övn.</span>':'')+'</button>'+
      (copy?'<button type="button" class="planner-day-paste" data-plan-date="'+date+'" data-plan-paste aria-label="Kopiera pass till '+date+'">Hit</button>':
      '<button type="button" class="planner-day-drag" data-plan-drag-date="'+date+'" aria-label="Flytta pass '+date+'. Dra eller använd piltangenterna."><svg viewBox="0 0 20 12" aria-hidden="true"><path d="M5 4h10M5 8h10"/></svg></button>')+'</div>';
  }
  html+='</div>';
  if(pulsePlanCopied)html+='<p class="planner-copy-status" role="status">Välj Hit på dagen du vill kopiera till. Du kan även byta månad.</p>';
  if(pulsePlanExpandedV2>=0&&pulsePlanSelected){
    var index=DAY_KEYS.indexOf(dayKeyFromISO(pulsePlanSelected)),selectedEntry=pulsePlanEntryForDate(pulsePlanSelected);
    html+='<article class="pulse-plan-day-v2 is-expanded planner-selected-day" data-index="'+index+'" data-color="'+pulsePlanColorV2(selectedEntry.type)+'">'+
      '<button type="button" class="planner-selected-title" data-pulse-open-builder-v2="'+index+'">'+escHtml(parseISODate(pulsePlanSelected).toLocaleDateString('sv-SE',{weekday:'long',day:'numeric',month:'long'}))+'<span>Öppna passbyggaren ↗</span></button>'+
      pulsePlanExpandedHtmlV2(selectedEntry,index)+'</article>';
  }
  var scroll=box.scrollTop;box.innerHTML=html;box.scrollTop=scroll;
  document.getElementById('pulse-plan-summary-v2').textContent=active+' pass · '+exerciseCount+' övningar';
}
function pulsePlanInstallMonthDrag(){
  var box=document.getElementById('plan-days');if(!box)return;
  var drag=null;
  function finish(event){
    if(!drag||event.pointerId!==drag.id)return;
    var current=drag;drag=null;
    document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',finish);document.removeEventListener('pointercancel',finish);
    box.querySelectorAll('.is-drag-target,.is-drag-source').forEach(function(el){el.classList.remove('is-drag-target','is-drag-source');});
    if(event.type==='pointerup'&&current.to&&current.to!==current.from)pulsePlanSwapDates(current.from,current.to);
  }
  function move(event){
    if(!drag||event.pointerId!==drag.id)return;
    event.preventDefault();
    var target=document.elementFromPoint(event.clientX,event.clientY),cell=target&&target.closest('[data-calendar-date]');
    drag.to=cell&&cell.dataset.calendarDate;
    box.querySelectorAll('[data-calendar-date]').forEach(function(el){el.classList.toggle('is-drag-target',el===cell&&drag.to!==drag.from);});
    var r=box.getBoundingClientRect();
    if(event.clientY<r.top+32)box.scrollTop-=12;else if(event.clientY>r.bottom-32)box.scrollTop+=12;
  }
  box.addEventListener('pointerdown',function(event){
    var handle=event.target.closest('[data-plan-drag-date]');if(!handle||event.button>0)return;
    event.preventDefault();drag={id:event.pointerId,from:handle.dataset.planDragDate,to:null};
    handle.closest('[data-calendar-date]').classList.add('is-drag-source');
    document.addEventListener('pointermove',move,{passive:false});document.addEventListener('pointerup',finish);document.addEventListener('pointercancel',finish);
  });
  box.addEventListener('keydown',function(event){
    var handle=event.target.closest('[data-plan-drag-date]'),delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[event.key];
    if(!handle||!delta)return;
    event.preventDefault();var to=shiftISODate(handle.dataset.planDragDate,delta);
    pulsePlanSwapDates(handle.dataset.planDragDate,to);
    var next=box.querySelector('[data-plan-drag-date="'+to+'"]');if(next)next.focus();
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',pulsePlanInstallMonthDrag,{once:true});else pulsePlanInstallMonthDrag();
