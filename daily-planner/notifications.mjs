const button=document.querySelector('#enablePush'),status=document.querySelector('#pushStatus');
button.addEventListener('click',async()=>{
  try{
    if(/iphone|ipad|ipod/i.test(navigator.userAgent)&&!navigator.standalone&&!matchMedia('(display-mode: standalone)').matches)throw Error('Lägg till Dayline på hemskärmen och öppna appen därifrån.');
    const user=firebase.auth().currentUser;if(!user)throw Error('Logga in för att aktivera notiser.');
    if(!('Notification' in window)||!('PushManager' in window))throw Error('Webbläsaren stöder inte pushnotiser.');
    if(await Notification.requestPermission()!=='granted')throw Error('Tillåt notiser i enhetens inställningar.');
    button.disabled=true;
    const registration=await navigator.serviceWorker.ready;
    const messaging=firebase.messaging();
    const token=await messaging.getToken({serviceWorkerRegistration:registration,vapidKey:'BDxkgYtOxV9Pwiz_IJk0wzLmZCXAd1Gkdo1yHdBwZZCJr-NdwkSLbYF1l4EFBho3eT11rSdjV8esa4m9v97GjLk'});
    let id=localStorage.getItem('dayline.push.device');if(!id){id=crypto.randomUUID();localStorage.setItem('dayline.push.device',id);}
    await firebase.database().ref(`dayline_push/${user.uid}/${id}`).set({token,enabled:true,updatedAt:Date.now()});
    status.textContent='Notiser är aktiverade på den här enheten.';
  }catch(e){status.textContent=e.code==='PERMISSION_DENIED'?'Firebase behöver behörighetsregeln för notiser.':e.message;}finally{button.disabled=false;}
});
// Foreground delivery uses the same notification presentation as background push.
firebase.messaging.isSupported().then(supported=>{if(supported)firebase.messaging().onMessage(async payload=>{const r=await navigator.serviceWorker.ready;await r.showNotification(payload.data.title,{body:payload.data.body,tag:payload.data.tag,data:{url:'./'},icon:'./icon-192.png'});});}).catch(()=>{});
