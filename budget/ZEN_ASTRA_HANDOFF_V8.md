# Zen / Astra handoff – v8 clean flow + meditation scenery

Senast uppdaterad: 2026-09-10

## Checkpoint före v8

- Branch: `checkpoint/zen-before-clean-flow-bamboo-v8-20260910`
- Commit: `be69e478f4aacdcffe43cb162110e732b6ac0964`
- Detta är state efter v7 innan flow och meditation-scenen städades upp.

## Viktig designregel

Stretch är referensen för **hur glow/flow fungerar**.

Meditation ska använda samma:

- mängd glow
- placering av glow
- box-shadow-proportioner
- milestone-ring treatment
- graph bar treatment
- symbol treatment

Enda visuella skillnaden är färgen:

- Stretch: grön glow enligt `zen.css`
- Meditation: varm ljusgul morgonsol (`--sun: #f5dfa0`)

Lägg INTE till separata ljusbågar, flygande ringar, radiala kort-halos eller extra pseudo-element i Meditation. Flow ska kännas integrerat i elementet precis som på Stretch.

## Aktiv flow-implementation

`zen-effects-v4.css` innehåller nu v8-regler som uttryckligen kopierar Stretch-formlerna för:

- `.day-fill`
- `.small-symbol`
- `.ritual-glyph`
- `.stat-symbol`
- `.keepsake.unlocked .keepsake-symbol`
- aktiv kind-switch

Meditation byter endast glow-färg till `--sun` / `--sun-rgb`.

## Aktiv meditation-renderer

Synlig meditation-scen ägs nu av:

- `zen-scene-meditation-v8-clean.js`
- `zen-scene-meditation-v8.css`

`zen.html` laddar **inte längre** `zen-scene-v4.js`.

`zen-scene-v3.js` är fortfarande laddad eftersom den äger Stretch-skogen, men dess `.landscape-garden` döljs helt i Meditation-läge av v8 CSS. Därför ska gammal v3-bambu aldrig vara synlig i Meditation.

### v8-scenen

- En enda canvas äger den synliga meditation-bakgrunden.
- Både distant och foreground bamboo renderas i samma renderer.
- Alla bambustammar börjar under canvas (`H + 75`) och slutar ovanför canvas (`-145`) så inga stammar ska se avklippta ut i topp eller botten.
- Undervattensdelen tonas ned i alpha i stället för att abrupt kapas.
- Varje bambustam får ripples vid sin faktiska vattenkorsning.
- Distant bamboo får mindre ripples; foreground bamboo får tydligare ripples.
- Vindband/ripples över hela vattenytan är animerade.
- Vattenfall och dropprörelse finns kvar på höger sida.
- Morgonsolljus och mjuka ljusstrålar finns kvar.
- Mobil får förstärkt sway/ripple-rörelse.

## Filer att läsa först

1. `budget/zen.html`
2. `budget/zen.css`
3. `budget/zen-effects-v4.css`
4. `budget/zen-scene-v3.js` – Stretch reference / old hidden garden
5. `budget/zen-scene-meditation-v8-clean.js`
6. `budget/zen-scene-meditation-v8.css`
7. `budget/zen-effects-v4.js`
8. `budget/zen-demo-v4.js`

## Guardrails

- Ändra inte `budget/exercise.html` eller Pulse Flow när du arbetar med Zen visuals.
- Återaktivera inte `zen-scene-v4.js` utan uttrycklig anledning.
- Visa inte `.landscape-garden` i Meditation-läge så länge v8 är aktiv.
- Skapa inte ytterligare bamboo overlays ovanpå v8; förbättra v8-renderern i stället.
- Behåll iPhone/Safari som primärt visuellt mål.
- Behåll reduced-motion, visibility/offscreen pause och begränsad DPR/fps.
- Demo-data får inte sparas/synkas.
- Skapa checkpoint före större ändringar.
