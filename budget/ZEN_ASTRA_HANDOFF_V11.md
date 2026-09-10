# Zen / Astra handoff – v11 contrast + integrated rock bank

Senast uppdaterad: 2026-09-10

## Checkpoint före v11

- Branch: `checkpoint/zen-before-contrast-rockbank-v11-20260910`
- Commit: `ffcd386820e5ddf9ec4240ab76df5e10f4ef4822`
- Detta är v10-state före kontrast-, underrubrik- och stenbanksjusteringarna.

## V11 – designprincip

Meditation ska fortfarande vara ljust, lugnt och luftigt, men inte jämnt mjölkigt över hela sidan.

Kontrasten skapas nu genom:

1. svagt kallare blågröna sidotoner
2. varm morgonsol i center/heading
3. ett nästan osynligt transparent glass-veil över content-sektionerna
4. något mörkare primär/sekundär text
5. samma gula glow-hierarki som tidigare på barplots/symboler

Gör inte Meditation mörk. Lägg inte till stark vignette eller tydliga glas-kort runt hela sektioner.

## Heading-underrubrik

Meditation har nu samma typ av titel-underrubrik som Stretch:

- Stretch: `rörlighet & återhämtning.`
- Meditation: `andning & närvaro.`

Meditation använder `--sun` / varmt morgonsolsgult glow.

Implementation: `budget/zen-effects-v4.css` via `body[data-kind=meditation] .hero-copy h1::after`.

## Kontrast / transparency

`budget/zen-effects-v4.css` innehåller v11-regler för:

- kall sidotoning i body-bakgrunden
- starkare men fortfarande mjuk hero-side shading
- mycket svagt transparent gradient-veil på `.page-section`
- något mer separation i `.ritual-choice` och `.history-row`
- mörkare textvariabler i Meditation

Behåll detta subtilt. Målet är separation, inte synliga paneler.

## Glow-regel

Stretch är fortfarande referensen för glow-mängd och placering.

Meditation använder samma princip men med:

- `--sun: #f5dfa0`
- `--sun-rgb: 245,223,160`

Ingen fristående flygande glow, inga animerade bågar/ringar runt milestones.

## Stenbank + vattenfall

Aktiv fil:

- `budget/zen-waterfall-v9.js`

Filnamnet är äldre men innehållet är nu v11.

V11 ändrar stenarna från transparenta separata objekt till en sammanhängande klippbank:

1. En solid bakre klippmassa renderas först.
   - Den occludar bambu bakom stenen.
   - Bambu ska därför inte kunna synas igenom stenen.
2. Individuella stenar renderas ovanpå klippmassan med hög opacitet.
3. En mörk våt springa markerar exakt var vattnet lämnar stenen.
4. Cascade-strålarna startar vid den springan.
5. Ett water-veil renderas över stenbankens nederdel så den känns nedsänkt i dammen.
6. Surface reflections och splash-ripples binder ihop banken med dammen.

Mobilpositionen är medvetet längre åt höger för att hålla stenen utanför huvudtextkolumnen men ändå synlig i cropen.

## Scenery layering

Behåll följande:

- `zen-scene-v3.js`: Stretch-skogen; gammal Meditation-garden är dold i Meditation.
- `zen-scene-meditation-v8-clean.js`: bambu, damm, vind, sol, ripples.
- `zen-waterfall-v9.js`: v11-klippbank + vattenfall ovanpå Meditation-canvasen, men under `.landscape-shade`.

Återaktivera inte gamla `zen-scene-v4.js`.

## Cache

`zen.html` använder v11 cache keys:

- `zen-effects-v4.css?v=20260910-contrast-rockbank-v11`
- `zen-waterfall-v9.js?v=20260910-contrast-rockbank-v11`

## Guardrails

- Ändra inte `budget/exercise.html` eller Pulse Flow för Zen-visuals.
- Behåll iPhone/Safari som primärt mål.
- Demo-data får aldrig sparas/synkas.
- Behåll reduced-motion och offscreen/background pause.
- Skapa checkpoint före större visuell ombyggnad.
- Om stenbanken justeras: flytta sten + waterfall + water veil som en enhet; separera inte deras koordinater igen.
