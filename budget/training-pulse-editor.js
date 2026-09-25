/* Pulse Field uses the preserved training application's real builder, session
   and data layer in a same-origin, lazily loaded workspace. No second workout
   runtime, storage model or timer is created in the dashboard. */
(function(){
'use strict';
if(!document.getElementById('next-session-link'))return;
var $=function(id){return document.getElementById(id);};
var selectedDate=dateISO(new Date()),dialog=null,frame=null,legacyReady=null,activeTool='',pendingWrites=0;
var actionTitles={build:'Bygg pass',start:'Träningsläge',log:'Träningslogg',week:'Veckoplan',weekTemplates:'Veckomallar',records:'Personliga rekord',goals:'Mål och VO₂',editDay:'Redigera pass',editLog:'Redigera loggat pass',editExercise:'Redigera övning',editTemplate:'Redigera mallpass',startTemplate:'Starta mallpass',editRecord:'Redigera rekord'};
function dateISO(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function asDate(iso){var a=String(iso||selectedDate).split('-').map(Number);return new Date(a[0],a[1]-1,a[2],12);}
function monday(iso){var d=asDate(iso);d.setDate(d.getDate()-(d.getDay()+6)%7);return dateISO(d);}
function dayName(iso){return ['Mån','Tis','Ons','Tor','Fre','Lör','Sön'][(asDate(iso).getDay()+6)%7];}
function escapeHtml(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function read(k,fallback){try{var v=JSON.parse(localStorage.getItem('ex_'+k));return v==null?fallback:v;}catch(_){return fallback;}}
function changed(){window.dispatchEvent(new CustomEvent('pulse-field:data-change'));renderTemplates();}
function notice(t){var node=$('field-toast');if(!node)return;node.textContent=t;node.classList.add('is-visible');clearTimeout(notice.timer);notice.timer=setTimeout(function(){node.classList.remove('is-visible');},2700);}
function makeDialog(){
 dialog=document.createElement('dialog');
 dialog.id='field-workspace';dialog.className='field-workspace';dialog.setAttribute('aria-label','Passverktyg');
 dialog.innerHTML='<section class="field-workspace-shell"><header class="field-workspace-header"><div><strong id="field-workspace-title">Passverktyg</strong><small>Pulse Field · träning</small></div><button type="button" class="field-workspace-close" id="field-workspace-close" aria-label="Stäng passverktyget">×</button></header><p class="field-workspace-status" id="field-workspace-status" role="status">Öppnar passverktyg…</p><div id="field-workspace-container" class="field-workspace-shell" style="flex:1;min-height:0;height:auto"></div></section>';
 document.body.appendChild(dialog);
 $('field-workspace-close').addEventListener('click',requestClose);
 dialog.addEventListener('cancel',function(event){event.preventDefault();requestClose();});
}
function updateStatus(t){var status=$('field-workspace-status');status.hidden=!t;status.textContent=t||'';}
function workspaceWindow(){
 try{if(!frame||!frame.contentWindow||frame.contentWindow.location.origin!==location.origin)return null;return frame.contentWindow;}catch(_){return null;}
}
function hasOpenModal(doc){return !!doc.querySelector('.modal-overlay.show');}
function requestClose(){
 var win=workspaceWindow();
 if(win&&win.sessionState){
  if(!win.confirm('Avsluta det pågående passet utan att spara?'))return;
  win.stopSessionMode(false);
 }
 if(dialog.open)dialog.close();
 activeTool='';
}
function observeEditor(win){
 var doc=win.document;
 var observer=new MutationObserver(function(changes){
  if(!dialog.open||activeTool==='goals')return;
  if(!changes.some(function(c){return c.type==='attributes'&&c.attributeName==='class'&&c.target.classList.contains('modal-overlay');}))return;
  queueMicrotask(function(){
   if(!dialog.open||activeTool==='goals'||hasOpenModal(doc))return;
   if(pendingWrites){notice('Ändringarna har sparats.');pendingWrites=0;}
   dialog.close();activeTool='';
  });
 });
 observer.observe(doc.body,{subtree:true,attributes:true,attributeFilter:['class']});
 win.addEventListener('beforeunload',function(){observer.disconnect();legacyReady=null;frame=null;});
}
function connectLegacy(win){
 if(typeof win.openDayWorkoutBuilder!=='function'||typeof win.openWorkoutModal!=='function'||typeof win.startWorkoutSessionForDate!=='function'||!win.DB)throw new Error('Passverktygets funktioner kunde inte startas.');
 // Place the single embedded-theme sheet after legacy feature styles; the
 // original session and builder scripts may inject their own rules at boot.
 var theme=win.document.querySelector('link[href*="training-pulse-embedded.css"]');
 if(theme)win.document.head.appendChild(theme);
 var set=win.DB.set;
 win.DB.set=function(k,v){set.call(this,k,v);pendingWrites++;changed();};
 observeEditor(win);
}
function loadLegacy(){
 if(legacyReady)return legacyReady;
 if(!frame){
  frame=document.createElement('iframe');
  frame.className='field-workspace-frame';
  frame.title='Passbyggare och träningsläge';
  frame.setAttribute('referrerpolicy','same-origin');
  frame.setAttribute('loading','eager');
  $('field-workspace-container').appendChild(frame);
 }
 legacyReady=new Promise(function(resolve,reject){
  var expired=setTimeout(function(){reject(new Error('Passverktyget tog för lång tid att ladda. Försök igen.'));},45000);
  frame.addEventListener('load',function(){
   try{
    var win=workspaceWindow();
    if(!win)throw new Error('Passverktyget måste öppnas från samma webbplats.');
    connectLegacy(win);clearTimeout(expired);resolve(win);
   }catch(e){clearTimeout(expired);reject(e);}
  },{once:true});
  frame.addEventListener('error',function(){clearTimeout(expired);reject(new Error('Kunde inte ladda passverktyget.'));},{once:true});
  var url=new URL('archive/exercise.html',location.href);
  url.searchParams.set('embedded','1');
  url.searchParams.set('v','20260925-legacy-workspace-3');
  if(new URLSearchParams(location.search).get('user')==='maja')url.searchParams.set('user','maja');
  frame.src=url.href;
 }).catch(function(e){legacyReady=null;updateStatus(e.message);throw e;});
 return legacyReady;
}
function showWorkspace(tool){
 if(!dialog)makeDialog();
 activeTool=tool;
 $('field-workspace-title').textContent=actionTitles[tool]||'Passverktyg';
 updateStatus(frame&&legacyReady?'':'Laddar dina passverktyg…');
 if(!dialog.open)dialog.showModal();
}
function openTemplateEditor(win,id,date){
 var tpl=win.getTemplates().find(function(t){return String(t.id)===String(id);});
 if(!tpl){notice('Mallpasset finns inte längre.');return false;}
 win.fieldEmbeddedTemplateId=tpl.id;
 win.openWorkoutModal({skipBlank:true});
 win.document.getElementById('wk-type').value=tpl.type||tpl.name||'Övrigt';
 if(tpl.duration)win.document.getElementById('wk-dur').value=tpl.duration;
 var list=win.document.getElementById('ex-list');list.innerHTML='';
 (tpl.exercises||[]).forEach(function(ex){win.addExRow(ex);});
 if(!tpl.exercises||!tpl.exercises.length)win.addExRow();
 var wk=win.document.getElementById('wk-modal');
 wk.dataset.fieldEditingTemplate='1';
 var title=wk.querySelector('h2');if(title)title.textContent='Redigera mallpass';
 var footer=wk.querySelector('.modal-footer');
 var save=footer.querySelector('[onclick="saveWorkout()"]');if(save)save.hidden=true;
 var special=win.document.createElement('button');special.type='button';special.className='btn-primary';special.textContent='Spara ändringar i mall';
 special.addEventListener('click',function(){
  var before=win.getTemplates().find(function(t){return String(t.id)===String(id);});
  win.saveCurrentAsTemplate();
  var after=win.getTemplates().find(function(t){return String(t.id)===String(id);});
  if(after&&JSON.stringify(after)!==JSON.stringify(before)){win.closeModal('wk-modal');}
 });
 footer.appendChild(special);
 return true;
}
function selectTool(win,tool,button,date){
 var iso=date||selectedDate;win.document.documentElement.dataset.fieldWorkspace=tool;
 win.viewedMondayISO=monday(iso);
 if(tool!=='editTemplate')win.fieldEmbeddedTemplateId=null;
 switch(tool){
  case 'build':case 'editDay':win.openDayWorkoutBuilder(dayName(iso),iso);break;
  case 'start':
   var planned=win.getPlannedSessions()[iso];
   if(!planned||!(planned.exercises||[]).length){activeTool='build';$('field-workspace-title').textContent='Bygg pass';win.openDayWorkoutBuilder(dayName(iso),iso);}
   else win.startWorkoutSessionForDate(iso);
   break;
  case 'log':win.openWorkoutModal();if(iso){win.document.getElementById('wk-date').value=iso;}break;
  case 'editLog':win.editWorkout(Number(button.dataset.workoutId));break;
  case 'editExercise':win.editWorkoutExercise(Number(button.dataset.workoutId),Number(button.dataset.exerciseIndex));break;
  case 'week':win.openPlanModal();break;
  case 'weekTemplates':win.openTemplateModal();break;
  case 'records':win.openPRModal();break;
  case 'editRecord':
   var name=button.dataset.recordName,prs=win.getPRs(),value=Number(prs[name]||button.dataset.recordValue||0);
   win.openEditPR(name,value);break;
  case 'editTemplate':openTemplateEditor(win,button.dataset.templateId,iso);break;
  case 'startTemplate':
   var tpl=win.getTemplates().find(function(t){return String(t.id)===String(button.dataset.templateId);});
   if(!tpl){notice('Mallpasset finns inte längre.');return false;}
   var byDate=win.getPlannedSessions();
   byDate[iso]={type:tpl.type||tpl.name||'Träning',exercises:JSON.parse(JSON.stringify(tpl.exercises||[]))};
   win.savePlannedSessions(byDate);win.startWorkoutSessionForDate(iso);break;
  case 'goals':
   var main=win.document.getElementById('pulse-goals');
   if(!main)throw new Error('Målredigeringen kunde inte öppnas.');
   win.document.documentElement.dataset.fieldWorkspace='goals';
   win.refreshGoals();break;
  default:return false;
 }
 return true;
}
function runTool(tool,button){
 if(new URLSearchParams(location.search).get('demo')==='1'){notice('Exempelvyn kan inte ändras. Öppna sidan utan demo=1 för att redigera och spara pass.');return;}
 var date=button&&button.dataset.fieldDate||selectedDate;
 if(tool==='edit-template')tool='editTemplate';
 if(tool==='start-template')tool='startTemplate';
 if(tool==='edit-log')tool='editLog';
 if(tool==='edit-exercise')tool='editExercise';
 if(tool==='edit-record')tool='editRecord';
 if(tool==='edit-day'||tool==='start-day')tool=tool==='edit-day'?'editDay':'start';
 if(tool==='week-templates')tool='weekTemplates';
 if(!(tool in actionTitles)){notice('Okänt passverktyg.');return;}
 showWorkspace(tool);
 loadLegacy().then(function(win){
  if(!dialog.open)return;
  updateStatus('');
  if(tool==='goals'){$('field-workspace-container').dataset.goalMode='1';}else delete $('field-workspace-container').dataset.goalMode;
  var success=selectTool(win,tool,button,date);
  if(success===false){dialog.close();activeTool='';}
 }).catch(function(e){updateStatus(e.message);});
}
function renderTemplates(){
 var grid=$('field-template-grid');if(!grid)return;
 var all=read('templates',[]);
 grid.innerHTML=all.length?all.map(function(t){
  var count=(t.exercises||[]).length;
  return '<article class="field-template-card"><strong>'+escapeHtml(t.name||t.type||'Mallpass')+'</strong><p>'+escapeHtml(t.type||'Träning')+' · '+count+' övningar</p><div class="field-action-row">'+
   '<button type="button" class="field-action field-action--primary" data-field-action="start-template" data-template-id="'+escapeHtml(t.id)+'">Starta</button>'+
   '<button type="button" class="field-action" data-field-action="edit-template" data-template-id="'+escapeHtml(t.id)+'">Redigera</button></div></article>';
 }).join(''):'<p class="field-template-empty">Inga mallpass sparade ännu. Bygg ditt första pass.</p>';
}
function install(){
 renderTemplates();
 document.addEventListener('click',function(event){
  var date=event.target.closest('[data-day]');if(date)selectedDate=date.dataset.day;
  var action=event.target.closest('[data-field-action]');if(!action)return;
  event.preventDefault();
  var menu=action.closest('#field-menu');
  if(menu){menu.classList.remove('is-open');menu.setAttribute('aria-hidden','true');var toggle=$('menu-toggle');if(toggle)toggle.setAttribute('aria-expanded','false');}
  runTool(action.dataset.fieldAction,action);
 });
 window.addEventListener('firebase-sync',function(event){
  if(event.detail&&['ex_templates','ex_plannedSessions','ex_weekPlans'].includes(event.detail.key)){changed();}
 });
 var deep=new URLSearchParams(location.search).get('tool');
 if(deep&&['build','start','log','week','records','goals'].includes(deep))runTool(deep,null);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();