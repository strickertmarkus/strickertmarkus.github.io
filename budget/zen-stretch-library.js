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
 function add(id,name,group,cue,base,motion,changes={},paired=false,extra={}){
  const rig={...clone(typeof base==='string'?rigs[base]:base),...changes};
  families.push({id,name,group,cue,rig,motion,paired,muscle:extra.muscle||'',area:extra.area||''});
 }
 // Wider catalogue: smaller muscles get their own entries. They reuse the nearest
 // existing rig and motion; `muscle` names the target and `area` sets the glow.
 function more(id,name,group,muscle,area,cue,base,motion,paired=false,changes={}){add(id,name,group,cue,base,motion,changes,paired,{muscle,area});}
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

 // Nacke & käke
 more('scalene','Scalenusstretch','Nacke','Scalenus, sidan av halsen','neck','Sänk axeln på angiven sida, luta huvudet åt motsatt håll och vänd hakan en aning uppåt.',stand,'neckTilt',true);
 more('scm','Främre halsstretch','Nacke','Sternocleidomastoideus','neck','Vrid huvudet bort från angiven sida och lyft hakan lite. Håll bröstbenet lågt och axlarna sänkta.',stand,'neckTurn',true);
 more('suboccipital','Övre nackstretch','Nacke','Suboccipitala muskler, nackens överdel','neck','Gör en liten hakindragning och nicka sedan bara med huvudet, som ett litet ja, utan att böja hela nacken.',stand,'neckNod');
 more('trap-seated','Trapeziusstretch med handstöd','Nacke','Övre trapezius','neck','Sitt på angiven hand för att hålla axeln nere och luta huvudet åt motsatt sida. Låt andra handen vila lätt på huvudet.',seat,'neckTilt',true);
 more('jaw','Käkavslappning','Nacke','Käkmuskler (masseter, temporalis)','neck','Låt tungan vila bakom framtänderna och öppna munnen långsamt så långt det är bekvämt. Stäng lika lugnt.',stand,'chin');
 more('neck-extension','Nackextension med stöd','Nacke','Främre halsmuskler','neck','Stöd nacken med händerna och låt blicken gå mjukt uppåt. Gå bara så långt det känns fritt.',seat,'neckNod');
 // Axlar & bröst
 more('doorway-pec','Bröststretch i dörrkarm','Axlar & bröst','Pectoralis major','chest','Placera angiven underarm mot en dörrkarm med armbågen i axelhöjd. Kliv ett litet steg fram tills det känns i bröstet.',stand,'armHold',true,{arms:[[[134,91],[93,95],[90,53]],[[166,91],[180,134],[176,166]]]});
 more('pec-minor','Bröststretch med hög arm','Axlar & bröst','Pectoralis minor','chest','Som i dörrkarmen men med armbågen ovanför huvudet. Luta dig snett framåt och håll revbenen nere.',stand,'armHold',true,{arms:[[[134,91],[104,58],[98,20]],[[166,91],[180,134],[176,166]]]});
 more('sleeper','Sovarens stretch','Axlar & bröst','Rotatorkuff, bakre axel (infraspinatus, teres minor)','shoulder','Ligg på angiven sida med armen i 90 grader framför dig. Tryck underarmen mjukt mot golvet med andra handen.',side,'armHold',true);
 more('towel-reach','Handduksstretch bakom ryggen','Axlar & bröst','Rotatorkuff (subscapularis), främre axel','shoulder','Håll en handduk bakom ryggen med angiven hand nederst. Dra den långsamt uppåt med den övre handen.',stand,'overhead',true,{arms:[[[134,91],[124,140],[148,150]],[[166,91],[185,51],[152,60]]]});
 more('front-delt','Främre axelstretch vid vägg','Axlar & bröst','Främre deltoideus','shoulder','Placera angiven handflata mot en vägg bakom dig i axelhöjd och vrid kroppen långsamt bort från armen.',stand,'armHold',true,{arms:[[[134,91],[95,105],[58,110]],[[166,91],[174,135],[176,166]]]});
 more('rear-delt','Bakre axelstretch med böjd arm','Axlar & bröst','Bakre deltoideus','shoulder','Böj angiven arm 90 grader framför bröstet och dra armbågen mot motsatt axel med andra handen.',stand,'armHold',true,{arms:[[[134,91],[170,105],[170,75]],[[166,91],[178,144],[170,108]]]});
 more('wall-angel','Väggänglar','Axlar & bröst','Skulderbladsmuskler, bröst','shoulder','Stå med ryggen mot en vägg och för armarna långsamt upp och ned med armbågar och handryggar nära väggen.',stand,'goalpost',false,{arms:[[[134,91],[93,95],[90,53]],[[166,91],[207,95],[210,53]]]});
 more('reverse-prayer','Omvänd bön','Axlar & bröst','Främre axel, underarmar','chest','För handflatorna mot varandra bakom ryggen med fingrarna uppåt, eller håll i armbågarna om det är lättare.',stand,'prayer',false,{arms:[[[134,91],[121,144],[151,140]],[[166,91],[184,143],[151,140]]]});
 more('prone-t','Liggande bröstöppning','Axlar & bröst','Bröst, främre axel','chest','Ligg på mage med angiven arm rakt ut åt sidan. Rulla mjukt över mot armen och böj det övre knät för stöd.',prone,'breathe',true);
 more('serratus','Sidosträck i dörrkarm','Axlar & bröst','Serratus anterior, sidan av bröstkorgen','torso','Håll i en dörrkarm med angiven hand ovanför huvudet och låt höften glida ut åt motsatt sida.','side-left','side',true);
 // Rygg & bål
 more('lat-bench','Latsstretch mot bänk','Rygg & bål','Latissimus dorsi','torso','Placera händerna på en bänk eller stolsrygg, gå bakåt och sänk bröstet med raka armar.',stand,'hinge',false,{head:[100,140],torso:[[118,128],[151,150]],arms:[[[118,130],[85,125],[52,122]],[[124,128],[90,118],[55,115]]]});
 more('rhomboid','Övre ryggrundning','Rygg & bål','Rhomboideus, mellersta trapezius','shoulder','Fläta fingrarna framför dig, skjut händerna framåt och runda ryggen mellan skulderbladen.',stand,'hug',false,{arms:[[[134,91],[140,128],[150,140]],[[166,91],[160,128],[150,140]]]});
 more('ql','Quadratus lumborum-stretch','Rygg & bål','Quadratus lumborum, ländryggens sida','torsoLow','Stå med fötterna korsade, angiven sida bakom, och luta bålen åt motsatt håll med armen över huvudet.','side-left','side',true);
 more('seated-side','Sittande sidosträck','Rygg & bål','Sneda bukmuskler, latissimus','torso','Sitt brett, låt ena handen vila i golvet och sträck den andra armen över huvudet åt angiven sida.',seat,'side',true,{arms:[[[134,140],[112,177],[108,205]],[[166,140],[160,95],[130,70]]]});
 more('standing-back','Stående bakåtböjning','Rygg & bål','Raka bukmuskeln, höftböjare','torso','Placera händerna på ländryggen och böj dig lätt bakåt med blicken framåt. Andas lugnt.',stand,'cobra',false,{arms:[[[134,91],[125,135],[140,160]],[[166,91],[175,135],[160,160]]]});
 more('towel-thoracic','Bröstryggsextension över handduk','Rygg & bål','Bröstryggen (thorakal extension)','torso','Ligg med en hoprullad handduk tvärs under skulderbladen och låt armarna vila ovanför huvudet.','rest','breathe');
 more('quadruped-rotation','Bröstryggsrotation på alla fyra','Rygg & bål','Bröstryggens rotatorer','torso','Placera angiven hand bakom huvudet och rotera armbågen långsamt mot taket. Följ med blicken.','cat','thread',true);
 more('supine-twist','Liggande ryggvridning','Rygg & bål','Ländrygg, sneda bukmuskler, säte','torsoLow','Ligg på rygg, för angivet knä över kroppen och låt det sjunka mot golvet. Vänd blicken åt motsatt håll.','rest','kneeSway',true,{legs:[[[159,222],[209,165],[249,239]],[[159,211],[210,214],[260,217]]]});
 more('chair-fold','Framåthäng på stol','Rygg & bål','Ländryggens muskler (erector spinae)','torsoLow','Sitt på en stol med knäna isär och låt överkroppen hänga ned mellan benen. Rulla upp långsamt.',seat,'hinge',false,{head:[150,215],torso:[[150,180],[151,206]]});
 more('belly-breath','Magandning med sträck','Rygg & bål','Diafragma, bukväggen','torso','Ligg på rygg med händerna på magen. Andas långsamt in så att magen lyfter och sträck lätt i bålen.','rest','breathe');
 // Höfter & säte
 more('piriformis-chair','Piriformisstretch på stol','Höfter & säte','Piriformis','hip','Sitt på en stol, lägg angiven fotled på motsatt knä och fäll fram från höften med rak rygg.',seat,'glute',true);
 more('pigeon','Duvan','Höfter & säte','Säte, piriformis, höftrotatorer','hip','Från alla fyra: för angivet knä fram mot handen och sträck det andra benet bakåt. Sänk höften mjukt mot underlaget.','cat','frog',true);
 more('tfl','Stående TFL-stretch','Höfter & säte','Tensor fasciae latae, IT-bandet','hip','Korsa angivet ben bakom det andra och skjut höften försiktigt ut åt samma sida.','side-left','side',true);
 more('couch','Soffstretch','Höfter & säte','Rectus femoris, höftböjare','thigh','Placera angiven fot mot en soffa eller vägg bakom dig med knät på mjukt underlag. Res överkroppen långsamt.','hip-left','lunge',true);
 more('psoas-bed','Höftböjarstretch vid sängkant','Höfter & säte','Iliopsoas','hip','Ligg vid kanten av en säng, låt angivet ben hänga ned och håll det andra knät mot bröstet.','rest','kneeChest',true,{legs:[[[159,222],[148,166],[201,199]],[[159,211],[205,240],[250,262]]]});
 more('windshield','Vindrutetorkare','Höfter & säte','Höftens inåt- och utåtrotatorer','hip','Sitt med böjda knän brett isär och händerna bakom dig. Låt knäna falla lugnt från sida till sida.',seat,'kneeSway');
 more('happy-baby','Glada bebisen','Höfter & säte','Inre lår, säte, ländrygg','hip','Ligg på rygg, håll om fötternas utsidor och låt knäna sjunka mot armhålorna.','rest','butterfly',false,{legs:[[[159,222],[146,170],[165,140]],[[159,211],[150,160],[175,132]]]});
 more('lizard','Ödlan','Höfter & säte','Höftböjare, inre lår','hip','Från utfall: placera båda händerna innanför angiven främre fot och sänk höfterna mot golvet.','hip-left','lunge',true);
 more('standing-figure-four','Stående fyran','Höfter & säte','Gluteus medius och maximus','hip','Stå på ett ben med stöd, lägg angiven fotled över knät och sätt dig lite bakåt som på en stol.',stand,'glute',true,{legs:[[[141,159],[175,170],[150,185]],[[159,159],[165,210],[170,261]]]});
 more('cross-body-leg','Liggande ben över kroppen','Höfter & säte','Gluteus medius, IT-bandet','hip','Ligg på rygg och för angivet raka ben över kroppen. Håll det lätt med motsatt hand och behåll axlarna i golvet.','rest','figureFour',true);
 more('frog-prone','Liggande groda','Höfter & säte','Inre lår, höftleder','hip','Ligg på mage och för angivet knä uppåt längs golvet åt sidan. Låt höften sjunka.',prone,'breathe',true);
 // Lår
 more('straddle','Grenstretch sittande','Lår','Adduktorer, baksida lår','thigh','Sitt med benen brett isär och fäll fram från höften med rak rygg. Mjuka knän går bra.','fold','hinge',false,{legs:[[[93,224],[150,250],[205,262]],[[95,214],[160,200],[230,190]]]});
 more('heel-step','Baksida lår med häl på pall','Lår','Hamstrings','thigh','Placera angiven häl på en låg pall med rakt ben och fäll fram från höften med rak rygg.',stand,'hinge',true,{legs:[[[141,159],[115,190],[90,215]],[[159,159],[163,210],[170,261]]]});
 more('prone-quad','Framsida lår på mage','Lår','Quadriceps','thigh','Ligg på mage, böj angivet knä och håll om foten eller använd en handduk runt vristen.',prone,'quad',true,{legs:[[[168,224],[216,234],[200,185]],[[168,213],[216,220],[266,220]]]});
 more('kneeling-quad','Knästående bakåtlutning','Lår','Quadriceps, höftböjare','thigh','Sitt på knä med händerna bakom dig och luta överkroppen försiktigt bakåt.',kneel,'cobra');
 more('legs-wall-wide','Ben isär mot väggen','Lår','Adduktorer','thigh','Ligg med benen uppför en vägg och låt dem sjunka isär åt sidorna av sin egen vikt.','rest','butterfly',false,{legs:[[[159,222],[190,160],[230,110]],[[159,211],[180,150],[200,90]]]});
 more('gracilis','Sidoutfall med tårna upp','Lår','Gracilis, långa adduktorer','thigh','Stå brett, böj det andra knät och håll angivet ben rakt med tårna pekande uppåt.',stand,'sideLunge',true,{head:[128,71],torso:[[135,107],[153,167]],legs:[[[145,169],[94,207],[80,262]],[[161,169],[208,215],[255,264]]]});
 more('legs-wall','Ben uppför väggen','Lår','Hamstrings, vader','thigh','Ligg på rygg med benen vilande uppför väggen. Låt baksidan av låren mjukna.','rest','hamstring',false,{legs:[[[159,222],[175,150],[190,80]],[[159,211],[172,140],[185,70]]]});
 more('chair-hamstring','Sittande baksida lår på stol','Lår','Hamstrings, vad','thigh','Sitt på stolskanten, sträck angivet ben med hälen i golvet och dra tårna mot dig. Fäll fram från höften.',seat,'hinge',true,{legs:[[[143,209],[190,225],[240,250]],[[158,209],[196,240],[136,254]]]});
 // Underben & fötter
 more('tibialis','Framsida underben','Underben & fötter','Tibialis anterior','calf','Stå med stöd och placera angiven fot bakom dig med fotryggen mot golvet. Böj stödbenet lätt.',stand,'instep',true,{legs:[[[141,159],[150,210],[175,255]],[[159,159],[163,210],[170,261]]]});
 more('peroneus','Fotledsstretch inåt','Underben & fötter','Peroneusmusklerna, utsidan av underbenet','calf','Sitt med angiven fot över motsatt knä och vrid fotsulan försiktigt uppåt och inåt.',seat,'ankle',true);
 more('plantar','Fotvalvsstretch','Underben & fötter','Fotsulan (plantarfascian)','foot','Sitt och dra tårna på angiven fot bakåt mot smalbenet med handen tills det känns i fotvalvet.',seat,'toes',true);
 more('toe-spread','Tåspretning','Underben & fötter','Fotens små muskler','foot','Spreta ut tårna så brett det går, håll en stund och slappna sedan av.',seat,'anklePump');
 more('step-calf','Hälsenestretch på trappsteg','Underben & fötter','Vadmusklerna, hälsenan','calf','Stå med framfoten på ett trappsteg och sänk angiven häl långsamt. Håll i räcket.',stand,'calf',true);
 more('big-toe','Stortåstretch mot vägg','Underben & fötter','Stortåns böjare','foot','Placera stortån mot en vägg med hälen i golvet och luta knät försiktigt framåt.',stand,'toes',true);
 more('ball-roll','Fotsula mot boll','Underben & fötter','Fotsulan, fotens små muskler','foot','Rulla angiven fotsula långsamt över en boll eller flaska med lätt tryck.',seat,'anklePump',true);
 // Armar & händer
 more('finger-stretch','Fingerstretch bakåt','Armar & händer','Fingrarnas böjare','forearm','Håll angiven hand framför dig med handflatan utåt och dra fingrarna försiktigt bakåt med andra handen.',stand,'wristFlex',true,{arms:[[[134,91],[107,128],[78,133]],[[166,91],[142,151],[76,143]]]});
 more('thumb','Tumstretch','Armar & händer','Tummens muskler och senor','forearm','Böj in tummen i handflatan, slut fingrarna runt den och luta handleden lätt mot lillfingersidan.',stand,'wristExtend',true,{arms:[[[134,91],[107,128],[78,133]],[[166,91],[142,151],[76,143]]]});
 more('finger-spread','Fingerspretning','Armar & händer','Handens små muskler','forearm','Spreta ut fingrarna så brett det går, håll en stund och knyt sedan handen mjukt.',stand,'wrists',false,{arms:[[[134,91],[117,137],[116,103]],[[166,91],[183,137],[184,103]]]});
 more('forearm-rotation','Underarmsrotation','Armar & händer','Pronatorer och supinatorer','forearm','Håll armbågarna mot sidorna och vrid handflatorna långsamt upp och ned.',stand,'wrists',false,{arms:[[[134,91],[126,135],[105,140]],[[166,91],[174,135],[195,140]]]});
 more('biceps-wall','Bicepsstretch mot vägg','Armar & händer','Biceps, brachialis','upperArm','Placera angiven handflata mot väggen bakom dig med rak arm och fingrarna bakåt. Vrid kroppen långsamt bort.',stand,'biceps',true,{arms:[[[134,91],[95,105],[58,110]],[[166,91],[174,135],[176,166]]]});
 more('table-wrist','Handledsstretch mot bord','Armar & händer','Handledens böjare','forearm','Placera handflatorna på ett bord med fingrarna mot dig och luta dig försiktigt bakåt.',stand,'wristFlex',false);
 more('table-wrist-back','Handrygg mot bord','Armar & händer','Handledens sträckare','forearm','Placera handryggarna mot ett bord och luta dig lätt framåt tills det känns ovanpå underarmen.',stand,'wristExtend',false);
 more('triceps-wall','Tricepsstretch mot vägg','Armar & händer','Triceps','upperArm','Placera angiven armbåge högt mot en vägg med handen bakom huvudet och luta bröstet mot väggen.',stand,'overhead',true,{arms:[[[134,91],[120,35],[150,74]],[[166,91],[174,135],[176,166]]]});
 // Helkropp
 more('long-stretch','Liggande helkroppssträck','Helkropp','Hela kroppen','','Ligg på rygg, sträck armarna över huvudet och tårna bort från dig. Andas ut och släpp.','rest','breathe');
 more('reach-tall','Stående sträck på tå','Helkropp','Hela kroppen, vader','','Sträck båda armarna mot taket, gå upp på tå och sjunk sedan lugnt ned.',stand,'overhead',false,{arms:[[[134,91],[128,48],[126,10]],[[166,91],[172,48],[174,10]]]});
 more('worlds-greatest','Världens bästa stretch','Helkropp','Höftböjare, bröstrygg, baksida lår','','Från utfall: placera handen innanför angiven främre fot och rotera den andra armen mot taket.','hip-left','lunge',true);
 more('deep-squat','Djup knäböjsvila','Helkropp','Fotleder, höfter, ländrygg','hip','Sjunk ned i en djup knäböj med hälarna i golvet. Håll i något stadigt vid behov.',kneel,'breathe');
 more('down-dog','Mjuk nedåtgående hund','Helkropp','Vader, baksida lår, axlar','','Från alla fyra: lyft höfterna mot taket med mjuka knän och tryck hälarna lätt mot golvet.','cat','puppy',false,{head:[110,215],torso:[[120,195],[175,130]],arms:[[[118,200],[95,222],[70,235]],[[124,195],[100,218],[75,230]]],legs:[[[175,135],[200,190],[230,235]],[[172,138],[195,192],[222,232]]]});
 const poses=families.flatMap(f=>f.paired?['left','right'].map(side=>({id:f.id+'-'+side,name:f.name+' · '+(side==='left'?'vänster':'höger'),cue:f.cue,group:f.group,family:f.id,side,...(f.muscle?{muscle:f.muscle}:{})})): [{id:f.id,name:f.name,cue:f.cue,group:f.group,family:f.id,...(f.muscle?{muscle:f.muscle}:{})}]);
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
   else if(family.id==='rest'){const breath=(1-Math.cos(t*Math.PI/4))/2;p.torso[0][1]-=4*breath;p.arms.forEach(a=>a[0][1]-=2*breath);}
   else {p.torso[0][1]-=2*b;p.head[1]-=b;p.arms.forEach(a=>a[0][1]-=b);}
  }
  if(entry.side==='right'){[p.head,...p.torso,...p.arms.flat(),...p.legs.flat()].forEach(v=>v[0]=300-v[0]);p.headAngle=-p.headAngle;p.hands.forEach(h=>h.angle=Math.PI-h.angle);p.feet.forEach(f=>f.angle=Math.PI-f.angle);}
  const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  const torsoAt=t=>p.torso.length===3?mix(mix(p.torso[0],p.torso[1],t),mix(p.torso[1],p.torso[2],t),t):mix(p.torso[0],p.torso[1],t);
  p.highlights=[];
  const mark=(a,b,r=11)=>p.highlights.push({a:[...a],b:[...b],r});
  const segment=(limb,a,b,r=10)=>mark(mix(limb[0],limb[1],a),mix(limb[0],limb[1],b),r);
  const arms=entry.side?[p.arms[0]]:p.arms,legs=entry.side?[p.legs[0]]:p.legs;
  const areas={neck:()=>mark(mix(p.head,p.torso[0],.6),p.torso[0],11),shoulder:()=>arms.forEach(a=>segment(a,0,.35,12)),upperArm:()=>arms.forEach(a=>segment(a,.22,.8,10)),
   forearm:()=>arms.forEach(a=>mark(mix(a[1],a[2],.3),a[2],9)),chest:()=>mark(mix(p.arms[0][0],p.torso[0],.5),mix(p.arms[1][0],p.torso[0],.5),15),
   torso:()=>mark(torsoAt(.2),torsoAt(.7),13),torsoLow:()=>mark(torsoAt(.55),torsoAt(.95),13),hip:()=>legs.forEach(a=>segment(a,0,.25,17)),
   thigh:()=>legs.forEach(a=>segment(a,.15,.8,13)),calf:()=>legs.forEach(a=>segment([a[1],a[2]],.2,.75,12)),foot:()=>legs.forEach(a=>mark(mix(a[1],a[2],.85),a[2],10))};
  if(family.muscle){if(areas[family.area])areas[family.area]();}
  else if(family.id==='hip')segment(p.legs[1],0,.45,14);
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
 return {poses,frame,families:families.map(({id,name,group,muscle})=>({id,name,group,...(muscle?{muscle}:{})}))};
});
