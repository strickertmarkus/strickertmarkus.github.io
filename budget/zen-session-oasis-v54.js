/* Zen session oasis v54: presentation-only controller for the meditation runner.
   Core timing/session state remains owned by zen.js; this module reacts to that
   state to drive theme motion, water ripples and the home-to-session transition. */
(function(){
  'use strict';

  var body=document.body;
  var startButton=document.getElementById('start-button');
  var resumeButton=document.getElementById('resume-button');
  var resumeBanner=document.getElementById('resume-banner');
  var sessionView=document.getElementById('session-view');
  var breathingField=document.getElementById('breathing-field');
  var breathLabel=document.getElementById('breath-label');
  if(!body||!sessionView||!breathingField||!breathLabel)return;

  var rippleTimer=0;
  var lastPhase=(breathLabel.textContent||'').trim();
  var reducedMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)');

  function motionReduced(){return !!(reducedMotion&&reducedMotion.matches);}
  function meditationSession(){return body.classList.contains('in-session')&&body.dataset.kind==='meditation';}

  function pulseWater(){
    if(!meditationSession()||motionReduced())return;
    window.clearTimeout(rippleTimer);
    body.classList.remove('oasis-exhale');
    /* Force the single decorative ripple animation to restart cleanly. */
    void sessionView.offsetWidth;
    body.classList.add('oasis-exhale');
    rippleTimer=window.setTimeout(function(){body.classList.remove('oasis-exhale');},1900);
  }

  function syncPhase(){
    var phase=(breathLabel.textContent||'').trim();
    var active=meditationSession();
    body.classList.toggle('free-breathing',active&&phase==='Egen andning');
    body.classList.toggle('guided-breathing',active&&(phase==='Andas in'||phase==='Andas ut'));
    if(active&&phase==='Andas ut'&&phase!==lastPhase&&!body.classList.contains('is-paused'))pulseWater();
    lastPhase=phase;
  }

  function wrapSessionEntry(button,canMorph){
    if(!button||typeof button.onclick!=='function'||button.dataset.oasisWrapped==='true')return;
    var original=button.onclick;
    button.dataset.oasisWrapped='true';
    button.onclick=function(event){
      if(!canMorph()||motionReduced())return original.call(this,event);
      body.classList.add('oasis-entering');
      var run=function(){return original.call(button,event);};
      if(typeof document.startViewTransition==='function'){
        var transition=document.startViewTransition(run);
        Promise.resolve(transition.finished).catch(function(){}).finally(function(){body.classList.remove('oasis-entering');});
        return;
      }
      var result=run();
      window.setTimeout(function(){body.classList.remove('oasis-entering');},850);
      return result;
    };
  }

  /* The meditation home CTA and session breathing field share a view-transition
     name in CSS, giving supported browsers a real ring-to-ring morph. */
  wrapSessionEntry(startButton,function(){
    return body.dataset.kind==='meditation'&&(!resumeBanner||resumeBanner.hidden);
  });
  wrapSessionEntry(resumeButton,function(){return body.dataset.kind==='meditation';});

  new MutationObserver(syncPhase).observe(breathLabel,{childList:true,characterData:true,subtree:true});
  new MutationObserver(syncPhase).observe(body,{attributes:true,attributeFilter:['class','data-kind']});
  syncPhase();
})();
