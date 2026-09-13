# Träningsmode: tre cleanup-checkpoints

Datum: 2026-09-13. Fokus är befintligt träningsmode, utan visuell omdesign.

## Checklista och återgång

- [x] Checkpoint 1 — `checkpoint/training-cleanup-1-dead-code`, commit `f5702b14b997a4ad42f24c0c5e6ee59dd78bf9b6`.
  Borttagen orefererad v129-fil, inaktiv Three.js-scen, två duplicerade stylesheet-taggar och en firebase-sync-lyssnare på fel eventmål. 246 rader borttagna.
- [x] Checkpoint 2 — `checkpoint/training-cleanup-2-heart-rate`, commit `37f8fcf2e028a72de39234439563d42fa4870aa8`.
  Den vanliga träningssidan skapar slutlig pulsdiagrammarkup direkt. `exercise-heart-rate-range.js` äger diagrammet; tidigare två Chart-konstruktorer är borttagna. Schemaläggaren och senaste-pass-kortet i points-8-9 behålls. Uppdateringar från storage, firebase-sync och återupptagen rendering går till den kvarvarande renderaren.
- [x] Checkpoint 3 — `checkpoint/training-cleanup-3-timers`.
  Borttagna gamla starttimerfunktioner/handlers i points-3-6-7, extra animation/observer i session-shell och vilande auto-klick-poller i flow-polish. V46 fortsätter äga starttimern. Den vanliga sidans extra auto-vilotimer i theme-rest tas bort; v142 behåller automatisk vila. V142 startar inte längre mellanövningar med syntetiska klick, så hela blockeringslagret v144 och dess laddare tas bort. Oförändrade vilovärden/segment skrivs inte längre till DOM varje animationsruta, och tre redundanta timeout-anrop per wrapper tas bort.

Checkpoint-grenarna pekar på respektive färdig ändring. Tillståndet före dessa tre steg var `09a7cb76aed1fb7b3b1ab53ea9d18302f51ee769`. Återställ via Git; gamla implementationer behöver inte ligga kvar som reservkod i sidan.

## Verifiering

- Syntaxkontroll av ändrad JavaScript och `git diff --check` efter varje steg.
- Browserkontroller med lokala testdata och simulerad Firebase. Inga riktiga träningsdata skrivs av testerna.
- Vanlig träningssida, Reactor och Observatory: inga JavaScript-fel efter steg 2 och 3. Diagrammens testdata matchar. Det tidigare Chart-kollisionsfelet på vanliga sidan försvinner i steg 2.
- Reactor/Observatory: 320, 375, 390, 768 och 1440 px. Ingen ökad dokumentbredd. PR, träningslogg, redigering, passbyggare samt öppna/stänga träningsmode kontrollerade; historiken oförändrad.
- Vanliga träningsmodet: 18 kontroller passerar, inklusive en starttimer, en vilovy, en loggrad per avslutat set, hoppa över vila, tidsstyrd fortsättning mellan set/övningar, avstängd starttimer, mellanövning väntar på användaren, start av mellanövning, pausa/återuppta kondition samt spara exakt ett pass och stänga träningsmode.
- Vilovy och konditionens fokusvy visuellt granskade vid 390 px. Kontrollerna kördes i Chromium; fysisk iPhone/Safari har inte verifierats här.

## Kvarvarande beroenden och separat fynd

`exercise-between-sets.js` kan inte raderas: den innehåller passbyggaren samt det äldre manuella viloflödet som fortfarande används i isolerade sidor. Reactor/Observatory laddar inte samma automatiska v142-flöde som vanliga träningssidan. Zen-preview har också en separat runtime. Detta steg migrerar inte dessa flöden.

Ett test som avslutar två set och låter den andra vilan löpa ut misslyckas i Reactor och zen-preview: nästa set startar inte. Samma test misslyckas även mot checkpoint 2, alltså före timerändringarna. Det är ett separat befintligt fel i äldre övergångslogik, inte ett godkänt fullständigt passflöde. Vid fortsatt arbete bör väntande övergångar referera till sessionens position och åtgärd i stället för en knappnod som kan ersättas under rendering. Migrera sedan de sidorna till en gemensam vilokontroller innan den gamla tas bort.

Övrigt som behålls med avsikt:

- Canvas-glow och SVG-linjer är kompletterande visuella lager, inte automatiskt dubletter.
- V145:s fokusvy, ljud och animationer har kvar sin runtime.
- Session-enhancements och session-ux har ytterligare äldre reservlogik som kräver separat konsolidering; detta arbete gör inte anspråk på att hela träningsruntime nu är en enda modul.
- De fristående meditation/stretch-sidorna ändras inte i denna omgång.
