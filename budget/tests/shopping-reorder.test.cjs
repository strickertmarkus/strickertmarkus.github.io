const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const reorder=require('../shopping-list-reorder-v1.js');

function fixture(){
 return [
  {id:1,type:'item',text:'Övrigt',checked:false},
  {id:10,type:'category',text:'Maxi'},
  {id:11,type:'item',text:'Mjölk',checked:false},
  {id:12,type:'item',text:'Bröd',checked:true},
  {id:20,type:'category',text:'Willys'},
  {id:21,type:'item',text:'Ägg',checked:false},
  {id:30,type:'category',text:'Coop'},
  {id:31,type:'item',text:'Kaffe',checked:true}
 ];
}
const ids=items=>items.map(item=>item.id);
test('moving an article within its category preserves all data and checked state',()=>{
 const items=fixture(),result=reorder.moveEntries(items,'item',11,'item',12,true);
 assert.deepEqual(ids(result),[1,10,12,11,20,21,30,31]);
 assert.equal(result.find(item=>item.id===12).checked,true);
 assert.deepEqual(ids(items),[1,10,11,12,20,21,30,31]);
});
test('articles move across categories by dropping on rows or section headings',()=>{
 assert.deepEqual(ids(reorder.moveEntries(fixture(),'item',11,'item',21,true)),[1,10,12,20,21,11,30,31]);
 assert.deepEqual(ids(reorder.moveEntries(fixture(),'item',11,'category',20,true)),[1,10,12,20,21,11,30,31]);
 assert.deepEqual(ids(reorder.moveEntries(fixture(),'item',11,'uncategorized',null,true)),[1,11,10,12,20,21,30,31]);
});
test('dragging a section header also moves its entire section intact',()=>{
 assert.deepEqual(ids(reorder.moveEntries(fixture(),'category',10,'category',20,true)),[1,20,21,10,11,12,30,31]);
 assert.deepEqual(ids(reorder.moveEntries(fixture(),'category',30,'category',10,false)),[1,30,31,10,11,12,20,21]);
});
test('no-op and incompatible drags do not write',()=>{
 assert.equal(reorder.moveEntries(fixture(),'item',11,'item',12,false),null);
 assert.equal(reorder.moveEntries(fixture(),'category',10,'item',21,true),null);
 assert.equal(reorder.moveEntries(fixture(),'item',11,'item',11,true),null);
 assert.equal(reorder.moveEntries(fixture(),'item',999,'item',12,false),null);
});
test('Home Listor uses canonical list engine, quick-add and pointer/keyboard reorder',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../shopping.html'),'utf8');
 const source=fs.readFileSync(path.join(__dirname,'../shopping-list-reorder-v1.js'),'utf8');
 assert.match(html,/shopping-list-reorder-v1\.js\?v=/);
 assert.ok(html.indexOf('shopping-list-engine-v7.js')<html.indexOf('shopping-list-reorder-v1.js'));
 assert.match(source,/shopping-quick-add/);
 assert.match(source,/shopping-category-quick-add/);
 assert.match(source,/pointerdown/);assert.match(source,/pointermove/);assert.match(source,/pointerup/);
 assert.match(source,/ArrowUp/);assert.match(source,/ArrowDown/);
 assert.match(source,/localStorage\.setItem\('sh_lists'/);
 assert.match(source,/win\.saveState\(\)/);
 assert.match(source,/shopping-embedded/);
});
