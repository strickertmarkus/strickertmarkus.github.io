(function(){
  'use strict';
  if(window.__wellnessShellInstalled)return;
  window.__wellnessShellInstalled=true;

  var canonical=/\/exercise\.html$/.test(location.pathname);
  var directZen=/\/zen\.html$/.test(location.pathname);
  var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)');
  var trainingMain=document.getElementById('pulse-home');
  var header=document.querySelector('.app-header, .zen-header');
  var zenHost=null,zenLoadPromise=null,zenDocumentPromise=null,zenPreloadStarted=false,zenStyleLinks=[],zenTools=null,zenBrand=null;
  var mode='training',switchToken=0;
  var scrollPositions={training:window.scrollY||0,zen:0};
  var trainingTitle=document.title;
  var trainingTheme='#0F1219';

  function profileQuery(){return new URLSearchParams(location.search).get('user')==='maja'?'maja':'';}
  function modeURL(next){
    var url=new URL(location.href);
    if(canonical){
      if(next==='zen')url.searchParams.set('wellness','zen');
      else url.searchParams.delete('wellness');
    }else{
      url=new URL('exercise.html',location.href);
      if(profileQuery())url.searchParams.set('user','maja');
      if(next==='zen')url.searchParams.set('wellness','zen');
    }
    return url;
  }
  function hrefFor(next){return modeURL(next).href;}
  function ensureThemeMeta(){
    var meta=document.querySelector('meta[name="theme-color"]');
    if(!meta){meta=document.createElement('meta');meta.name='theme-color';meta.content=trainingTheme;document.head.appendChild(meta);}
    return meta;
  }
  function setNotice(message){
    var node=document.querySelector('.wellness-mode-notice');
    if(!node)return;
    node.textContent=message||'';
    node.hidden=!message;
    if(message)window.setTimeout(function(){if(node.textContent===message){node.hidden=true;node.textContent='';}},4200);
  }
  function mountNav(){
    if(!header)return null;
    var existing=header.querySelector('.wellness-nav');
    if(existing)return existing;
    var nav=document.createElement('nav');
    nav.className='wellness-nav';
    nav.setAttribute('aria-label','Träning och återhämtning');
    nav.innerHTML='<a data-destination="training" href="'+hrefFor('training')+'"><span class="wellness-symbol" aria-hidden="true">◆⌁</span>Träning</a><a data-destination="zen" href="'+hrefFor('zen')+'"><span class="wellness-symbol" aria-hidden="true">✧≈</span>Zen</a><span class="wellness-mode-notice" role="status" aria-live="polite" hidden></span>';
    var anchor=header.querySelector('.streak-badge, .zen-header-end');
    header.insertBefore(nav,anchor||null);
    return nav;
  }
  function updateNav(next){
    document.querySelectorAll('.wellness-nav [data-destination]').forEach(function(link){link.setAttribute('aria-current',link.dataset.destination===next?'page':'false');});
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
    zenTools=document.createElement('div');
    zenTools.className='wellness-zen-tools';
    zenTools.hidden=true;
    zenTools.innerHTML='<span id="profile-name">Din profil</span><button class="icon-button" id="settings-open" type="button" aria-label="Inställningar och sparad data">⋯</button>';
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
    ['.landscape','#zen-main'].forEach(function(selector){var node=doc.querySelector(selector);if(node)host.appendChild(document.importNode(node,true));});
    Array.prototype.forEach.call(doc.querySelectorAll('dialog,#toast'),function(node){host.appendChild(document.importNode(node,true));});
    if(!host.querySelector('#zen-main'))throw new Error('Zen-ytan saknar huvudvyn.');
    trainingMain.insertAdjacentElement('afterend',host);
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
    }).catch(function(error){zenLoadPromise=null;if(zenHost){zenHost.remove();zenHost=null;}throw error;});
    return zenLoadPromise;
  }
  function toggleZenStyles(active){zenStyleLinks.forEach(function(link){link.media=active?'all':'not all';});}
  function trainingSessionActive(){var modal=document.getElementById('session-modal');return !!(modal&&modal.classList.contains('show'));}
  function zenSessionActive(){return document.body.classList.contains('in-session');}
  function canLeave(next){
    if(mode==='training'&&next==='zen'&&trainingSessionActive()){setNotice('Avsluta det pågående träningspasset innan du byter till Zen.');return false;}
    if(mode==='zen'&&next==='training'&&zenSessionActive()){setNotice('Avsluta eller lämna Zen-passet till startsidan innan du byter till Träning.');return false;}
    return true;
  }
  function applyMode(next){
    var zen=next==='zen';
    toggleZenStyles(zen);
    document.documentElement.dataset.wellnessMode=next;
    document.body.classList.toggle('wellness-zen-active',zen);
    trainingMain.hidden=zen;
    if(zenHost)zenHost.hidden=!zen;
    if(zenTools)zenTools.hidden=!zen;
    if(zenBrand)zenBrand.hidden=!zen;
    var trainingBrand=header&&header.querySelector('.brand-text');if(trainingBrand)trainingBrand.hidden=zen;
    var streak=header&&header.querySelector('.streak-badge');if(streak)streak.hidden=zen;
    ensureThemeMeta().content=zen?(document.body.dataset.kind==='meditation'?'#a7c3bd':'#091d18'):trainingTheme;
    document.title=zen?'Zen · Stretch och meditation':trainingTitle;
    updateNav(next);
    mode=next;
  }
  function swap(next){
    scrollPositions[mode]=window.scrollY||0;
    var apply=function(){applyMode(next);};
    if(reduced&&reduced.matches){apply();return Promise.resolve();}
    if(typeof document.startViewTransition==='function'){
      var transition=document.startViewTransition(apply);
      return transition.finished.catch(function(){});
    }
    document.documentElement.classList.add('wellness-shell-switching');
    apply();
    var target=next==='zen'?zenHost:trainingMain;
    if(target)target.classList.add('wellness-surface-enter');
    return new Promise(function(resolve){window.setTimeout(function(){document.documentElement.classList.remove('wellness-shell-switching');if(target)target.classList.remove('wellness-surface-enter');resolve();},260);});
  }
  function historyFor(next,action){
    if(action==='none')return;
    var url=modeURL(next);
    if(action==='replace')history.replaceState({wellnessMode:next},'',url.href);
    else history.pushState({wellnessMode:next},'',url.href);
  }
  function requestMode(next,options){
    options=options||{};next=next==='zen'?'zen':'training';
    if(next===mode&&!options.force){updateNav(next);return Promise.resolve(true);}
    if(!canLeave(next))return Promise.resolve(false);
    var token=++switchToken;
    var ready=next==='zen'?ensureZenLoaded():Promise.resolve();
    return ready.then(function(){
      if(token!==switchToken)return false;
      return swap(next).then(function(){
        if(token!==switchToken)return false;
        historyFor(next,options.history||'push');
        requestAnimationFrame(function(){window.scrollTo(0,scrollPositions[next]||0);});
        window.dispatchEvent(new CustomEvent('wellness-mode-change',{detail:{mode:next}}));
        return true;
      });
    }).catch(function(){setNotice('Zen kunde inte laddas. Försök igen.');return false;});
  }

  var nav=mountNav();
  if(!canonical){updateNav(directZen?'zen':'training');return;}
  if(!trainingMain||!header)return;
  ensureSharedHeaderZenTools();
  document.documentElement.dataset.wellnessMode='training';
  updateNav('training');
  var zenNavLink=nav&&nav.querySelector('[data-destination="zen"]');
  if(zenNavLink){
    zenNavLink.addEventListener('pointerenter',warmZenAssets,{once:true,passive:true});
    zenNavLink.addEventListener('focus',warmZenAssets,{once:true});
    zenNavLink.addEventListener('touchstart',warmZenAssets,{once:true,passive:true});
  }
  if('requestIdleCallback' in window)window.requestIdleCallback(warmZenAssets,{timeout:1200});
  else window.setTimeout(warmZenAssets,1000);
  if(nav)nav.addEventListener('click',function(event){var link=event.target.closest('[data-destination]');if(!link||!nav.contains(link))return;event.preventDefault();requestMode(link.dataset.destination);});
  window.addEventListener('popstate',function(){var next=new URLSearchParams(location.search).get('wellness')==='zen'?'zen':'training';requestMode(next,{history:'none'});});
  window.setWellnessMode=function(next){return requestMode(next);};
  if(new URLSearchParams(location.search).get('wellness')==='zen')requestMode('zen',{history:'none',force:true});
})();
