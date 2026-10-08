(function(){
  'use strict';
  if(window.FamilyTodosUI)return;
  var store=window.FamilyTodos;
  if(!store)return;
  var MEMBERS=[['family','Familjen'],['markus','Markus'],['maja','Maja'],['melker','Melker'],['mila','Mila']];
  var COLORS={family:'#FBBF24',markus:'#38BDF8',maja:'#F9A8B8',melker:'#86EFAC',mila:'#F472B6'};
  var PRIORITY={normal:'Normal',important:'Viktig',urgent:'Brådskande'};
  var contexts={}, editingId=null;

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function opts(options,active){return options.map(function(o){return '<option value="'+esc(o[0])+'"'+(active===o[0]?' selected':'')+'>'+esc(o[1])+'</option>';}).join('');}
  function prioOpts(current){return opts(Object.keys(PRIORITY).map(function(k){return [k,PRIORITY[k]];}),current);}
  function memberOpts(value){return opts(MEMBERS,value);}
  function dueInfo(item) {
    if(!item.dueDate)return '';
    var d=item.dueDate,overdue=!item.done&&d<today(),now=d===today();
    var label=overdue?'Försenad · ':now?'Idag · ':'';
    return '<span class="ft-due'+(overdue?' ft-late':now?' ft-today':'')+'">'+label+esc(d.slice(8,10)+'/'+d.slice(5,7))+'</span>';
  }
  function row(t,mode) {
    var isEdit=editingId===t.id;
    var assigned=MEMBERS.find(function(m){return m[0]===t.member;});
    var priority=t.priority!=='normal'?'<span class="ft-priority '+t.priority+'">'+esc(PRIORITY[t.priority])+'</span>':'';
    var checked=t.done?' is-done':'';
    var showMeta=mode!=='home'||t.member!=='family'||t.priority!=='normal'||!!t.dueDate;
    var content='<div class="ft-task'+checked+'" data-id="'+esc(t.id)+'" style="--ft-member:'+COLORS[t.member]+'">'+
      '<button type="button" class="ft-check" data-act="toggle" data-id="'+esc(t.id)+'" aria-label="'+(t.done?'Återaktivera':'Klarmarkera')+' '+esc(t.text)+'">'+(t.done?'✓':'')+'</button>'+
      '<div class="ft-task-body"><button type="button" class="ft-task-title" data-act="edit" data-id="'+esc(t.id)+'">'+esc(t.text)+'</button>'+
      (showMeta?'<div class="ft-task-meta"><span class="ft-member-dot"></span><span>'+esc(assigned?assigned[1]:'Familjen')+'</span>'+priority+dueInfo(t)+'</div>':'')+'</div>'+
      (mode==='home'?'':'<button class="ft-row-edit" type="button" data-act="edit" data-id="'+esc(t.id)+'" aria-label="Redigera">⋯</button>')+
      '</div>';
    if(isEdit){
      content+='<form class="ft-editor" data-id="'+esc(t.id)+'">'+
        '<label>Uppgift<input name="text" type="text" maxlength="240" value="'+esc(t.text)+'" required></label>'+
        '<div class="ft-editor-fields"><label>Ansvarig<select name="member">'+memberOpts(t.member)+'</select></label>'+
        '<label>Prioritet<select name="priority">'+prioOpts(t.priority)+'</select></label>'+
        '<label>Förfallodatum<input name="dueDate" type="date" value="'+esc(t.dueDate||'')+'"></label></div>'+
        '<div class="ft-editor-actions"><button type="submit" class="ft-primary">Spara</button>'+
        '<button type="button" data-act="cancel">Avbryt</button>'+
        '<button type="button" class="ft-danger" data-act="delete" data-id="'+esc(t.id)+'">Radera</button></div></form>';
    }
    return content;
  }
  function build(root,mode) {
    var compact=mode==='home',shop=mode==='shopping';
    root.classList.add('family-todos', 'ft-'+mode);
    root.dataset.familyTodosMode=mode;
    if (compact) {
      // Home deliberately reuses the native shopping widget controls and spacing.
      // Optional metadata stays collapsed instead of occupying permanent rows.
      root.innerHTML='<div class="widget-head ft-home-head">'+
        '<div class="widget-title">Att göra</div>'+
        '<div class="ft-home-head-actions"><button type="button" class="ft-undo" data-act="undo" title="Ångra senaste ändring" aria-label="Ångra" disabled>↶</button>'+
        '<div class="badge" data-ft-count>0 kvar</div></div></div>'+
        '<form class="ft-add-form" data-ft-add>'+
        '<div class="shopping-input-row ft-home-input-row">'+
        '<input class="shopping-input" type="text" name="text" maxlength="240" placeholder="Lägg till uppgift..." aria-label="Ny uppgift" autocomplete="off" required>'+
        '<button type="submit" class="btn ft-home-add-btn">Lägg till</button></div>'+
        '<button type="button" class="ft-options-toggle" data-act="options" aria-expanded="false" aria-controls="family-todo-home-options">+ Ansvarig, prioritet och datum</button>'+
        '<div class="ft-add-options" id="family-todo-home-options" hidden>'+
        '<label>Ansvarig<select name="member" aria-label="Ansvarig">'+memberOpts('family')+'</select></label>'+
        '<label>Prioritet<select name="priority" aria-label="Prioritet">'+prioOpts('normal')+'</select></label>'+
        '<label>Förfallodatum<input type="date" name="dueDate" aria-label="Förfallodatum"></label></div></form>'+
        '<div class="ft-list" data-ft-list aria-live="polite"></div>'+
        '<a class="tap-hint ft-bottom-link" href="shopping.html?mode=todo">Visa alla uppgifter <span aria-hidden="true">↗</span></a>';
    } else {
    root.innerHTML='<div class="ft-head"><div><div class="ft-title">'+(compact?'Att göra':shop?'Familjens att-göra-lista':'Att göra')+'</div>'+
      '<div class="ft-subtitle" data-ft-count>Hämtar uppgifter…</div></div>'+
      '<div class="ft-head-actions"><button type="button" class="ft-undo" data-act="undo" title="Ångra senaste ändring" aria-label="Ångra">↶</button>'+
      (compact?'<a class="ft-full-link" href="shopping.html?mode=todo" aria-label="Visa alla uppgifter">↗</a>':'')+'</div></div>'+
      '<form class="ft-add-form" data-ft-add><div class="ft-add-main"><input type="text" name="text" maxlength="240" placeholder="Ny uppgift…" aria-label="Ny uppgift" required autocomplete="off">'+
      '<button type="submit" class="ft-primary ft-plus" aria-label="Lägg till uppgift">＋</button></div>'+
      '<div class="ft-add-options"><select name="member" aria-label="Ansvarig">'+memberOpts('family')+'</select>'+
      '<select name="priority" aria-label="Prioritet">'+prioOpts('normal')+'</select>'+
      '<input type="date" name="dueDate" aria-label="Förfallodatum"></div></form>'+
      (!compact?'<div class="ft-filters"><select data-ft-member aria-label="Filtrera på ansvarig"><option value="all">Alla ansvariga</option>'+memberOpts('family')+'</select>'+
      '<select data-ft-status aria-label="Visa uppgifter"><option value="all">Aktiva och klara</option><option value="active">Aktiva</option><option value="done">Klarmarkerade</option></select></div>':'')+
      '<div class="ft-list" data-ft-list aria-live="polite"></div>'+
      (compact?'<a class="ft-bottom-link" href="shopping.html?mode=todo">Visa alla uppgifter <span aria-hidden="true">↗</span></a>':'');
    }
    var form=root.querySelector('[data-ft-add]');
    form.addEventListener('submit',function(event){
      event.preventDefault();
      var data=new FormData(form);
      var id=store.add(data.get('text'),data.get('member'),data.get('priority'),data.get('dueDate'));
      if(id){form.elements.text.value='';form.elements.text.focus();}
    });
    root.addEventListener('click',function(event){
      var target=event.target.closest('[data-act]');if(!target||!root.contains(target))return;
      var id=target.dataset.id,action=target.dataset.act;
      if(action==='options'){
        var panel=root.querySelector('.ft-add-options');
        var opening=!!panel.hidden;
        panel.hidden=!opening;
        target.setAttribute('aria-expanded',String(opening));
        return;
      }
      if(action==='toggle'){store.toggle(id);return;}
      if(action==='undo'){editingId=null;store.undo();return;}
      if(action==='edit'){editingId=editingId===id?null:id;render(mode);var input=root.querySelector('.ft-editor input[name="text"]');if(input)input.focus();return;}
      if(action==='cancel'){editingId=null;render(mode);return;}
      if(action==='delete'){if(!window.confirm('Radera uppgiften?'))return;editingId=null;store.remove(id);return;}
    });
    root.addEventListener('submit',function(event){
      if(!event.target.matches('.ft-editor'))return;
      event.preventDefault();
      var form=event.target,id=form.dataset.id,formData=new FormData(form);
      if(!String(formData.get('text')||'').trim())return;
      editingId=null;
      store.update(id,{text:formData.get('text'),member:formData.get('member'),
        priority:formData.get('priority'),dueDate:formData.get('dueDate')});
    });
    root.addEventListener('keydown',function(event){
      if(event.key==='Escape'&&editingId){editingId=null;render(mode);}
    });
    root.querySelectorAll('[data-ft-member],[data-ft-status]').forEach(function(input){input.addEventListener('change',function(){render(mode);});});
  }
  function render(mode){
    var root=contexts[mode];if(!root)return;
    var listRoot=root.querySelector('[data-ft-list]');if(!listRoot)return;
    // Keep inline editing text and focus intact during incoming Firebase updates.
    if(editingId&&root.contains(document.activeElement)&&document.activeElement.closest('.ft-editor'))return;
    var all=store.list(),active=all.filter(function(t){return !t.done;}).length;
    var sync=store.status();
    var counter=root.querySelector('[data-ft-count]');
    counter.textContent=mode==='home' ? active+' kvar'+(sync==='offline'?' · offline':'') : active+' kvar · '+all.length+' totalt'+(sync==='offline'?' · Offline':sync==='connecting'?' · Synkar…':'');
    if(mode==='home')counter.title=active+' kvar · '+all.length+' totalt';
    var undo=root.querySelector('[data-act="undo"]');if(undo)undo.disabled=!store.canUndo();
    var filtered=all.slice();
    if(mode==='home')filtered=filtered.slice(0,5);
    else{
      var owner=root.querySelector('[data-ft-member]'),status=root.querySelector('[data-ft-status]');
      if(owner&&owner.value!=='all')filtered=filtered.filter(function(t){return t.member===owner.value;});
      if(status&&status.value==='active')filtered=filtered.filter(function(t){return !t.done;});
      if(status&&status.value==='done')filtered=filtered.filter(function(t){return t.done;});
    }
    listRoot.innerHTML=filtered.length?filtered.map(function(t){return row(t,mode);}).join(''):
      '<div class="ft-empty">'+(all.length?'Inga uppgifter matchar filtret.':mode==='home'?'Inga uppgifter ännu. Lägg till den första här.':'Inga uppgifter ännu. Lägg till den första ovan.')+'</div>';
  }
  function installStyles(){
    if(document.getElementById('family-todos-v1-css'))return;
    var style=document.createElement('style');style.id='family-todos-v1-css';
    style.textContent=`
      .family-todos{--ft-orange:#FDBA74;min-width:0;color:var(--text,#f0f6fc);font-family:Inter,system-ui,sans-serif}
      .family-todos *{box-sizing:border-box}.family-todos button,.family-todos input,.family-todos select{font:inherit}
      .ft-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}.ft-title{font-size:15px;font-weight:780;letter-spacing:.15px}.ft-subtitle{font-size:11px;color:var(--text-sec,#94a3b8);margin-top:2px}
      .ft-head-actions{display:flex;gap:8px;align-items:center}.ft-head-actions button,.ft-full-link{border:1px solid rgba(253,186,116,.18);border-radius:10px;background:rgba(253,186,116,.05);color:var(--accent,#fdbA74);display:grid;place-items:center;min-width:30px;height:30px;cursor:pointer;text-decoration:none}
      .ft-undo:disabled{opacity:.3;cursor:default}.ft-add-form{display:grid;gap:7px;margin-bottom:12px}
      .ft-add-main{display:grid;grid-template-columns:minmax(0,1fr) 38px;gap:7px;align-items:center}
      .family-todos input,.family-todos select{min-width:0;width:100%;border:1px solid var(--border,rgba(255,255,255,.1));border-radius:9px;background:var(--bg3,#202735);color:var(--text,#f0f6fc);padding:9px 10px;font-size:13px;outline:none;min-height:38px}
      .family-todos input:focus,.family-todos select:focus{border-color:var(--accent,#fdbA74);box-shadow:0 0 0 2px rgba(253,186,116,.10)}
      .ft-add-options{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1.2fr);gap:6px}
      .ft-add-options select,.ft-add-options input{font-size:11px;min-height:33px;height:33px;padding:5px 7px}
      .ft-primary{border:1px solid rgba(253,186,116,.42);border-radius:9px;color:#0f1219;background:linear-gradient(135deg,#fdba74,#fb923c);font-weight:750!important;cursor:pointer;padding:8px 12px}
      .ft-plus{height:38px;font-size:21px!important;line-height:1}
      .ft-filters{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:12px 0}.ft-filters select{font-size:11px;min-height:33px}
      .ft-list{display:grid;gap:0;max-height:550px;overflow-y:auto;overscroll-behavior:contain}.ft-home .ft-list{max-height:365px}
      .ft-task{display:grid;grid-template-columns:23px minmax(0,1fr) auto;gap:9px;align-items:start;padding:10px 2px 9px;border-bottom:1px solid rgba(255,255,255,.065)}
      .ft-task:last-child{border-bottom:0}.ft-check{height:19px;width:19px;display:grid;place-items:center;border-radius:6px;border:1.5px solid var(--ft-member);color:#111827;background:transparent;margin-top:2px;font-size:13px;font-weight:900;cursor:pointer}
      .ft-task.is-done .ft-check{background:var(--ft-member);box-shadow:0 0 12px color-mix(in srgb,var(--ft-member) 24%,transparent)}
      .ft-task-body{min-width:0}.ft-task-title{display:block;text-align:left;width:100%;padding:0;margin:0;border:0;background:none;color:var(--text,#fff);font-size:13px;line-height:1.35;font-weight:610;overflow-wrap:anywhere;cursor:pointer}
      .ft-task.is-done .ft-task-title{text-decoration:line-through;color:var(--text-sec,#94a3b8)}
      .ft-task-meta{display:flex;gap:6px;align-items:center;flex-wrap:wrap;color:var(--text-sec,#94a3b8);font-size:10px;margin-top:4px}
      .ft-member-dot{width:6px;height:6px;border-radius:50%;background:var(--ft-member);box-shadow:0 0 9px var(--ft-member)}
      .ft-priority{font-size:10px;border-radius:6px;padding:1px 5px;background:rgba(255,255,255,.04)}
      .ft-priority.important{color:#fbbf24}.ft-priority.urgent{color:#fb7185;background:rgba(251,113,133,.08)}
      .ft-due{color:#93c5fd}.ft-due.ft-late{color:#fb7185}.ft-due.ft-today{color:#fbbf24}
      .ft-row-edit{border:0;background:transparent;color:var(--text-sec,#94a3b8);font-size:19px;cursor:pointer;padding:0 5px}
      .ft-editor{margin:5px 0 11px 30px;padding:12px;border-radius:12px;border:1px solid rgba(253,186,116,.23);background:rgba(253,186,116,.035);display:grid;gap:10px}
      .ft-editor label{display:grid;gap:4px;font-size:10px;color:var(--text-sec,#94a3b8)}
      .ft-editor-fields{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ft-editor-fields label:last-child{grid-column:1 / -1}
      .ft-editor-actions{display:flex;gap:6px;flex-wrap:wrap}.ft-editor-actions button{padding:8px 11px;border-radius:8px;border:1px solid var(--border,rgba(255,255,255,.1));background:rgba(255,255,255,.03);color:var(--text,#fff);cursor:pointer;font-size:12px}
      .ft-editor-actions .ft-primary{color:#10151b;background:linear-gradient(135deg,#fdba74,#fb923c)}.ft-editor-actions .ft-danger{margin-left:auto;color:#fb7185}
      .ft-empty{color:var(--text-sec,#94a3b8);font-size:12px;padding:12px 3px}
      .ft-bottom-link{display:flex;justify-content:flex-end;gap:8px;margin-top:10px;font-size:11px;text-decoration:none;color:var(--accent,#fdba74)}
      .ft-shopping{max-width:1040px;margin:0 auto;padding:22px 24px;background:var(--bg2,#161b22);border:1px solid var(--border,rgba(255,255,255,.08));border-radius:18px}
      .ft-shopping .ft-title{font-size:20px}.ft-shopping .ft-list{max-height:none}
      #family-todo-shopping{display:none}
      html[data-list-mode="todo"] .shopping-dashboard{display:none!important}
      html[data-list-mode="todo"] #family-todo-shopping{display:block}
      .ft-cal-day-indicator{display:inline-block;width:5px;height:5px;background:#fbbf24;box-shadow:0 0 9px #fbbf24;border-radius:50%;vertical-align:middle;margin-left:5px}
      .ft-calendar-reminder{margin:8px 0;padding:8px;border-left:2px solid #fbbf24;background:rgba(251,191,36,.04);border-radius:5px;font-size:12px}
      @media(max-width:520px){.ft-shopping{padding:14px 11px;border-radius:12px}.ft-add-options{grid-template-columns:1fr 1fr}.ft-add-options input{grid-column:1 / -1}.ft-editor-fields{grid-template-columns:1fr}.ft-editor-fields label:last-child{grid-column:auto}.family-todos input,.family-todos select{font-size:16px}.ft-add-options select,.ft-add-options input,.ft-filters select{font-size:14px;min-height:39px;height:39px}.ft-shopping .ft-title{font-size:17px}}

      /* Home: match #shopping-widget instead of reusing the full-page form. */
      #family-todo-home.ft-home{min-width:0}
      #family-todo-home.ft-home .widget-head{margin-bottom:12px}
      #family-todo-home.ft-home .widget-title{font-size:12px;letter-spacing:.8px;line-height:1.4;font-weight:700;text-transform:uppercase;color:#FDBA74}
      #family-todo-home.ft-home .ft-home-head-actions{display:flex;align-items:center;gap:7px}
      #family-todo-home.ft-home .badge{font-size:11px;white-space:nowrap}
      #family-todo-home.ft-home .ft-undo{width:25px;height:25px;min-width:25px;border:0;border-radius:7px;background:none;color:var(--text-sec,#8B949E);font-size:17px;cursor:pointer}
      #family-todo-home.ft-home .ft-undo:disabled{display:none}
      #family-todo-home.ft-home .ft-undo:not(:disabled):hover{color:var(--accent,#FDBA74)}
      #family-todo-home.ft-home .ft-add-form{display:block;margin-bottom:0}
      #family-todo-home.ft-home .shopping-input-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;width:100%;margin-bottom:0}
      #family-todo-home.ft-home .shopping-input{background:transparent;min-width:0;border-radius:8px;padding:9px 10px;min-height:0;font-size:13px}
      #family-todo-home.ft-home .shopping-input::placeholder{font-size:13px;color:var(--text-sec,#8B949E)}
      #family-todo-home.ft-home .btn{min-height:0;padding:8px 12px;font-size:12px;font-weight:700;white-space:nowrap;border-radius:8px}
      #family-todo-home.ft-home .ft-options-toggle{display:inline-block;margin:7px 0 0;padding:2px 0;border:0;background:none;color:var(--text-sec,#8B949E);font-size:11px;line-height:1.3;text-align:left;cursor:pointer}
      #family-todo-home.ft-home .ft-options-toggle[aria-expanded="true"]{color:var(--accent,#FDBA74)}
      #family-todo-home.ft-home .ft-add-options[hidden]{display:none!important}
      #family-todo-home.ft-home .ft-add-options{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;margin:10px 0 0;padding:10px;border-radius:9px;border:1px solid var(--border,rgba(255,255,255,.08));background:rgba(255,255,255,.018)}
      #family-todo-home.ft-home .ft-add-options label{display:grid;gap:4px;min-width:0;font-size:11px;color:var(--text-sec,#8B949E)}
      #family-todo-home.ft-home .ft-add-options label:last-child{grid-column:1/-1}
      #family-todo-home.ft-home .ft-add-options input,#family-todo-home.ft-home .ft-add-options select{min-height:35px;height:35px;max-width:100%;background:transparent;border-radius:7px;padding:5px 7px;font-size:12px}
      #family-todo-home.ft-home .ft-list{max-height:280px;overflow:auto;margin-top:5px}
      #family-todo-home.ft-home .ft-empty{padding:12px 2px 6px;font-size:13px;color:var(--text-sec,#8B949E)}
      #family-todo-home.ft-home .ft-task{grid-template-columns:18px minmax(0,1fr);gap:8px;align-items:center;padding:8px 3px;border-bottom:1px solid var(--border,rgba(255,255,255,.07))}
      #family-todo-home.ft-home .ft-check{width:16px;height:16px;margin:0;border-radius:4px;font-size:11px}
      #family-todo-home.ft-home .ft-task-title{font-size:13px;font-weight:500;line-height:1.4}
      #family-todo-home.ft-home .ft-task-meta{margin-top:2px}
      #family-todo-home.ft-home .ft-bottom-link{display:inline-flex;justify-content:flex-start;gap:7px;width:auto;margin-top:10px;font-size:11px;line-height:1.5;color:var(--text-sec,#8B949E);text-decoration:none}
      #family-todo-home.ft-home .ft-bottom-link:hover{color:var(--accent,#FDBA74)}
      #family-todo-home.ft-home .ft-editor{margin:8px 0 12px 20px;padding:10px}
      @media(max-width:520px){
        #family-todo-home.ft-home .shopping-input{font-size:16px}
        #family-todo-home.ft-home .shopping-input::placeholder{font-size:13px}
        #family-todo-home.ft-home .ft-add-options select,#family-todo-home.ft-home .ft-add-options input{min-height:38px;height:38px;font-size:16px}
      }

      @media(prefers-reduced-motion:reduce){.family-todos *{transition:none!important}}
    `;
    document.head.appendChild(style);
  }
  function decorateCalendar(){
    if(!contexts.calendar)return;
    var grid=document.getElementById('cal-grid');if(!grid)return;
    var dates={};store.list().forEach(function(t){if(!t.done&&t.dueDate)dates[t.dueDate]=true;});
    grid.querySelectorAll('.cal-cell[data-date]').forEach(function(cell){
      var old=cell.querySelector('.ft-cal-day-indicator');
      if(old)old.remove();
      if(dates[cell.dataset.date]){
        var marker=document.createElement('span');marker.className='ft-cal-day-indicator';marker.title='Att göra: förfallodatum';
        var num=cell.querySelector('.cal-num');if(num)num.appendChild(marker);
      }
    });
  }
  function enhanceCalendar(){
    var grid=document.getElementById('cal-grid');
    if(grid&&'MutationObserver'in window)new MutationObserver(decorateCalendar).observe(grid,{childList:true});
    if(typeof window.renderDayEvents==='function'&&!window.renderDayEvents.__familyTodosEnhanced){
      var old=window.renderDayEvents;
      window.renderDayEvents=function(date){
        old(date);
        var list=document.getElementById('day-events-list');if(!list)return;
        var tasks=store.list().filter(function(t){return !t.done&&t.dueDate===date;});
        if(tasks.length){var empty=list.querySelector('.empty-sidebar');if(empty)empty.remove();}
        tasks.forEach(function(t){
          var reminder=document.createElement('div');reminder.className='ft-calendar-reminder';
          reminder.textContent='Att göra · '+t.text+' · '+(PRIORITY[t.priority]||'Normal');
          list.appendChild(reminder);
        });
      };
      window.renderDayEvents.__familyTodosEnhanced=true;
    }
    store.subscribe(function(){decorateCalendar();if(window.selectedDate&&typeof window.renderDayEvents==='function')window.renderDayEvents(window.selectedDate);});
  }
  function mount(){
    installStyles();
    var home=document.getElementById('family-todo-home');
    var calendar=document.getElementById('family-todo-calendar');
    var shopping=document.getElementById('family-todo-shopping');
    if(home){contexts.home=home;build(home,'home');}
    if(calendar){contexts.calendar=calendar;build(calendar,'calendar');enhanceCalendar();}
    if(shopping){contexts.shopping=shopping;build(shopping,'shopping');}
    store.subscribe(function(){Object.keys(contexts).forEach(render);});
  }
  window.FamilyTodosUI={render:render};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();