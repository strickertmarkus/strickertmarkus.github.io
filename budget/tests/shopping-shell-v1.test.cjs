const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const html=read('shopping.html'),css=read('shopping-shell-v1.css');
test('list modes keep the same persisted feature owners',()=>{
  assert.equal(fs.existsSync(path.join(__dirname,'..','shopping-minimal.html')),false);
  for(const name of ['core-v1','list-stability-v8','list-engine-v7','toolbar-v9','recipes-v4','recipe-link-popup-v5','recipe-header-polish-v6']){
    assert.equal(html.split('src="shopping-'+name+'.js?').length-1,1,name);
  }
  assert.match(html,/training-overlay\.js/);
  assert.match(html,/orange-icons-2/);
  assert.doesNotMatch(html+css,/minimal-tools|data-shopping-layout|Fokuserad vy/);
});
test('menus and recipe editor use modal top layer and shared scroll ownership',()=>{
  assert.match(html,/<dialog id="shopping-menu-dialog"/);
  assert.match(read('shopping-core-v1.js'),/menuDialog.showModal\(\)/);
  assert.match(read('shopping-recipe-link-popup-v5.js'),/createElement\('dialog'\)/);
  assert.doesNotMatch(css,/position:fixed/);
  assert.doesNotMatch(read('shopping-list-engine-v7.js'),/\.nav-dropdown-wrapper\{/);
});
test('background scrolls and fades; controls retain accessible motion and focus',()=>{
  assert.match(css,/--bg:#0F1219/);
  assert.match(css,/--accent:#FDBA74/);
  assert.match(css,/mask-image:linear-gradient/);
  assert.match(css,/focus-visible/);
  assert.match(css,/prefers-reduced-motion/);
});
