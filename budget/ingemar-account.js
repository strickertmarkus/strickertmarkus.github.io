/* Ingemar uses the family's default Firebase login and a dedicated shared
 * top-level record, just like the separate Maja/Markus training keys.
 * Only Ingemar's data is loaded here; existing private UID data is untouched. */
(function () {
  'use strict';
  const ROOT='ex_ingemar';
  const LOCAL_KEY='ex_ingemar';
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
  let generation=0,writeTimer=null,dirty=false,saving=false,lastLocal='',lastRemote='',retryTimer=null;
  let loginBusy=false,loadTimer=null,refreshPending=false,readAttempt=0;

  function el(id){return document.getElementById(id);}
  function text(id,value){const node=el(id);if(node)node.textContent=value;}
  function setStatus(status){
    API.status=status;
    text('ingemar-sync-status',status);
  }
  function message(value,error){
    const node=el('ingemar-account-message');
    if(node){node.textContent=value||'';node.dataset.error=error?'true':'false';}
  }
  function setGate(visible){
    document.documentElement.dataset.ingemarAuth=visible?'locked':'ready';
    const gate=el('ingemar-account-gate');
    if(gate){gate.hidden=!visible;gate.dataset.signedIn=API.user?'true':'false';}
  }
  function localKey(){return LOCAL_KEY;}
  function cache(value){try{localStorage.setItem(localKey(),value);}catch(_){}}
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
    const operation=register?auth.createUserWithEmailAndPassword(email,password):auth.signInWithEmailAndPassword(email,password);
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
    stopLoadTimer();readAttempt++;refreshPending=false;connected=false;API.ready=false;setGate(true);
    setStatus(/permission.denied/i.test(error&&error.code||'')?'Firebase-åtkomst saknas':'Kunde inte hämta träningsdata');
    message(errorMessage(error),true);
  }
  function teardown(){
    generation++;readAttempt++;stopLoadTimer();refreshPending=false;
    if(writeTimer){clearTimeout(writeTimer);writeTimer=null;}
    if(recordRef&&recordHandler)recordRef.off('value',recordHandler);
    recordRef=null;recordHandler=null;API.ready=false;API.user=null;
    connected=false;dirty=false;saving=false;lastLocal='';lastRemote='';
    setGate(true);
    if(client)client.apply(null);
  }
  async function activate(user){
    teardown();
    if(!user){setStatus('Inte inloggad');message('Logga in för att öppna din träningssida.');return;}
    const token=generation;
    API.user={uid:user.uid,email:user.email||''};
    setGate(true);watchLoad();
    message('Hämtar dina träningsuppgifter…');setStatus('Ansluter till Firebase…');
    recordRef=db.ref(ROOT);
    const ref=recordRef;
    const handler=function(snapshot){
      if(token!==generation)return;
      const record=snapshot.val();
      const raw=typeof record==='string'?record:'';
      if(record!==null&&typeof record!=='string'){stopLoadTimer();setStatus('Fel vid inläsning');message('Sparade uppgifter har ett oväntat format.',true);return;}
      if(!API.ready){
        let chosen=raw;
        const unsent=pendingLocal()&&readCache();
        if(unsent){chosen=unsent;setDirty(true);}
        if(chosen){
          try{client.apply(JSON.parse(chosen));}catch(error){
            stopLoadTimer();console.warn('[Ingemar] Kunde inte tolka synkad data',error);
            message('Sparade uppgifter kunde inte läsas. Kontakta administratören innan du ändrar något.',true);
            setStatus('Fel vid inläsning');return;
          }
        }else client.apply(null);
        lastRemote=raw||'';
        lastLocal=chosen||client.serialize();cache(lastLocal);
        stopLoadTimer();API.ready=true;connected=true;setGate(false);message('');
        setStatus(dirty?'Lokala ändringar väntar på synk':'Synkat via Firebase');
        if(dirty)queueWrite();
        return;
      }
      if(!dirty&&!saving&&raw!==lastRemote){
        try{client.apply(raw?JSON.parse(raw):null);lastLocal=raw||client.serialize();cache(lastLocal);}
        catch(error){console.warn('[Ingemar] Ogiltig fjärrdata',error);setStatus('Fel vid uppdatering');return;}
      }
      lastRemote=raw||'';
      if(!dirty&&!saving)setStatus('Synkat via Firebase');
    };
    recordHandler=handler;
    ref.on('value',handler,function(error){
      if(token!==generation)return;
      loadFailed(error);
    });
    refresh();
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
    const token=generation,raw=lastLocal,ref=recordRef;
    saving=true;
    try{
      await ref.set(raw);
      if(token!==generation)return;
      saving=false;
      if(raw===lastLocal){
        setDirty(false);lastRemote=raw;setStatus('Synkat via Firebase');
      }else queueWrite();
    }catch(error){
      if(token!==generation)return;
      saving=false;setStatus('Sparat på enheten · väntar på Firebase');
      console.warn('[Ingemar] Synkning misslyckades',error);
    }
  }
  function save(value){
    if(!API.canEdit)return false;
    let raw;
    try{raw=JSON.stringify(value);}catch(_){return false;}
    if(raw===lastLocal&&!dirty)return true;
    lastLocal=raw;cache(raw);setDirty(true);queueWrite();
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
    const login=el('ingemar-account-form');
    if(login)login.addEventListener('submit',event=>{event.preventDefault();signIn(false);});
    const register=el('ingemar-register-submit');
    if(register)register.addEventListener('click',()=>signIn(true));
    const logoutButton=el('ingemar-logout');
    if(logoutButton)logoutButton.addEventListener('click',()=>logout().catch(()=>message('Kunde inte logga ut.',true)));
    const retry=el('ingemar-retry');
    if(retry)retry.addEventListener('click',()=>{if(API.user){message('Försöker hämta träningsdata igen…');watchLoad();refresh();}});
    const gateLogout=el('ingemar-gate-logout');
    if(gateLogout)gateLogout.addEventListener('click',()=>logout().catch(()=>message('Kunde inte byta konto.',true)));
    try{
      if(!window.firebase||!window.FIREBASE_CONFIG)throw Error('Firebase SDK eller konfiguration saknas');
      app=firebase.apps.find(a=>a.name==='[DEFAULT]')||firebase.initializeApp(window.FIREBASE_CONFIG);
      auth=firebase.auth(app);db=firebase.database(app);
      auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(error=>console.warn('[Ingemar] Auth persistence',error));
      auth.onAuthStateChanged(user=>activate(user).catch(error=>loadFailed(error)),error=>{teardown();message(errorMessage(error),true);});
      retryTimer=setInterval(()=>{if(dirty&&!saving&&!writeTimer&&API.canEdit)queueWrite();else refresh();},3000);
      window.addEventListener('online',()=>{if(dirty)queueWrite();else refresh();});
      window.addEventListener('pageshow',()=>{if(dirty)queueWrite();else refresh();});
      document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(dirty)queueWrite();else refresh();}});
    }catch(error){message(errorMessage(error),true);setStatus('Kan inte starta Firebase');}
  }
})();