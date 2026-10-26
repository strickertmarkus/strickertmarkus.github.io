/* Coordinates are relative to each 724 × 1086 half of body-front-back.webp. */
(()=>{
 'use strict';
 const regions={
  front:[
   ['Axlar',['M267 242Q271 190 307 190L338 202 307 230 273 282Z','M470 200Q511 180 535 220L543 275 514 250 496 221Z']],
   ['Bröst',['M308 230Q352 198 395 217L400 277Q386 314 340 288Z','M414 218Q460 196 496 233L478 286Q436 313 410 277Z']],
   ['Biceps',['M269 278L303 253 307 302 285 359 258 370 253 338Z','M505 255L534 278 550 336 549 368 523 348 506 302Z']],
   ['Mage',['M345 298L370 291 402 299 432 292 465 307 455 418 420 465 391 468 354 424Z']],
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
 const root=document.getElementById('muscle-map-page');
 if(!root)return;
 let side='front',selected='Bröst';
 const svg=document.getElementById('muscle-map-regions');
 const choices=document.getElementById('muscle-map-choices');
 function select(name){
  selected=name;
  root.querySelectorAll('[data-map-muscle]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.mapMuscle===name)));
  document.getElementById('muscle-map-name').textContent=name;
  const count=window.PulseGuideUI.countFor(name);
  document.getElementById('muscle-map-count').textContent=count+' övningar att utforska';
  document.getElementById('muscle-map-open').setAttribute('aria-label','Visa '+count+' övningar för '+name);
 }
 function render(){
  root.querySelector('.muscle-map-figure').dataset.side=side;
  root.querySelector('.muscle-map-figure img').alt='Silverfärgad helkroppsfigur med markerade muskler, sedd '+(side==='front'?'framifrån':'bakifrån');
  root.querySelectorAll('[data-map-side]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mapSide===side)));
  svg.innerHTML=regions[side].map(([name,paths])=>`<g class="muscle-map-region" data-map-muscle="${name}" role="button" tabindex="0" aria-label="Välj ${name}">${paths.map(d=>`<path d="${d}"/>`).join('')}</g>`).join('');
  choices.innerHTML=regions[side].map(([name])=>`<button type="button" data-map-muscle="${name}">${name}</button>`).join('');
  if(!regions[side].some(([name])=>name===selected))selected=side==='front'?'Bröst':'Rygg';
  select(selected);
 }
 root.addEventListener('click',event=>{
  const muscle=event.target.closest('[data-map-muscle]');
  if(muscle)select(muscle.dataset.mapMuscle);
  const toggle=event.target.closest('[data-map-side]');
  if(toggle){side=toggle.dataset.mapSide;render();}
  if(event.target.closest('#muscle-map-open'))window.PulseGuideUI.browseMuscle(selected);
 });
 svg.addEventListener('keydown',event=>{
  if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-map-muscle]')){event.preventDefault();select(event.target.dataset.mapMuscle);}
 });
 render();
})();
