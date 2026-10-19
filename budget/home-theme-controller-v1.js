(function(){
'use strict';
if(!/\/home\.html$/.test(location.pathname))return;
const root=document.documentElement;
try{for(const key of ['home-blue-theme-config-v1','home-theme-choice-v1','home-custom-theme-color-v1','home-brightness-v1'])localStorage.removeItem(key);}catch(_){}
function apply(){
 root.classList.add('home-finance-orange-v3','home-status-integrated-v3');
 for(const node of [root,document.body].filter(Boolean)){
  delete node.dataset.homeBlueTheme;delete node.dataset.homeSurfaceTheme;delete node.dataset.homeCustomTheme;
  for(const [key,value] of Object.entries({'--home-view-accent':'#FDBA74','--home-view-accent-soft':'#FDBA74','--home-view-rgb':'253,186,116','--accent':'#FDBA74','--accent-dim':'rgba(253,186,116,.10)','--accent-glow':'rgba(253,186,116,.25)','--border-a':'rgba(253,186,116,.30)','--accent-bg':'rgba(253,186,116,.055)','--home-status-surface':'#0F1219'}))node.style.setProperty(key,value,'important');
 }
 root.style.backgroundColor='#0F1219';
 const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content='#0F1219';
}
apply();document.addEventListener('DOMContentLoaded',apply,{once:true});
})();
