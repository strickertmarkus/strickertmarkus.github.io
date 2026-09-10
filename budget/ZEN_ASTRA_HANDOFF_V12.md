# Zen / Astra handoff – v12 sunlight depth + centered waterfall

Senast uppdaterad: 2026-09-10

## Checkpoint före v12

- Branch: `checkpoint/zen-before-sun-depth-v12-20260910`
- Commit: `9e5750f751a2af158f7b6b98e4755352ffa83c77`
- Detta är v11-state före dagens kontrast-/waterfall-förfining.

## Aktiv designprincip

Stretch är fortfarande referensen för hur glow fungerar: integrerat i element, inga flygande ljusringar eller frikopplade halos.

Meditation använder samma glow-logik men med varmt morgonsolljus:

- `--sun: #f5dfa0`
- symboler/barplots/milstolpar använder samma lokala glow-princip som Stretch
- ljuset i resten av sidan ska kännas som reflekterat naturligt solljus, inte neon eller lampor

## Nytt i v12

### 1. Underrubrik

Meditation visar fortfarande `andning & närvaro.` under huvudtiteln, men v12 gör den läsbarare mot den ljusa bambuscenen:

- mörkare varm gul/guldig grundfärg
- högre vikt
- kompakt ljusglow nära texten
- svag mörk shadow bakom för lokal kontrast
- något större på mobil

Implementation: `zen-sun-depth-v12.css`.

### 2. Mer kontrast genom resten av sidan

Headingen ska inte vara den enda ytan med djup. V12 fortsätter formspråket nedåt utan att flytta själva sceneryn:

- mycket svaga diagonala/vertikala solstrålar över `#home-view`
- breda, nästan omärkbara varma ljuspooler vid delar av Statistik/Milstolpar/Historik
- subtil kall sidotoning för djup
- lite tydligare transparent yta i `.page-section`
- något skarpare section/history/card borders
- korta varma highlights på vissa section-top borders

Det ska fortfarande kännas luftigt och ljust. Öka inte opaciteten mycket utan mobil screenshot-verifiering.

### 3. Stenbank + waterfall

Aktiv waterfall-renderer är nu:

- `zen-waterfall-v12.js`

`zen-waterfall-v9.js` finns kvar för rollback men laddas inte av `zen.html`.

V12:

- flyttar waterfall/stenbank inåt på mobil (`fallX` ca 835 i world coordinates)
- gör stenbanken cirka 22 % mindre på mobil
- behåller vattenfallet mer visuellt framträdande än stenmassan
- använder solid bank för att occluda bambu bakom
- wet notch definierar var vattnet lämnar klippan
- water veil ligger framför bankens nederdel så stenarna ser nedsänkta ut
- splash/ripples ligger vid faktisk landningspunkt
- reduced-motion och offscreen/background pause är kvar

## Aktiv filordning i zen.html

CSS:

1. `training-zen-nav.css`
2. `zen.css`
3. `zen-scene-v3.css`
4. `zen-effects-v4.css`
5. `zen-scene-meditation-v8.css`
6. `zen-sun-depth-v12.css`

JS scenery:

1. `zen-scene-v3.js` – Stretch scenery; gamla Meditation garden döljs av v8 CSS
2. `zen-scene-meditation-v8-clean.js` – huvudscen för Meditation: bambu/vatten/sol
3. `zen-waterfall-v12.js` – mindre centrerad klippbank + cascade

## Guardrails

- Ändra inte `budget/exercise.html` eller Pulse Flow för Zen-visuals.
- Återaktivera inte `zen-waterfall-v9.js` samtidigt som v12.
- Återaktivera inte `.landscape-garden` i Meditation.
- Skapa inte nya frikopplade glow-objekt runt UI.
- Behåll Stretch som referens för glow-intensitet och placering.
- Behåll Meditation ljust; skapa kontrast via lokal transparens, svalare kanter och riktat solljus, inte genom att göra hela sidan mörk.
- Demo-data får inte sparas/synkas.
- iPhone/Safari är primärt visuellt mål.
- Skapa checkpoint före större visuella iterationer.
