(function(){
  'use strict';
  if(!/\/exercise\.html$/i.test(window.location.pathname))return;

  function text(v){return String(v||'').trim().toLocaleLowerCase('sv-SE');}

  function addStyles(){
    if(document.getElementById('exercise-shell-v13-style'))return;
    var s=document.createElement('style');
    s.id='exercise-shell-v13-style';
    s.textContent=`
      .week-toolbar{flex-wrap:nowrap!important}
      .week-toolbar>.btn-sm[onclick*="goToCurrentWeek"]{display:none!important}
      .week-inline-actions-v13{display:flex;align-items:center;gap:6px;margin-left:auto;flex:0 0 auto}
      .week-inline-actions-v13 .btn-sm{white-space:nowrap}

      html body .goals-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}
      html body .goals-grid>.goal-card.goal-pass-week-legacy-v13{display:none!important}
      html body .goals-grid>.goal-card.vo2-goal-source-v13{display:block!important}
      html body .goals-grid>.goal-vo2-chart-v13{display:none!important}
      html body .goal-vo2-chart-v13 h3{margin-bottom:10px;color:#34D399}
      html body .goal-vo2-chart-v13 .bw-row{display:none!important}
      html body .goal-vo2-chart-v13 .chart-area{height:190px}

      .vo2-goal-line-v13{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 10px;padding:6px 0 7px;border-bottom:1px solid rgba(255,255,255,.055)}
      .vo2-goal-line-v13 label{color:#FBBF24;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.55px;white-space:nowrap}
      .vo2-goal-line-v13 input{width:62px;height:30px;padding:4px 7px;border:1px solid rgba(251,191,36,.28);border-radius:7px;background:rgba(251,191,36,.055);color:#FBBF24;outline:none;text-align:center;font:750 11px/1 'Inter',sans-serif}
      .vo2-goal-line-v13 input:focus{border-color:rgba(251,191,36,.62);box-shadow:0 0 0 2px rgba(251,191,36,.08)}

      html body #day-workout-modal #pretimer-builder-v2,
      html body #day-workout-modal #between-set-global-editor-v2{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important}
      #day-workout-modal #between-exercise-toggle-panel-v7.builder-toggle-cluster-v13{min-width:132px!important;min-height:0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;display:flex!important;align-items:flex-start!important;justify-content:flex-end!important;gap:12px!important}
      .builder-toggle-unit-v13{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:5px;min-width:55px}
      .builder-toggle-label-v13{color:#8B949E;font-size:8px;line-height:1.05;font-weight:800;letter-spacing:.25px;text-align:center;white-space:nowrap}
      #between-exercise-toggle-panel-v7.builder-toggle-cluster-v13 .between-switch-v7,
      #between-exercise-toggle-panel-v7.builder-toggle-cluster-v13 .pretimer-switch{width:40px!important;height:22px!important;padding:2px!important;margin:0!important;flex:0 0 auto!important}
      #between-exercise-toggle-panel-v7.builder-toggle-cluster-v13 .between-switch-v7::after,
      #between-exercise-toggle-panel-v7.builder-toggle-cluster-v13 .pretimer-switch::after{width:16px!important;height:16px!important}
      #between-exercise-toggle-panel-v7.builder-toggle-cluster-v13 .between-switch-v7[aria-pressed="true"]::after,
      #between-exercise-toggle-panel-v7.builder-toggle-cluster-v13 .pretimer-switch[aria-pressed="true"]::after{transform:translateX(18px)!important}

      .exercise-user-option[data-user="markus"].active{background:rgba(56,189,248,.14)!important;color:#38BDF8!important;box-shadow:inset 0 0 0 1px rgba(56,189,248,.42)!important}
      .exercise-user-option[data-user="maja"].active{background:rgba(244,114,182,.15)!important;color:#F472B6!important;box-shadow:inset 0 0 0 1px rgba(244,114,182,.46)!important}

      @media(max-width:768px){
        html body .goals-grid{grid-template-columns:1fr!important}
        html body .goals-grid>.goal-vo2-chart-v13{grid-column:1!important;padding:15px}
        html body .goal-vo2-chart-v13 .chart-area{height:205px}
      }
      @media(max-width:600px){
        .week-toolbar{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:center!important;gap:5px!important;width:100%!important}
        .week-toolbar .week-nav{flex:1 1 auto!important;min-width:0!important;width:auto!important;gap:5px!important}
        .week-toolbar .week-nav-copy{min-width:0!important;width:auto!important;flex:1 1 auto!important}
        .week-inline-actions-v13{gap:4px}
        .week-inline-actions-v13 .btn-sm{padding:6px 7px!important;font-size:9px!important}
        #day-workout-modal .builder-week-between-v7{grid-template-columns:minmax(0,1fr) auto!important;column-gap:8px!important;row-gap:0!important}
        #day-workout-modal #between-exercise-toggle-panel-v7.builder-toggle-cluster-v13{grid-column:2!important;min-width:124px!important;gap:8px!important}
        .builder-toggle-unit-v13{min-width:54px;gap:4px}
        .builder-toggle-label-v13{font-size:7.5px}
      }
      @media(max-width:380px){
        .week-inline-actions-v13 .btn-sm{padding:5px 5px!important;font-size:8px!important}
        #day-workout-modal .builder-week-between-v7{grid-template-columns:minmax(0,1fr) 118px!important;column-gap:6px!important}
        #day-workout-modal #between-exercise-toggle-panel-v7.builder-toggle-cluster-v13{grid-column:2!important;min-width:118px!important;gap:6px!important}
        .builder-toggle-unit-v13{min-width:52px}
        .builder-toggle-label-v13{font-size:7px;letter-spacing:0}
      }
    `;
    document.head.appendChild(s);
  }

  function arrangeWeekToolbar(){
    var toolbar=document.querySelector('.week-toolbar');
    if(!toolbar)return;

    Array.prototype.slice.call(toolbar.children).forEach(function(child){
      if(child.tagName==='BUTTON'&&text(child.textContent)==='denna vecka')child.remove();
    });

    if(document.getElementById('week-inline-actions-v13'))return;
    var header=Array.prototype.slice.call(document.querySelectorAll('.section-hdr')).find(function(node){
      var h2=node.querySelector('h2');
      return h2&&text(h2.textContent)==='veckoplan';
    });
    if(!header)return;
    var buttons=Array.prototype.slice.call(header.querySelectorAll('button')).filter(function(button){
      var t=text(button.textContent);return t==='redigera'||t==='mallpass';
    });
    if(!buttons.length)return;
    var actions=document.createElement('div');
    actions.id='week-inline-actions-v13';
    actions.className='week-inline-actions-v13';
    buttons.forEach(function(button){actions.appendChild(button);});
    toolbar.appendChild(actions);
  }

  function goalValue(){
    try{
      if(typeof window.getGoals==='function'){
        var goals=window.getGoals()||{};
        var v=Number(goals.vo2Goal);
        if(isFinite(v))return v;
      }
    }catch(_){}
    var legacy=document.getElementById('g3-goal');
    var fallback=Number(legacy&&legacy.value);
    return isFinite(fallback)?fallback:45;
  }

  function saveGoalValue(value){
    try{
      var goals=typeof window.getGoals==='function'?(window.getGoals()||{}):{};
      goals.vo2Goal=value;
      if(window.DB&&typeof window.DB.set==='function')window.DB.set('goals',goals);
      else localStorage.setItem('ex_goals',JSON.stringify(goals));
    }catch(_){}
    var legacy=document.getElementById('g3-goal');
    if(legacy)legacy.value=value;
  }

  function syncGoalInput(){
    var input=document.getElementById('vo2-goal-line-v13');
    if(!input||document.activeElement===input)return;
    var v=goalValue();
    if(isFinite(v)&&Number(input.value)!==v)input.value=String(v);
  }

  function ensureGoalControl(card){
    if(!card)return;
    if(document.getElementById('vo2-goal-line-v13')){syncGoalInput();return;}
    var area=card.querySelector('.chart-area');
    if(!area)return;
    var line=document.createElement('div');
    line.className='vo2-goal-line-v13';
    line.innerHTML='<label for="vo2-goal-line-v13">Mål VO₂ max</label><input id="vo2-goal-line-v13" type="number" min="20" max="80" step="0.1" inputmode="decimal">';
    card.insertBefore(line,area);
    var input=line.querySelector('input');
    input.value=String(goalValue());
    input.addEventListener('change',function(){
      var v=Number(input.value);
      if(!isFinite(v)||v<20||v>80){syncGoalInput();return;}
      saveGoalValue(v);
      try{if(typeof window.refreshGoals==='function')window.refreshGoals();}catch(_){}
      try{if(typeof window.renderCharts==='function')window.renderCharts();}catch(_){}
    });
  }

  function arrangeGoals(){
    var grid=document.querySelector('.goals-grid');
    if(!grid)return;
    var g1=document.getElementById('g1-goal');
    var g1Card=g1&&g1.closest?g1.closest('.goal-card'):null;
    if(g1Card)g1Card.classList.add('goal-pass-week-legacy-v13');
    var g3=document.getElementById('g3-goal');
    var g3Card=g3&&g3.closest?g3.closest('.goal-card'):null;
    if(g3Card){
      g3Card.classList.add('vo2-goal-source-v13');
      g3Card.classList.add('goal-vo2-chart-v13');
      g3Card.style.display='block';
    }

    var canvas=document.getElementById('chart-bw');
    var card=canvas&&canvas.closest?canvas.closest('.chart-card'):null;
    var g2=document.getElementById('g2-goal');
    var runCard=g2&&g2.closest?g2.closest('.goal-card'):null;
    if(!card)return;
    card.classList.add('goal-vo2-chart-v13');
    if(card.parentElement!==grid){
      if(runCard&&runCard.parentElement===grid)runCard.insertAdjacentElement('afterend',card);
      else grid.appendChild(card);
    }
    ensureGoalControl(card);
  }

  function compactBuilderControls(){
    var modal=document.getElementById('day-workout-modal');
    if(!modal||!modal.classList.contains('show'))return false;
    var panel=document.getElementById('between-exercise-toggle-panel-v7');
    var betweenButton=panel&&panel.querySelector('[data-global-toggle-v7]');
    var timerButton=document.getElementById('pretimer-builder-switch-v2');
    if(!panel||!betweenButton||!timerButton)return false;
    if(panel.dataset.compactTogglesV13==='1')return true;

    betweenButton.remove();timerButton.remove();panel.innerHTML='';
    panel.classList.add('builder-toggle-cluster-v13');panel.dataset.compactTogglesV13='1';
    var a=document.createElement('div');a.className='builder-toggle-unit-v13';a.innerHTML='<span class="builder-toggle-label-v13">Mellanövningar</span>';a.appendChild(betweenButton);
    var b=document.createElement('div');b.className='builder-toggle-unit-v13';b.innerHTML='<span class="builder-toggle-label-v13">5 s starttimer</span>';b.appendChild(timerButton);
    panel.appendChild(a);panel.appendChild(b);
    return true;
  }

  function scheduleBuilderCompact(){
    var attempts=0;
    function run(){attempts++;if(compactBuilderControls()||attempts>=12)return;setTimeout(run,50);}
    run();
  }

  function prepare(){
    addStyles();
    arrangeWeekToolbar();
    arrangeGoals();
    syncGoalInput();
    if(document.getElementById('day-workout-modal')&&document.getElementById('day-workout-modal').classList.contains('show'))scheduleBuilderCompact();
  }

  addStyles();
  document.addEventListener('click',function(event){
    var button=event.target&&event.target.closest?event.target.closest('button'):null;
    if(!button)return;
    var t=text(button.textContent);
    if(t==='redigera' || t.indexOf('passupplägg')>=0)setTimeout(scheduleBuilderCompact,0);
  },true);
  document.addEventListener('change',function(event){
    if(event.target&&event.target.id==='day-workout-date')setTimeout(scheduleBuilderCompact,0);
  });

  window.__exerciseShellV13={prepare:prepare};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',prepare,{once:true});
  else prepare();
})();
