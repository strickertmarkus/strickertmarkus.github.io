const assert = require('node:assert/strict');
const fs = require('node:fs');
const {webkit} = require('playwright');
const origin = 'http://127.0.0.1:4173';
const out = 'test-results/shopping';
fs.mkdirSync(out, {recursive:true});

(async () => {
  const browser = await webkit.launch();
  const context = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === origin) {
      if (url.pathname.endsWith('/firebase-sync.js')) return route.fulfill({body:'',contentType:'application/javascript'});
      return route.continue();
    }
    if (url.hostname === 'cdn.jsdelivr.net') return route.continue(); // real date picker
    return route.fulfill({body:'',contentType:route.request().resourceType()==='stylesheet'?'text/css':'application/javascript'});
  });
  await context.addInitScript(() => {
    const snapshot={val:()=>null,exists:()=>false};
    const ref={on(){},off(){},set:async()=>{},once:async()=>snapshot,get:async()=>snapshot,transaction:async fn=>({committed:true,snapshot:{exists:()=>true,val:()=>fn(null)}}),update:async()=>{}};
    ref.child=()=>ref;
    const user={uid:'home-boot-fixture'};
    const auth={currentUser:user,setPersistence:async()=>{},onAuthStateChanged:fn=>{setTimeout(()=>fn(user),0);return ()=>{};}};
    const authFn=()=>auth;authFn.Auth={Persistence:{LOCAL:'local'}};
    window.firebase={apps:[{}],initializeApp(){},auth:authFn,database:()=>({ref:()=>ref})};
    if(!localStorage.getItem('home-boot-seeded')) {
      localStorage.setItem('home-boot-seeded','1');
      localStorage.setItem('sh_lists',JSON.stringify([{id:1,name:'Huvudlista',items:[{id:10,type:'category',text:'Maxi'},{id:11,type:'item',text:'Mjölk',checked:false},{id:20,type:'category',text:'Willys'},{id:21,type:'item',text:'Bananer',checked:false}]}]));
      localStorage.setItem('home-calendar-view-v11','week'); // stale preference must not restore removed UI
      const date=new Date();
      localStorage.setItem('home_transfer_income_v1',JSON.stringify({[date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')]:{markus:30000,maja:20000}}));
      const months=['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December'];
      localStorage.setItem('familjebudget_data',JSON.stringify({transfers:[{year:date.getFullYear(),month:months[date.getMonth()],husutgifter:20000,ica:6000,markusAndel:.6,majaAndel:.4,icaMarkus:3600,icaMaja:2400,huskontoMarkus:12000,huskontoMaja:8000}]}));
    }
    // Inspect the visible frames, including frames before DOMContentLoaded.
    window.homeBootFrames=[];
    function record(){
      const nav=document.querySelector('.month-nav');
      if(nav)window.homeBootFrames.push({inHeader:nav.parentElement.classList.contains('app-header'),finalClass:nav.classList.contains('home-header-month-v10'),legacyTrip:!!document.getElementById('trip-section')});
      if(window.homeBootFrames.length<120)requestAnimationFrame(record);
    }
    requestAnimationFrame(record);
  });
  try {
    await page.goto(origin+'/budget/home.html',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>window.__homeShoppingGroupsV1Installed && window.__homeCalendarPolishV5Installed);
    assert.equal(await page.locator('#trip-section,#trip-modal,#home-critical-prelayout-v9').count(),0);
    assert.equal(await page.locator('.calendar-toolbar-v2').count(),1);
    assert(await page.evaluate(()=>homeBootFrames.length>0&&homeBootFrames.every(x=>x.inHeader&&x.finalClass&&!x.legacyTrip)),'legacy layout appeared during boot');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow');
    await page.screenshot({path:out+'/home-mobile-boot.png'});
    const month=await page.locator('#month-label').textContent();
    await page.locator('.month-nav button').last().click();
    assert.notEqual(await page.locator('#month-label').textContent(),month);
    await page.locator('.month-nav button').first().click();
    await page.locator('.fab').click();
    await page.locator('#event-modal.show').waitFor();
    assert(await page.locator('#ev-date').evaluate(el=>!!el._flatpickr),'date picker not initialized');
    await page.locator('#event-modal .modal-close').click();
    await page.locator('#shopping-widget').scrollIntoViewIfNeeded();
    await page.locator('[data-sh-add-category="Maxi"]').click();
    const input=page.locator('.shopping-category-add-input');
    for(const text of ['kaffe','pasta','tomater']){
      await input.fill(text);await input.press('Enter');
      assert(await input.evaluate(el=>el===document.activeElement),'Enter lost focus');
    }
    assert.match(await page.locator('#shopping-items').textContent(),/Kaffe/);
    await page.screenshot({path:out+'/home-mobile-shopping.png'});
    await page.locator('[data-sh-close-add]').click();
    await page.locator('#home-tab-economy').click();
    assert.equal(await page.locator('#home-overview').isVisible(),false);
    assert.equal(await page.locator('.fab').isVisible(),false);
    assert.equal(await page.locator('.month-nav').isVisible(),false);
    assert.equal(await page.locator('#home-tab-economy').getAttribute('aria-selected'),'true');
    assert.equal(await page.locator('[data-calendar-view]').count(),0);
    assert.equal(await page.locator('#home-economy #transfer-widget').count(),1);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.screenshot({path:out+'/home-mobile-economy.png'});
    await page.locator('#transfer-month-btn').click();
    await page.locator('[data-transfer-edit="markus"]').click();
    await page.locator('#transfer-income-markus').fill('32000');
    await page.locator('#transfer-income-markus').press('Enter');
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('familjebudget_data')).transfers[0].huskontoMarkus),Math.round(20000*32000/52000));
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.screenshot({path:out+'/home-mobile-economy-edit.png'});
    await page.locator('#home-tab-overview').click();
    assert(await page.locator('#cal-grid').isVisible());
    assert.match(await page.locator('#shopping-items').textContent(),/Tomater/);
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.locator('body').getAttribute('data-home-calendar-view'),'month');
    assert.equal(await page.locator('.app-header > .month-nav').count(),1);
    assert.equal(await page.locator('.calendar-toolbar-v2 .month-nav').count(),0);
    assert.match(await page.locator('#shopping-items').textContent(),/Tomater/);
    assert.equal(await page.locator('#home-tab-overview').getAttribute('aria-selected'),'true');
    assert.deepEqual(errors,[]);
    console.log('Home: stable boot, calendar navigation/date picker, repeated Enter, Home sections, salary persistence and clean reload passed');
  } catch(error) {
    await page.screenshot({path:out+'/home-boot-failure.png',fullPage:true}).catch(()=>{});
    console.error('Home page errors:', errors);
    throw error;
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
