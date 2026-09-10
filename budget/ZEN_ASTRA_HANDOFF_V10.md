# Zen / Astra handoff – v10 sunlight symbols + aligned waterfall

Senast uppdaterad: 2026-09-10

## Checkpoint före v10

- Branch: `checkpoint/zen-before-symbol-waterfall-v10-20260910`
- Commit: `34022df1e3af598718393ebf308b1f1d1bfdee95`
- Detta är state efter v9, innan symbolglow och vattenfallet justerades enligt mobilskärmdumparna.

## Viktig designregel för Meditation glow

Stretch är fortfarande referensen för **var glow finns och hur mycket glow som används**.

Meditation använder samma visuella hierarki, men med varm morgonsol:

- `--sun: #f5dfa0`
- `--sun-rgb: 245,223,160`

Det innebär:

1. Grafstaplar har gradient i själva stapeln + en mjuk halo.
2. Symboler ska ha varm ljusgul **glyph-färg**, inte grön glyph med gul skugga.
3. Milestone-ringen hålls ren och lågintensiv; det är främst symbolen som lyser.
4. Inga flygande ljusbågar, separata ringar eller stora kort-halos.
5. Välj pass, vald rutin, statistik, Historik och footer ska följa samma symbolprincip.

Aktiva selektorer i `zen-effects-v4.css` omfattar bland annat:

- `.small-symbol`
- `.history-row .small-symbol`
- `.selected-routine .small-symbol`
- `.ritual-glyph`
- `.stat-symbol`
- `.zen-footer > span`
- `.keepsake.unlocked .keepsake-symbol`
- `.day-fill`

## Statistik

`minuter totalt`, `genomförda pass` och `dagar i följd` har ett svagt sunlight text-shadow. Detta ska vara tydligt nog för att höra ihop med grafen, men betydligt svagare än symbolerna/staplarna.

## Meditation scenery

Huvudscenen ägs fortfarande av:

- `zen-scene-meditation-v8-clean.js`
- `zen-scene-meditation-v8.css`

Gamla meditation-lager är fortsatt dolda:

- `.landscape-garden`
- `.landscape-v4-overlay`

Återaktivera dem inte.

## Vattenfall v10

`zen-waterfall-v9.js` innehåller nu v10-implementationen (filnamnet behålls för att minimera filspridning).

Viktigt:

- På mobil flyttas kaskaden inåt i den synliga cropen (`fallX ≈ 835` world coords).
- Vattenfallet har en egen liten stenhylla som renderas i samma overlay, så strålarna börjar från en fysisk klippkant i stället för tom luft.
- Vattenstrålarna landar vid dammens yta och skapar expanderande splash-ripples.
- Stenhylla, vattenstrålar och splash delar samma koordinatsystem och ska därför alltid ligga i linje.
- Overlayn ligger under headingens shade/fade.

Om vattenfallet behöver flyttas senare: flytta **stenhylla + lipY + waterY tillsammans**. Flytta aldrig bara vattenstrålarna.

## Solspill nedanför heading

`zen-effects-v4.css` använder `body[data-kind=meditation]::after` för att låta två mycket subtila ljusstrålar fortsätta under headingen. Själva bambu-/vattenscenen följer inte med ned på sidan.

## Aktuell cache-version

I `zen.html` används:

- `zen-effects-v4.css?v=20260910-symbol-waterfall-v10`
- `zen-waterfall-v9.js?v=20260910-symbol-waterfall-v10`

Behåll cache-busting vid visuella ändringar eftersom iOS Safari annars ofta visar äldre Zen-filer.

## Guardrails

- Ändra inte `budget/exercise.html` eller Pulse Flow när Zen-visuals justeras.
- Behåll Stretch oförändrad när Meditation tweakas.
- Demo-data får aldrig sparas eller synkas.
- Behåll reduced-motion och offscreen/background pause för canvas-animationer.
- Lägg inte nya scenery-lager ovanpå utan att först kontrollera om befintlig v8/v10-renderer kan justeras.
- Undvik gamla meditation-renderers och gamla v4-bambu-overlays.
