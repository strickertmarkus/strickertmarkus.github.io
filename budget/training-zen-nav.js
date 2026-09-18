(function(){
  'use strict';
  if(window.__wellnessShellInstalled)return;
  window.__wellnessShellInstalled=true;

  var canonical=/\/exercise\.html$/.test(location.pathname);
  var directZen=/\/zen\.html$/.test(location.pathname);
  var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)');
  var trainingMain=document.getElementById('pulse-home');
  var header=document.querySelector('.app-header, .zen-header');
  var zenHost=null,zenBackdrop=null,zenLoadPromise=null,zenDocumentPromise=null,zenPreloadStarted=false,zenStyleLinks=[],zenTools=null,zenBrand=null,sharedSwitch=null;
  var mode='training',zenKind='stretch',switchToken=0;
  var scrollPositions={training:window.scrollY||0,zen:0};
  var trainingTitle=document.title;
  var trainingTheme='#0F1219';

  function profileQuery(){return new URLSearchParams(location.search).get('user')==='maja'?'maja':'';}
  function normalizeDestination(value){return value==='meditation'?'meditation':value==='stretch'||value==='zen'?'stretch':'training';}
  function destinationFromURL(){return normalizeDestination(new URLSearchParams(location.search).get('wellness'));}
  function modeURL(destination){
    destination=normalizeDestination(destination);
    var url=new URL(location.href);
    if(canonical){
      if(destination==='training')url.searchParams.delete('wellness');
      else url.searchParams.set('wellness',destination);
    }else{
      url=new URL('exercise.html',location.href);
      if(profileQuery())url.searchParams.set('user','maja');
      if(destination!=='training')url.searchParams.set('wellness',destination);
    }
    return url;
  }
  function ensureThemeMeta(){
    var meta=document.querySelector('meta[name="theme-color"]');
    if(!meta){meta=document.createElement('meta');meta.name='theme-color';meta.content=trainingTheme;document.head.appendChild(meta);}
    return meta;
  }
  function zenCanvasColor(kind){return kind==='meditation'?'#a7c3bd':'#091d18';}
  function syncCanvasTheme(destination){
    var zen=destination==='stretch'||destination==='meditation';
    var color=zen?zenCanvasColor(destination):trainingTheme;
    if(zen){
      document.documentElement.dataset.wellnessKind=destination;
      document.documentElement.style.removeProperty('background-color');
    }else{
      delete document.documentElement.dataset.wellnessKind;
      document.documentElement.style.backgroundColor=color;
    }
    ensureThemeMeta().content=color;
  }
  function setNotice(message){
    var node=document.querySelector('.wellness-mode-notice');
    if(!node)return;
    node.textContent=message||'';
    node.hidden=!message;
    if(message)window.setTimeout(function(){if(node.textContent===message){node.hidden=true;node.textContent='';}},4200);
  }
  function switchMarkup(){
    return '<div class="wellness-kind-options">'+
      '<button type="button" data-wellness-destination="training" aria-pressed="false"><span aria-hidden="true">⌁</span> Träning</button>'+
      '<button type="button" data-wellness-destination="stretch" aria-pressed="false"><span aria-hidden="true">✧</span> Stretch</button>'+
      '<button type="button" data-wellness-destination="meditation" aria-pressed="false"><span aria-hidden="true">≈</span> Meditation</button>'+
      '</div>'+
      '<span class="wellness-overview-slot"></span>'+
      '<span class="wellness-mode-notice" role="status" aria-live="polite" hidden></span>';
  }
  function ensureSharedSwitch(){
    if(!canonical||!trainingMain||!header)return null;
    var existing=document.querySelector('[data-wellness-kind-switch="true"]');
    if(existing){sharedSwitch=existing;return existing;}
    var nav=document.createElement('nav');
    nav.className='wellness-kind-switch';
    nav.dataset.wellnessKindSwitch='true';
    nav.setAttribute('aria-label','Välj Träning, Stretch eller Meditation');
    nav.innerHTML=switchMarkup();
    var overviewToggle=document.getElementById('training-overview-toggle');
    var overviewSlot=nav.querySelector('.wellness-overview-slot');
    if(overviewToggle&&overviewSlot)overviewSlot.appendChild(overviewToggle);
    header.insertAdjacentElement('afterend',nav);
    sharedSwitch=nav;
    nav.addEventListener('click',function(event){
      var button=event.target.closest('[data-wellness-destination]');
      if(!button||!nav.contains(button))return;
      requestDestination(button.dataset.wellnessDestination);
    });
    return nav;
  }
  function updateUnifiedSwitch(destination){
    destination=normalizeDestination(destination);
    document.querySelectorAll('[data-wellness-destination]').forEach(function(button){
      button.setAttribute('aria-pressed',String(button.dataset.wellnessDestination===destination));
      if(button.tagName==='A')button.setAttribute('aria-current',button.dataset.wellnessDestination===destination?'page':'false');
    });
    document.querySelectorAll('#wellness-zen-surface .kind-switch [data-kind],body:not(.wellness-zen-active) .kind-switch [data-kind]').forEach(function(button){
      button.setAttribute('aria-pressed',String(destination!=='training'&&button.dataset.kind===destination));
    });
  }
  function ensureSharedHeaderZenTools(){
    if(!canonical||!header)return;
    var brand=header.querySelector('.brand');
    if(brand&&!brand.querySelector('.wellness-zen-brand')){
      zenBrand=document.createElement('a');
      zenBrand.className='wellness-zen-brand';
      zenBrand.href='home.html';
      zenBrand.hidden=true;
      zenBrand.setAttribute('aria-label','Startsida');
      zenBrand.innerHTML='<span aria-hidden="true">✧</span><span>ZEN<small>STRETCH &amp; MEDITATION</small></span>';
      brand.appendChild(zenBrand);
    }else if(brand)zenBrand=brand.querySelector('.wellness-zen-brand');
    var existing=header.querySelector('.wellness-zen-tools');
    if(existing){zenTools=existing;return;}
    zenTools=document.createElement('div');
    zenTools.className='wellness-zen-tools';
    zenTools.hidden=true;
    zenTools.innerHTML='<button class="icon-button" id="settings-open" type="button" aria-label="Inställningar och sparad data">⋯</button>';
    var anchor=header.querySelector('.streak-badge');
    header.insertBefore(zenTools,anchor||null);
  }
  function getZenDocument(){
    if(zenDocumentPromise)return zenDocumentPromise;
    zenDocumentPromise=fetch('zen.html',{credentials:'same-origin'}).then(function(response){
      if(!response.ok)throw new Error('Zen kunde inte laddas.');
      return response.text();
    }).then(function(html){return new DOMParser().parseFromString(html,'text/html');}).catch(function(error){zenDocumentPromise=null;throw error;});
    return zenDocumentPromise;
  }
  function preloadZenAssets(doc){
    if(zenPreloadStarted)return;
    zenPreloadStarted=true;
    Array.prototype.forEach.call(doc.querySelectorAll('link[rel="stylesheet"]'),function(source){
      var href=source.getAttribute('href')||'';
      var absolute=new URL(href,location.href);
      var file=absolute.pathname.split('/').pop();
      if(!/^zen.*\.css$/i.test(file))return;
      if(document.querySelector('link[data-wellness-preload="'+absolute.href.replace(/"/g,'')+'"]'))return;
      var link=document.createElement('link');
      link.rel='preload';link.as='style';link.href=absolute.href;link.dataset.wellnessPreload=absolute.href;
      document.head.appendChild(link);
    });
    Array.prototype.forEach.call(doc.querySelectorAll('script[src]'),function(source){
      var src=source.getAttribute('src')||'';
      var absolute=new URL(src,location.href);
      var file=absolute.pathname.split('/').pop().split('?')[0];
      if(file!=='zen.js'&&!/^zen-.*\.js$/i.test(file))return;
      if(document.querySelector('link[data-wellness-preload="'+absolute.href.replace(/"/g,'')+'"]'))return;
      var link=document.createElement('link');
      link.rel='preload';link.as='script';link.href=absolute.href;link.dataset.wellnessPreload=absolute.href;
      document.head.appendChild(link);
    });
  }
  function warmZenAssets(){
    if(!canonical||zenLoadPromise)return;
    getZenDocument().then(preloadZenAssets).catch(function(){zenPreloadStarted=false;});
  }
  function loadStyles(doc){
    var promises=[];
    Array.prototype.forEach.call(doc.querySelectorAll('link[rel="stylesheet"]'),function(source){
      var href=source.getAttribute('href')||'';
      var absolute=new URL(href,location.href);
      var file=absolute.pathname.split('/').pop();
      var isZen=/^zen.*\.css$/i.test(file);
      var isFont=absolute.hostname==='fonts.googleapis.com';
      if(!isZen&&!isFont)return;
      if(document.querySelector('link[data-wellness-asset="'+absolute.href.replace(/"/g,'')+'"]'))return;
      var link=document.createElement('link');
      link.rel='stylesheet';link.href=absolute.href;link.dataset.wellnessAsset=absolute.href;
      if(isZen){link.media='not all';zenStyleLinks.push(link);}
      promises.push(new Promise(function(resolve){link.addEventListener('load',resolve,{once:true});link.addEventListener('error',resolve,{once:true});}));
      document.head.appendChild(link);
    });
    return Promise.all(promises);
  }
  function loadScripts(doc){
    var sources=Array.prototype.map.call(doc.querySelectorAll('script[src]'),function(script){return script.getAttribute('src')||'';}).filter(function(src){
      var file=new URL(src,location.href).pathname.split('/').pop().split('?')[0];
      return file==='zen.js'||/^zen-.*\.js$/i.test(file);
    });
    return sources.reduce(function(chain,src){
      return chain.then(function(){return new Promise(function(resolve,reject){
        var absolute=new URL(src,location.href).href;
        if(document.querySelector('script[data-wellness-asset="'+absolute.replace(/"/g,'')+'"]')){resolve();return;}
        var script=document.createElement('script');script.src=absolute;script.dataset.wellnessAsset=absolute;script.async=false;
        script.onload=resolve;script.onerror=function(){reject(new Error('Kunde inte ladda Zen-modulen '+src));};document.body.appendChild(script);
      });});
    },Promise.resolve());
  }
  function extractZenSurface(doc){
    var host=document.createElement('section');
    host.id='wellness-zen-surface';host.className='wellness-zen-surface';host.hidden=true;host.setAttribute('aria-label','Zen');
    var landscape=doc.querySelector('.landscape');
    if(landscape){
      zenBackdrop=document.importNode(landscape,true);
      zenBackdrop.classList.add('wellness-zen-backdrop');
      zenBackdrop.hidden=true;
      var wrap=header&&header.closest('.app-wrap');
      if(wrap)wrap.insertBefore(zenBackdrop,wrap.firstChild);
      else document.body.insertBefore(zenBackdrop,document.body.firstChild);
    }
    var main=doc.querySelector('#zen-main');
    if(main)host.appendChild(document.importNode(main,true));
    Array.prototype.forEach.call(doc.querySelectorAll('dialog,#toast'),function(node){host.appendChild(document.importNode(node,true));});
    if(!host.querySelector('#zen-main'))throw new Error('Zen-ytan saknar huvudvyn.');
    trainingMain.insertAdjacentElement('afterend',host);
    var trainingButton=host.querySelector('.kind-switch [data-wellness-destination="training"]');
    if(trainingButton)trainingButton.addEventListener('click',function(){requestDestination('training');});
    return host;
  }
  function ensureZenLoaded(){
    if(zenLoadPromise)return zenLoadPromise;
    zenLoadPromise=getZenDocument().then(function(doc){
      preloadZenAssets(doc);
      zenHost=extractZenSurface(doc);
      ensureThemeMeta();
      document.body.dataset.kind=doc.body.dataset.kind||'stretch';
      return loadStyles(doc).then(function(){return loadScripts(doc);});
    }).catch(function(error){zenLoadPromise=null;if(zenHost){zenHost.remove();zenHost=null;}if(zenBackdrop){zenBackdrop.remove();zenBackdrop=null;}throw error;});
    return zenLoadPromise;
  }
  function selectZenKind(kind){
    kind=kind==='meditation'?'meditation':'stretch';
    zenKind=kind;
    var button=zenHost&&zenHost.querySelector('.kind-switch [data-kind="'+kind+'"]');
    if(button&&button.getAttribute('aria-pressed')!=='true')button.click();
    document.body.dataset.kind=kind;
    if(mode==='zen'||document.documentElement.dataset.wellnessMode==='zen')syncCanvasTheme(kind);
    updateUnifiedSwitch(kind);
  }
  function toggleZenStyles(active){zenStyleLinks.forEach(function(link){link.media=active?'all':'not all';});}
  function trainingSessionActive(){var modal=document.getElementById('session-modal');return !!(modal&&modal.classList.contains('show'));}
  function zenSessionActive(){return document.body.classList.contains('in-session');}
  function canLeave(nextMode){
    if(mode==='training'&&nextMode==='zen'&&trainingSessionActive()){setNotice('Avsluta det pågående träningspasset innan du byter till Stretch eller Meditation.');return false;}
    if(mode==='zen'&&nextMode==='training'&&zenSessionActive()){setNotice('Avsluta eller lämna Zen-passet innan du byter till Träning.');return false;}
    return true;
  }
  function applyMode(nextMode){
    var zen=nextMode==='zen';
    if(zen)toggleZenStyles(true);
    if(!zen){
      if(zenHost)zenHost.hidden=true;
      if(zenBackdrop)zenBackdrop.hidden=true;
    }
    document.documentElement.dataset.wellnessMode=nextMode;
    document.documentElement.classList.toggle('exercise-concept-pulse-home-v1',!zen);
    document.body.classList.toggle('wellness-zen-active',zen);
    trainingMain.hidden=zen;
    if(zen){
      if(zenHost)zenHost.hidden=false;
      if(zenBackdrop)zenBackdrop.hidden=false;
    }
    if(zenTools)zenTools.hidden=!zen;
    if(zenBrand)zenBrand.hidden=!zen;
    var trainingBrand=header&&header.querySelector('.brand-text');if(trainingBrand)trainingBrand.hidden=zen;
    var streak=header&&header.querySelector('.streak-badge');if(streak)streak.hidden=zen;
    if(!zen)toggleZenStyles(false);
    syncCanvasTheme(zen?zenKind:'training');
    document.title=zen?'Zen · '+(zenKind==='meditation'?'Meditation':'Stretch'):trainingTitle;
    updateUnifiedSwitch(zen?zenKind:'training');
    mode=nextMode;
  }
  function swap(nextMode){
    scrollPositions[mode]=window.scrollY||0;
    applyMode(nextMode);
    if(reduced&&reduced.matches)return Promise.resolve();
    var target=nextMode==='zen'?zenHost:trainingMain;
    if(!target)return Promise.resolve();
    target.classList.remove('wellness-surface-enter');
    document.documentElement.classList.add('wellness-shell-switching');
    return new Promise(function(resolve){
      requestAnimationFrame(function(){
        target.classList.add('wellness-surface-enter');
        window.setTimeout(function(){
          document.documentElement.classList.remove('wellness-shell-switching');
          target.classList.remove('wellness-surface-enter');
          resolve();
        },200);
      });
    });
  }
  function historyFor(destination,action){
    if(action==='none')return;
    var url=modeURL(destination);
    if(action==='replace')history.replaceState({wellnessDestination:destination},'',url.href);
    else history.pushState({wellnessDestination:destination},'',url.href);
  }
  function finishSwitch(destination,options,token){
    if(token!==switchToken)return false;
    historyFor(destination,options.history||'push');
    if(sharedSwitch)sharedSwitch.removeAttribute('aria-busy');
    requestAnimationFrame(function(){window.scrollTo(0,scrollPositions[mode]||0);});
    window.dispatchEvent(new CustomEvent('wellness-mode-change',{detail:{mode:mode,destination:destination}}));
    return true;
  }
  function requestDestination(value,options){
    options=options||{};
    var destination=normalizeDestination(value);
    var nextMode=destination==='training'?'training':'zen';
    var token=++switchToken;
    if(nextMode===mode&&!options.force){
      if(nextMode==='zen'&&destination!==zenKind){selectZenKind(destination);historyFor(destination,options.history||'push');}
      updateUnifiedSwitch(nextMode==='training'?'training':zenKind);
      if(sharedSwitch)sharedSwitch.removeAttribute('aria-busy');
      return Promise.resolve(true);
    }
    if(!canLeave(nextMode)){
      updateUnifiedSwitch(mode==='zen'?zenKind:'training');
      if(sharedSwitch)sharedSwitch.removeAttribute('aria-busy');
      return Promise.resolve(false);
    }
    updateUnifiedSwitch(destination);
    if(sharedSwitch)sharedSwitch.setAttribute('aria-busy','true');
    var ready=nextMode==='zen'?ensureZenLoaded():Promise.resolve();
    return ready.then(function(){
      if(token!==switchToken)return false;
      if(nextMode==='zen')selectZenKind(destination);
      return swap(nextMode).then(function(){return finishSwitch(destination,options,token);});
    }).catch(function(){
      if(token===switchToken){
        if(sharedSwitch)sharedSwitch.removeAttribute('aria-busy');
        updateUnifiedSwitch(mode==='zen'?zenKind:'training');
        setNotice('Läget kunde inte laddas. Försök igen.');
      }
      return false;
    });
  }

  if(directZen&&!canonical){
    zenKind=document.body.dataset.kind==='meditation'?'meditation':'stretch';
    document.documentElement.dataset.wellnessMode='zen';
    syncCanvasTheme(zenKind);
    var directTraining=document.querySelector('.kind-switch [data-wellness-destination="training"]');
    if(directTraining)directTraining.addEventListener('click',function(){location.href=modeURL('training').href;});
    updateUnifiedSwitch(zenKind);
    return;
  }
  if(!canonical||!trainingMain||!header)return;
  ensureSharedHeaderZenTools();
  var nav=ensureSharedSwitch();
  document.documentElement.dataset.wellnessMode='training';
  updateUnifiedSwitch('training');
  if(nav){
    nav.querySelectorAll('[data-wellness-destination="stretch"],[data-wellness-destination="meditation"]').forEach(function(button){
      button.addEventListener('pointerenter',warmZenAssets,{once:true,passive:true});
      button.addEventListener('focus',warmZenAssets,{once:true});
      button.addEventListener('touchstart',warmZenAssets,{once:true,passive:true});
    });
  }
  document.addEventListener('zen:home-rendered',function(){
    if(mode!=='zen')return;
    zenKind=document.body.dataset.kind==='meditation'?'meditation':'stretch';
    syncCanvasTheme(zenKind);
    updateUnifiedSwitch(zenKind);
  });
  if('requestIdleCallback' in window)window.requestIdleCallback(warmZenAssets,{timeout:1200});
  else window.setTimeout(warmZenAssets,1000);
  window.addEventListener('popstate',function(){requestDestination(destinationFromURL(),{history:'none'});});
  window.setWellnessMode=function(next){return requestDestination(next);};
  var initial=destinationFromURL();
  if(initial!=='training')requestDestination(initial,{history:'none',force:true});
})();
