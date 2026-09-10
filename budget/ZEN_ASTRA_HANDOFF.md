# Zen – Astra handoff

Senast uppdaterad: 2026-09-10

## Viktiga checkpoints

Före v4-demo/ljus/bambu-ändringarna:

- Branch: `checkpoint/zen-before-demo-light-v4-20260910`
- Commit: `3a9dfdb78d2129fc15faa3dc4b120922fb5c1284`
- Message: `Use detailed Zen scenery v3`

Före v5-vatten/morgonsol-förfiningen:

- Branch: `checkpoint/zen-before-water-sunlight-v5-20260910`
- Commit: `3fc1cfa49272b813de61691b1fbbbac2a34b2255`
- Message: `Add Astra handoff for Zen v4`

## Nuvarande arkitektur

Zen är en fristående del under `budget/` och ska inte kopplas ihop med den vanliga träningsmotorn mer än via den gemensamma Träning/Zen-navigationen.

Kärnfiler:

- `zen.html` – sidstruktur och script/css-ordning.
- `zen-model.js` – passmodeller, statistik och tidslogik.
- `zen-store.js` – separat Zen-lagring/synk under `zen_v1/...`.
- `zen.js` – UI, builder, sessionsflöde, historik och statistik.
- `zen.css` – grunddesign.
- `training-zen-nav.js/css` – gemensam Träning/Zen-navigation.

Scenery:

- `zen-scene-v3.js` – huvudrenderaren för skog och meditationsmiljö. Lämna denna som stabil fallback om du inte uttryckligen behöver ändra kärnscenen.
- `zen-scene-v3.css` – v3-headingdetaljer.
- `zen-scene-v4.js` – overlay ovanpå v3 för meditation: kontinuerliga bambustammar som går ut ur bild, vissa går genom vattenlinjen, får reflektioner och nu även animerade vindripples över vattenytan.

V4 UI/demo:

- `zen-demo-v4.js` – read-only exempeldata. Den modifierar endast `ZenStore.entries`-gettern i minnet och skriver aldrig demo records till localStorage eller Firebase.
- `zen-effects-v4.js` – dynamisk Zen-symbol och exempeldata-badge. Extra lower-page fireflies har tagits bort.
- `zen-effects-v4.css` – naturligt ljusgult meditation-glow runt knappar/kort, dynamisk symbol och demo-badge.

## Demo-data – viktigt

Demo-data finns för både Stretch och Meditation för att visa hur veckograf, statistik, milstolpar och historik ser ut.

Regler:

1. Demo visas bara för en kategori om kategorin saknar riktiga sparade sessions.
2. Så fort riktig data finns för en kategori försvinner demo för just den kategorin automatiskt.
3. Demo-data får aldrig skrivas till `ZenStore.put`, Firebase eller localStorage.
4. Demo-id börjar med `zen_demo_v4_`.
5. Delete-knappar för demo records döljs i `zen-effects-v4.js`.
6. UI visar `Visar exempeldata · sparas inte` när aktuell kategori använder demo.

Om demo senare ska tas bort helt: ta bort `zen-demo-v4.js` från `zen.html` och eventuellt badge-logiken från `zen-effects-v4.js`.

## Stretch – aktuell design

- Mörk enchanted/forest-palett.
- Detaljerat procedurrenderat träd i Canvas.
- Organiska spetsiga löv, barkfåror, knutar, mossa och varierat lövverk.
- Löv rör sig subtilt i vind.
- Fireflies finns endast i heading-scenen. Den extra firefly-overlayn över resten av sidan togs bort i v5.
- Heading har ett grönt sekundärt textelement under `Stretch` via v3 CSS.

Önskad riktning framåt: behåll det lugnt, vuxet och detaljerat. Undvik cartoon/barnsliga former och för stora partiklar.

## Meditation – aktuell design

- Ljus jade/vatten-trädgård.
- Stor varm ljuskälla i headingbakgrunden.
- Procedurrenderade stenar, vatten, ripples, reflektioner och bambu.
- v4 lägger ytterligare kontinuerliga foreground-bambu som går från vattenområdet och ut över canvas-toppen så att bambu inte upplevs abrupt avklippt.
- Flera bambu går genom vattenlinjen och får mjuka reflektioner.
- Vattenytan har från v5 ett subtilt vindfält av horisontella ripples plus expanderande ringar runt bambustammarna.
- UI-elementens lokala ljus är från v5 ett diffust ljusgult/varmvitt glow inspirerat av morgonsol, inte gröna/jadefärgade punktljus.

Önskad riktning framåt: mer naturligt ljus/reflektion och materialkänsla, men fortfarande lugnt och inte glassmorphism överallt.

## Dynamisk Zen-symbol

Symbolen längst upp till vänster bredvid `zen` följer aktiv kategori:

- Stretch: `✧`
- Meditation: `≈`

Bytet görs av `zen-effects-v4.js` när `body[data-kind]` ändras.

## Scriptordning i zen.html

Ordningen är avsiktlig:

1. Firebase/auth
2. `training-zen-nav.js`
3. `zen-model.js`
4. `zen-store.js`
5. `zen-demo-v4.js`
6. `zen-scene-v3.js`
7. `zen-scene-v4.js`
8. `zen.js`
9. `zen-effects-v4.js`

Ändra inte ordningen utan anledning. Demo-lagret måste ligga efter store men före `zen.js`, eftersom `zen.js` använder `ZenStore.entries` när statistik/historik renderas.

Aktuella cache-busters för vatten/ljus är `20260910-water-sunlight-v5` i `zen.html`.

## Guardrails

- Ändra inte `budget/exercise.html` eller Pulse Flow-träningsfiler när du arbetar med Zen-visuals.
- Behåll separat Zen storage namespace.
- Demo-data får inte synkas.
- Bevara reduced-motion-stöd.
- Bevara mobile Safari/iPhone som primärt mål.
- Canvas-animationer ska pausa i bakgrunden/offscreen och hålla begränsad upplösning/fps.
- Skapa checkpoint före större visuella omskrivningar.

## När Astra fortsätter

Börja med att läsa senaste commits på `main`, därefter:

- `budget/ZEN_ASTRA_HANDOFF.md`
- `budget/zen.html`
- `budget/zen-scene-v3.js`
- `budget/zen-scene-v4.js`
- `budget/zen-effects-v4.css`
- `budget/zen-effects-v4.js`
- `budget/zen-demo-v4.js`

Fortsätt från nuvarande state i stället för att återinföra den äldre `feat/pulse-flow-zen-mode-lab`-arkitekturen.
