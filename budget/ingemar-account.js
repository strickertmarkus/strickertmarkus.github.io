/* Ingemar's personal Firebase Auth and Realtime Database adapter.
 * This module deliberately uses a named app, independent of the family's
 * default Firebase app. Data always lives under the authenticated user's UID.
 * Database rules MUST enforce auth.uid === $uid for this path. */
(function () {
  'use strict';
  const ROOT='ingemar_v1';
  const LOCAL_PREFIX='ingemar_account_v1_';
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
  let currentUid='',loginBusy=false;

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
    if(gate)gate.hidden=!visible;
  }
  function localKey(){return LOCAL_PREFIX+currentUid;}
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
    if(code==='PERMISSION_DENIED'||code==='permission_denied')return 'Databasåtkomst nekades. Kontrollera reglerna för ingemar_v1.';
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
    operation.then(()=>{el('ingemar-login-password').value='';message('Kontot är anslutet. Hämtar dina uppgifter…');})
      .catch(error=>message(errorMessage(error),true))
      .finally(()=>setBusy(false));
  }
  function teardown(){
    generation++;
    if(writeTimer){clearTimeout(writeTimer);writeTimer=null;}
    if(recordRef&&recordHandler)recordRef.off('value',recordHandler);
    recordRef=null;recordHandler=null;API.ready=false;API.user=null;
    connected=false;dirty=false;saving=false;currentUid='';lastLocal='';lastRemote='';
    setGate(true);
  }
  async function activate(user){
    teardown();
    if(!user){setStatus('Inte inloggad');message('Logga in för att öppna din träningssida.');return;}
    const token=generation;
    currentUid=user.uid;
    API.user={uid:user.uid,email:user.email||''};
    message('Hämtar dina träningsuppgifter…');setStatus('Ansluter till Firebase…');
    recordRef=db.ref(ROOT+'/'+user.uid+'/state');
    const ref=recordRef;
    const handler=function(snapshot){
      if(token!==generation)return;
      const record=snapshot.val();
      const raw=record && typeof record.json==='string'?record.json:null;
      if(!API.ready){
        let chosen=raw;
        const unsent=pendingLocal()&&readCache();
        if(unsent){chosen=unsent;setDirty(true);}
        if(chosen){
          try{client.apply(JSON.parse(chosen));}catch(error){
            console.warn('[Ingemar] Kunde inte tolka synkad data',error);
            message('Sparade uppgifter kunde inte läsas. Kontakta administratören innan du ändrar något.',true);
            setStatus('Fel vid inläsning');return;
          }
        }else client.apply(null);
        lastRemote=raw||'';
        lastLocal=chosen||client.serialize();
        API.ready=true;connected=true;setGate(false);
        setStatus(dirty?'Lokala ändringar väntar på synk':'Synkat via Firebase');
        if(dirty)queueWrite();
        return;
      }
      if(!dirty&&!saving&&raw&&raw!==lastRemote){
        try{client.apply(JSON.parse(raw));lastLocal=raw;cache(raw);}
        catch(error){console.warn('[Ingemar] Ogiltig fjärrdata',error);setStatus('Fel vid uppdatering');}
      }
      lastRemote=raw||'';
      if(!dirty&&!saving)setStatus('Synkat via Firebase');
    };
    recordHandler=handler;
    ref.on('value',handler,function(error){
      if(token!==generation)return;
      connected=false;setGate(true);
      setStatus('Firebase-åtkomst saknas');
      message(errorMessage(error),true);
    });
    text('ingemar-account-email',user.email||'Mitt konto');
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
      await ref.set({json:raw,updatedAt:firebase.database.ServerValue.TIMESTAMP});
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
    try{
      if(!window.firebase||!window.FIREBASE_CONFIG)throw Error('Firebase SDK eller konfiguration saknas');
      app=firebase.apps.find(a=>a.name==='ingemar-personal')||firebase.initializeApp(window.FIREBASE_CONFIG,'ingemar-personal');
      auth=firebase.auth(app);db=firebase.database(app);
      auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(error=>console.warn('[Ingemar] Auth persistence',error));
      auth.onAuthStateChanged(user=>activate(user),error=>{teardown();message(errorMessage(error),true);});
      retryTimer=setInterval(()=>{if(dirty&&!saving&&!writeTimer&&API.canEdit)queueWrite();},10000);
      window.addEventListener('online',()=>{if(dirty)queueWrite();});
      window.addEventListener('pageshow',()=>{if(dirty)queueWrite();});
      document.addEventListener('visibilitychange',()=>{if(!document.hidden&&dirty)queueWrite();});
    }catch(error){message(errorMessage(error),true);setStatus('Kan inte starta Firebase');}
  }
})();