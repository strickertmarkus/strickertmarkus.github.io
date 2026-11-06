# Genomgång av träning, stretch och meditation

Detaljerat underlag för förbättringar, implementation och fortsatt verifiering.

**Datum:** 6 november 2026  
**Omfattning:** Markus och Majas träningssida `budget/exercise.html` samt anslutande stretch- och meditationsvyer.  
**Status:** Granskning och förslag. Inga av förslagen i detta dokument har implementerats.  
**Granskad kodversion:** `093d8b78f2cf681b34cae5df8f7c477326cbabb0` i `strickertmarkus/strickertmarkus.github.io`.

Dokumentet beskriver den genomgång som gjordes i samtalet och kopplar fynden till kod i den angivna versionen. Det är inte en ny fullständig granskning av eventuella senare ändringar. Före implementation ska aktuell branch och berörda kodvägar jämföras med denna baslinje.

## 1. Slutsats och prioritering

Den visuella riktningen fungerar bra: träning, stretch och meditation har egna uttryck, samtidigt som huvudnavigationen har blivit mer samlad. Störst nytta kommer från att förbättra datakorrekthet och sambandet mellan planering, genomförande och loggning.

Prioritera i denna ordning:

1. Korrekt faktisk tid per stretchövning och rättvisande muskelstatistik.
2. Möjlighet att spara delvis genomförda träningspass.
3. Passnamn som följer med hela vägen till historiken och korrekt hantering av flera pass samma dag.
4. Egna stretch- och meditationsmallar i träningsplaneraren.
5. Enklare mallval, tillfälliga tidsval och tydligare huvudhandlingar.
6. Konsekventa färger, navigation, profiler och läsbarhet.
7. Riktad mätning av prestanda, mobilbeteende och synkronisering.

### Prioritetsnivåer

| Nivå | Betydelse |
| --- | --- |
| P1 | Fel eller begränsning som påverkar sparade resultat, möjligheten att avsluta ett pass eller tillförlitlig planering. |
| P2 | Tydlig förbättring av begriplighet, hittbarhet eller konsekvens i ett vanligt flöde. |
| P3 | Förfining, utökad funktion eller optimering som bör föregås av mätning eller prioriteringsbeslut. |

### Evidensnivåer

| Markering | Betydelse |
| --- | --- |
| Återskapat | Beteendet observerades genom interaktion i den isolerade förhandsvisningen. |
| Kodbekräftat | Beteendet eller begränsningen kan följas i granskad kod. Det betyder inte att alla verkliga enhetsfall har provats. |
| Designbedömning | Förslag utifrån den observerade presentationen och användarflödet; inte ett påstående om ett tekniskt fel. |
| Behöver verifieras | Risk, hypotes eller önskat test där underlaget ännu inte räcker för en säker slutsats. |

## 2. Genomförd granskning och begränsningar

### Det som granskades

- Aktuell källkod för träningssidan, Zen-sidorna, planering, sessioner, loggning och delar av synkroniseringen.
- Träningsflödet från passbyggare till genomförande och logg.
- Stretchflödet inklusive passval, avbrutet pass, historik och muskelstatistik.
- Meditationens startvy, byggare, pågående pass, ljudinställningar och paus.
- Grafer, veckoplanering och historik med exempeldata.
- Utvalda vyer i bredderna 320, 390 och 1280 CSS-pixlar. Detta var ingen fullständig kombinationsmatris för varje vy och bredd.

### Begränsningar

- Den publicerade sidan krävde inloggning. Interaktionerna gjordes därför i en separat förhandsvisning med exempeldata och frånkopplad riktig synkronisering.
- Ingen verklig träningshistorik ändrades. Inga implementationer, commits eller publiceringar gjordes i användarens repository.
- Webbläsaren var Chromium. Riktig iPhone/Safari, Android och macOS Safari är inte verifierade genom denna granskning.
- Mobilbredder i en iframe motsvarar inte full verifiering av tangentbord, browserfält, safe areas, Dynamic Island eller touch på en riktig telefon.
- WebGL kunde inte användas normalt i granskningsmiljön. Den senaste 3D-figurens hudton, glow, övergångar och faktiska bildfrekvens är därför inte visuellt godkända här.
- Ingen batterimätning, FPS-mätning eller synk mellan verkliga enheter utfördes.
- Inga automatiska testsuiter kördes. Testerna längre ned är förslag för fortsatt arbete, inte godkända testresultat.

### Förbättringar som redan finns i baslinjen

Följande ska inte behandlas som kvarstående gamla designproblem:

- Kompaktare sidtopp med samlade områdesflikar.
- Tydligare texter som ”Veckans träning” och ”Markus pass och plan”.
- Namngivet menyval ”Kompakt vy”.
- ”Hantera” vid personliga rekord.
- Startcirkeln använder nu det planerade passets namn via `plan.name || plan.type`.
- Meditation har redan paus, dold timer, andningsval, bakgrundsljud och intervallklocka.
- Stretchbyggaren har redan sökning, kategorier, textbeskrivningar, sidpar och gemensamma tidsval.
- Wake Lock och viss optimering för dolda eller inaktiva scener finns redan.

## 3. Karta över berörda filer

Sök i första hand på funktioner och element-ID:n nedan. Radnummer ändras snabbt. Alla sökvägar i dokumentet är relativa till repositoryts rot.

| Fil | Ansvar och relevanta startpunkter |
| --- | --- |
| `budget/exercise.html` | Träningssidans huvudstruktur, meny, veckovy, grafer, logg och rekord. |
| `budget/training-pulse-field.js` | Dashboard och presentation: `renderHero`, `nextPlanned`, `renderRhythm`, `renderWeek`, `renderActivity`, `workoutType`, `workoutKind`, `renderLog`, `renderInsight`, `renderVolume`, `renderRecords`. |
| `budget/training-pulse-field.css` | Träningssidans layout, typografi, grafer och responsiva regler. |
| `budget/training-pulse-editor.js` | Öppnar och kopplar in passverktygen via iframe till `archive/exercise.html?embedded=1`. Förmedlar profil och öppningskontext. |
| `budget/training-pulse-editor.css` | Det yttre arbetsfönstret runt passverktygen. |
| `budget/archive/exercise.html` | Aktiv runtime för den inbäddade passbyggaren och träningsläget. Bland annat `stopSessionMode`, `saveSessionWorkout` och `day-workout-template-select`. Filen är fortfarande aktiv trots katalognamnet `archive`. |
| `budget/training-pulse-classic-templates-v1.js` | Mallpassflödet och mallval i den klassiska byggaren. Läs tillsammans med runtime och laddningskonfiguration. |
| `budget/training-pulse-classic-builder-v1.css` | Presentation av passbyggaren, inklusive kompakta inställningar. |
| `budget/training-zen-plans.js` | Kopplar Zen till träningsplanering: `routines`, `session`, `PulseZen.selectOptions`, `PulseZen.builderRecord`, `PulseZen.list`, `PulseZen.url`. |
| `budget/training-zen-plans.css` | Utseende för Zen-val i träningsbyggare och planerare. |
| `budget/zen.html` | Struktur för hemvy, bibliotek, byggare, session, sammanfattning och inställningar. |
| `budget/zen.js` | Zen-flöden: `routines`, `renderHome`, `renderLibrary`, `passClick`, `openBuilder`, `startSession`, `openSession`, `tick`, `complete`, `saveComplete`, ljud och historikredigering. |
| `budget/zen-model.js` | Passdefinitioner, tidsmodell, validering och statistik: bland annat `practiced`, `position`, `groups`, `period`, `stats`. |
| `budget/zen-store.js` | Lagring av egna mallar, sparade pass och aktiv session. Kontrollera profilavgränsning och validering före schemaändringar. |
| `budget/zen-stretch-library.js` | Stretchövningar och metadata som används i biblioteket. |
| `budget/zen-session-scene.js` | Sessionsrendering, förtimer, progress, nästa övning samt val mellan den nya figuren och reservvisning. |
| `budget/pulse-silver-stretch.js` | Den nya stretchfigurens rörelser: `POSE_DEFS`, uppbyggnad av poser och stöd per övnings-ID. |
| `budget/zen.css` och `budget/zen-session.css` | Zen-sidornas respektive sessionsvyns layout och responsiva regler. |
| `budget/training-zen-nav.js` och `.css` | Gemensam områdesnavigation. Kontrollera hur profil följer med mellan sidor. |
| `budget/firebase-sync.js` | Gemensamma synknycklar, realtidslyssnare och reservpollning. |
| `budget/auth-config.js` | Laddningsvägar och aktiva moduler. Kontrollpunkt innan ändring i äldre runtime eller delade filer. |
| `budget/exercise-session-persistence-v143.js` och `budget/exercise-reload-recovery.js` | Återställning av träningssessioner. Behöver läsas när avslutsflödet ändras. |

**Arkitekturprincip:** Gör förändringen där beteendet faktiskt ägs. En ändring enbart i `exercise.html` löser inte ett problem i den inbäddade sessionsrutinen. Undvik ett nytt efterhandslager som korrigerar fel data först när de visas.

## 4. Funktionsfynd med implementationsförslag

### F01 — Faktisk stretchtid och övningshistorik stämmer inte överens

**Prioritet:** P1. **Evidens:** Återskapat och kodbekräftat.

**Observation:** Ett pass med sex övningar à 60 sekunder avslutades efter cirka 78 sekunders aktiv tid. Sammanfattningen visade cirka 1,3 minuter, men historiken sparade hela mallens sex övningar à 1:00. ”Mest stretchat” räknade därför planerad tid för övningar som inte genomförts.

**Kodväg:** `zen.js` → `complete(early)` använder `M.practiced(...)` för totalen men kopierar `session.routine.steps` med ursprungliga `step.seconds`. `zen-model.js` → `groups(...)` summerar därefter dessa steg. Historikredigeringen i `zen.js` ändrar total tid utan att samtidigt reda ut stegfördelningen.

**Föreslagen lösning:**

1. Registrera aktivt genomförd tid per steg under sessionen, med stabil identitet även när samma övning förekommer flera gånger.
2. Skilj mellan planerad och faktisk tid samt status som genomförd, delvis genomförd och överhoppad.
3. Låt historik och muskelstatistik använda samma faktiska steguppgifter.
4. Bestäm uttryckligen hur förtimer, paus och eventuell bytestid räknas. Rekommendation: de ska inte räknas som aktiv stretchtid.
5. Låt en ändrad total i loggredigeringen antingen följas av korrigerad stegfördelning eller markeras som en total utan känd fördelning. Fördela inte automatiskt om tiden och kalla resultatet uppmätt.

**Bakåtkompatibilitet:** Äldre poster kan sakna faktisk stegtid. Bevara dem, men märk den gamla övningslistan som planerat upplägg när den inte kan styrkas som genomförd. Undvik att presentera gammal planerad tid som säker muskelstatistik. En eventuell historisk migrering behöver ett separat beslut.

**Godkänt när:** Ett avbrutet eller hoppat pass aldrig tillskriver ej genomförda steg faktisk tid. Summan av faktiska steg och eventuellt separat redovisad ofördelad tid motsvarar total aktiv tid inom definierad avrundning.

### F02 — Avsluta träning bör kunna spara ett delvis genomfört pass

**Prioritet:** P1. **Evidens:** Återskapat.

**Observation:** Efter ett genomfört set leder ”Avsluta” till ”Avsluta passläge utan att spara?”. Flödet erbjuder inte ett tydligt alternativ att spara den redan genomförda delen.

**Berörda delar:** `archive/exercise.html` → `stopSessionMode` och `saveSessionWorkout`; sessionssammanfattningen; `training-pulse-editor.js`; återställningsmodulerna för sessioner.

**Föreslagen lösning:** Visa en avslutsdialog med ”Spara genomfört”, ”Fortsätt passet” och ”Kasta passet”. Återanvänd den befintliga datavägen för sparande: `saveSessionWorkout` samlar redan in övningar med loggade set. Det måste först verifieras att alla anrop och kompletterande moduler klarar att den körs innan hela upplägget är färdigt.

**Detaljer att bestämma:** Vad händer med ett pågående, ännu inte bekräftat set? Rekommendation: visa det separat och fråga om det ska räknas; anta inte att planerade reps och vikt genomförts. Ingen loggpost ska skapas om inget faktiskt resultat finns utan ett uttryckligt alternativ för enbart tid.

**Godkänt när:** Ett pass med ett av fyra set kan sparas med exakt ett genomfört set. Dubbeltryck skapar inte dubbletter. Aktivt återställningsläge rensas först efter lyckat sparande. Avbrytande av dialogen återgår till samma session.

### F03 — Passnamn och träningskategori behöver skiljas åt

**Prioritet:** P1. **Evidens:** Återskapat och kodbekräftat.

**Observation:** Ett namngivet pass kunde visas som ”Bröst + Triceps” i planeringen men ”Övrigt” i loggen. Den nyare startcirkeln använder passnamn korrekt, men det löser inte sparandet och loggpresentationen.

**Kodväg:** `training-pulse-field.js` → `workoutType` prioriterar `type` före `name`. `archive/exercise.html` → `saveSessionWorkout` skapar en post med `type` men utan motsvarande separat passnamn i den granskade funktionen.

**Föreslagen lösning:** Bevara `name` och träningskategori separat genom plan → session → sparad logg → presentation. Inför en tydlig visningsfunktion för passnamn och behåll klassificering av träningsform separat. Ändra inte bara ordningen i `workoutType` utan att kontrollera alla anrop: funktionen används också där namnet kan påverka kategorisering och diagramgruppering.

**Äldre data:** Visa befintligt passnamn när det finns, annars befintlig typ. Skriv inte över gamla kategorier eller gruppera om historiska grafer utan kontroll.

**Godkänt när:** Samma namn syns i byggare, startvy, session, sammanfattning och logg. Styrka/kondition och diagramgruppering förblir korrekta. Namn med åäö, långt namn och generiskt namn fungerar.

### F04 — Egna Zen-mallar ska gå att välja i träningsplaneraren

**Prioritet:** P1. **Evidens:** Kodbekräftat; ett fullständigt skapa–planera–starta-flöde återstår att verifiera.

**Kodväg:** `zen.js` → `routines()` kombinerar inbyggda rutiner med egna i `ZenStore`. `training-zen-plans.js` → `routines()` och `session()` söker enbart i `ZenModel.routines`.

**Föreslagen lösning:** Skapa ett gemensamt sätt att läsa och slå upp både inbyggda och profilspecifika egna mallar. Låt planeraren invänta att rätt profils data är tillgängliga. Undvik att en ännu oladdad lista tolkas som att mallen raderats.

**Viktigt vid start:** `PulseZen.url` skickar rutin-ID:n och eventuell kö till Zen. Om en plan ska behålla en ögonblickskopia av sitt upplägg måste även startvägen faktiskt använda den kopian, inte enbart slå upp en senare ändrad mall med samma ID.

**Godkänt när:** En egen stretch- eller meditationsmall kan skapas, väljas i planeringen, öppnas och startas med rätt innehåll. Testa även mallbyte, namnbyte, borttagen mall, flera Zen-pass i följd och Markus/Maja var för sig.

### F05 — Nästa pass måste beräknas per pass, inte per dag

**Prioritet:** P1. **Evidens:** Kodbekräftad risk; inte fullständigt återskapad i UI.

**Kodväg:** `training-pulse-field.js` → `renderHero` hoppar över idag om `workoutsOn(date).length` är större än noll. Samtidigt finns stöd för `additionalSessions` i veckopresentationen. Kontrollera också `nextPlanned`, startknappar och markeringar för genomförda pass.

**Föreslagen lösning:** Identifiera vilket planerat pass en logg hör till och välj första återstående pass i rätt ordning. Använd stabilt plan-ID/session-ID, inte enbart samma namn eller datum. Fristående loggning bör inte automatiskt markera en valfri plan som genomförd.

**Äldre data:** För äldre loggar utan koppling måste beteendet vara försiktigt och dokumenterat. Ett gammalt pass bör inte matchas godtyckligt när det finns flera likadana planeringar.

**Godkänt när:** Med två planerade pass idag och ett genomfört visar startcirkeln det andra. Detta gäller även två pass med samma namn och blandade passkategorier. Veckomål och Zen-markeringar får inte dubbelräknas.

### F06 — Färgerna för styrka och kondition byter betydelse

**Prioritet:** P2. **Evidens:** Visuellt observerat och kodbekräftat.

| Vy i granskad version | Styrka | Kondition |
| --- | --- | --- |
| Veckoöversikt/aktivitetsmarkeringar | Rödrosa | Cyan |
| Medelpulsgraf | Cyan | Rödrosa |

**Berörda delar:** `training-pulse-field.js`, särskilt orbit-/aktivitetsrendering och pulsgrafens färgval; motsvarande CSS och eventuell sessionslegend.

**Föreslagen lösning:** Samla semantiska färger på ett ställe och använd dem i samtliga berörda vyer. Temafärgen för en sida och betydelsen av en datakategori behöver inte vara samma sak. Bekräfta önskad slutpalett före färgbyte; tidigare preferenser har varit blå styrka och orange kondition, medan nuvarande design använder andra accenter.

**Godkänt när:** Varje kategori har samma färgbetydelse i vecka, månad, orbit, puls och session där kategorifärg används. Pulsgrafen har en begriplig legend och kan läsas utan att enbart förlita sig på färg.

## 5. Träning: förenkling och presentation

### T01 — Gör mallvalet synligt i passbyggaren

**Prioritet:** P2. **Evidens:** Återskapat/designbedömning.

”Välj mallpass” ligger i en hopfälld inställningsdel tillsammans med exempelvis timers. Mallval är en primär uppgift och bör synas nära passnamnet. Behåll timer och mellanövningar under inställningar.

**Var:** `archive/exercise.html`, elementet `day-workout-template-select`, `training-pulse-classic-templates-v1.js` och `training-pulse-classic-builder-v1.css`. Kontrollera modulernas aktiva laddning via `auth-config.js`.

**Verifiera:** Tomt pass, befintlig plan, vald mall, ändrad mall och egen dagsspecifik ändring. Det ska vara tydligt om en ändring påverkar dagens kopia eller själva mallen. Namnändring ska uppdatera rätt dropdown utan att tangentbordsfokus tappas.

### T02 — Anpassa huvudknappen till användarens avsikt

**Prioritet:** P2. **Evidens:** Designbedömning från observerat flöde.

Nu konkurrerar ”Spara passupplägg”, ”Spara som mall”, ”Starta pass”, ”Logga pass” och andra val. Föreslagna benämningar:

| Avsikt | Tydlig handling |
| --- | --- |
| Planera en dag | Spara planering |
| Skapa återanvändbart upplägg | Spara som mall |
| Börja träna nu | Starta pass |
| Registrera något redan genomfört | Logga genomfört pass |

**Var:** Öppningskontext i `training-pulse-editor.js`; knappar och åtgärder i `archive/exercise.html`; byggarens CSS.

**Verifiera:** Samma byggare ska öppna rätt datum och sammanhang från startcirkel, veckodag, mallhantering och logg. En ändrad knapptext får inte dölja att åtgärden faktiskt också sparar en plan eller mall.

### T03 — Visa genomfört resultat först i sammanfattningen

**Prioritet:** P2. **Evidens:** Återskapat/designbedömning.

Efter styrketräning får puls och VO₂ stor tyngd. Visa i stället passnamn, tid, genomförda övningar/set och relevant volym först. Puls/VO₂ kan ligga i en kompakt valfri del. Konditionspass bör lyfta distans, tid och tempo när dessa uppgifter finns.

**Var:** Sessionssammanfattning i `archive/exercise.html` och aktiva kompletterande sessionsmoduler; `saveSessionWorkout` för sparandet.

**Verifiera:** Saknade mätvärden ska förbli saknade, inte bli noll. Sammanfattningen ska spegla faktiska set, blandade vikter, kroppsvikt och delvis genomförda pass.

### T04 — Tydligare grafnamn och historiksökning

**Prioritet:** P2 för namn, P3 för utökad sökning. **Evidens:** Designbedömning.

- ”Mått” innehåller medelpuls, löpning och VO₂. ”Puls & kondition” är mer beskrivande.
- ”Veckofält” kan förenklas till ”Planering” eller ”Veckoplan”. Undvik dubbla likalydande etiketter om ögonbrynsrubriken redan säger planering.
- Träningshistoriken behöver på sikt sökning efter pass/övning och datumfilter, utan att ersätta den befintliga tidslinjen.

**Var:** `exercise.html`, `training-pulse-field.js` → `renderInsight`, `renderLog`; `training-pulse-field.css`.

**Verifiera:** Noll träffar, många poster, långa övningsnamn, datumgränser och fortsatt redigering av rätt loggpost efter filtrering. Nuvarande ”Visa äldre pass” ska inte ge dubletter eller tappa filter.

## 6. Stretch: passval, övningar och efterregistrering

### S01 — Skilj på att titta på och välja ett pass

**Prioritet:** P2. **Evidens:** Kodbekräftat och observerat flöde.

`zen.js` → `passClick` ändrar `selected[kind]` även när en rad bara expanderas. En användare kan därmed ändra den stora startknappens pass genom att undersöka innehållet i biblioteket.

**Förslag:** Låt expandera enbart visa innehåll och ge ett tydligt ”Välj pass”, eller gör den kombinerade handlingen uttrycklig med en omedelbar ”Valt”-markering. Direktstart via play-knappen kan fortsatt både välja och starta.

**Var:** `passClick`, `passRow`, `renderLibrary`, `renderHome` i `zen.js`; bibliotekets struktur i `zen.html`.

**Verifiera:** Öppna och stäng tre pass utan start. Kontrollera att det valda passet bara ändras enligt beslutad interaktion och att valet bevaras vid återbesök.

### S02 — Lägg till tidsfilter i passbiblioteket

**Prioritet:** P2. **Evidens:** Förslag utifrån befintlig kategori- och sökfiltrering.

Små val som ”≤5 min”, ”6–10 min” och ”över 10 min” gör det lättare att välja utifrån tillgänglig tid. Beräkna längden från passets faktiska planerade innehåll, inte från namn som ”Kort”.

**Var:** `zen.js` → `renderLibrary`; `zen.html` → `library-dialog`; `zen.css`; använd samma tidsberäkning som `ZenModel.duration`.

**Verifiera:** Kombinerad textsökning, kategori, tidsfilter och egna mallar. Visa en tydlig återställning när kombinationen inte ger några träffar.

### S03 — Visuell förhandsvisning i övningsbyggaren

**Prioritet:** P2/P3. **Evidens:** Designförslag.

Textbeskrivningar och muskelinformation finns redan via `updatePoseDescription`. Det som saknas i det granskade valet är en tydlig visuell förhandsvisning. Visa en liten stillbild av den markerade övningen tillsammans med befintlig instruktion. Ladda inte animation för samtliga rader samtidigt.

**Var:** `zen.js` → `renderPoseOptions`, `updatePoseDescription`, `renderBuilder`; `zen-stretch-library.js`; återanvänd befintlig figur-/posevisning där det är möjligt.

**Verifiera:** Vänster/höger, automatiskt tillägg av båda sidor, samma övning flera gånger, sökning utan träff och tangentbordsnavigation. Förhandsvisningen får inte påverka pågående pass eller lagra något.

### S04 — Jämn kvalitet och korrekt rörelsevisning

**Prioritet:** P2 för korrekthet i vanliga pass; P3 för utökad täckning. **Evidens:** Kodbekräftad varierande täckning; slutlig 3D-kvalitet behöver verifieras.

`zen-session-scene.js` → `drawPose` använder den nya figuren när `silver.supports(stepId)` är sant och annars en reservvisning. Det är alltså inte belagt att övningar blir tomma; däremot varierar presentationen.

**Förslag:** Inventera vilka rörelser som används i de vanligaste färdiga passen och prioritera dem. Kontrollera att figurens sida, muskelområde och position motsvarar texten. Reservvisningen ska vara begriplig och avsiktligt utformad även när WebGL inte fungerar.

**Var:** `pulse-silver-stretch.js`, `zen-session-scene.js`, `zen-stretch-library.js`, `zen-session.css`.

**Verifiera på riktig enhet:** Mjuk övergång mellan poser, inget armhopp, korrekt vänster/höger, synligt grönt glow, bibehållen vit hudton, ingen kapning av huvud eller fötter. Kontrollera att stretchspecifik materialändring inte påverkar figuren i träning eller utforskaren.

### S05 — Valbar bytestid mellan positioner

**Prioritet:** P3. **Evidens:** Produktförslag, inte konstaterat fel.

Överväg 3–5 sekunders valbar bytestid, särskilt mellan stående och golvpositioner. Befintlig information om nästa övning finns redan; detta förslag avser separat tid att faktiskt byta position.

**Var:** Tidsmodell i `zen-model.js`, sessionsstyrning i `zen.js`, rendering i `zen-session-scene.js` och `zen-session.css`.

**Beroende:** F01 bör lösas först. Bytestid ska inte av misstag öka muskelstatistiken. Om funktionen införs behövs tydlig åtskillnad mellan aktiv stretchtid och total förväntad passlängd.

### S06 — Manuell loggning för stretch och meditation

**Prioritet:** P2/P3. **Evidens:** Ingen tydlig sådan väg hittades i granskad UI; förslag till komplettering.

Lägg till ”Logga genomfört pass” med datum, varaktighet, valfritt pass och anteckning. Det möjliggör registrering av pass genomförda utan appens timer.

**Var:** `zen.html`, `zen.js`, `zen-store.js` och validering/statistik i `zen-model.js`.

**Dataprincip:** Val av mall är inte bevis på att varje övning genomförts. Om användaren endast anger total tid, spara den som sådan. Låt eventuell övningsfördelning anges uttryckligen och märk den som manuellt registrerad.

**Verifiera:** Tidigare datum, midnatt, sommar-/vintertid, två pass samma dag, redigering och synk. Milstolpar och dagssviter ska använda vald aktivitetsdag på ett konsekvent sätt.

## 7. Meditation: enklare start och tydligare inställningar

### M01 — Tillfällig passlängd utan att skapa en mall

**Prioritet:** P2. **Evidens:** Observerat flöde och kodbekräftad autosparning.

Att ändra längd på ett färdigt pass kräver anpassning i byggaren. `builder-start` sparar ändrat innehåll som en egen rutin innan start. Ett tillfälligt val kan därför fylla biblioteket med mallar.

**Förslag:** Visa 5/10/15/20 minuter och egen tid före start. Skapa en sessionskopia för den här gången. ”Spara som egen mall” ska vara en separat, uttrycklig handling.

**Var:** `zen.html` → startområde och `meditation-minutes`; `zen.js` → `startSession`, `readBuilderForm`, `builderShape`, `builder-start`; validering i `zen-model.js`.

**Verifiera:** 7 minuter på en 10-minutersmall ger en 7-minuterssession men lämnar mallen och antalet mallar oförändrade. Avbruten start, återupptagning och ändring av en befintlig egen mall måste fungera utan tyst överskrivning.

### M02 — Förtydliga vad guidningen innehåller

**Prioritet:** P2. **Evidens:** Designbedömning.

”Guidad andning” kan tolkas som talad instruktion. ”Visuell andningsguide” eller ”Andningsrytm” beskriver nuvarande funktion tydligare där ett förtydligande behövs.

Visa förinställda rytmer först och flytta de fyra sifferfälten till ”Anpassa rytm”. Presentera faserna i faktisk ordning: andas in → håll → andas ut → håll. Undvik att en notation som 4/4/4/4 behöver tolkas utan fasnamn.

**Var:** `zen.html`, `zen.js` → `updateBreathingBuilder`, `readBreathing`, `openBuilder`; `zen-model.js` för validering och fasmodell.

**Verifiera:** Noll sekunders hålltid, olika in-/uttider, byte mellan egen andning och guide, paus mitt i en fas och återupptagning. Visuell instruktion och ljudsignal ska följa samma fas.

### M03 — Separera bakgrundsljud och signaler

**Prioritet:** P2. **Evidens:** Kodbekräftat gemensamt ljudvillkor.

En gemensam ljudflagga styr både bakgrundsljud och signaler. Det gör det svårt att exempelvis ha regn utan andningssignaler.

**Förslag:** Separata val för bakgrund och signaler. Börja med separata på/av-val; separata nivåer kan läggas till om de behövs. Befintligt ljudläge bör migreras förutsägbart.

**Var:** `zen.html` → `session-audio`; `zen.js` → `savePrefs`, `updateSound`, `updateAmbient`, `updateBreathAudio`, `updateIntervalBell`, `setDingVolume`.

**Verifiera:** Endast bakgrund, endast signaler, båda, helt tyst, volym noll, paus och avslut. Kontrollera att gamla ljudnoder stoppas och att ljud inte dubbleras efter upprepade sessioner. Prova Bluetooth och telefonens ljudinställningar på riktig enhet.

### M04 — Definiera beteendet vid skärmlås och appbyte

**Prioritet:** P2. **Evidens:** Kodbekräftat beteende; praktiskt mobilutfall behöver verifieras.

Koden stoppar eller undertrycker ljud när dokumentet är dolt, medan tidsmodellen kan fortsätta. Användaren kan därmed förlora guide eller slutsignal utan att passet pausas.

**Förslag:** Bestäm per sessionstyp om passet ska pausas vid dold sida eller fortsätta med tydligt definierade begränsningar. Lova inte bakgrundsljud som webbläsaren inte kan garantera. Behåll och verifiera befintlig Wake Lock där den stöds.

**Var:** `zen.js` → `visibilitychange`, `pagehide`, `tick`, `updateWakeLock` och ljudfunktioner; `zen-model.js` → tidsankare och paus/återupptagning.

**Verifiera:** Lås i början, mitt i och nära slutet av passet. Återvänd efter både kort och lång tid. Kontrollera korrekt återstående tid, en enda slutsignal, inga negativa tider och inga sekvenser av försenade signaler som spelas upp samtidigt.

### M05 — Bevara sessionens andningsinställningar i historiken

**Prioritet:** P2. **Evidens:** Kodbekräftad begränsning i den sparade posten.

Sparad meditation innehåller inte en fullständig ögonblickskopia av guidningsläge och andningsrytm. Historiken kan därför inte säkert återskapa samma session efter att mallen ändrats.

**Förslag:** Spara varaktighet, guidningsläge och rytm som de faktiskt användes. Om användaren växlar guide under passet: bestäm om historiken ska redovisa växlingen eller bara kunna återanvända den ursprungliga inställningen. Det får inte bli ett otydligt påstående om hela passet.

**Var:** `zen.js` → `complete`, `saveComplete`, historikrendering; `zen-store.js`; validering i `zen-model.js`.

**Verifiera:** Ändra eller radera mallen efteråt och öppna det gamla passet. En framtida ”Gör samma pass igen” ska använda historikens kopia, inte den nuvarande mallen.

### M06 — Mer neutral återkoppling efter passet

**Prioritet:** P3. **Evidens:** Designbedömning.

Nuvarande val är ”Lite lättare”, ”Lugnare” och ”Mer närvarande”. Komplettera med exempelvis ”Som innan” och ”Svårt att fokusera”. Återkoppling ska fortsatt vara valfri.

**Var:** `zen.html` → sammanfattningens `data-feeling`; `zen.js` och eventuell validering/presentation av `feeling` i `zen-model.js`.

**Verifiera:** Gamla känslovärden visas oförändrat. Att inte välja något går att spara. Ny text får inte göra knappraden för bred på 320 px.

## 8. Gemensam design, navigation och tillgänglighet

| ID | Prioritet | Förslag | Var och hur det bör verifieras |
| --- | --- | --- | --- |
| D01 | P2 | Visa aktuell person diskret även på Stretch och Meditation. | `zen.html`, profilhantering i `zen.js`/`zen-store.js`, `training-zen-nav.js`. Kontrollera rätt profil vid direktlänk, omladdning och områdesbyte. Visuell otydlighet är inte i sig bevis på blandad data. |
| D02 | P2 | Samordna menyernas betydelse. Träning har global navigation, Zen har främst inställningar/data. | `exercise.html`, `zen.html`, respektive menylogik och nav-filer. Använd gemensamt menyinnehåll eller tydligt olika symboler för navigation och inställningar. |
| D03 | P2 | Förstärk meditationens starttext mot den ljusa bakgrunden. | `zen.css`, startcirkel och underrubrik. Mät kontrast i de svagaste delarna av den faktiska bakgrunden; ingen formell kontrastmätning gjordes i granskningen. |
| D04 | P2 | Öka läsbarheten för viktig liten text och sessionsinstruktioner. | `zen-session.css`, `zen.css`, `training-pulse-field.css`. Testa textförstoring, avstånd från telefonen och längre svenska ord. Behåll korta texter i stället för fler grå hjälpstycken. |
| D05 | P2 | Skilj statistik för vald period från totalsiffror. | `zen.js` → `renderHome`; `zen.html`/`zen.css`. Vecka/Månad/År ska ha tydligt visuellt tillämpningsområde och totalsiffrorna märkas konsekvent. |
| D06 | P2 | Namnge ett pågående pass i återupptagningsrutan. | `zen.html` → `resume-banner`; `zen.js` och `ZenStore.active`. Observerat: en pausad meditation gav generisk ruta på Stretch. Visa typ, namn och återstående tid samt tydligt vad ”Fortsätt” öppnar. |
| D07 | P3 | Behåll uttrycksfull startvy men gör snabb vardagsanvändning effektiv. | `training-pulse-field.css` och kompaktläget. Mät antal steg till dagens pass innan ytterligare krympning av hero. Nuvarande design är redan mer kompakt än tidigare. |
| D08 | P2 | Säkerställ konsekvent popup- och fokusbeteende. | Aktiv gemensam rörelse-/dialogimplementation samt `training-pulse-editor.js` och Zen-dialogernas anrop. Föreslaget test, inget nytt konstaterat fel: öppna från knapp, stäng tillbaka till rätt ursprung, lås bakgrundsskroll och återställ fokus. |

Visuell riktning att bevara: olika miljöer för de tre områdena, glow, kompakta kontroller och låg mängd hjälpt text. En gemensam struktur behöver inte innebära att alla sidor får samma bakgrund eller färg.

## 9. Prestanda och teknisk hållbarhet

### P01 — Mät synkroniseringens arbete per sida

**Prioritet:** P3, eller högre om mätning visar tydlig påverkan. **Evidens:** Kodbekräftad återkommande aktivitet, ej uppmätt prestandaproblem.

`firebase-sync.js` har realtidslyssnare samt reservpollning av fjärrdata var tredje sekund och lokala data varje sekund. `SYNC_KEYS` omfattar även andra delar av hemsidan och båda träningsprofilerna.

**Undersök innan ändring:**

- Hur många anrop och hur mycket data orsakar en minuts inaktiv träningssida?
- Startas samma arbete också i den inbäddade runtime-vyn? Detta är en kontrollpunkt, inte bekräftad dubblering.
- Fortsätter onödigt arbete när fliken är dold eller arbetsfönstret är stängt?
- Leder synkuppdateringar till omrendering trots att innehållet är oförändrat?

**Möjlig lösning efter mätning:** Begränsa prenumerationer till relevanta data och aktiv profil, samordna synk mellan huvudvy och iframe samt gör reservpollning beroende av faktiskt behov. Bevara funktionen för iOS där WebSocket eller lagringsövervakning kan fallera; avlägsna inte reservvägen utan verifiering.

### P02 — Mät animationer separat från timer och datalogik

Förtimern och progressrenderingen i `zen-session-scene.js` använder redan en renderloop, medan tyngre figurarbete begränsas. Det är en bra grund. Modellens tickintervall ska inte förväxlas med skärmens faktiska uppdateringsfrekvens.

**Mät:** Bildtider och långa avbrott under förtimer, stretching, grafscroll och dialogöppning; antal aktiva renderloopar; WebGL-kontexter; minnesutveckling efter upprepade öppna/stäng-cykler.

**Önskat resultat:** Jämn rörelse för timern, korrekt tid även vid tappade bildrutor, inget märkbart hopp vid återupptagning och ingen fortsatt tung rendering när vyn är stängd. Fastställ en realistisk bildfrekvensbudget efter mätning på måltelefonen i stället för att lova en siffra från desktop.

### P03 — Ändra källan till beteendet och minska överlapp

Flera aktiva moduler och stilregler påverkar samma äldre runtime. Vid varje förändring bör det finnas en tydlig ägare av beteendet. Undvik att lägga en ny korrigerande modul ovanpå en felaktig sparfunktion eller flera konkurrerande timer-/CSS-regler.

Refaktorera inom den aktuella ändringens omfattning. En generell omskrivning av hela webbplatsen är inte motiverad av denna granskning.

## 10. Föreslagen fortsatt verifiering

Detta är en testplan för framtida arbete. Den innebär inte att testerna körts eller att implementation är beställd.

### 10.1 Miljöer

| Miljö | Syfte |
| --- | --- |
| Riktig iPhone, Safari, stående och liggande | Tangentbord, fokuszoom, touch, safe areas, Dynamic Island, ljud, Wake Lock, skärmlås och prestanda. |
| WebKit med 390×844 samt 320 px bredd | Reproducerbara layoutkontroller för viktiga vyer. Ersätter inte fysisk telefon. |
| macOS Safari | Grafglow, scroll, större layout och popup-animationer. |
| Android Chrome | Mobil jämförelse, ljud och återupptagning; delade komponenters påverkan där de används. |
| Desktop Chromium cirka 1280 px och större | Översikt, dialogstorlek, figurplacering och tangentbordsanvändning. |
| Två inloggade enheter med kontrollerad testdata | Riktig synk, offline/online, konflikter och profilavgränsning. |

### 10.2 Funktionella testfall

| ID | Scenario | Förväntat resultat |
| --- | --- | --- |
| V01 | Kör en stretchövning helt, nästa delvis, avsluta. | Endast faktisk tid sparas för respektive steg; total och statistik hänger ihop. |
| V02 | Hoppa över steg och återvänd till en tidigare övning. | Ingen planerad tid tilldelas hoppade steg; upprepade besök hanteras enligt definierad modell. |
| V03 | Pausa stretch under både förtimer och aktiv övning. | Paus/förtimer räknas inte som aktiv övningstid; ingen extra timer skapas. |
| V04 | Redigera total tid på en stretchlogg. | Stegfördelningen förblir sanningsenlig eller märks som okänd/manuellt ändrad. |
| V05 | Öppna en äldre stretchpost utan nya tidsfält. | Ingen dataskada eller krasch; osäker fördelning presenteras ärligt. |
| V06 | Avsluta träning efter ett av flera set. | Spara genomfört fungerar och räknar bara verkliga set. |
| V07 | Avsluta utan set och dubbeltryck Spara. | Tydligt tomtillstånd och högst en post; aktivt pass försvinner inte vid misslyckad lagring. |
| V08 | Planera, genomför och redigera ett namngivet pass. | Passnamn och träningskategori bevaras som separata uppgifter. |
| V09 | Planera två pass idag, genomför ett. | Nästa-pass-visningen pekar på det kvarvarande passet. |
| V10 | Logga ett oplanerat pass när två planerade finns. | Ingen godtycklig plan markeras som klar. |
| V11 | Skapa egen Zen-mall, planera och starta från träning. | Rätt profil, rutin, ordning och längd används i hela kedjan. |
| V12 | Ändra eller radera mallen efter planering. | Planens innehåll följer uttryckligen vald kopieringspolicy; historik ändras inte. |
| V13 | Starta meditation med tillfälligt ändrad längd. | Sessionen får rätt längd; ingen mall skapas eller ändras utan uttryckligt val. |
| V14 | Ändra andningsrytm och slå av/på guide. | Text, figur och ljud följer samma tidsmodell; sparade inställningar är begripliga. |
| V15 | Kör bakgrundsljud och signaler i samtliga kombinationer. | Valen är oberoende och inga ljud fortsätter efter avslut. |
| V16 | Lås skärmen/appväxla och återvänd nära eller efter slut. | Definierat paus-/fortsättningsbeteende; korrekt tid och högst en slutsignal. |
| V17 | Logga manuellt på tidigare datum och över midnatt. | Historik, diagram, sviter och veckomål använder rätt aktivitetsdag. |
| V18 | Byt mellan Markus och Maja och öppna direkta länkar. | Rätt profil visas och inga mallar, loggar eller val läcker mellan profiler. |
| V19 | Registrera kroppsvikt på Markus och öppna Maja. | Markusfunktionen och volym/PR-regler bevaras; kroppsviktsfunktionen introduceras inte på Maja. |
| V20 | Kör befintliga styrke-, konditions- och blandade pass. | PR, volym per övning, total volym, löpning och puls fungerar fortsatt. |
| V21 | Filtrera en stor träningslogg och redigera en träff. | Rätt post redigeras, inga dubbletter och filter behålls förutsägbart. |
| V22 | Växla planering mellan vecka och månad. | Vald dag, extra pass och Zen-indikatorer motsvarar samma data. |

### 10.3 Layout och användbarhet

- Kontrollera startvy, byggare, bibliotek, session, ljudpanel, sammanfattning och historik i relevanta bredder.
- Leta efter horisontell skroll, kapad text, kontroller under safe areas och dialoger som kräver onödig dubbel scroll.
- Fokusera varje numeriskt fält med riktigt mobiltangentbord. Kontrollera att värdet och Spara/Starta fortfarande nås. Kontrollera 16 px textstorlek där iOS fokuszoom är en risk.
- Kontrollera touchytor, särskilt små pennor, kryss, play-knappar och grafpunkter. Mät faktiska klickytor, inte bara ikonernas storlek.
- Använd textförstoring och tangentbord. Läsordning, fokusmarkering, dialogfokus och fokusåterställning ska fungera.
- Testa reducerad rörelse. Information om tid och nästa steg måste fortfarande uppdateras korrekt.
- Öppna och stäng varje relevant popup flera gånger. Kontrollera morphanimationen från ursprungsknappen, utan kvarhängande miniatyr eller låst bakgrundsskroll.
- Be en användare utan instruktion utföra: välj mall, skapa eget pass, starta, spara delvis, hitta loggen och ändra tiden. Notera felval och tvekan, inte bara om uppgiften till slut går att lösa.

### 10.4 Figur och timer

- Jämför stretchens femsekunders förtimer med träningslägets befintliga raka glödlinje och gradient. Återanvänd beteende och uttryck; skapa inte en tredje timerstil.
- Kontrollera en enda synlig förtimer på mobil och rätt storlek på desktop.
- Granska figurens stilläge, rörelsefas och övergång till nästa pose. Ta särskilt med armsträckningar och vänster/höger-varianter.
- Kontrollera både WebGL-visning och reservvisning. Ett saknat grafikstöd ska inte göra passet oanvändbart.
- Kontrollera figurens material i träning/utforskare efter ändring i delad kod. Stretchens vita hudton och gröna glow ska vara avgränsade till stretch.

### 10.5 Synk, offline och återställning

1. Skapa en tydligt märkt testmall på desktop och kontrollera den på telefon.
2. Planera den på en dag och verifiera samma upplägg på båda enheterna.
3. Genomför och spara ett delpass. Kontrollera att exakt en post och samma stegfördelning visas på båda.
4. Testa nätverksavbrott före respektive under sparande. Gränssnittet ska skilja lokal lagring från bekräftad synk om dessa tillstånd skiljer sig.
5. Redigera samma testpost på två enheter. Dokumentera faktisk konfliktpolicy; anta inte att konfliktlösning redan är tillräcklig.
6. Ladda om under aktivt pass och under paus. Kontrollera återställningsmodulerna och att passet inte loggas dubbelt.
7. Testa start i en flik och återupptagning i en annan. Definiera vad som ska ske med två aktiva sessioner innan detta betraktas som godkänt.

Använd avgränsad testdata/testprofil för synkprov. Dessa tester kräver verklig anslutning och ingår inte i resultaten från den isolerade granskningen.

### 10.6 Prestandamätning med jämförbara scenarier

| Scenario | Mät och dokumentera |
| --- | --- |
| Kall öppning av träning | Tid tills första meningsfulla innehåll och första användbara startkontroll; laddade resurser. |
| Öppna byggaren första och andra gången | Väntetid, iframe-laddning, antal extra resurser och kvarvarande renderarbete efter stängning. |
| Scrolla över samtliga grafer | Långa huvudtrådsavbrott, bildtider och om osynliga grafer fortsätter arbeta. |
| Kör stretch i 10 minuter | Timerstabilitet, bildtidsvariation, temperatur/batteri som jämförande observation och minnesutveckling. |
| Kör meditation med ljud i 10 minuter | Ljudavbrott, återupptagning, timerkorrekthet och arbete i bakgrunden. |
| Lämna startsidan inaktiv | Synkanrop per minut, datamängd och CPU-aktivitet. |
| Öppna/stäng session eller builder upprepade gånger | Kvarvarande timers, eventlyssnare, ljudnoder och grafikresurser. |

Spara enhet, webbläsarversion, innehållsmängd, nätverk och scenario med varje resultat. Jämför före/efter under samma förutsättningar. Hitta den faktiska flaskhalsen innan animationer eller reservsynk tas bort.

### 10.7 Befintliga tester att inspektera före utökning

Följande filer finns i den granskade koden. Deras existens betyder inte att de körts, godkänts eller täcker alla fall ovan:

- `budget/tests/zen.test.cjs`
- `budget/tests/zen-session.test.cjs`
- `budget/tests/zen-session-browser.cjs`
- `budget/tests/zen-meditation-builder-browser.cjs`
- `budget/tests/zen-stretch-library.test.cjs`
- `budget/tests/zen-stretch-ivory-desktop.test.cjs`
- `budget/tests/training-zen-plans-browser.cjs`
- `budget/tests/training-multipass-zen-rhythm.test.cjs`
- `budget/tests/pulse-field-interactions.cjs`
- `budget/tests/surface-motion-browser.cjs`

Utöka i första hand relevanta befintliga tester med verkliga felvillkor. För tidsmodell, delpass och matchning av plan/logg är rena deterministiska tester värdefulla. För layout ska geometriska kontroller kombineras med visuell granskning. Körning ska följa repositoryts aktuella instruktioner och den beställda uppgiftens omfattning.

## 11. Föreslagen arbetsordning vid en framtida implementation

| Etapp | Innehåll | Viktigaste risk att hantera |
| --- | --- | --- |
| A — Korrekt loggdata | F01 och datakontrakt för F03/M05. | Äldre poster, faktisk kontra planerad tid och schema som båda profilerna kan läsa. |
| B — Säkert avslut och planering | F02, F03, F05. | Dubbelloggning, tappad aktiv session och felaktig matchning mellan plan och logg. |
| C — Gemensamt passbibliotek | F04, T01, S01, S02. | Profilladdning, mallkopior och start av tidigare planerat innehåll. |
| D — Snabbare vardagsflöden | T02, T03, M01–M03, D01–D06. | Oväntat autosparande och förändrat beteende bakom bekanta knappar. |
| E — Verifierad kvalitet | Figur/timer, M04, synk- och prestandamätning, valda P3-förslag. | Plattformsspecifika begränsningar och regressioner i delade komponenter. |

Detta är en möjlig uppdelning av arbetet, inte ett krav på separata publiceringar. Samla sammanhängande ändringar och undvik att lämna frontend och lagrade datastrukturer i oförenliga mellanlägen.

### Kontrollista före kodändring

- [ ] Läs aktuellt `AGENTS.md` och hämta senaste relevanta kod.
- [ ] Jämför med dokumentets baslinje och markera redan lösta punkter.
- [ ] Kontrollera vilka moduler som faktiskt laddas i huvudvy och inbäddad runtime.
- [ ] Bestäm datakontrakt för tid, namn, plan-ID och historiska ögonblickskopior.
- [ ] Bestäm läsbeteende för äldre poster innan nya fält börjar skrivas.
- [ ] Avgränsa Markus/Maja och kontrollera påverkan på delade Ingemar-komponenter.
- [ ] Välj relevanta acceptansfall och dokumentera eventuell kvarvarande osäkerhet.

### Klart när

- [ ] Berörda funktionella acceptansvillkor är uppfyllda.
- [ ] Äldre loggar och mallar kan fortfarande läsas utan förlust eller påhittad detaljdata.
- [ ] Rätt profil följer med genom navigation, planering, session och sparande.
- [ ] Berörda mobil- och desktopvyer är visuellt kontrollerade.
- [ ] Enhetsberoende beteenden som ljud, skärmlås och synk är verifierade där de ändrats.
- [ ] Eventuella förbättringar av prestanda har mätunderlag; kvarstående begränsningar är angivna.
- [ ] Ändringar i delade komponenter har inte ändrat oavsiktliga sidor eller funktioner.

## 12. Källankare för granskad version

Länkarna är låsta till granskningsversionen så att underlaget går att förstå även efter senare ändringar:

- [Träningssidans rendering och diagram](https://github.com/strickertmarkus/strickertmarkus.github.io/blob/093d8b78f2cf681b34cae5df8f7c477326cbabb0/budget/training-pulse-field.js)
- [Inbäddad byggare och träningsruntime](https://github.com/strickertmarkus/strickertmarkus.github.io/blob/093d8b78f2cf681b34cae5df8f7c477326cbabb0/budget/archive/exercise.html)
- [Zen-flöden och sparande](https://github.com/strickertmarkus/strickertmarkus.github.io/blob/093d8b78f2cf681b34cae5df8f7c477326cbabb0/budget/zen.js)
- [Zen-tidsmodell och statistik](https://github.com/strickertmarkus/strickertmarkus.github.io/blob/093d8b78f2cf681b34cae5df8f7c477326cbabb0/budget/zen-model.js)
- [Zen-integration i träningsplaneraren](https://github.com/strickertmarkus/strickertmarkus.github.io/blob/093d8b78f2cf681b34cae5df8f7c477326cbabb0/budget/training-zen-plans.js)
- [Stretchens sessionsrendering](https://github.com/strickertmarkus/strickertmarkus.github.io/blob/093d8b78f2cf681b34cae5df8f7c477326cbabb0/budget/zen-session-scene.js)
- [Gemensam Firebase-synk](https://github.com/strickertmarkus/strickertmarkus.github.io/blob/093d8b78f2cf681b34cae5df8f7c477326cbabb0/budget/firebase-sync.js)

**Dokumentets roll:** Ett underlag att välja och genomföra förbättringar från. Öppna förslag, testfall och designbedömningar ska inte tolkas som redan implementerade eller verifierade funktioner.
