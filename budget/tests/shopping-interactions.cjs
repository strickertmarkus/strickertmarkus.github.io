const assert=require('node:assert/strict');
const fs=require('node:fs');
const {webkit,chromium}=require('playwright');
fs.mkdirSync('test-results/shopping',{recursive:true});
const origin='http://127.0.0.1:4173';
const mockFirebase=String.raw`
(function(){
 const user={uid:'shopping-fixture'};
 const snapshot={val:()=>null,exists:()=>false};
 const ref={on(){},off(){},set:()=>Promise.resolve(),once:()=>Promise.resolve(snapshot),get:()=>Promise.resolve(snapshot),update:()=>Promise.resolve()};
 ref.child=()=>ref;
 const auth={currentUser:user,setPersistence:()=>Promise.resolve(),onAuthStateChanged:fn=>{setTimeout(()=>fn(user),0);return ()=>{};}};
 const authFn=()=>auth;authFn.Auth={Persistence:{LOCAL:'local'}};
 window.firebase={apps:[],initializeApp(){this.apps.push({});},auth:authFn,database:()=>({ref:()=>ref})};
})();`;
async function run(type,name,viewport,layout,offline=false){
 const browser=await type.launch();
 const context=await browser.newContext({viewport,hasTouch:viewport.width<700,isMobile:viewport.width<700,reducedMotion:viewport.width>=1000?'no-preference':'reduce'});
 const page=await context.newPage();
 page.setDefaultTimeout(10000);
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.origin===origin){
     if(url.pathname.endsWith('/firebase-sync.js'))return route.fulfill({contentType:'application/javascript',body:''});
     return route.continue();
   }
   if(url.hostname==='www.gstatic.com')return route.fulfill({contentType:'application/javascript',body:offline?'':mockFirebase});
   return route.fulfill({status:200,body:'',contentType:route.request().resourceType()==='stylesheet'?'text/css':'application/javascript'});
 });
 await page.addInitScript(()=>{
   if(localStorage.getItem('test-seeded'))return;
   localStorage.setItem('test-seeded','true');
   localStorage.setItem('sh_lists',JSON.stringify([
     {id:1,name:'Huvudlista',items:[{id:10,type:'category',text:'Mat'},...Array.from({length:36},(_,i)=>({id:i+100,type:'item',text:'Vara '+i,checked:false}))]},
     {id:2,name:'Helg',items:[{id:201,type:'item',text:'Kaffe',checked:false}]}
   ]));
   localStorage.setItem('sh_saved_templates',JSON.stringify([{id:8,name:'Veckohandling',headings:['Mat','Hem']}]));
   localStorage.setItem('sh_recipes_v3',JSON.stringify({version:4,recipes:[{id:7,name:'Pasta',url:'',items:['Tomater','Pasta']},{id:8,name:'Soppa',url:'https://example.com/soppa',items:['Morot']}]}));
 });
 const prefix=name+'-'+layout+(offline?'-offline':'');
 async function geometry(selector){
   const result=await page.locator(selector).evaluate(el=>{
     const r=el.getBoundingClientRect();
     return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:innerWidth,h:innerHeight,display:getComputedStyle(el).display};
   });
   assert(result.x>=-1&&result.right<=result.w+1&&result.y>=-1&&result.bottom<=result.h+1,selector+' outside viewport '+JSON.stringify(result));
 }
 async function openMenu(label){
   await page.locator('.dropdown-btn').filter({hasText:label}).click();
   await page.waitForFunction(()=>document.querySelector('#shopping-menu-dialog').open);
   await geometry('#shopping-menu-dialog');
   assert(await page.evaluate(()=>TrainingOverlay.isLocked()));
 }
 async function closed(){
   await page.waitForFunction(()=>!document.querySelector('#shopping-menu-dialog').open&&!TrainingOverlay.isLocked());
 }
 async function storeValue(key){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);}
 try{
   await page.goto(origin+'/budget/shopping.html',{waitUntil:'networkidle'});
   assert.equal(await page.locator('.shopping-mode-switch button svg').count(),3);
   assert.equal(await page.locator('a[href="shopping-minimal.html"]').count(),0);

   await page.waitForFunction(()=>window.__shoppingRecipeLinkPopupV5Installed&&window.__shoppingListEngineV7);
   assert.equal(await page.locator('#items-list .list-item').count(),36);
   assert.equal(await page.locator('#recipes-list .recipe-item').count(),2);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow');
   for(const attr of ['data-shopping-list-engine-v7','data-shopping-recipes-v4','data-shopping-recipe-link-popup-v5','data-shopping-recipe-header-polish-v6']){
     assert.equal(await page.locator('script['+attr+']').count(),1,'duplicate runtime '+attr);
   }
   await page.screenshot({path:'test-results/shopping/'+prefix+'-page.png',fullPage:true});
   // Hamburger is reachable and visible in the viewport, even on short screens.
   await page.locator('.nav-btn').click();
   await geometry('#shopping-menu-dialog');
   await page.locator('#nav-menu a[href="shopping.html"]').first().waitFor({state:'visible'});
   assert.equal(await page.locator('.nav-btn').getAttribute('aria-expanded'),'true');
   assert(await page.evaluate(()=>TrainingOverlay.isLocked()));
   await page.screenshot({path:'test-results/shopping/'+prefix+'-menu.png'});
   await page.keyboard.press('Tab');
   assert(await page.evaluate(()=>document.querySelector('#shopping-menu-dialog').contains(document.activeElement)));
   await page.keyboard.press('Escape');await closed();
   assert(await page.evaluate(()=>document.activeElement===document.querySelector('.nav-btn')));
   // Repeated open/close and backdrop dismissal cannot leak scroll locks.
   for(let i=0;i<3;i++){await page.locator('.nav-btn').click();await page.locator('.shopping-menu-close').click();await closed();}
   await page.locator('.nav-btn').click();await page.mouse.click(2,2);await closed();
   // List selection, adding, editing, checking, deleting and undo.
   await openMenu('Listor');await page.locator('#lists-menu a').filter({hasText:'Helg'}).click();await closed();
   assert.equal(await page.locator('#shopping-current-list').innerText(),'Helg');
   await page.locator('[data-item-id="201"] .item-text').click();
   await page.locator('[data-editing-item="true"]').fill('Kaffe och te');
   await page.locator('[data-editing-item="true"]').press('Enter');
   await page.locator('.shopping-draft-editor').fill('Mjölk');
   // The existing key repeat guard intentionally spans 150ms.
   await page.waitForTimeout(170);
   await page.locator('.shopping-draft-editor').press('Enter');
   await page.locator('.shopping-draft-editor').press('Escape');
   assert((await storeValue('sh_lists'))[1].items.some(x=>x.text==='Mjölk'));
   await page.locator('[data-item-id="201"] input[type="checkbox"]').check();
   assert((await storeValue('sh_lists'))[1].items.find(x=>x.id===201).checked);
   assert.match(await page.locator('#shopping-summary').innerText(),/1 kvar/);
   await page.locator('[data-item-id="201"] [data-action="delete-item"]').click();
   assert(!(await storeValue('sh_lists'))[1].items.some(x=>x.id===201));
   await page.locator('.undo-btn').click();
   assert((await storeValue('sh_lists'))[1].items.some(x=>x.id===201));
   // Save and select templates, create and delete a list.
   await openMenu('Listor');await page.locator('#lists-menu a').filter({hasText:'Huvudlista'}).click();await closed();
   await openMenu('Mallar');
   page.once('dialog',d=>d.accept('Testmall'));
   await page.locator('#templates-menu .menu-action').click();
   assert((await storeValue('sh_saved_templates')).some(x=>x.name==='Testmall'));
   await page.locator('.shopping-menu-close').click();await closed();
   await openMenu('Listor');page.once('dialog',d=>d.accept('Testlista'));
   await page.locator('#lists-menu .menu-action').click();await closed();
   assert.equal(await page.locator('#shopping-current-list').innerText(),'Testlista');
   assert((await storeValue('sh_lists')).find(x=>x.name==='Testlista').items.some(x=>x.type==='category'));
   await openMenu('Listor');page.once('dialog',d=>d.accept());
   await page.locator('#lists-menu .list-menu-row').filter({hasText:'Testlista'}).locator('button').click();await closed();
   assert(!(await storeValue('sh_lists')).some(x=>x.name==='Testlista'));
   // Add recipe ingredients through the menu and edit their saved URL in a modal.
   await openMenu('Recept');await page.locator('#recipes-dropdown a').filter({hasText:'Pasta'}).click();await closed();
   assert((await storeValue('sh_lists'))[0].items.some(x=>x.text==='Tomater'));
   const edit=page.locator('[data-recipe-id="7"] .recipe-edit-meta-v4');
   await edit.scrollIntoViewIfNeeded();
   const beforeY=await page.evaluate(()=>scrollY);
   await edit.click();
   await page.waitForFunction(()=>document.querySelector('#recipe-link-popup-v5').open);
   await geometry('#recipe-link-popup-v5');
   await page.screenshot({path:'test-results/shopping/'+prefix+'-recipe.png'});
   assert(await page.evaluate(()=>TrainingOverlay.isLocked()));
   const frozen=await page.evaluate(()=>document.querySelector('.shopping-list-panel').getBoundingClientRect().top);
   if(viewport.width<700&&type===webkit)await page.evaluate(()=>scrollBy(0,500));
   else await page.mouse.wheel(0,500);
   assert(Math.abs(await page.evaluate(()=>document.querySelector('.shopping-list-panel').getBoundingClientRect().top)-frozen)<2,'background scrolled');
   await page.locator('#recipe-link-input-v5').fill('javascript:alert(1)');
   await page.locator('[data-link-save-v5]').click();
   assert(await page.locator('#recipe-link-error-v5').innerText());
   await page.locator('#recipe-link-input-v5').fill('https://example.com/pasta');
   await page.locator('[data-link-save-v5]').click();
   await page.waitForFunction(()=>!document.querySelector('#recipe-link-popup-v5').open&&!TrainingOverlay.isLocked());
   assert(Math.abs(await page.evaluate(()=>scrollY)-beforeY)<3,'scroll restoration');
   assert.equal((await storeValue('sh_recipes_v3')).recipes.find(x=>x.id===7).url,'https://example.com/pasta');
   await edit.click();await page.keyboard.press('Escape');
   await page.waitForFunction(()=>!TrainingOverlay.isLocked());
   // Expand/collapse and add an ingredient; saved data survives reload.
   await page.locator('[data-recipe-id="7"] .recipe-toggle').click();
   await page.locator('#new-recipe-ingredient-v4-7').fill('Basilika');
   await page.locator('#new-recipe-ingredient-v4-7').press('Enter');
   assert((await storeValue('sh_recipes_v3')).recipes.find(x=>x.id===7).items.includes('Basilika'));
   // Mode templates are persistent lists, and unfinished edits stay in their own mode.
   const switchTo=async mode=>{
     const button=page.locator('[data-list-mode-button="'+mode+'"]');
     await button.click();
     assert.equal(await button.getAttribute('aria-pressed'),'true');
     assert.equal(await button.evaluate(el=>getComputedStyle(el).color),'rgb(253, 186, 116)');
     assert.equal(await page.locator('.logo').evaluate(el=>getComputedStyle(el).color),'rgb(253, 186, 116)');
   };
   await switchTo('packing');
   assert.equal(await page.title(),'Packlista');
   assert.deepEqual(await page.locator('#items-list .category-title:not(.new-category)').allTextContents(),['Melker','Mila','Maja','Markus','Övrigt']);
   await page.locator('[data-action="add-item"]').first().click();
   await page.locator('.shopping-draft-editor').fill('Solhatt');
   await switchTo('todo');
   assert.equal(await page.title(),'Att göra');
   assert.equal(await page.locator('#items-list .category-title:not(.new-category)').count(),0);
   await page.locator('[data-action="add-item"]').first().click();
   await page.locator('.shopping-draft-editor').fill('Boka tid');
   await switchTo('packing');
   assert.match(await page.locator('#items-list').innerText(),/Solhatt/);
   assert.doesNotMatch(await page.locator('#items-list').innerText(),/Boka tid/);
   await page.locator('.undo-btn').click();
   assert.doesNotMatch(await page.locator('#items-list').innerText(),/Solhatt/);
   await switchTo('todo');
   assert.match(await page.locator('#items-list').innerText(),/Boka tid/);
   await switchTo('packing');
   await page.locator('[data-action="add-item"]').first().click();
   await page.locator('.shopping-draft-editor').fill('Solhatt');
   await switchTo('todo');await switchTo('packing');
   await page.reload({waitUntil:'networkidle'});
   await page.waitForFunction(()=>window.__shoppingRecipeLinkPopupV5Installed);
   assert.equal(await page.title(),'Packlista');
   assert.match(await page.locator('#items-list').innerText(),/Solhatt/);
   await switchTo('todo');
   assert.match(await page.locator('#items-list').innerText(),/Boka tid/);
   await page.locator('.undo-btn').click();
   assert.doesNotMatch(await page.locator('#items-list').innerText(),/Solhatt/);
   await switchTo('shopping');
   assert.equal(await page.locator('.logo').evaluate(el=>getComputedStyle(el).color),'rgb(253, 186, 116)');
   for(const heading of ['Maxi','Willys','Hemköp','Lidl','Coop'])assert((await page.locator('#items-list .category-title').allTextContents()).includes(heading));
   assert.doesNotMatch(await page.locator('#items-list').innerText(),/Solhatt|Boka tid/);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.reload({waitUntil:'networkidle'});
   await page.waitForFunction(()=>window.__shoppingRecipeLinkPopupV5Installed);
   assert((await storeValue('sh_lists'))[0].items.some(x=>x.text==='Tomater'));
   assert.equal((await storeValue('sh_recipes_v3')).recipes.find(x=>x.id===7).url,'https://example.com/pasta');
   assert.deepEqual(errors,[]);
   console.log(prefix+': menus, keyboard, scroll, CRUD, undo, templates, recipes, reload passed');
 }catch(error){
   await page.screenshot({path:'test-results/shopping/'+prefix+'-failure.png',fullPage:true}).catch(()=>{});
   console.log('FAILURE STATE',prefix,await page.evaluate(()=>({url:location.href,errors:[],open:[...document.querySelectorAll('dialog[open]')].map(x=>x.id),active:document.activeElement?.outerHTML,body:document.body.className})).catch(()=>({})),errors);
   throw error;
 }finally{await browser.close();}
}
(async()=>{
 for(const [type,browserName] of [[webkit,'webkit'],[chromium,'chromium']]){
   for(const [name,viewport] of [['mobile',{width:390,height:844}],['desktop',{width:1440,height:960}],['short',{width:667,height:375}]]){
     await run(type,browserName+'-'+name,viewport,'dashboard');
   }
 }
 await run(webkit,'webkit-mobile',{width:390,height:844},'dashboard',true);
})().catch(e=>{console.error(e);process.exitCode=1;});
