/* Ingemar uses the family's default Firebase login and a dedicated shared
 * top-level record, just like the separate Maja/Markus training keys.
 * Only Ingemar's data is loaded here; existing private UID data is untouched. */
(function () {
  'use strict';
  // Three-way merge: only changes relative to the device's acknowledged base
  // are applied. Arrays with IDs are records, never a replace-all collection.
  function merge(base,local,remote){
    const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
    if(equal(base,local))return remote;
    if(equal(base,remote)||equal(local,remote))return local;
    // Preserve a newer remote edit if this device deleted a stale version.
    if(local===undefined)return remote;
    if(Array.isArray(local)&&Array.isArray(remote)&&[...(base||[]),...local,...remote].every(x=>x&&x.id!=null)){
      const map=a=>Object.fromEntries((a||[]).map(x=>[String(x.id),x]));
      const values=merge(map(base),map(local),map(remote));
      const order=equal((base||[]).map(x=>x.id),local.map(x=>x.id))?remote:local;
      return [...new Set([...order,...local,...remote].map(x=>String(x.id)))].filter(id=>values[id]!==undefined).map(id=>values[id]);
    }
    if(local&&remote&&typeof local==='object'&&typeof remote==='object'&&!Array.isArray(local)&&!Array.isArray(remote)){
      const out={};for(const key of new Set([...Object.keys(base||{}),...Object.keys(local),...Object.keys(remote)])){
        const value=merge(base&&base[key],local[key],remote[key]);if(value!==undefined)out[key]=value;
      }return out;
    }
    // A concurrent deletion must not erase a newer edit.
    return local;
  }
  function mergeProfile(base,local,remote){
    const result=merge(base,local,remote);
    // Two devices may replace the same day/template. Keep the other version
    // as a reusable template instead of silently losing that workout.
    function preserve(a,b,c,label){
      if(!b||!c||!b.exercises||!c.exercises||JSON.stringify(a)===JSON.stringify(b)||JSON.stringify(a)===JSON.stringify(c)||JSON.stringify(b)===JSON.stringify(c))return;
      const text=JSON.stringify(c);let hash=2166136261;for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);
      const id='recovered-'+label+'-'+(hash>>>0).toString(36);
      result.templates=result.templates||[];
      if(!result.templates.some(t=>t.id===id))result.templates.push({id,name:(c.name||c.type)+' · sparad version',type:c.type,exercises:c.exercises});
    }
    for(const date of Object.keys(local.plans||{}))preserve((base.plans||{})[date],local.plans[date],(remote.plans||{})[date],date);
    for(const item of local.templates||[])preserve((base.templates||[]).find(x=>x.id===item.id),item,(remote.templates||[]).find(x=>x.id===item.id),item.id);
    return result;
  }
  window.IngemarMerge=mergeProfile;
  const ROOT='ex_ingemar';
  const LOCAL_KEY='ex_ingemar';
  const CACHE_OWNER=LOCAL_KEY+'_verified_uid';
  const API={
    ready:false,
    user:null,
    status:'Kontrollerar inloggning…',
    connect,
    save,
    logout,
    get canEdit(){return API.ready && !!API.user;},
  };
  window.IngemarAccount=API;
  let app,auth,db,recordRef=null,recordHandler=null,client=null,connected=false;
  let localDurable=true,baseRaw='',pendingKey=LOCAL_KEY+'_journal';
  let generation=0,writeTimer=null,dirty=false,saving=false,lastLocal='',lastRemote='',retryTimer=null;
  let loginBusy=false,loadTimer=null,refreshPending=false,readAttempt=0;
  let authResolved=false,persistenceReady=Promise.resolve(),persistenceWarning=false,writeWatchdog=null;

  function el(id){return document.getElementById(id);}
  function text(id,value){const node=el(id);if(node)node.textContent=value;}
  function setStatus(status){
    API.status=status;
    const indicator=el('ingemar-sync-status');
    if(!indicator)return;
    const failed=/nekad|misslyckades|Kunde inte|åtkomst saknas|Fel vid/i.test(status);
    const synced=/^Synkat/i.test(status);
    const waiting=dirty||/väntar|synkar|sparar|ansluter|kontrollerar/i.test(status);
    indicator.dataset.syncState=failed?'error':synced?'synced':waiting?'pending':'idle';
    indicator.dataset.error=failed?'true':'false';
    let visible=status;
    if(status==='Synkat via Firebase')visible='Synkat · Firebase';
    else if(status==='Sparar ändringar…')visible='Sparar · väntar på Firebase';
    else if(status==='Lokala ändringar väntar på synk')visible='Sparat på enheten · väntar på Firebase';
    else if(status==='Sparat lokalt · synkningen misslyckades')visible='Sparat på enheten · ej synkat';
    indicator.textContent=visible;
    indicator.title=status;
  }
  function message(value,error){
    const node=el('ingemar-account-message');
    if(node){node.textContent=value||'';node.dataset.error=error?'true':'false';}
  }
  function setGate(visible,phase){
    document.documentElement.dataset.ingemarAuth=visible?'locked':'ready';
    const main=el('ingemar-main');if(main)main.inert=!API.ready;
    const logoutButton=el('ingemar-logout');if(logoutButton)logoutButton.disabled=!authResolved;
    const gate=el('ingemar-account-gate');
    const currentPhase=!visible?'ready':(phase||(authResolved?(API.user?'loading':'login'):'restoring'));
    if(gate){
      gate.hidden=!visible;
      gate.dataset.phase=currentPhase;
      gate.dataset.signedIn=API.user?'true':'false';
      gate.setAttribute('aria-label',currentPhase==='login'?'Logga in på Ingemars träning':'Ingemars träning');
    }
    // Do not reveal the credentials form during Firebase initialization or
    // while a previously authenticated account is fetching its data.
    const form=el('ingemar-account-form');
    if(form)form.hidden=currentPhase!=='login';
  }
  function localKey(){return LOCAL_KEY;}
  function cache(value){try{localStorage.setItem(localKey(),value);if(API.user)localStorage.setItem(CACHE_OWNER,API.user.uid);return true;}catch(_){setStatus('Kunde inte spara på enheten · håll sidan öppen');return false;}}
  function forgetVerifiedCache(){try{localStorage.removeItem(CACHE_OWNER);}catch(_){}}
  function showVerifiedCache(){
    try{
      const owner=localStorage.getItem(CACHE_OWNER);
      if(!owner||(API.user&&owner!==API.user.uid))return;
      // This is a read-only copy already stored on this device, never proof
      // of authentication. Only a fresh authorized snapshot enables saving.
      const raw=readCache();if(!raw)return;
      const value=JSON.parse(raw);if(!value||typeof value!=='object'||Array.isArray(value))return;
      client.apply(value);setGate(false);
      setStatus(API.user?'Visar sparad data · synkar…':'Visar sparad data · kontrollerar inloggning…');
    }catch(_){/* Invalid or unavailable cache falls back to the server. */}
  }
  function readCache(){try{return localStorage.getItem(localKey());}catch(_){return null;}}
  function setDirty(value){
    dirty=value;
    try{localStorage.setItem(localKey()+'_pending',value?'1':'0');}catch(_){}
  }
  function pendingLocal(){
    try{return localStorage.getItem(localKey()+'_pending')==='1';}catch(_){return false;}
  }
  function errorMessage(error){
    const code=error&&error.code||'';
    if(code==='auth/email-already-in-use')return 'Adressen har redan ett konto. Välj Logga in.';
    if(code==='auth/invalid-email')return 'Ange en giltig e-postadress.';
    if(code==='auth/weak-password')return 'Välj ett lösenord med minst sex tecken.';
    if(code==='auth/invalid-credential'||code==='auth/wrong-password'||code==='auth/user-not-found')return 'Fel e-post eller lösenord.';
    if(code==='auth/operation-not-allowed')return 'E-postinloggning måste aktiveras i Firebase Authentication.';
    if(code==='auth/too-many-requests')return 'För många försök. Vänta en stund.';
    if(/permission.denied/i.test(code))return 'Du är inloggad, men Firebase nekar åtkomst till Ingemars träningsdata (ex_ingemar). Databasregeln behöver ge ditt och Ingemars konto behörighet. Ett nytt konto ändrar inte regeln.';
    if(code==='load-timeout')return 'Du är inloggad, men databasen svarar inte. Kontrollera anslutningen och välj Försök igen.';
    return 'Det gick inte att ansluta. Försök igen.';
  }
  function setBusy(busy){
    loginBusy=busy;
    for(const id of ['ingemar-login-submit','ingemar-register-submit']){
      const b=el(id);if(b)b.disabled=busy;
    }
  }
  function signIn(register){
    if(loginBusy||!auth)return;
    const email=(el('ingemar-login-email').value||'').trim();
    const password=el('ingemar-login-password').value||'';
    if(!email||password.length<6){message('Ange e-postadress och lösenord (minst sex tecken).',true);return;}
    setBusy(true);message(register?'Skapar ditt konto…':'Loggar in…');
    const operation=persistenceReady.then(()=>register?auth.createUserWithEmailAndPassword(email,password):auth.signInWithEmailAndPassword(email,password));
    operation.then(()=>{el('ingemar-login-password').value='';})
      .catch(error=>message(errorMessage(error),true))
      .finally(()=>setBusy(false));
  }
  function stopLoadTimer(){if(loadTimer){clearTimeout(loadTimer);loadTimer=null;}}
  function watchLoad(){
    stopLoadTimer();
    const token=generation;
    loadTimer=setTimeout(()=>{if(token===generation&&!API.ready)loadFailed({code:'load-timeout'});},12000);
  }
  function loadFailed(error){
    if(/permission.denied/i.test(error&&error.code||''))forgetVerifiedCache();
    stopLoadTimer();readAttempt++;refreshPending=false;connected=false;API.ready=false;setGate(true,'error');
    setStatus(/permission.denied/i.test(error&&error.code||'')?'Firebase-åtkomst saknas':'Kunde inte hämta träningsdata');
    message(errorMessage(error)+(API.user&&/permission.denied/i.test(error&&error.code||'')?' (UID: '+API.user.uid+')':''),true);
  }
  function teardown(){
    generation++;readAttempt++;stopLoadTimer();refreshPending=false;
    if(writeTimer){clearTimeout(writeTimer);writeTimer=null;}
    if(writeWatchdog){clearTimeout(writeWatchdog);writeWatchdog=null;}
    if(recordRef&&recordHandler)recordRef.off('value',recordHandler);
    recordRef=null;recordHandler=null;API.ready=false;API.user=null;
    connected=false;dirty=false;saving=false;lastLocal='';lastRemote='';
    setGate(true,'restoring');
    if(client)client.apply(null);
  }
  async function activate(user){
    teardown();
    if(!user){forgetVerifiedCache();setGate(true,'login');setStatus('Inte inloggad');message('Logga in för att öppna din träningssida.');return;}
    const token=generation;
    API.user={uid:user.uid,email:user.email||''};
    setGate(true,'loading');watchLoad();
    message('Hämtar dina träningsuppgifter…');setStatus('Ansluter till Firebase…');
    showVerifiedCache();
    recordRef=db.ref(ROOT);
    const ref=recordRef;
    const handler=function(snapshot){
      if(token!==generation)return;
      const record=snapshot.val();
      const raw=typeof record==='string'?record:'';
      if(record!==null&&typeof record!=='string'){setGate(true,'error');stopLoadTimer();setStatus('Fel vid inläsning');message('Sparade uppgifter har ett oväntat format.',true);return;}
      if(!API.ready){
        let chosen=raw;
        let journal=null;
        try{journal=JSON.parse(localStorage.getItem(pendingKey)||'null');}catch(_){}
        const unsent=journal&&journal.local||pendingLocal()&&readCache();
        if(unsent){try{chosen=JSON.stringify(mergeProfile(JSON.parse(journal&&journal.base||'{}'),JSON.parse(unsent),JSON.parse(raw||'{}')));setDirty(true);}catch(error){loadFailed(error);return;}}
        baseRaw=raw||'{}';
        if(chosen){
          try{client.apply(JSON.parse(chosen));}catch(error){
            setGate(true,'error');stopLoadTimer();console.warn('[Ingemar] Kunde inte tolka synkad data',error);
            message('Sparade uppgifter kunde inte läsas. Kontakta administratören innan du ändrar något.',true);
            setStatus('Fel vid inläsning');return;
          }
        }else client.apply(null);
        lastRemote=raw||'';
        lastLocal=chosen||client.serialize();cache(lastLocal);
        stopLoadTimer();API.ready=true;connected=true;setGate(false);message('');
        setStatus(dirty?'Lokala ändringar väntar på synk':persistenceWarning?'Synkat · inloggning kan behöva upprepas':'Synkat via Firebase');
        if(dirty){saveJournal();queueWrite();}
        return;
      }
      if(!dirty&&!saving&&raw!==lastRemote){
        try{client.apply(raw?JSON.parse(raw):null);lastLocal=raw||client.serialize();cache(lastLocal);}
        catch(error){console.warn('[Ingemar] Ogiltig fjärrdata',error);setStatus('Fel vid uppdatering');return;}
      }
      if(!dirty&&!saving)baseRaw=raw||'{}';
      lastRemote=raw||'';
      if(!dirty&&!saving)setStatus('Synkat via Firebase');
    };
    recordHandler=handler;
    ref.on('value',handler,function(error){
      if(token!==generation)return;
      loadFailed(error);
    });
    // The initial value listener supplies the first snapshot and stays live.
    // Avoid an additional competing get() while Firebase restores its cache.
  }
  async function refresh(){
    const ref=recordRef,handler=recordHandler;
    if(!ref||!handler||saving||(dirty&&API.ready)||refreshPending)return;
    refreshPending=true;const attempt=++readAttempt;
    try{const snapshot=await ref.get();if(ref===recordRef&&attempt===readAttempt)handler(snapshot);}
    catch(error){if(ref===recordRef&&attempt===readAttempt&&!API.ready)loadFailed(error);}
    finally{if(ref===recordRef&&attempt===readAttempt)refreshPending=false;}
  }
  function queueWrite(){
    if(!API.canEdit||!dirty)return;
    if(writeTimer)clearTimeout(writeTimer);
    writeTimer=setTimeout(flush,450);
    setStatus('Sparar ändringar…');
  }
  async function flush(){
    writeTimer=null;
    if(!API.canEdit||!recordRef||saving||!dirty)return;
    const token=generation,raw=lastLocal,base=baseRaw,ref=recordRef;
    saving=true;
    if(writeWatchdog)clearTimeout(writeWatchdog);
    writeWatchdog=setTimeout(()=>{
      if(token===generation&&saving)setStatus(localDurable?'Sparat lokalt · väntar på Firebase':'Inte sparat ännu · håll sidan öppen');
    },10000);
    try{
      const result=await ref.transaction(current=>{
        if(current!==null&&typeof current!=='string')throw Error('Invalid remote data');
        return JSON.stringify(mergeProfile(JSON.parse(base||'{}'),JSON.parse(raw),JSON.parse(current||'{}')));
      },undefined,false);
      if(!result.committed)throw Error('Transaction aborted');
      const committed=result.snapshot.val();
      if(token!==generation)return;
      saving=false;
      if(writeWatchdog){clearTimeout(writeWatchdog);writeWatchdog=null;}
      baseRaw=committed;lastRemote=committed;
      lastLocal=JSON.stringify(mergeProfile(JSON.parse(raw),JSON.parse(lastLocal),JSON.parse(committed)));
      client.apply(JSON.parse(lastLocal));cache(lastLocal);
      if(lastLocal===committed){
        setDirty(false);try{localStorage.removeItem(pendingKey);}catch(_){}
        setStatus('Synkat via Firebase');
      }else{saveJournal();queueWrite();}
    }catch(error){
      if(token!==generation)return;
      saving=false;
      if(writeWatchdog){clearTimeout(writeWatchdog);writeWatchdog=null;}
      if(/permission.denied/i.test(error&&error.code||''))setStatus('Firebase nekade sparningen · kontrollera kontobehörighet');
      else setStatus(localDurable?'Sparat lokalt · synkningen misslyckades':'Kunde inte spara · håll sidan öppen');
      console.warn('[Ingemar] Synkning misslyckades',error);
    }
  }
  function saveJournal(){
    try{localStorage.setItem(pendingKey,JSON.stringify({base:baseRaw,local:lastLocal}));localDurable=true;return true;}
    catch(_){localDurable=false;setStatus('Kunde inte spara på enheten · håll sidan öppen');return false;}
  }
  function save(value){
    if(!API.canEdit)return false;
    let raw;
    try{raw=JSON.stringify(value);}catch(_){return false;}
    if(raw===lastLocal&&!dirty)return true;
    lastLocal=raw;setDirty(true);const durable=saveJournal();cache(raw);queueWrite();if(!durable)setStatus('Kunde inte spara på enheten · håll sidan öppen');
    return true;
  }
  async function logout(){
    if(!auth)return;
    if(dirty&&recordRef&&connected)await flush();
    if(dirty&&!window.confirm('Ändringar är inte synkade. Vill du ändå logga ut?'))return;
    await auth.signOut();
  }
  function connect(adapter){
    client=adapter;
    showVerifiedCache();
    const login=el('ingemar-account-form');
    if(login)login.addEventListener('submit',event=>{event.preventDefault();signIn(false);});
    const register=el('ingemar-register-submit');
    if(register)register.addEventListener('click',()=>signIn(true));
    const logoutButton=el('ingemar-logout');
    if(logoutButton)logoutButton.addEventListener('click',()=>logout().catch(()=>message('Kunde inte logga ut.',true)));
    const retry=el('ingemar-retry');
    if(retry)retry.addEventListener('click',()=>{if(API.user){
      const user=auth&&auth.currentUser||API.user;
      message('Återansluter till Firebase…');
      activate(user).catch(loadFailed);
    }});
    const gateLogout=el('ingemar-gate-logout');
    if(gateLogout)gateLogout.addEventListener('click',()=>logout().catch(()=>message('Kunde inte byta konto.',true)));
    function startFirebase(){
      try{
        if(!window.firebase||!window.FIREBASE_CONFIG)throw Error('Firebase SDK eller konfiguration saknas');
        app=firebase.apps.find(a=>a.name==='[DEFAULT]')||firebase.initializeApp(window.FIREBASE_CONFIG);
        auth=firebase.auth(app);db=firebase.database(app);
        // Wait until durable sign-in persistence is configured before resolving
        // the restored session or accepting new credentials.
        persistenceReady=auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
          .catch(error=>{persistenceWarning=true;console.warn('[Ingemar] Lokal inloggningslagring saknas',error);});
        persistenceReady.then(()=>{
          auth.onAuthStateChanged(user=>{
            authResolved=true;
            activate(user).catch(error=>loadFailed(error));
          },error=>{authResolved=true;forgetVerifiedCache();teardown();setGate(true,'error');message(errorMessage(error),true);});
        });
        retryTimer=setInterval(()=>{if(dirty&&!saving&&!writeTimer&&API.canEdit)queueWrite();},3000);
        window.addEventListener('online',()=>{if(dirty)queueWrite();else refresh();});
        window.addEventListener('pagehide',()=>{if(dirty)flush();});
        window.addEventListener('beforeunload',event=>{if(dirty&&!localDurable){event.preventDefault();event.returnValue='';}});
        window.addEventListener('pageshow',()=>{if(dirty)queueWrite();else refresh();});
        document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(dirty)queueWrite();else refresh();}});
      }catch(error){authResolved=true;setGate(true,'error');message(errorMessage(error),true);setStatus('Kan inte starta Firebase');}
    }
    // The local view must render independently of deferred Firebase downloads
    // and Auth initialization. DOMContentLoaded is only the network adapter's gate.
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startFirebase,{once:true});
    else startFirebase();
  }
})();
