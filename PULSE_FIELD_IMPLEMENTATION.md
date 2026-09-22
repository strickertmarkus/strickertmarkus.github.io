# Pulse Field – implementerings- och överlämningsplan

Senast uppdaterad: 2026-09-22  
Arbetsgren: `work/pulse-field-fresh-20260922`  
Planerad jämförelseadress: `/budget/training-pulse-field.html`

## Syfte

Pulse Field är en helt fristående alternativ vy för träningssidan. Den befintliga
`budget/exercise.html` ska fortsätta fungera och ligga kvar oförändrad som
jämförelse. Den nya sidan delar träningsdata med originalet, men återanvänder inte
dess layout, komponentstruktur eller diagramkod.

Målet är att Träning ska kännas byggd samtidigt som Stretch och Meditation:

- samma lugna mörker, djup, glow och redaktionella typografi;
- en egen fysisk identitet för träning: puls, bana, riktning och kraft;
- tätare informationshierarki utan stora generiska paneler;
- tydlig skillnad mellan överblick, graf, tabell, logg och rekord;
- samma interaktionsmönster överallt där användaren väljer vecka.

## Status vid denna checkpoint

Följande nya filer finns och är medvetet frikopplade från den gamla sidans UI:

- `budget/training-pulse-field.html` – ny semantisk sidstruktur.
- `budget/training-pulse-field.css` – nytt formspråk och responsiv layout.
- `budget/training-pulse-field.js` – egen rendering från befintlig träningsdata.

JavaScript-filen klarar `node --check`. Sidan är ännu inte visuellt verifierad i
riktig mobilbrowser och ska därför betraktas som en genomarbetad första byggversion,
inte som publiceringsklar.

Det som redan är byggt:

1. En rikare hero med ett “signalfält”, pulsnoder och en startcirkel med lysande
   tränings-/EKG-symbol.
2. En ny veckoplanerare (“Veckofält”) som visualiserar veckan som en rörelsebana i
   stället för en vanlig kalenderpanel.
3. Enhetliga vecka-föregående/vecka-nästa-kontroller som drivs av samma state.
4. Veckoaktivitet med **Historik som standardläge** och växling mellan minuter och
   pass.
5. Insiktsdelen “Kroppens svar”, med separata lägen för **Graf** och **Tabell** så
   de aldrig kan renderas ovanpå eller i stället för varandra.
6. Egen SVG-rendering för medelpuls, distans och VO₂ utan beroende av gamla
   diagramkomponenter.
7. En ny tidslinjebaserad träningslogg med kompakt sammanfattning och en egen
   expanderad detaljvy.
8. En ny rekordpresentation med podium för de främsta rekorden och kompakta
   muskelgrupper under.
9. Ett demodata-läge via `?demo=1` för visuell kontroll utan att påverka riktiga
   data.

## Designprincipen

### 1. Mörker är duken, inte kortfärgen

Bakgrunden ska bära nästan allt. Sektioner separeras med rytm, tunna linjer,
typografi och ljusfält – inte med många stora rektangulära kort. Ytor används bara
när de förklarar ett tillstånd, exempelvis en öppnad loggpost.

### 2. Coral visar handling, cyan visar mätning

- Coral/varm rosa: start, vald dag, aktuell puls, aktiv kontroll och rekord.
- Cyan: sekundär mätdata, tid, intervall, kondition och jämförelseserier.
- Varmvit: rubriker och primär läsning.
- Dämpad blågrå: metadata och inaktiva kontroller.

Plommon används endast som ett mycket mörkt djup bakom glow. Det får inte dyka upp
som slumpmässiga knappar eller paneler.

### 3. Träning uttrycks som rörelse

Stretch har mjuk expansion och Meditation har stillhet. Träning får i stället:

- signalbanor och riktade kurvor;
- pulspunkter och koncentriska start-ringar;
- staplar som tänds snarare än staplar som ser ut som ett vanligt dashboard;
- en tidslinje i loggen;
- rekord som höjdpunkter, inte som en tung datatabell.

### 4. En kontroll betyder samma sak överallt

Veckoval ska alltid använda samma tre delar: vänsterpil, centrerad vecka/datum och
högerpil. Aktivitetens vyval, enhetsval och graf/tabell är kapselkontroller med
samma höjd och vald-markering. Ingen annan komponent får introducera en egen
variant av samma val.

## Teknisk arkitektur

### Delade data

Den nya sidan läser samma localStorage-nycklar som originalsidan:

- `ex_wk`
- `ex_goals`
- `ex_templates`
- `ex_weekTemplates`
- `ex_plannedSessions`
- `ex_prs`
- `ex_plan`
- `ex_vo2`

Ingen datamigrering ska göras. Pulse Field ska vara en alternativ presentation av
samma källa. Ändringar av schema hör hemma i originalsidan och måste då hanteras
explicit i båda vyerna.

### Profil och Firebase

`budget/firebase-sync.js` identifierar i nuläget endast exakt `/exercise.html` som
träningssida. Innan publicering ska matchningen utökas till både:

- `/exercise.html`
- `/training-pulse-field.html`

Det krävs för att Markus/Maja-scoping och Firebase-synk ska använda rätt nycklar.
`auth-gate.js` ska inte ladda originalsidan som bundle på Pulse Field; den generiska
auth-gaten kan däremot fortsätta skydda sidan.

### Oberoende UI-kod

`training-pulse-field.js` ska inte importera eller anropa gamla renderfunktioner.
Undantaget är länkar till originalsidan för befintliga redigeringsflöden tills de
eventuellt byggs om separat. Detta håller jämförelsen ärlig och förhindrar att
legacy-CSS återkommer.

## Exakt kvarvarande implementering

Gör punkterna i denna ordning.

### Steg 1 – slutför datakopplingen

1. Ändra `isExercisePage` i `budget/firebase-sync.js` så båda HTML-filerna känns
   igen.
2. Lägg en diskret Markus/Maja-växlare i Pulse Field-menyn och bevara `?user=maja`
   i alla interna länkar.
3. Lägg en tydlig “Pulse Field · ny vy”-länk i originalsidan via
   `budget/exercise-motion-v1.js`; ändra inget annat i originalets layout.
4. Verifiera att ett byte av profil återrenderar alla sektioner och inte blandar
   Markus och Majas localStorage-data.

### Steg 2 – visuell första render

Rendera följande bredder med `?demo=1`:

- 390 × minst 844 px (primär iPhone-kontroll),
- 768 px,
- 1440 px.

Kontrollera särskilt:

- ingen horisontell overflow;
- hero-cirkeln ligger på samma visuella höjd/axel som motsvarande motiv på Zen-
  sidorna;
- träningssymbolen är centrerad och läsbar även utan glow;
- veckofältets bana korsar inte dagstexter;
- loggens tidslinje och rekordpodiet har en tydlig rytm på små skärmar;
- ingen sticky browser- eller sidkontroll täcker innehåll längst ned.

Ta skärmbilder och justera CSS utifrån faktisk rendering, inte enbart kodläsning.

### Steg 3 – diagramens precision

1. Verifiera att **Historik** är markerad efter första laddning.
2. Säkerställ att minut/pass-valet aldrig byter vy till “Vecka”.
3. I medelpulsgrafen ska varje värdelabel förankras vid sin punkt och klampas mot
   SVG-ytans fyra kanter. Etiketter nära varandra ska växla ovanför/under linjen.
4. Vid saknad datapunkt ska linjen brytas, inte dras genom ett påhittat nollvärde.
5. Graf och tabell ska vara två separata DOM-containrar; endast en får ha
   `hidden=false`.
6. Tabellen ska ha samma dataset och sortering som grafen, men aldrig innehålla
   SVG eller canvas.

### Steg 4 – träningsloggen

Loggen ska förbli en tidslinje, inte bli ett stort legacy-kort.

Stängd post visar:

- datum i vänster räls;
- passnamn och typ;
- två relevanta mått (exempelvis volym + tid eller puls + distans);
- en liten expandera-indikator.

Öppnad post visar:

- samma header kvar på plats;
- en horisontell pulsremsa för min/medel/max;
- övningar som kompakta rader med namn, resultat och tid;
- sekundär metadata sist;
- ingen stor stängknapp inuti rutan och ingen dubbel rubrik.

Första posten får vara öppen i demovyn för att designen ska kunna bedömas direkt.
I riktigt läge ska ingen eller senast valda post vara öppen enligt användarstate.

### Steg 5 – personliga rekord

1. Podiet visar högst tre relevanta rekord och ska fungera även med 0–2 rekord.
2. Ett långt övningsnamn får brytas på högst två rader utan att vikten flyttar sig.
3. Undergrupperna använder sans serif för data och serif endast för sektionens
   redaktionella rubrik.
4. Muskelgrupp, antal och maxvärde ska ha en stabil kolumnrytm på mobil.
5. Expandering ska ske inline; undvik chevrons på varje rekordrad om raden inte
   faktiskt kan öppnas.

### Steg 6 – interaktioner och tillgänglighet

1. Alla knappar måste nås med tangentbord och ha synlig `:focus-visible`.
2. Aktiv flik ska exponera `aria-selected` eller `aria-pressed` beroende på
   kontrolltyp.
3. Expanderade loggposter ska använda `aria-expanded` och ett stabilt panel-id.
4. `prefers-reduced-motion` ska stänga av pulserande glow och längre övergångar,
   men inte ta bort viktiga tillstånd.
5. Färg ska aldrig vara enda markören för valt läge.

### Steg 7 – avgränsad verifiering

Undvik att lägga tid på hela legacy-testsviten. Kör en fokuserad kontroll:

- `node --check budget/training-pulse-field.js`
- `git diff --check`
- öppna sidan med demodata och fånga `pageerror`/console errors;
- klicka Historik, Minuter/Pass, Graf/Tabell och minst en loggpost;
- kontrollera profilväxling och att båda vyerna läser samma data;
- kontrollera mobil och desktop visuellt.

### Steg 8 – publicering

1. Hämta senaste `main` och kontrollera eventuella samtidiga ändringar.
2. Integrera arbetsgrenen utan att skriva över orelaterade ändringar.
3. Publicera GitHub Pages.
4. Öppna den publicerade jämförelseadressen och verifiera HTTP 200 samt en riktig
   render, inte bara att filen finns.
5. Lämna båda länkarna till användaren:
   - original: `/budget/exercise.html`
   - Pulse Field: `/budget/training-pulse-field.html`

## Beslut som inte ska tas tyst

Fråga användaren om någon av dessa punkter blir aktuell:

1. Ska startcirkeln öppna originalsidan eller ska hela passläget byggas om i Pulse
   Field? Nuvarande plan länkar till det befintliga passläget.
2. Ska den nya sidan bli permanent standard efter jämförelsen? Byt inte standard
   utan uttryckligt godkännande.
3. Ska redigering av veckoplan och mål fortsätta ske i originalet eller få ett nytt
   gränssnitt? Nuvarande plan återanvänder originalets funktioner via länkar.
4. Ska Maja ha exakt samma visuella accent eller en separat men besläktad accent?

## Definition av färdig

Pulse Field är färdig först när:

- originalsidan fortfarande fungerar och kan jämföras sida vid sida;
- alla sektioner visar riktig användardata och rätt profil;
- veckoval är konsekvent i både utseende och state;
- Historik är aktivitetens standardvy;
- graf och tabell aldrig kan sammanblandas;
- medelpulsens etiketter sitter korrekt vid alla kantfall;
- stängd och öppnad träningslogg känns som samma genomtänkta komponent;
- rekorddelen har en tydlig egen karaktär utan att bryta Zen-familjen;
- mobilskärmbilden upplevs lika rik och balanserad som Stretch och Meditation;
- den publicerade sidan har verifierats efter deploy.

