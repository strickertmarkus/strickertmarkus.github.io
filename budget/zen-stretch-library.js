(function(root,factory){
 'use strict';if(typeof module==='object'&&module.exports)module.exports=factory();else root.ZenStretch=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clone=v=>JSON.parse(JSON.stringify(v));
 const rigs={
  arrive:{head:[150,50],torso:[[150,86],[150,158]],arms:[[[134,91],[126,135],[124,166]],[[166,91],[174,135],[176,166]]],legs:[[[141,159],[137,210],[130,261]],[[159,159],[163,210],[170,261]]]},
  neck:{head:[150,50],torso:[[150,86],[150,158]],arms:[[[134,91],[118,125],[115,157]],[[166,91],[181,125],[185,157]]],legs:[[[141,159],[137,210],[130,261]],[[159,159],[163,210],[170,261]]]},
  'side-left':{head:[120,52],torso:[[127,87],[150,156]],arms:[[[111,92],[103,132],[117,167]],[[141,81],[139,41],[110,16]]],legs:[[[142,158],[129,211],[114,261]],[[157,158],[172,210],[183,261]]]},
  cat:{head:[91,127],torso:[[111,145],[189,142]],arms:[[[113,150],[109,196],[103,229]],[[125,151],[120,192],[118,229]]],legs:[[[186,146],[191,223],[230,226]],[[175,148],[175,212],[215,216]]]},
  child:{head:[104,197],torso:[[126,190],[183,171]],arms:[[[126,195],[86,217],[45,222]],[[130,186],[90,205],[46,211]]],legs:[[[182,177],[159,225],[215,222]],[[185,169],[173,214],[216,210]]]},
  'hip-left':{head:[127,65],torso:[[135,98],[153,169]],arms:[[[120,109],[101,149],[98,185]],[[149,107],[161,148],[131,176]]],legs:[[[146,171],[100,182],[82,252]],[[160,176],[193,248],[244,249]]]},
  fold:{head:[139,158],torso:[[134,183],[92,221]],arms:[[[143,185],[179,206],[214,224]],[[126,177],[171,196],[210,216]]],legs:[[[93,224],[161,233],[234,232]],[[95,214],[163,218],[231,219]]]},
  rest:{head:[55,208],torso:[[89,214],[161,218]],arms:[[[93,222],[129,240],[166,238]],[[93,203],[129,194],[164,200]]],legs:[[[159,222],[208,234],[259,239]],[[159,211],[210,214],[260,217]]]}
 };

 const stand=rigs.arrive,seat={head:[148,100],torso:[[150,134],[151,206]],arms:[[[134,140],[111,177],[111,205]],[[166,140],[187,177],[189,205]]],legs:[[[143,209],[109,240],[170,252]],[[158,209],[196,240],[136,254]]]},
 kneel={head:[148,60],torso:[[150,96],[154,169]],arms:[[[134,104],[128,141],[126,173]],[[166,104],[174,141],[174,172]]],legs:[[[147,174],[131,229],[196,236]],[[161,174],[159,219],[210,227]]]},
 prone={head:[75,199],torso:[[109,211],[171,223]],arms:[[[111,220],[87,239],[57,231]],[[111,202],[95,218],[66,219]]],legs:[[[168,224],[216,234],[263,237]],[[168,213],[216,220],[266,220]]]},
 side={head:[67,177],torso:[[101,194],[158,213]],arms:[[[102,196],[70,219],[48,204]],[[108,190],[135,218],[155,232]]],legs:[[[155,217],[209,238],[261,246]],[[159,204],[213,220],[263,231]]]};
 const families=[];
 function add(id,name,group,cue,base,motion,changes={},paired=false){
  const rig={...clone(typeof base==='string'?rigs[base]:base),...changes};
  families.push({id,name,group,cue,rig,motion,paired});
 }
 add("arrive","Stående avslappning","Helkropp","Stå bekvämt. Låt axlarna sjunka och känn fötterna mot marken.","arrive","breathe",{},false);
 add("neck","Axelrullningar","Axlar & bröst","Rulla axlarna långsamt bakåt. Släpp ned dem mellan varje rörelse.","neck","shoulders",{},false);
 add("side","Sidosträck","Rygg & bål","Sträck motsatt arm uppåt och luta mjukt åt den angivna sidan.","side-left","side",{},true);
 add("cat","Katt & ko","Rygg & bål","På alla fyra: runda ryggen långsamt och mjukna sedan åt andra hållet.","cat","cat",{},false);
 add("child","Barnets position","Rygg & bål","Sänk höfterna mot hälarna och sträck armarna framåt. Vila där det känns bekvämt.","child","child",{},false);
 add("hip","Knästående höftböjarstretch","Höfter & säte","Sätt den angivna foten fram och motsatt knä på mjukt underlag. För bäckenet varsamt framåt utan att svanka.","hip-left","lunge",{},true);
 add("fold","Sittande framåtfällning","Lår","Sitt med benen framför dig och mjuka knän. Fäll fram från höften.","fold","hinge",{},false);
 add("rest","Liggande vila","Helkropp","Vila på rygg och låt kroppen sjunka ned mot underlaget.","rest","breathe",{},false);
 add("neck-tilt","Nacklutning","Nacke","För örat mjukt mot axeln på angiven sida. Håll båda axlarna sänkta.",stand,"neckTilt",{},true);
 add("neck-turn","Nackrotation","Nacke","Vrid huvudet långsamt åt ena sidan och tillbaka. Håll hakan i samma höjd.",stand,"neckTurn",{},false);
 add("neck-nod","Nacknickning","Nacke","Sänk hakan lugnt mot bröstet och återgå till neutralt läge.",stand,"neckNod",{},false);
 add("levator","Diagonal nackstretch","Nacke","Vänd blicken snett ned mot armhålan på angiven sida utan att dra i huvudet.",stand,"neckDiagonal",{},true);
 add("chin-tuck","Hakindragning","Nacke","För hakan försiktigt rakt bakåt. Behåll blicken framåt och släpp sedan efter.",stand,"chin",{},false);
 add("cross-arm","Axelstretch över bröstet","Axlar & bröst","För angiven arm över bröstet. Stöd överarmen med den andra handen.",stand,"armHold",{"arms": [[[134, 91], [167, 110], [204, 108]], [[166, 91], [178, 144], [167, 108]]]},true);
 add("triceps","Tricepsstretch över huvudet","Armar & händer","Lyft angiven arm och böj armbågen bakom huvudet. Stöd lätt med andra handen.",stand,"overhead",{"arms": [[[134, 91], [120, 35], [150, 74]], [[166, 91], [185, 51], [123, 36]]]},true);
 add("chest-open","Bröstöppning med händer bakom ryggen","Axlar & bröst","För händerna bakom kroppen och öppna bröstet varsamt. Håll revbenen mjuka.",stand,"chest",{"arms": [[[134, 91], [121, 144], [151, 170]], [[166, 91], [184, 143], [151, 170]]]},false);
 add("goalpost","Kaktusarmar","Axlar & bröst","Lyft böjda armar åt sidorna. För armbågarna varsamt bakåt och släpp efter.",stand,"goalpost",{"arms": [[[134, 91], [93, 95], [90, 53]], [[166, 91], [207, 95], [210, 53]]]},false);
 add("arm-circles","Armcirklar","Axlar & bröst","Rita långsamma små cirklar med armarna ut åt sidorna.",stand,"armCircles",{"arms": [[[134, 91], [93, 97], [54, 101]], [[166, 91], [207, 97], [246, 101]]]},false);
 add("self-hug","Självkram för skulderbladen","Axlar & bröst","Krama om dig själv och runda övre ryggen lätt. Släpp sedan efter.",stand,"hug",{"arms": [[[134, 91], [183, 120], [173, 87]], [[166, 91], [118, 129], [127, 88]]]},false);
 add("eagle-arms","Örnarmar","Axlar & bröst","Korsa överarmarna framför dig och för underarmarna uppåt. Håll axlarna låga.",stand,"eagle",{"arms": [[[134, 91], [167, 135], [146, 77]], [[166, 91], [132, 140], [153, 75]]]},false);
 add("lat-reach","Sidolutning med båda armar upp","Rygg & bål","Sträck båda armarna uppåt och luta bålen mjukt åt angiven sida.","side-left","side",{"arms": [[[111, 92], [100, 43], [91, 16]], [[141, 81], [139, 41], [110, 16]]]},true);
 add("puppy","Valpens position","Axlar & bröst","På knä: behåll höfterna över knäna och sträck armarna framåt mot golvet.","cat","puppy",{"head": [83, 205], "torso": [[111, 195], [184, 145]], "arms": [[[112, 200], [79, 224], [37, 229]], [[119, 190], [80, 210], [38, 216]]]},false);
 add("thread","Trä nålen","Rygg & bål","På alla fyra: för angiven arm under kroppen åt motsatt sida och sänk axeln mjukt.","cat","thread",{"head": [99, 188], "torso": [[120, 178], [184, 147]], "arms": [[[118, 184], [151, 216], [202, 222]], [[128, 176], [94, 209], [62, 223]]]},true);
 add("seated-twist","Sittande ryggradsvridning","Rygg & bål","Sitt stadigt och vrid bröstkorgen mjukt åt angiven sida. Låt huvudet följa.",seat,"twist",{"arms": [[[134, 140], [116, 176], [165, 214]], [[166, 140], [198, 178], [214, 223]]]},true);
 add("standing-twist","Stående bålrotation","Rygg & bål","Vrid överkroppen lugnt från sida till sida med mjuka knän.",stand,"twist",{"arms": [[[134, 91], [94, 109], [125, 144]], [[166, 91], [206, 109], [175, 144]]]},false);
 add("sphinx","Sfinxen","Rygg & bål","Ligg på mage med underarmarna i golvet. Lyft bröstet varsamt med bäckenet kvar i golvet.",prone,"sphinx",{"head": [92, 133], "torso": [[112, 168], [176, 223]], "arms": [[[111, 176], [100, 233], [58, 234]], [[119, 171], [118, 222], [77, 222]]]},false);
 add("cobra","Låg kobra","Rygg & bål","Ligg på mage. Lyft bröstet en liten bit med händerna som lätt stöd och sänk igen.",prone,"cobra",{"head": [85, 157], "torso": [[112, 183], [174, 222]], "arms": [[[109, 192], [125, 209], [100, 234]], [[119, 181], [142, 200], [119, 221]]]},false);
 add("pelvic-tilt","Bäckentippning på rygg","Rygg & bål","Ligg på rygg med böjda knän. Tippa bäckenet lugnt så att ländryggen mjukt närmar sig golvet.","rest","pelvis",{"legs": [[[159, 222], [209, 165], [249, 239]], [[159, 211], [205, 151], [243, 222]]]},false);
 add("knee-sways","Liggande knäpendling","Rygg & bål","Ligg med böjda knän och fötterna i golvet. Låt knäna röra sig lugnt från sida till sida.","rest","kneeSway",{"legs": [[[159, 222], [209, 165], [249, 239]], [[159, 211], [205, 151], [243, 222]]]},false);
 add("open-book","Öppna boken","Rygg & bål","Ligg på sidan med böjda knän. Öppna övre armen bakåt och följ handen med blicken.",side,"book",{"arms": [[[102, 196], [93, 226], [62, 247]], [[108, 190], [98, 219], [63, 239]]], "legs": [[[155, 217], [151, 250], [222, 255]], [[159, 204], [154, 237], [225, 241]]]},true);
 add("knee-chest","Knä mot bröst","Höfter & säte","Ligg på rygg. För angivet knä mot bröstet och håll mjukt om låret.","rest","kneeChest",{"arms": [[[93, 222], [130, 183], [155, 174]], [[93, 203], [118, 168], [149, 166]]], "legs": [[[159, 222], [148, 166], [201, 199]], [[159, 211], [210, 214], [260, 217]]]},true);
 add("both-knees","Båda knäna mot bröstet","Höfter & säte","Ligg på rygg och samla knäna mot bröstet. Låt axlarna vila i golvet.","rest","kneeChest",{"arms": [[[93, 222], [125, 173], [152, 164]], [[93, 203], [117, 159], [149, 152]]], "legs": [[[159, 222], [145, 163], [196, 183]], [[159, 211], [146, 150], [197, 174]]]},false);
 add("figure-four","Liggande fyran","Höfter & säte","Lägg angiven fotled över motsatt lår. För stödbenet mjukt mot kroppen.","rest","figureFour",{"arms": [[[93, 222], [137, 191], [180, 177]], [[93, 203], [135, 177], [181, 166]]], "legs": [[[159, 222], [174, 149], [207, 187]], [[159, 211], [207, 166], [234, 216]]]},true);
 add("butterfly","Fjärilen","Höfter & säte","Sitt med fotsulorna mot varandra. Låt knäna sjunka utåt utan att pressa dem.",seat,"butterfly",{"legs": [[[143, 209], [88, 242], [151, 255]], [[158, 209], [212, 242], [151, 255]]]},false);
 add("ninety-ninety","90/90-sittande","Höfter & säte","Sitt med båda knäna böjda åt varsin sida. Fäll varsamt över det främre benet.",seat,"hinge",{"legs": [[[143, 209], [99, 231], [160, 250]], [[158, 209], [210, 216], [221, 259]]]},true);
 add("seated-glute","Sittande sätesstretch","Höfter & säte","Korsa angivet ben över det andra. Håll om knät och för det mjukt mot motsatt axel.",seat,"glute",{"arms": [[[134, 140], [124, 183], [171, 183]], [[166, 140], [190, 178], [167, 188]]], "legs": [[[143, 209], [174, 175], [186, 246]], [[158, 209], [115, 237], [170, 255]]]},true);
 add("frog","Grodan","Höfter & säte","På alla fyra: för knäna bekvämt isär och för höfterna lite bakåt. Använd mjukt underlag.","cat","frog",{"legs": [[[186, 146], [154, 230], [215, 237]], [[175, 148], [222, 214], [260, 222]]]},false);
 add("adductor-rock","Adduktorgungning","Lår","Stå på ett knä med angivet ben rakt åt sidan. För höfterna varsamt bakåt.","cat","adductor",{"legs": [[[186, 146], [191, 223], [230, 226]], [[175, 148], [218, 183], [266, 219]]]},true);
 add("side-lunge","Sidoutfall","Lår","Stå brett. Böj knät på angiven sida och flytta vikten dit medan andra benet förblir långt.",stand,"sideLunge",{"head": [128, 71], "torso": [[135, 107], [153, 167]], "legs": [[[145, 169], [94, 207], [80, 262]], [[161, 169], [208, 215], [255, 264]]]},true);
 add("half-split","Halv split","Lår","Från knästående utfall: för höften bakåt, räta främre benet mjukt och fäll från höften.","hip-left","hinge",{"head": [114, 124], "torso": [[126, 155], [161, 194]], "arms": [[[112, 164], [104, 207], [98, 235]], [[139, 157], [153, 201], [150, 237]]], "legs": [[[154, 194], [108, 225], [49, 251]], [[168, 197], [194, 246], [247, 249]]]},true);
 add("standing-fold","Stående framåtfällning","Lår","Böj knäna mjukt och fäll överkroppen framåt från höften. Låt armarna hänga.",stand,"hinge",{"head": [100, 203], "torso": [[116, 181], [151, 143]], "arms": [[[109, 186], [95, 223], [93, 259]], [[126, 182], [119, 222], [119, 260]]], "legs": [[[145, 148], [134, 207], [129, 263]], [[158, 148], [173, 207], [177, 263]]]},false);
 add("wide-fold","Bredbent framåtfällning","Lår","Stå brett med mjuka knän. Fäll från höften och vila händerna där du når.",stand,"hinge",{"head": [143, 194], "torso": [[146, 174], [151, 137]], "arms": [[[135, 183], [118, 222], [111, 255]], [[162, 182], [183, 223], [192, 255]]], "legs": [[[141, 143], [103, 200], [62, 261]], [[161, 143], [203, 200], [244, 261]]]},false);
 add("hurdler","Sittande enbensfällning","Lår","Sträck angivet ben framåt och böj det andra inåt. Fäll mjukt över det raka benet.","fold","hinge",{"legs": [[[93, 224], [161, 233], [234, 232]], [[95, 214], [132, 181], [165, 216]]]},true);
 add("supine-hamstring","Liggande baksida lår","Lår","Ligg på rygg. Håll bakom angivet lår och sträck knät varsamt med foten uppåt.","rest","hamstring",{"arms": [[[93, 222], [142, 176], [183, 154]], [[93, 203], [140, 162], [182, 150]]], "legs": [[[159, 222], [186, 154], [199, 79]], [[159, 211], [210, 214], [260, 217]]]},true);
 add("standing-quad","Stående framsida lår","Lår","Böj angivet knä och håll foten bakom dig. Stöd med andra handen mot en vägg vid behov.",stand,"quad",{"arms": [[[134, 91], [120, 137], [115, 190]], [[166, 91], [204, 96], [238, 99]]], "legs": [[[141, 159], [135, 212], [112, 177]], [[159, 159], [163, 210], [170, 261]]]},true);
 add("side-quad","Sidliggande framsida lår","Lår","Ligg på sidan och böj övre knät. Håll foten bakom dig med höfterna lugnt staplade.",side,"quad",{"arms": [[[102, 196], [70, 219], [48, 204]], [[108, 190], [161, 166], [206, 174]]], "legs": [[[155, 217], [209, 238], [261, 246]], [[159, 204], [220, 220], [211, 163]]]},true);
 add("calf","Vadstretch med rakt knä","Underben & fötter","Sätt angiven fot bakåt med hälen i golvet. Luta kroppen lätt framåt; ta väggstöd vid behov.",stand,"calf",{"head": [112, 59], "torso": [[120, 95], [153, 166]], "arms": [[[110, 99], [79, 93], [52, 79]], [[132, 99], [88, 105], [52, 95]]], "legs": [[[145, 170], [108, 215], [92, 262]], [[160, 171], [200, 214], [236, 260]]]},true);
 add("soleus","Vadstretch med böjt knä","Underben & fötter","Sätt angiven fot något bakåt. Böj båda knäna mjukt med bakre hälen kvar i golvet.",stand,"soleus",{"head": [126, 68], "torso": [[132, 103], [153, 175]], "legs": [[[145, 178], [118, 220], [123, 263]], [[160, 177], [176, 216], [210, 263]]]},true);
 add("ankle-circles","Fotledscirklar","Underben & fötter","Sitt och lyft angiven fot från golvet. Rita långsamma cirklar med foten.","fold","ankle",{},true);
 add("ankle-pumps","Fotledspumpningar","Underben & fötter","Sitt med benen framåt. Växla mellan att peka tårna och dra dem mot dig.","fold","anklePump",{},false);
 add("toe-sit","Tåstretch på knä","Underben & fötter","Sitt lätt bak mot hälarna med tårna vikta in under fötterna. Avlasta med händerna vid behov.",kneel,"toes",{},false);
 add("instep","Vriststretch på knä","Underben & fötter","Vila fotryggarna mot ett mjukt underlag och sänk vikten försiktigt mot hälarna.",kneel,"instep",{},false);
 add("wrist-flexor","Handledsstretch med handflatan upp","Armar & händer","Sträck angiven arm med handflatan upp. För fingrarna mjukt nedåt med andra handen.",stand,"wristFlex",{"arms": [[[134, 91], [107, 128], [78, 133]], [[166, 91], [142, 151], [76, 143]]]},true);
 add("wrist-extensor","Handledsstretch med handflatan ned","Armar & händer","Sträck angiven arm med handflatan ned. Böj handleden mjukt nedåt med andra handen.",stand,"wristExtend",{"arms": [[[134, 91], [107, 128], [78, 133]], [[166, 91], [142, 151], [76, 143]]]},true);
 add("prayer","Handflator ihop","Armar & händer","Pressa handflatorna lätt mot varandra framför bröstet. Sänk händerna lugnt en liten bit.",stand,"prayer",{"arms": [[[134, 91], [112, 147], [150, 116]], [[166, 91], [188, 147], [150, 116]]]},false);
 add("wrist-circles","Handledscirklar","Armar & händer","Håll underarmarna framför dig och rulla handlederna långsamt.",stand,"wrists",{"arms": [[[134, 91], [117, 137], [116, 103]], [[166, 91], [183, 137], [184, 103]]]},false);
 add("palm-rock","Handledsgungning på alla fyra","Armar & händer","På alla fyra med handflatorna i golvet: för vikten försiktigt framåt och tillbaka.","cat","palm",{},false);

 add('biceps','Bicepsstretch med raka armar','Armar & händer','För raka armar en liten bit bakom kroppen med handflatorna framåt. Håll axlarna sänkta och lyft bara så långt det känns mjukt.',stand,'biceps',{arms:[[[134,91],[112,131],[95,172]],[[166,91],[184,131],[205,172]]]});
 const poses=families.flatMap(f=>f.paired?['left','right'].map(side=>({id:f.id+'-'+side,name:f.name+' · '+(side==='left'?'vänster':'höger'),cue:f.cue,group:f.group,family:f.id,side})): [{id:f.id,name:f.name,cue:f.cue,group:f.group,family:f.id}]);
 const byId=new Map(poses.map(p=>[p.id,p])),byFamily=new Map(families.map(f=>[f.id,f]));
 function frame(id,t=0,reduced=false){
  const entry=byId.get(id);if(!entry)return null;const family=byFamily.get(entry.family),p=clone(family.rig);
  const cycle=t*Math.PI/4,w=Math.sin(cycle)*1.55,q=(1-Math.cos(cycle))*.78,b=Math.sin(t*Math.PI*2/8),m=family.motion;
  const upper=[p.head,...p.torso.slice(0,-1),...p.arms.flat()];
  const rotate=(points,pivot,a)=>points.forEach(v=>{const x=v[0]-pivot[0],y=v[1]-pivot[1];v[0]=pivot[0]+x*Math.cos(a)-y*Math.sin(a);v[1]=pivot[1]+x*Math.sin(a)+y*Math.cos(a);});
  p.headAngle=0;p.hands=p.arms.map(a=>({angle:Math.atan2(a[2][1]-a[1][1],a[2][0]-a[1][0])}));
  p.feet=p.legs.map(a=>({angle:Math.atan2(a[2][1]-a[1][1],a[2][0]-a[1][0])-.7}));
  if(!reduced){
   if(m==='shoulders'){p.arms.forEach((a,i)=>a.forEach((v,j)=>{v[0]+=(i?1:-1)*7*w*[1,.75,.45][j];v[1]-=12*q*[1,.85,.65][j];}));p.torso[0][1]-=3*q;}
   else if(m==='cat'){p.torso.splice(1,0,[150,143-18*w]);p.head[1]+=8*w;p.head[0]+=3*w;}
   else if(m==='neckTilt'||m==='neckDiagonal'){p.head[0]-=9*q;p.head[1]+=m==='neckDiagonal'?9*q:3*q;p.headAngle=-.3*q;}
   else if(m==='neckTurn'){p.head[0]+=7*w;p.headAngle=.12*w;}
   else if(m==='neckNod'){p.head[1]+=7*q;p.headAngle=.24*q;}
   else if(m==='chin'){p.head[0]+=5*q;p.head[1]+=2*q;}
   else if(m==='side')rotate(upper,p.torso.at(-1),-.1*w);
   else if(['hinge','child','puppy','sphinx','cobra'].includes(m)){rotate(upper,p.torso.at(-1),(m==='sphinx'||m==='cobra'?-.1:.07)*q);}
   else if(['lunge','calf','soleus','palm','frog','adductor','sideLunge'].includes(m)){const dx=(m==='frog'||m==='adductor'?7:-7)*q;upper.forEach(v=>v[0]+=dx);p.torso.at(-1)[0]+=dx;p.legs.forEach(a=>a[0][0]+=dx);if(m==='soleus')p.legs.forEach(a=>a[1][0]-=5*q);}
   else if(m==='twist'){upper.forEach(v=>v[0]=150+(v[0]-150)*Math.cos(.4*w)+7*w);p.headAngle=.1*w;}
   else if(m==='book'){rotate(p.arms[1].slice(1),p.arms[1][0],-1.35*q);p.headAngle=-.12*q;}
   else if(m==='thread'){p.arms[0].slice(1).forEach(v=>v[0]+=12*q);p.torso[0][1]+=3*q;}
   else if(m==='biceps'){p.arms.forEach((a,i)=>rotate(a.slice(1),a[0],(i?1:-1)*.08*q));}
   else if(m==='armCircles'){p.arms.forEach((a,i)=>a.slice(1).forEach((v,j)=>{v[0]+=(i?1:-1)*5*Math.cos(cycle);v[1]+=(j+1)*7*w;}));}
   else if(['armHold','overhead','chest','goalpost','hug','eagle','prayer'].includes(m)){p.arms.forEach((a,i)=>rotate(a.slice(1),a[0],(i?1:-1)*.07*q));if(m==='prayer')p.arms.forEach(a=>a[2][1]+=8*q);p.torso[0][1]-=b;}
   else if(m==='pelvis'){p.torso.at(-1)[1]-=4*q;p.legs.forEach(a=>a[0][1]-=4*q);}
   else if(m==='kneeSway'){p.legs.forEach(a=>a[1][0]+=18*w);}
   else if(m==='kneeChest'){p.legs.forEach((a,i)=>{if(family.id==='both-knees'||i===0)rotate(a.slice(1),a[0],-.08*q);});}
   else if(m==='figureFour'){p.legs.forEach(a=>rotate(a.slice(1),a[0],-.045*q));}
   else if(m==='butterfly'){p.legs.forEach(a=>a[1][1]+=6*q);}
   else if(m==='glute'){p.legs[0][1][0]-=5*q;p.arms.forEach(a=>a[2][0]-=4*q);}
   else if(m==='hamstring'){rotate(p.legs[0].slice(1),p.legs[0][0],-.09*q);}
   else if(m==='quad'){const i=family.id==='side-quad'?1:0;rotate(p.legs[i].slice(2),p.legs[i][1],.1*q);p.arms[i][2][1]-=3*q;}
   else if(m==='ankle'){p.feet[0].angle+=.65*w;p.legs[0][2][1]+=3*Math.cos(cycle);}
   else if(m==='anklePump'){p.feet.forEach(f=>f.angle+=.6*w);}
   else if(m==='toes'||m==='instep'){p.torso.forEach(v=>v[1]+=3*q);p.head[1]+=3*q;p.feet.forEach(f=>f.angle+=(m==='toes'?-.3:.2)*q);}
   else if(m==='wristFlex'||m==='wristExtend'){p.hands[0].angle+=(m==='wristFlex'?1:-1)*(.55+.2*q);}
   else if(m==='wrists'){p.hands.forEach((h,i)=>h.angle+=(i?1:-1)*.8*w);}
   else {p.torso[0][1]-=2*b;p.head[1]-=b;p.arms.forEach(a=>a[0][1]-=b);}
  }
  if(entry.side==='right'){[p.head,...p.torso,...p.arms.flat(),...p.legs.flat()].forEach(v=>v[0]=300-v[0]);p.headAngle=-p.headAngle;p.hands.forEach(h=>h.angle=Math.PI-h.angle);p.feet.forEach(f=>f.angle=Math.PI-f.angle);}
  const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  const torsoAt=t=>p.torso.length===3?mix(mix(p.torso[0],p.torso[1],t),mix(p.torso[1],p.torso[2],t),t):mix(p.torso[0],p.torso[1],t);
  p.highlights=[];
  const mark=(a,b,r=11)=>p.highlights.push({a:[...a],b:[...b],r});
  const segment=(limb,a,b,r=10)=>mark(mix(limb[0],limb[1],a),mix(limb[0],limb[1],b),r);
  const arms=entry.side?[p.arms[0]]:p.arms,legs=entry.side?[p.legs[0]]:p.legs;
  if(family.id==='hip')segment(p.legs[1],0,.45,14);
  else if(m==='cobra'||m==='sphinx'){mark(torsoAt(.45),torsoAt(.88),12);const a=torsoAt(.38),b=torsoAt(.78);mark([a[0],a[1]+12],[b[0],b[1]+12],10);}
  else if(m.startsWith('neck')||m==='chin')mark(mix(p.head,p.torso[0],.6),p.torso[0],11);
  else if(['shoulders','armHold','armCircles','goalpost','hug','eagle'].includes(m))arms.forEach(a=>segment(a,0,.35,12));
  else if(m==='overhead'||m==='biceps')arms.forEach(a=>segment(a,.22,.8,10));
  else if(m==='chest')mark(mix(p.arms[0][0],p.torso[0],.5),mix(p.arms[1][0],p.torso[0],.5),15);
  else if(['wristFlex','wristExtend','wrists','prayer','palm'].includes(m))arms.forEach(a=>mark(mix(a[1],a[2],.6),a[2],9));
  else if(['calf','soleus'].includes(m))segment([p.legs[1][1],p.legs[1][2]],.2,.75,12);
  else if(['ankle','anklePump','toes','instep'].includes(m))legs.forEach(a=>mark(mix(a[1],a[2],.85),a[2],10));
  else if(m==='quad')segment(p.legs[family.id==='side-quad'?1:0],.15,.85,13);
  else if(m==='hamstring'||['fold','hurdler','half-split','standing-fold','wide-fold'].includes(family.id))legs.forEach(a=>segment(a,.15,.8,13));
  else if(['butterfly','frog','adductor','sideLunge'].includes(m))legs.forEach(a=>segment(a,.12,.65,12));
  else if(['figureFour','glute','kneeChest'].includes(m)||family.id==='ninety-ninety')legs.forEach(a=>segment(a,0,.25,17));
  else if(['side','twist','thread','book','cat','child','puppy','pelvis','kneeSway'].includes(m))mark(torsoAt(m==='puppy'?.05:.35),torsoAt(m==='puppy'?.45:.85),13);
  return p;
 }
 return {poses,frame,families:families.map(({id,name,group})=>({id,name,group}))};
});
