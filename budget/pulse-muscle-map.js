/* Artwork, muscle masks and leaders use the same 724 × 1086 coordinates. */
(()=>{
 'use strict';
 const regions={
  front:[
   ['Axlar',['M267 242Q271 190 307 190L338 202 307 230 273 282Z','M470 200Q511 180 535 220L543 275 514 250 496 221Z']],
   ['Bröst',['M308 230Q352 198 395 217L400 277Q386 314 340 288Z','M414 218Q460 196 496 233L478 286Q436 313 410 277Z']],
   ['Biceps',['M269 278L303 253 307 302 285 359 258 370 253 338Z','M505 255L534 278 550 336 549 368 523 348 506 302Z']],
   ['Mage',['M363 300Q382 289 399 300L400 390 392 463Q374 450 365 421L358 354Z','M410 300Q429 289 444 303L448 355 440 423 417 466 405 392Z','M315 286Q332 304 358 312L352 355Q353 390 365 421L388 470Q361 454 338 438L327 420Q332 382 324 350Z','M488 287Q471 305 448 316L454 355Q453 393 442 423L422 471Q450 455 470 437L478 420Q473 384 481 350Z']],
   ['Framsida lår',['M320 462L348 489 377 526 372 632 351 668 314 645 297 593 300 527Z','M457 475L480 451 502 524 507 590 490 649 453 669 433 625 432 527Z']],
   ['Vader',['M294 728L317 730 351 736 353 789 330 857 301 871 284 802Z','M466 735L493 723 510 759 516 801 501 863 478 865 458 798Z']]
  ],
  back:[
   ['Axlar',['M178 229Q192 192 219 195L251 206 226 233 181 270Z','M379 206Q416 185 442 227L455 271 416 243Z']],
   ['Rygg',['M246 200L302 168 331 168 386 203 408 250 399 321 371 399 326 435 306 435 259 399 232 321 224 251Z']],
   ['Triceps',['M180 279L212 249 227 299 213 346 185 373 168 341Z','M414 253L444 277 463 341 447 374 420 346 410 297Z']],
   ['Säte',['M249 436Q282 429 311 467L311 512Q277 550 237 527L227 493Z','M331 467Q360 431 391 436L411 492 399 528Q359 550 330 512Z']],
   ['Baksida lår',['M231 544L284 537 300 572 284 657 250 698 223 683 213 616Z','M346 541L399 543 421 615 410 688 387 701 352 658 337 579Z']],
   ['Vader',['M216 726L246 725 268 772 266 814 239 867 215 869 202 804Z','M387 725L416 727 433 805 418 869 395 865 368 812 367 771Z']]
  ]
 };
 // Each leader terminates at the inner edge of its HTML name button.
 const leaders={
  front:{Axlar:[290,220,'left',21],Bröst:[463,255,'right',27],Biceps:[278,325,'left',35],Mage:[458,379,'right',42],'Framsida lår':[335,566,'left',58],Vader:[490,790,'right',76]},
  back:{Axlar:[211,220,'left',21],Rygg:[367,288,'right',29],Triceps:[191,319,'left',36],Säte:[368,480,'right',47],'Baksida lår':[254,589,'left',59],Vader:[399,787,'right',77]}
 };
 // Shared with the gym preview (pulse-map-ui.js): the artwork shows the sheet
 // from sheetX on each side, and region coordinates are per 724-wide half.
 window.PulseMuscleMap={image:'assets/muscle-map-v1/body-front-back-defined.webp',size:[724,1086],sheetX:{front:41,back:683},regions};
 const root=document.getElementById('muscle-map-page');
 if(!root)return;
 let side='front',selected='Bröst';
 const svg=document.getElementById('muscle-map-regions');
 const labels=document.getElementById('muscle-map-labels');
 const alternatives=document.getElementById('muscle-map-exercises');
 function select(name){
  selected=name;
  root.querySelectorAll('[data-map-muscle]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.mapMuscle===name)));
  root.querySelectorAll('[data-map-label]').forEach(el=>el.classList.toggle('is-selected',el.dataset.mapLabel===name));
  document.getElementById('muscle-map-name').textContent=name;
  const count=window.PulseGuideUI.countFor(name);
  document.getElementById('muscle-map-count').textContent=count+' övningar att utforska';
  document.getElementById('muscle-map-open').setAttribute('aria-label','Visa '+count+' övningar för '+name);
  const items=window.PulseExplore.exercises.filter(e=>e.muscles.includes(name)).slice(0,3);
  alternatives.replaceChildren(...items.map(e=>{
   const button=document.createElement('button');button.type='button';button.dataset.mapExercise=e.id;
   button.textContent=e.name+' ↗';button.setAttribute('aria-label','Se animerad teknik för '+e.name);return button;
  }));
 }
 function render(){
  root.querySelector('.muscle-map-figure').dataset.side=side;
  root.querySelector('.muscle-map-figure img').alt='Silverfärgad helkroppsfigur med markerade muskler, sedd '+(side==='front'?'framifrån':'bakifrån');
  root.querySelectorAll('[data-map-side]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mapSide===side)));
  const offset=side==='front'?-41:41;
  const lines=regions[side].map(([name])=>{
   const [anchor,y,edge,percent]=leaders[side][name],x=anchor+offset,end=edge==='left'?164:560,level=1086*percent/100;
   return `<g class="muscle-map-leader" data-map-label="${name}" aria-hidden="true"><path d="M${x} ${y} L${(x+end)/2} ${level} H${end}"/><circle cx="${x}" cy="${y}" r="4"/></g>`;
  }).join('');
  svg.innerHTML=regions[side].map(([name,paths])=>`<g class="muscle-map-region" transform="translate(${offset} 0)" data-map-muscle="${name}" role="button" tabindex="0" aria-label="Välj ${name}">${name==='Mage'?'<path class="muscle-map-hit" d="M315 286L490 286 475 421 420 473 388 473 327 420Z"/>':''}${paths.map(d=>`<path d="${d}"/>`).join('')}</g>`).join('')+lines;
  labels.innerHTML=regions[side].map(([name])=>{
   const [,,edge,percent]=leaders[side][name];
   return `<button type="button" class="muscle-map-label ${edge}" style="top:${percent}%" data-map-label="${name}" data-map-guide="${name}" aria-label="Öppna animerade övningar för ${name}"><span>${name}</span><span aria-hidden="true">↗</span></button>`;
  }).join('');
  if(!regions[side].some(([name])=>name===selected))selected=side==='front'?'Bröst':'Rygg';
  select(selected);
 }
 root.addEventListener('click',event=>{
  const muscle=event.target.closest('[data-map-muscle]');
  if(muscle)select(muscle.dataset.mapMuscle);
  const toggle=event.target.closest('[data-map-side]');
  if(toggle){side=toggle.dataset.mapSide;render();}
  const guide=event.target.closest('[data-map-guide]');
  if(guide){select(guide.dataset.mapGuide);window.PulseGuideUI.openMuscleExercise(selected);}
  const exercise=event.target.closest('[data-map-exercise]');
  if(exercise)window.PulseGuideUI.openMuscleExercise(selected,Number(exercise.dataset.mapExercise));
  if(event.target.closest('#muscle-map-open'))window.PulseGuideUI.browseMuscle(selected);
 });
 svg.addEventListener('keydown',event=>{
  if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-map-muscle]')){event.preventDefault();select(event.target.dataset.mapMuscle);}
 });
 render();
})();
