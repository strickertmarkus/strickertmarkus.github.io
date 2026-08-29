(function(){
'use strict';
var p=location.pathname.toLowerCase();
var active=p.endsWith('/budget/familjebudget.html')||p.endsWith('/familjebudget.html')||p.endsWith('/budget/data.html')||p.endsWith('/data.html');
if(!active)return;

var KEY='familjebudget_data';
var BACKUP='familjebudget_data_recovery_backup_v1';

var DEFAULTS={
  loanParams:{huspris:5000000,huslan:3750000,kontantinsats:1250000,listranta:3.067,driftkostnad:47025,fastighetsavgift:9525,skattereduktion:100,bolan:75,lagfart:75000,renovering:1.0,ammortering:2,pantbrev:-9160,lantmateriavgift:825},
  income:{markus:{inkomst:36800,foraldraledig:false},maja:{inkomst:13000,foraldraledig:true}},
  expenses:[
    {name:'Mat/hushåll.',amount:6000},{name:'Internet',amount:399},{name:'Bilförsäkring',amount:882},{name:'Milas försäkring',amount:231},{name:'Villaförsäkring',amount:622},{name:'Guccis försäkring',amount:127},{name:'Kortavgift',amount:70},{name:'CSN',amount:1100},{name:'Spotify',amount:100},{name:'Youtube',amount:119},{name:'Gym',amount:279},{name:'Sparande Mila',amount:1000},{name:'Sparande Bröllop',amount:7000},{name:'Billån Maja',amount:2775},{name:'Abonnemang',amount:229},{name:'Mobil',amount:250},{name:'Glasögon',amount:331},{name:'Bankkort',amount:80},{name:'Försäkring Maja',amount:229},{name:'Försäkring Markus',amount:126}
  ],
  huskonto:[{name:'Dagisavgift',amount:1847},{name:'Bredband/Telefon',amount:852}],
  transfers:[
    {year:2025,month:'April',husutgifter:24696,ica:8331,majaAndel:.65,markusAndel:.35,huskontoMaja:16042,icaMaja:5415,huskontoMarkus:8638,icaMarkus:2915},
    {year:2025,month:'Maj',husutgifter:24680,ica:8331,majaAndel:.65,markusAndel:.35,huskontoMaja:16031,icaMaja:5415,huskontoMarkus:8632,icaMarkus:2915},
    {year:2025,month:'Juni',husutgifter:24664,ica:8331,majaAndel:.65,markusAndel:.35,huskontoMaja:16021,icaMaja:5415,huskontoMarkus:8626,icaMarkus:2915},
    {year:2025,month:'Juli',husutgifter:24648,ica:8331,majaAndel:.65,markusAndel:.35,huskontoMaja:16010,icaMaja:5415,huskontoMarkus:8621,icaMarkus:2915},
    {year:2025,month:'Augusti',husutgifter:24632,ica:8331,majaAndel:.65,markusAndel:.35,huskontoMaja:16000,icaMaja:5415,huskontoMarkus:8615,icaMarkus:2915},
    {year:2025,month:'September',husutgifter:24616,ica:8331,majaAndel:.65,markusAndel:.35,huskontoMaja:16000,icaMaja:5415,huskontoMarkus:8610,icaMarkus:2915},
    {year:2025,month:'Oktober',husutgifter:24600,ica:8331,majaAndel:.416,markusAndel:.584,huskontoMaja:10233,icaMaja:3465,huskontoMarkus:14366,icaMarkus:4865},
    {year:2025,month:'November',husutgifter:24584,ica:8331,majaAndel:.454,markusAndel:.546,huskontoMaja:11150,icaMaja:3778,huskontoMarkus:13432,icaMarkus:4552},
    {year:2025,month:'December',husutgifter:24568,ica:8331,majaAndel:.435,markusAndel:.565,huskontoMaja:10687,icaMaja:3623,huskontoMarkus:13880,icaMarkus:4707},
    {year:2026,month:'Januari',husutgifter:24552,ica:8331,majaAndel:.460,markusAndel:.540,huskontoMaja:11284,icaMaja:3828,huskontoMarkus:13267,icaMarkus:4502},
    {year:2026,month:'Februari',husutgifter:27235,ica:8331,majaAndel:.246,markusAndel:.754,huskontoMaja:6707,icaMaja:2051,huskontoMarkus:20527,icaMarkus:6279},
    {year:2026,month:'Mars',husutgifter:27219,ica:8331,majaAndel:.253,markusAndel:.747,huskontoMaja:6890,icaMaja:2109,huskontoMarkus:20328,icaMarkus:6221},
    {year:2026,month:'April',husutgifter:27203,ica:8331,majaAndel:.256,markusAndel:.744,huskontoMaja:6953,icaMaja:2129,huskontoMarkus:20249,icaMarkus:6201},
    {year:2026,month:'Maj',husutgifter:27187,ica:8331,majaAndel:.265,markusAndel:.735,huskontoMaja:7192,icaMaja:2204,huskontoMarkus:19994,icaMarkus:6126},
    {year:2026,month:'Juni',husutgifter:27171,ica:8331,majaAndel:.265,markusAndel:.735,huskontoMaja:7188,icaMaja:2204,huskontoMarkus:19982,icaMarkus:6126},
    {year:2026,month:'Juli',husutgifter:27155,ica:8331,majaAndel:.256,markusAndel:.744,huskontoMaja:6941,icaMaja:2129,huskontoMarkus:20213,icaMarkus:6201},
    {year:2026,month:'Augusti',husutgifter:27139,ica:8331,majaAndel:.273,markusAndel:.727,huskontoMaja:7417,icaMaja:2276,huskontoMarkus:19721,icaMarkus:6054},
    {year:2026,month:'September',husutgifter:27123,ica:8331,majaAndel:.256,markusAndel:.744,huskontoMaja:6932,icaMaja:2129,huskontoMarkus:20190,icaMarkus:6201},
    {year:2026,month:'Oktober',husutgifter:27107,ica:8331,majaAndel:.235,markusAndel:.765,huskontoMaja:6380,icaMaja:1960,huskontoMarkus:20726,icaMarkus:6370},
    {year:2026,month:'November',husutgifter:27091,ica:8331,majaAndel:.237,markusAndel:.763,huskontoMaja:6430,icaMaja:1977,huskontoMarkus:20660,icaMarkus:6353},
    {year:2026,month:'December',husutgifter:27075,ica:8331,majaAndel:.216,markusAndel:.784,huskontoMaja:5842,icaMaja:1797,huskontoMarkus:21232,icaMarkus:6533}
  ],
  checklistItems:[
    {name:'Stekpanna rostfritt stål',category:'Kök',price:0},{name:'Bra skärbräda i trä',category:'Kök',price:0},{name:'Minst en bra kniv',category:'Kök',price:0},{name:'Nya köksredskap (slevar etc.)',category:'Kök',price:0},{name:'Knivslip',category:'Kök',price:0},{name:'Nya saxar',category:'Kök',price:0},{name:'Elvisp',category:'Kök',price:0},{name:'Förvaring kök',category:'Förvaring',price:0},{name:'Förvaringslådor inne',category:'Förvaring',price:0},{name:'Förvaring garage',category:'Förvaring',price:0},{name:'Matbord kök (runt)',category:'Möbler',price:0},{name:'Matbord matsal',category:'Möbler',price:0},{name:'TV-bänk',category:'Möbler',price:0},{name:'Tvåsitssoffa hall uppe',category:'Möbler',price:0},{name:'Puffar ovanvåning',category:'Möbler',price:0},{name:'TV',category:'Möbler',price:0},{name:'Lampor',category:'Belysning',price:0},{name:'Lampknappar',category:'Belysning',price:0},{name:'Dörr till sovrum uppe',category:'Dörrar',price:0},{name:'Dörrar övervåning',category:'Dörrar',price:0},{name:'Garderobsdörrar',category:'Dörrar',price:0},{name:'Blandare badrum',category:'Övrigt',price:0},{name:'Vägguttag',category:'Övrigt',price:0},{name:'Säkringar',category:'Övrigt',price:0},{name:'Mattor',category:'Övrigt',price:0},{name:'Krokar',category:'Övrigt',price:0},{name:'Robotdammsugare',category:'Övrigt',price:0},{name:'Robotgräsklippare',category:'Övrigt',price:0},{name:'Snöskyffel',category:'Övrigt',price:0},{name:'Skruvar/muttrar',category:'Verktygsvara',price:0},{name:'Såg',category:'Verktygsvara',price:0},{name:'Stege',category:'Verktygsvara',price:0},{name:'Sladdlister',category:'Övrigt',price:0},{name:'Grill',category:'Altan/Trädgård',price:0},{name:'Grindar',category:'Övrigt',price:0}
  ]
};

function parse(raw){try{return raw?JSON.parse(raw):null}catch(_){return null}}
function score(d){
  if(!d||typeof d!=='object')return 0;
  var s=0;
  if(d.loanParams&&typeof d.loanParams==='object'&&Object.keys(d.loanParams).length>=5)s+=3;
  if(d.income&&d.income.markus&&d.income.maja)s+=2;
  if(Array.isArray(d.expenses)&&d.expenses.length)s+=2;
  if(Array.isArray(d.huskonto)&&d.huskonto.length)s+=1;
  if(Array.isArray(d.transfers)&&d.transfers.length)s+=3;
  if(Array.isArray(d.checklistItems)&&d.checklistItems.length)s+=1;
  return s;
}
function clone(v){return JSON.parse(JSON.stringify(v))}
function mergePreserving(d){
  d=(d&&typeof d==='object')?d:{};
  var out={};
  out.loanParams=Object.assign({},DEFAULTS.loanParams,d.loanParams&&typeof d.loanParams==='object'?d.loanParams:{});
  out.income={
    markus:Object.assign({},DEFAULTS.income.markus,d.income&&d.income.markus?d.income.markus:{}),
    maja:Object.assign({},DEFAULTS.income.maja,d.income&&d.income.maja?d.income.maja:{})
  };
  out.expenses=Array.isArray(d.expenses)&&d.expenses.length?d.expenses:clone(DEFAULTS.expenses);
  out.huskonto=Array.isArray(d.huskonto)&&d.huskonto.length?d.huskonto:clone(DEFAULTS.huskonto);
  out.transfers=Array.isArray(d.transfers)&&d.transfers.length?d.transfers:clone(DEFAULTS.transfers);
  out.checklistItems=Array.isArray(d.checklistItems)&&d.checklistItems.length?d.checklistItems:clone(DEFAULTS.checklistItems);
  out.checkedItems=d.checkedItems&&typeof d.checkedItems==='object'?d.checkedItems:{};
  out.savingsGoals=Array.isArray(d.savingsGoals)?d.savingsGoals:[];
  out.sectionHeadings=d.sectionHeadings&&typeof d.sectionHeadings==='object'?d.sectionHeadings:{};
  Object.keys(d).forEach(function(k){if(!(k in out))out[k]=d[k]});
  return out;
}
function readIdb(){
  return new Promise(function(resolve){
    if(!window.indexedDB){resolve(null);return}
    try{
      var r=indexedDB.open('budgetDB',1);
      r.onerror=function(){resolve(null)};
      r.onsuccess=function(){
        try{
          var db=r.result,tx=db.transaction('keyValueStore','readonly'),g=tx.objectStore('keyValueStore').get(KEY);
          g.onsuccess=function(){resolve(parse(g.result))};g.onerror=function(){resolve(null)};
        }catch(_){resolve(null)}
      };
    }catch(_){resolve(null)}
  });
}
function rawGet(k){try{return localStorage.getItem(k)}catch(_){return null}}
function rawSet(k,v){try{localStorage.setItem(k,v)}catch(_){}}
function syncValue(json){
  try{if(typeof window.fallbackSetItem==='function')window.fallbackSetItem(KEY,json)}catch(_){}
  try{if(typeof window.syncToFirebase==='function')window.syncToFirebase(KEY,json)}catch(_){}
}
async function repair(){
  var localRaw=rawGet(KEY),local=parse(localRaw),idb=await readIdb();
  var best=score(idb)>score(local)?idb:local;
  if(score(best)>3)return;
  if(localRaw&&!rawGet(BACKUP))rawSet(BACKUP,localRaw);
  var fixed=mergePreserving(best);
  var json=JSON.stringify(fixed);
  if(localRaw!==json){rawSet(KEY,json);syncValue(json)}
}

repair();
[250,700,1500,3000].forEach(function(ms){setTimeout(repair,ms)});
})();