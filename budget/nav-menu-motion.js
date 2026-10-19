/* Shared menu geometry, keyboard behaviour and reversible motion. Menus never lock page scrolling. */
(function(){
'use strict';
if(window.MenuMotion)return;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const pending=new WeakMap();
function animate(el,opening,done){
 const previous=pending.get(el);if(previous){previous.cancel();pending.delete(el);}
 if(reduced()||!el.animate){done?.();return;}
 const motion=el.animate(opening?[{opacity:0,translate:'0 -6px'},{opacity:1,translate:'0 0'}]:[{opacity:1,translate:'0 0'},{opacity:0,translate:'0 -5px'}],{duration:opening?190:150,easing:'cubic-bezier(.22,1,.36,1)'});
 pending.set(el,motion);motion.finished.then(()=>{if(pending.get(el)!==motion)return;pending.delete(el);done?.();}).catch(()=>{});
}
function show(dialog,modal=false){pending.get(dialog)?.cancel();pending.delete(dialog);dialog.inert=false;if(!dialog.open)modal?dialog.showModal():dialog.show();animate(dialog,true);}
function close(dialog,done){if(!dialog?.open){done?.();return;}dialog.inert=true;animate(dialog,false,()=>{dialog.close();dialog.inert=false;done?.();});}
function closeDetails(details){if(!details?.open)return;const panel=[...details.children].find(x=>x.tagName!=='SUMMARY');if(!panel){details.open=false;return;}animate(panel,false,()=>{details.open=false;});}
const floating=[];
function anchor(panel,trigger){let entry=floating.find(x=>x.panel===panel);if(!entry){entry={panel,trigger};floating.push(entry);}entry.trigger=trigger;position(entry);}
window.MenuMotion={show,close,closeDetails,anchor};
const style=document.createElement('style');style.textContent=`
.nav-dropdown-wrapper>.nav-btn,.shopping-tools-menu>summary,.tools>summary,#menu-toggle{
 display:inline-flex!important;align-items:center!important;justify-content:center!important;width:42px!important;height:42px!important;min-height:42px!important;padding:0!important;border:1px solid #ffffff1c!important;border-radius:11px!important;background:#ffffff04!important;color:#c2cad4!important;cursor:pointer;list-style:none;transition:background .18s,color .18s,border-color .18s!important
}
.shopping-tools-menu>summary::-webkit-details-marker,.tools>summary::-webkit-details-marker{display:none}
.nav-dropdown-wrapper>.nav-btn svg,.shopping-tools-menu>summary svg,.tools>summary svg,#menu-toggle svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round}
.nav-dropdown-wrapper>.nav-btn[aria-expanded=true],.shopping-tools-menu[open]>summary,.tools[open]>summary,#menu-toggle[aria-expanded=true]{background:#fdba7410!important;border-color:#fdba7440!important;color:#fdba74!important}
.nav-dropdown-menu,.field-menu,.shared-tools-panel,.shopping-tools-menu>.header-right-top{
 box-sizing:border-box!important;border:1px solid #ffffff20!important;border-radius:14px!important;background:#161b22!important;color:#d4dbe4!important;box-shadow:0 14px 38px #0007!important;padding:6px!important;overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior:contain;min-width:0!important
}
.nav-dropdown-menu,.field-menu{display:block!important;opacity:0;visibility:hidden;pointer-events:none;transform:translateY(-6px)!important;animation:none!important;transition:opacity .16s ease,transform .20s cubic-bezier(.22,1,.36,1),visibility 0s .20s!important}
.nav-dropdown-menu:not(:popover-open),.field-menu:not(:popover-open){display:none!important}
.nav-dropdown-menu.show,.field-menu.is-open{opacity:1;visibility:visible;pointer-events:auto;transform:none!important;transition-delay:0s!important}
.nav-dropdown-menu>a,.nav-dropdown-menu>button,.field-menu>a,.shared-tools-panel>button,.shared-tools-panel>.file-button{display:flex!important;align-items:center;gap:10px;min-height:42px!important;margin:0!important;padding:10px 12px!important;border:0!important;border-radius:9px!important;background:transparent!important;color:#c9d1dc!important;text-align:left;font:500 13px/1.4 Inter,system-ui,sans-serif!important;text-decoration:none;box-sizing:border-box;width:100%;white-space:normal!important}
.nav-dropdown-menu .nav-icon{display:grid;place-items:center;flex:0 0 20px;width:20px;height:20px}
.nav-dropdown-menu .nav-icon svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.7}
.nav-dropdown-menu>a:hover,.nav-dropdown-menu>a.active,.field-menu>a:hover,.shared-tools-panel>button:hover{background:#fdba7410!important;color:#fdba74!important}
.tools[open]{background:transparent!important;border:0!important}.tools{position:relative}
@media(prefers-reduced-motion:reduce){.nav-dropdown-menu,.field-menu{transition:none!important}}
`;document.head.append(style);
const icon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
const entries=[];
function position(entry){const {panel,trigger}=entry;if(!trigger.isConnected)return;const r=trigger.getBoundingClientRect(),v=visualViewport,w=v?.width||innerWidth,h=v?.height||innerHeight,x=v?.offsetLeft||0,y=v?.offsetTop||0,width=Math.min(280,w-24),below=y+h-r.bottom-18,above=r.top-y-18,up=below<180&&above>below,max=Math.max(70,up?above:below);
 panel.style.setProperty('position','fixed','important');panel.style.setProperty('inset','auto','important');panel.style.setProperty('margin','0','important');panel.style.setProperty('width',width+'px','important');panel.style.setProperty('max-height',max+'px','important');panel.style.setProperty('left',Math.max(x+12,Math.min(r.right-width,x+w-width-12))+'px','important');panel.style.setProperty('top',(up?Math.max(y+12,r.top-8-Math.min(panel.scrollHeight,max)):Math.max(y+12,r.bottom+8))+'px','important');
}
function sync(entry){const {panel,trigger,details}=entry,open=details?details.open:panel.classList.contains(entry.openClass);trigger.setAttribute('aria-expanded',String(open));panel.inert=!open;
 if(open){clearTimeout(entry.timer);if(panel.showPopover&&!panel.matches(':popover-open'))panel.showPopover();position(entry);animate(panel,true);}
 else if(details){if(panel.matches(':popover-open'))panel.hidePopover();}
 else {entry.timer=setTimeout(()=>{if(!entry.isOpen()&&panel.matches(':popover-open'))panel.hidePopover();},reduced()?0:210);}
}
function setup(){
 document.querySelectorAll('.nav-dropdown-menu,.field-menu').forEach(panel=>{const trigger=panel.id==='field-menu'?document.getElementById('menu-toggle'):panel.parentElement.querySelector(':scope > button');if(!trigger)return;trigger.classList.add('nav-btn');trigger.innerHTML=icon;trigger.setAttribute('aria-label','Meny');trigger.setAttribute('aria-controls',panel.id);trigger.setAttribute('aria-haspopup','true');const entry={panel,trigger,openClass:panel.classList.contains('field-menu')?'is-open':'show'};entry.isOpen=()=>panel.classList.contains(entry.openClass);entry.dismiss=()=>{if(panel.id==='field-menu')window.dispatchEvent(new Event('pulse-field:close-menu'));else panel.classList.remove(entry.openClass);};panel.setAttribute('popover','manual');entries.push(entry);new MutationObserver(()=>sync(entry)).observe(panel,{attributes:true,attributeFilter:['class']});sync(entry);});
 document.querySelectorAll('.shopping-tools-menu,.tools').forEach(details=>{const trigger=details.querySelector('summary'),panel=details.querySelector('.header-right-top,.shared-tools-panel');if(!trigger||!panel)return;trigger.innerHTML=icon;trigger.setAttribute('aria-label','Fler alternativ');panel.setAttribute('popover','manual');const entry={panel,trigger,details,isOpen:()=>details.open,dismiss:()=>closeDetails(details)};entries.push(entry);details.addEventListener('toggle',()=>sync(entry));trigger.addEventListener('click',event=>{if(details.open){event.preventDefault();closeDetails(details);}});sync(entry);});
}
document.addEventListener('pointerdown',e=>entries.forEach(entry=>{if(entry.isOpen()&&!entry.panel.contains(e.target)&&!entry.trigger.contains(e.target))entry.dismiss();}));
document.addEventListener('click',e=>{for(const entry of entries)if(entry.isOpen()&&entry.panel.contains(e.target)&&e.target.closest(entry.details?'a,button':'a'))entry.dismiss();});
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;for(const entry of entries)if(entry.isOpen()){entry.dismiss();entry.trigger.focus({preventScroll:true});e.preventDefault();}});
let frame;const reposition=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{entries.filter(x=>x.isOpen()).forEach(position);floating.filter(x=>x.panel.open).forEach(position);});};window.addEventListener('scroll',reposition,{passive:true,capture:true});window.addEventListener('resize',reposition);visualViewport?.addEventListener('resize',reposition);visualViewport?.addEventListener('scroll',reposition);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
