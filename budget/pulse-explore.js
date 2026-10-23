/* Independent Markus/Maja copy of Ingemar's complete exercise catalogue. */
(function(root){
'use strict';
const raw=`Bröstpress i maskin|Push|Maskin|press|Bröst,Triceps,Axlar|Ställ in sitsen så handtagen är i brösthöjd.|Pressa handtagen framåt utan att låsa armbågarna hårt.|Återgå kontrollerat till start.|Håll skulderbladen stabila mot ryggstödet.
Pec deck|Push|Maskin|fly|Bröst,Axlar|Sitt med bröstet upprätt och armbågarna i höjd med bröstet.|För armarna samman framför kroppen.|Öppna långsamt utan att dra axlarna bakåt för långt.|Undvik att rycka med överkroppen.
Axelpress i maskin|Push|Maskin|overhead|Axlar,Triceps|Ställ in sitsen så handtagen är strax ovanför axlarna.|Pressa handtagen uppåt.|Sänk tills händerna är ungefär i öronhöjd.|Undvik att svanka kraftigt.
Tricepspress i kabel|Push|Kabel|pushdown|Triceps|Stå stadigt med armbågarna intill sidorna.|Pressa handtaget nedåt genom att sträcka armbågarna.|Släpp upp långsamt utan att flytta överarmarna.|Låt inte axlarna driva rörelsen.
Kabel-flyes|Push|Kabel|fly|Bröst,Axlar|Stå med ett ben lätt framför det andra och armarna öppna.|För handtagen framåt och mot varandra.|Återgå kontrollerat med lätt böjda armbågar.|Håll bröstkorgen stilla.
Bänkpress med skivstång|Push|Skivstång|bench|Bröst,Triceps,Axlar|Ligg stabilt på bänken med fötterna i golvet.|Pressa stången upp från brösthöjd.|Sänk kontrollerat mot nedre delen av bröstet.|Håll handlederna över underarmarna.
Hantelpress på bänk|Push|Hantlar|bench|Bröst,Triceps|Ligg på bänk med hantlarna bredvid bröstet.|Pressa hantlarna uppåt.|Sänk kontrollerat med armbågarna lätt vinklade.|Undvik att slå ihop hantlarna.
Lutande hantelpress|Push|Hantlar|bench|Bröst,Axlar,Triceps|Ställ bänken i måttlig lutning och håll hantlarna vid bröstet.|Pressa upp längs en kontrollerad bana.|Sänk långsamt till start.|Håll skulderbladen mot bänken.
Hantellyft åt sidan|Push|Hantlar|raise|Axlar|Stå stadigt med hantlar vid sidorna.|Lyft armarna åt sidan till ungefär axelhöjd.|Sänk långsamt utan att gunga.|Låt armbågarna leda rörelsen.
Armhävningar|Push|Kroppsvikt|pushup|Bröst,Triceps,Axlar|Placera händerna strax bredare än axlarna i plankposition.|Sänk bröstet mot golvet med stabil bål.|Pressa upp till raka armar.|Håll kroppen i en rak linje.
Latsdrag i maskin|Pull|Maskin|pulldown|Rygg,Biceps|Sitt med låren under stödet och greppa stången.|Dra stången mot övre delen av bröstet.|Släpp upp kontrollerat till nästan raka armar.|Dra armbågarna nedåt, inte bara händerna.
Sittande rodd i maskin|Pull|Maskin|row|Rygg,Biceps|Ställ in sitsen och placera bröstet mot stödet.|Dra handtagen mot nedre revbenen.|Sträck armarna kontrollerat framåt.|Undvik att kasta överkroppen bakåt.
Assisterade chins|Pull|Maskin|pullup|Rygg,Biceps|Ställ in avlastningen, placera knäna på plattan och greppa handtagen.|Dra bröstet upp mot stången.|Sänk kroppen långsamt.|Håll axlarna borta från öronen.
Omvänd pec deck|Pull|Maskin|reversefly|Rygg,Axlar|Sitt vänd mot ryggstödet med händerna på handtagen.|För armarna utåt och bakåt.|Återgå långsamt utan att runda ryggen.|Tänk att skulderbladen rör sig ihop.
Låg kabelrodd|Pull|Kabel|row|Rygg,Biceps|Sitt med neutral rygg och lätt böjda knän.|Dra handtaget mot magen.|Återgå med kontrollerad skulderrörelse.|Håll ryggen stabil.
Face pulls|Pull|Kabel|reversefly|Axlar,Rygg|Ställ kabeln i ansiktshöjd och greppa repet.|Dra repet mot ansiktet med armbågarna utåt.|Sträck armarna kontrollerat.|Håll axlarna nere.
Bicepscurl i kabel|Pull|Kabel|curl|Biceps|Stå upprätt med armbågarna nära kroppen.|Böj armbågarna och för handtaget uppåt.|Sänk kontrollerat.|Undvik att svänga med kroppen.
Bicepscurl med hantlar|Pull|Hantlar|curl|Biceps|Håll hantlarna vid sidorna med stabil hållning.|Böj armbågarna utan att flytta överarmarna.|Sänk långsamt.|Använd en vikt som inte kräver gungning.
Hantelrodd|Pull|Hantlar|row|Rygg,Biceps|Stöd ena handen mot en bänk och håll ryggen neutral.|Dra hanteln mot höften.|Sänk kontrollerat.|Undvik att vrida överkroppen.
Skivstångsrodd|Pull|Skivstång|row|Rygg,Biceps|Fäll i höften och håll ryggen neutral.|Dra stången mot nedre magen.|Sänk utan att ändra ryggvinkeln.|Håll bålen spänd.
Chins|Pull|Kroppsvikt|pullup|Rygg,Biceps|Häng i stången med stabila skuldror.|Dra kroppen upp mot stången.|Sänk långsamt till start.|Undvik att sparka dig upp.
Benpress i maskin|Ben|Maskin|legpress|Framsida lår,Säte|Sitt med hela ryggen mot stödet och fötterna på plattan.|Pressa plattan bort genom att sträcka benen.|Böj knäna kontrollerat tillbaka.|Lås inte knäna hårt.
Benspark i maskin|Ben|Maskin|extension|Framsida lår|Justera sits och dyna ovanför fotlederna.|Sträck knäna tills benen är nästan raka.|Sänk långsamt.|Låt höften vara kvar i sitsen.
Lårcurl i maskin|Ben|Maskin|legcurl|Baksida lår|Ligg på mage och justera dynan bakom fotlederna. Håll höfterna mot bänken.|Böj knäna mot motståndet.|Återgå långsamt.|Undvik att lyfta höften.
Hack squat i maskin|Ben|Maskin|squat|Framsida lår,Säte|Placera fötterna stadigt på plattan och axlarna under stöden.|Böj knän och höft i en kontrollerad knäböj.|Pressa upp genom hela foten.|Håll knäna i linje med tårna.
Höftabduktion i maskin|Ben|Maskin|abduct|Säte|Sitt med ryggen mot stödet och knäna mot dynorna.|För knäna utåt mot motståndet.|Återgå kontrollerat.|Undvik att luta kroppen fram och tillbaka.
Vadpress i maskin|Ben|Maskin|calf|Vader|Placera främre delen av fötterna på plattan.|Pressa upp hälarna så högt som bekvämt.|Sänk hälarna kontrollerat.|Undvik att studsa i bottenläget.
Knäböj med skivstång|Ben|Skivstång|squat|Framsida lår,Säte|Placera stången stabilt över övre ryggen.|Böj knän och höft samtidigt.|Pressa upp genom hela foten.|Håll bålen spänd och ryggen neutral.
Marklyft|Ben|Skivstång|hinge|Baksida lår,Säte,Rygg|Stå med stången nära smalbenen och greppa den.|Sträck höft och knän tills du står upprätt.|Sänk genom att fälla i höften.|Håll stången nära kroppen.
Rumänska marklyft|Ben|Skivstång|hinge|Baksida lår,Säte|Stå med lätt böjda knän och stången framför låren.|Fäll i höften med stången nära benen.|Res dig genom att sträcka höften.|Undvik att runda ländryggen.
Utfall med hantlar|Ben|Hantlar|lunge|Framsida lår,Säte|Stå upprätt med hantlar vid sidorna.|Ta ett steg fram och sänk bakre knät mot golvet.|Pressa tillbaka till start.|Håll främre knät i linje med foten.
Hip thrust|Ben|Skivstång|bridge|Säte,Baksida lår|Placera övre ryggen mot bänk och stången över höften.|Pressa upp höften tills kroppen bildar en rak linje.|Sänk kontrollerat.|Undvik att översträcka ländryggen.
Plankan|Ben|Kroppsvikt|plank|Mage,Rygg|Placera armbågarna under axlarna och sträck benen.|Spänn bål och säte och håll kroppen rak.|Andas lugnt under hela tiden.|Undvik att svanka eller lyfta sätet för högt.
Situps|Ben|Kroppsvikt|crunch|Mage|Ligg på rygg med böjda knän.|Rulla upp överkroppen kontrollerat.|Sänk långsamt till golvet.|Dra inte i nacken.
Löpband|Kondition|Konditionsmaskin|walk|Framsida lår,Vader,Säte|Starta i lugnt tempo och stå mitt på bandet.|Gå med naturliga, växelvisa steg. Animationen visar gång.|Anpassa fart och lutning gradvis.|Undvik att hålla i räckena i onödan.
Motionscykel|Kondition|Konditionsmaskin|cycle|Framsida lår,Vader|Ställ in sadelhöjden så knät är lätt böjt längst ner.|Trampa jämnt runt hela varvet.|Justera motstånd och kadens efter passet.|Undvik att gunga med överkroppen.
Crosstrainer|Kondition|Konditionsmaskin|elliptical|Framsida lår,Säte,Axlar|Ställ in motstånd och håll en upprätt hållning.|För handtagen och pedalerna i mjuka motsatta rörelser.|Behåll en jämn rytm.|Undvik att låsa knäna.
Roddmaskin|Kondition|Konditionsmaskin|row|Rygg,Framsida lår,Biceps|Sitt med rak rygg och lätt framåtlutning i startläget.|Tryck först med benen och dra sedan handtaget mot magen.|Återgå med armar, överkropp och sist ben.|Undvik att dra med armarna för tidigt.
Trappmaskin|Kondition|Konditionsmaskin|step|Framsida lår,Säte,Vader|Stå upprätt med hela foten på steget.|Tryck ned ett steg i taget med jämn rytm.|Fortsätt utan att hänga på handtagen.|Håll överkroppen stilla.
Kabelcrunch|Ben|Kabel|crunch|Mage|Knäböj framför kabeln och håll repet vid huvudet.|Runda överkroppen kontrollerat genom att spänna magen.|Återgå långsamt utan att lyfta höften.|Låt magen driva rörelsen.
Smithmaskin knäböj|Ben|Maskin|squat|Framsida lår,Säte|Ställ fötterna stabilt under stången.|Böj knän och höft i kontrollerad takt.|Pressa tillbaka upp.|Håll knäna i linje med fötterna.
Lutande bröstpress i maskin|Push|Maskin|press|Bröst,Axlar,Triceps|Ställ in sitsen så handtagen är i övre brösthöjd.|Pressa handtagen framåt och lätt uppåt.|Återgå kontrollerat.|Håll ryggen mot stödet.
Enarms latsdrag i kabel|Pull|Kabel|pulldown|Rygg,Biceps|Stå på ett knä med motsatt fot framför dig och sträck arbetsarmen uppåt.|Dra armbågen ned mot sidan.|Släpp upp kontrollerat.|Undvik att luta dig åt sidan.
Glute bridge|Ben|Kroppsvikt|bridge|Säte,Baksida lår|Ligg på rygg med böjda knän och fötterna i golvet.|Pressa höften upp tills kroppen är rak.|Sänk långsamt.|Spänn sätet utan att svanka.
Militärpress med hantlar|Push|Hantlar|overhead|Axlar,Triceps|Håll hantlarna i axelhöjd med spänd bål.|Pressa dem rakt upp.|Sänk kontrollerat.|Undvik att skjuta huvudet framåt.
Latsdrag med smalt grepp|Pull|Maskin|pulldown|Rygg,Biceps|Greppa handtaget och sitt stadigt med låren under stödet.|Dra ned mot övre bröstet.|Släpp upp långsamt.|Låt skulderbladen röra sig kontrollerat.
Pallof-press i kabel|Bål|Kabel|pallof|Mage|Stå med sidan mot kabeln, ställ handtaget i brösthöjd och håll det med båda händerna.|Pressa händerna rakt fram medan bröst och höfter pekar åt samma håll.|För tillbaka händerna till bröstet. Byt sida efter setet.|Motstå kabelns drag utan att vrida överkroppen.
Pull-through i kabel|Ben|Kabel|pullthrough|Säte,Baksida lår|Stå med ryggen mot en låg kabel och håll repet mellan benen.|För höften bakåt med mjuka knän och neutral rygg.|Sträck höften tills du står upprätt och håll armarna långa.|Rörelsen kommer från höften. Undvik att luta dig bakåt i toppläget.
Farmers walk|Bål|Hantlar|carry|Mage,Rygg|Håll en hantel i varje hand och stå upprätt.|Gå framåt med korta, jämna steg och vikterna vid sidorna.|Stanna kontrollerat innan du sätter ned vikterna.|Håll axlar och bäcken jämna och låt inte hantlarna gunga.
Step-up med hantlar|Ben|Hantlar|stepup|Framsida lår,Säte|Placera hela ena foten på en låg, stabil låda. Håll hantlarna vid sidorna.|Tryck genom foten på lådan och kliv upp med den andra foten.|Kliv långsamt ned med samma fot som nyss kom upp. Byt ben efter setet.|Välj en höjd du kan kontrollera och undvik att skjuta ifrån kraftigt med den bakre foten.
Dead bug|Bål|Kroppsvikt|deadbug|Mage|Ligg på rygg med armarna mot taket och höft och knän böjda ungefär 90 grader.|Sträck motsatt arm och ben långsamt bort från kroppen.|Återgå till start och växla sida.|Gå bara så långt att du kan behålla kontrollen över ryggen utan att svanka.
Bird dog|Bål|Kroppsvikt|birddog|Mage,Rygg,Säte|Stå på alla fyra med händer under axlar och knän under höfter.|Sträck motsatt arm och ben till ungefär samma höjd som bålen.|Sänk kontrollerat och växla sida.|Håll bäckenet stilla. Sträck långt snarare än högt.
Omvända flyes med hantlar|Pull|Hantlar|reversefly|Axlar,Rygg|Fäll framåt i höften med mjuka knän. Låt lätta hantlar hänga under axlarna.|För armarna utåt med lätt böjda armbågar.|Sänk långsamt utan att ändra överkroppens vinkel.|Undvik att rycka upp vikterna eller lyfta axlarna mot öronen.
Goblet squat med hantel|Ben|Hantlar|goblet|Framsida lår,Säte,Mage|Håll en hantel lodrätt nära bröstet med båda händerna under den övre vikten.|Böj höfter och knän med hela fötterna i golvet.|Res dig kontrollerat och håll hanteln nära kroppen.|Låt knäna följa tårnas riktning och välj ett djup du kan kontrollera.`;
const exercises=raw.split('\n').map((line,id)=>{const p=line.split('|');return {id,name:p[0],group:p[1],equipment:p[2],move:p[3],muscles:p[4].split(','),steps:p.slice(5,8),tip:p[8]};});
const inspiration={46:'Träna bålen genom att stå emot vridning.',47:'Ett annat sätt att träna höftfällning och säte.',48:'Träna bålstabilitet och grepp medan du går.',49:'Arbeta med ett ben i taget på en stabil låda.',50:'Koordination och bålkontroll från ryggliggande.',51:'Balans och kontroll med motsatt arm och ben.',52:'Ett fritt alternativ för bakre axlar och övre rygg.',53:'Knäböj med vikten framför kroppen.'};
// General repetition guidance: https://www.nhs.uk/live-well/exercise/how-to-improve-strength-flexibility/
// Technique references for added core movements: https://www.nasm.org/resource-center/exercise-library/
const programs=[
 {id:'full-machine',name:'Helkropp i maskiner',group:'Helkropp',type:'Push',equipment:'Maskiner',durationMinutes:[35,45],tag:'En tydlig start',description:'Ben, bröst och rygg i ett sammanhållet pass med stöd från maskinerna.',schedule:'Exempel: två pass i veckan med en vilodag emellan.',ids:[21,0,10,23,2,11],sets:2,reps:[8,12]},
 {id:'push',name:'Push · press & axlar',group:'Push',type:'Push',equipment:'Maskiner & kabel',durationMinutes:[30,40],tag:'Bröst · axlar · triceps',description:'Två pressövningar följs av bröst och triceps i kontrollerade rörelser.',schedule:'Kan kombineras med Pull och Ben på andra dagar.',ids:[0,2,1,3],sets:3,reps:[8,12]},
 {id:'pull',name:'Pull · rygg & armar',group:'Pull',type:'Pull',equipment:'Maskiner & kabel',durationMinutes:[30,40],tag:'Rygg · biceps · axlar',description:'Drag uppifrån och framifrån, följt av bakre axlar och biceps.',schedule:'Kan kombineras med Push och Ben på andra dagar.',ids:[10,11,13,16],sets:3,reps:[8,12]},
 {id:'legs',name:'Ben · stabil bas',group:'Ben',type:'Push',equipment:'Maskiner',durationMinutes:[30,40],tag:'Lår · säte · vader',description:'Ett maskinpass för både framsida och baksida av benen.',schedule:'Låt benen återhämta sig mellan passen. Komplettera med överkropp en annan dag.',ids:[21,23,22,25,26],sets:2,reps:[8,12]},
 {id:'dumbbells',name:'Helkropp med hantlar',group:'Helkropp',type:'Push',equipment:'Hantlar & bänk',durationMinutes:[35,45],tag:'Fria vikter',description:'Utfall, press och rodd med hantlar. Avsluta med säte och axlar.',schedule:'Exempel: två pass i veckan med en vilodag emellan. Utfall och rodd görs på båda sidor.',ids:[30,6,18,43,44],sets:2,reps:[8,12]},
 {id:'cardio',name:'Kondition · jämnt tempo',group:'Kondition',type:'Kondition',equipment:'Löpband & cykel',durationMinutes:[25,25],tag:'Gång & cykling',description:'Börja med lugn gång och fortsätt på cykeln i ett tempo du kan prata i.',schedule:'De första och sista minuterna på varje maskin tas lugnare.',ids:[34,35],minutes:[10,15],sets:1},
 {id:'push-short',name:'Push · kort & enkelt',group:'Push',type:'Push',equipment:'Maskin & kabel',durationMinutes:[15,20],tag:'När tiden är knapp',description:'Bröstpress följt av triceps. Två övningar och färre set gör passet lätt att hinna med.',schedule:'Ett kort alternativ till ditt vanliga Push-pass.',ids:[0,3],sets:2,reps:[8,12]},
 {id:'push-dumbbells',name:'Push · bara hantlar',group:'Push',type:'Push',equipment:'Hantlar & bänk',durationMinutes:[20,30],tag:'Bröst & axlar',description:'Hantelpress, axelpress och sidolyft. Ett kompakt pass utan maskinbyten.',schedule:'Välj detta som variation till Push i maskiner. Börja lätt i pressövningarna.',ids:[6,44,8],sets:2,reps:[8,12]},
 {id:'push-variety',name:'Push · varierat gympass',group:'Push',type:'Push',equipment:'Hantlar, maskin & kabel',durationMinutes:[40,50],tag:'Flera vinklar',description:'Lutande hantelpress och axelpress följs av kabel-flyes, sidolyft och triceps.',schedule:'Ett längre alternativ när du vill variera utrustningen. Låt pressmusklerna återhämta sig före nästa Push-pass.',ids:[7,2,4,8,3],sets:3,reps:[8,12]},
 {id:'push-long',name:'Push · extra tid på gymmet',group:'Push',type:'Push',equipment:'Skivstång, hantlar, maskin & kabel',durationMinutes:[50,60],tag:'Fler arbetsset',description:'Bänkpress och hantelpress för axlarna, följt av pec deck, sidolyft och triceps. Fyra set per övning.',schedule:'För dagar då du redan är van vid ett längre pass. Ta bort set i passbyggaren om mängden blir för stor.',ids:[5,44,1,8,3],sets:4,reps:[8,12]},
 {id:'pull-short',name:'Pull · kort & enkelt',group:'Pull',type:'Pull',equipment:'Maskin & hantlar',durationMinutes:[15,20],tag:'När tiden är knapp',description:'Sittande rodd och hantelcurl. Ett kort pass för rygg och biceps med två set per övning.',schedule:'Ett kort alternativ till ditt vanliga Pull-pass.',ids:[11,17],sets:2,reps:[8,12]},
 {id:'pull-dumbbells',name:'Pull · bara hantlar',group:'Pull',type:'Pull',equipment:'Hantlar & bänk',durationMinutes:[25,30],tag:'Rygg & bakre axlar',description:'Enarmsrodd, omvända flyes och bicepscurl. Samma hantelyta genom hela passet.',schedule:'Gör roddens repetitioner på båda sidor. Använd lättare hantlar för omvända flyes.',ids:[18,52,17],sets:2,reps:[8,12]},
 {id:'pull-variety',name:'Pull · varierat gympass',group:'Pull',type:'Pull',equipment:'Maskiner, hantlar & kabel',durationMinutes:[45,55],tag:'Drag & skulderkontroll',description:'Smalt latsdrag och hantelrodd följs av omvänd pec deck, face pulls och kabelcurl.',schedule:'Gör hantelrodd på båda sidor. Ett längre alternativ till ditt vanliga Pull-pass.',ids:[45,18,13,15,16],sets:3,reps:[8,12]},
 {id:'pull-long',name:'Pull · extra tid på gymmet',group:'Pull',type:'Pull',equipment:'Maskin, kabel & hantlar',durationMinutes:[50,60],tag:'Fler arbetsset',description:'Assisterade chins, kabelrodd, omvända flyes, face pulls och hantelcurl. Fyra set per övning.',schedule:'Anpassa avlastningen i chins. Ta bort set i passbyggaren om mängden blir för stor och låt ryggen återhämta sig mellan passen.',ids:[12,14,52,15,17],sets:4,reps:[8,12]}
];
function durationLabel(program){const [min,max]=program.durationMinutes;return (min===max?String(max):min+'–'+max)+' min';}
// Match the upper estimate so a time budget never includes a longer suggested pass.
function matchingPrograms(group,maxMinutes){return programs.filter(p=>(!group||group==='Alla'||p.group===group)&&(!maxMinutes||p.durationMinutes[1]<=Number(maxMinutes)));}
function prescription(id,program){
 const e=exercises[id];if(!e)return null;
 if(e.group==='Kondition'){const ix=program?program.ids.indexOf(id):-1;return {mode:'min',sets:1,minutes:program&&program.minutes?program.minutes[ix]:10,label:(program&&program.minutes?program.minutes[ix]:10)+' min',reps:null,range:''};}
 if(e.move==='carry')return {mode:'min',sets:2,minutes:.5,label:'2 × 30 sek',reps:null,range:''};
 if(e.move==='plank')return {mode:'min',sets:2,minutes:.5,label:'2 × 30 sek',reps:null,range:''};
 const count=program?program.sets:2,range=program&&program.reps||([50,51].includes(id)?[6,10]:[8,12]);
 return {mode:'kg',sets:count,minutes:null,reps:range[0],range:range.join('–'),label:count+' × '+range.join('–')+' reps'+([18,30,42,46,49,50,51].includes(id)?' / sida':'')};
}
function workout(request){
 if(!request||request.version!==1)return null;
 const program=request.programId?programs.find(p=>p.id===request.programId):null;
 if(request.programId&&!program)return null;
 const ids=program?program.ids:request.ids;
 if(!Array.isArray(ids)||!ids.length||ids.length>20||new Set(ids).size!==ids.length||ids.some(id=>!Number.isInteger(id)||!exercises[id]))return null;
 const allCardio=ids.every(id=>exercises[id].group==='Kondition'),allPull=ids.every(id=>exercises[id].group==='Pull');
 return {name:program?program.name:'Mitt träningspass',type:program?program.type:allCardio?'Kondition':allPull?'Pull':'Push',exercises:ids.map(id=>{
  const e=exercises[id],p=prescription(id,program);
  return {name:e.name,mode:p.mode,suggestedReps:p.range,guideId:id,betweenSets:{enabled:true,type:'rest',seconds:p.mode==='min'?60:90,name:''},sets:Array.from({length:p.sets},()=>({weight:null,reps:p.reps,minutes:p.minutes,done:false}))};})};
}
// Keep the guide isolated from Ingemar and keep each user's selections apart.
const profile=root.location&&new URLSearchParams(root.location.search).get('user')==='maja'?'maja':'markus';
root.PulseExplore={exercises,inspiration,programs,durationLabel,matchingPrograms,prescription,workout,transferKey:'pulse-explore-transfer-v1-'+profile,selectionKey:'pulse-explore-selection-v1-'+profile};
})(typeof window==='undefined'?globalThis:window);
