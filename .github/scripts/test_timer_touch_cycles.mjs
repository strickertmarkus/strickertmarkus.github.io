import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const source = fs.readFileSync('budget/exercise-timer-focus.js','utf8');
const html = `<!doctype html><html><head></head><body>
<div id="session-modal" class="pulse-flow-v58 show cardio-countdown-active">
  <div class="session-shell"><div class="session-top"></div><div class="session-grid">
    <div class="session-card session-main">
      <div id="session-cardio-countdown" class="show">
        <div id="session-countdown-ring">
          <svg class="pf-arc-svg-v80"></svg>
          <div class="session-countdown-core"></div>
          <div class="session-countdown-copy"><div id="session-countdown-value">00:59</div><div class="pf-ecg-v80"></div><div class="session-countdown-label">TID KVAR</div><div id="session-countdown-pause-hint">TRYCK FÖR ATT PAUSA</div></div>
        </div>
      </div>
    </div>
  </div></div>
</div>
<div id="session-pre-timer"></div>
</body></html>`;

const dom = new JSDOM(html,{url:'https://example.test/budget/exercise.html',runScripts:'outside-only',pretendToBeVisual:true});
const { window } = dom;
const { document } = window;
Object.defineProperty(window,'innerWidth',{value:390,writable:true});
Object.defineProperty(window,'innerHeight',{value:844,writable:true});
Object.defineProperty(window.navigator,'maxTouchPoints',{value:5,configurable:true});
window.matchMedia = () => ({matches:true,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
let rafSeq = 0;
const rafTimers = new Map();
window.requestAnimationFrame = cb => {
  const id = ++rafSeq;
  if (cb && cb.name === 'frame') return id; // do not start the perpetual app loop in the harness
  const timer = setTimeout(() => { rafTimers.delete(id); cb(window.performance.now()); }, 1);
  rafTimers.set(id,timer);
  return id;
};
window.cancelAnimationFrame = id => { const t=rafTimers.get(id); if(t) clearTimeout(t); rafTimers.delete(id); };
window.sessionState = {
  setRunning:true,setStartedAt:Date.now(),passStartedAt:Date.now()-1000,exerciseIndex:0,currentSet:1,
  exercises:[{kind:'cardio',time:1,name:'Hopprep'}]
};
const ring = document.getElementById('session-countdown-ring');
const host = document.getElementById('session-cardio-countdown');
const compact = {left:129,top:500,width:132,height:132,right:261,bottom:632};
const large = {left:45,top:348,width:300,height:300,right:345,bottom:648};
ring.getBoundingClientRect = () => {
  const st = ring.style;
  if (st.position === 'fixed' && st.left && st.top && st.width && st.height) {
    const left=parseFloat(st.left), top=parseFloat(st.top), width=parseFloat(st.width), height=parseFloat(st.height);
    return {left,top,width,height,right:left+width,bottom:top+height};
  }
  return document.documentElement.classList.contains('cardio-focus-active') ? large : compact;
};
host.getBoundingClientRect = () => ({left:0,top:492,width:390,height:148,right:390,bottom:640});
window.eval(source);

function touch(identifier,x,y){ return {identifier,clientX:x,clientY:y}; }
function dispatch(type,target,touches,changedTouches){
  const ev = new window.Event(type,{bubbles:true,cancelable:true});
  Object.defineProperty(ev,'touches',{value:touches,configurable:true});
  Object.defineProperty(ev,'changedTouches',{value:changedTouches,configurable:true});
  target.dispatchEvent(ev);
  return ev;
}
const wait = ms => new Promise(r=>setTimeout(r,ms));

async function swipe(expand,id){
  const activeBefore = document.documentElement.classList.contains('cardio-focus-active');
  if (activeBefore === expand) throw new Error(`bad precondition active=${activeBefore} expand=${expand}`);
  const rect = activeBefore ? large : compact;
  const x = rect.left + rect.width/2;
  const y = rect.top + rect.height/2;
  const dy = expand ? -205 : 205;
  dispatch('touchstart',ring,[touch(id,x,y)],[touch(id,x,y)]);
  dispatch('touchmove',ring,[touch(id,x,y+dy*0.35)],[touch(id,x,y+dy*0.35)]);
  dispatch('touchmove',ring,[touch(id,x,y+dy)],[touch(id,x,y+dy)]);
  dispatch('touchend',ring,[],[touch(id,x,y+dy)]);
  await wait(260);
  const active = document.documentElement.classList.contains('cardio-focus-active');
  if (active !== expand) throw new Error(`swipe ${expand?'expand':'collapse'} failed; active=${active}`);
  if (document.documentElement.classList.contains('cardio-focus-dragging')) throw new Error('dragging class stuck');
  if (ring.style.position || ring.style.transform || ring.style.left || ring.style.top) throw new Error('inline drag geometry stuck');
}

for (let i=0;i<8;i++) {
  await swipe(true,100+i*2);
  await swipe(false,101+i*2);
}
await swipe(true,999); // critical: must re-expand after a completed collapse chain
console.log('PASS: 8 full touch cycles + re-expand; no stuck drag state');
process.exit(0);
