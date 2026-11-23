# Dayline · Daily planner

Fristående dagsplanerare för GitHub Pages. Ingen byggprocess, externa typsnitt, CDN, inloggning eller databas behövs. Allt som appen behöver ligger i den här mappen.

Öppna: **https://strickertmarkus.github.io/daily-planner/**

## Användning

Första besöket visar en uttryckligt märkt **exempeldag**. Den kan redigeras för att prova funktionerna, men ändringarna i exempelläget sparas inte. Tryck **Börja min dag** för egen planering. Exempeldagen går att öppna igen via Inställningar, utan att ändra egna aktiviteter.

- **Hela dagen:** kronologisk tidslinje, nu-markör och en separat lista för aktiviteter utan tid.
- **Nu & nästa:** aktiviteter som pågår nu och nästa starttid. Samtidiga aktiviteter visas tillsammans. Typfilter och sökning gäller även här. För andra datum finns en länk tillbaka till idag.
- **Tider:** utan tid, enbart starttid eller start/slut samma dag. Sluttiden måste vara senare än starttiden. Ett intervall över midnatt behöver delas i två aktiviteter.
- **Enbart starttid:** aktuell från start till nästa schemalagda start samma dag, eller till midnatt. Klarmarkering avslutar visningen tidigare. Sluttid uppskattas inte och räknas inte in i planerad tid.
- **Typer:** Arbete, Egentid, Hälsa, Vardag och Paus. Filtrera i den horisontellt rullbara raden.
- **Redigera:** tryck på aktiviteten. Lägg till anteckning, markera viktig, ändra datum eller kopiera till nästa dag.
- **Återkommande:** dagligen, vardagar eller veckovis. Ändra en förekomst eller hela serien. Individuella ändringar är undantag och behålls vid serieändringar. Klarmarkering och borttagning av en förekomst påverkar bara den dagen.
- **Ångra:** efter att du sparat, klarmarkerat eller tagit bort. Borttagning av hela serien kan också ångras.
- **Överblick:** aktivitetsring, klara/kvar och planerad tid. Överlappande intervall räknas bara en gång i tidsmåttet. Krockar visas på aktiviteterna men hindrar inte sparning.
- **Vecka och kalender:** byt dag eller vecka, alternativt välj datum i månadskalendern.
- **Dagsanteckning:** sparas direkt per datum.
- **Sökning:** söker i rubrik, anteckning och typ för vald dag.
- **Tangentbord:** N = ny aktivitet, / = sök, Escape = stäng dialog. Genvägar aktiveras inte vid textinmatning.

## Sparning och säkerhetskopior

Egen planering sparas under `dayline.planner.v1` i `localStorage` på aktuell domän. Exempelläge har ett separat minnesobjekt och skriver aldrig över den egna planeringen.

**Ingen synk mellan telefon och dator är implementerad.** Rensas webbplatsdata kan planeringen försvinna. Exportera en JSON-kopia under Inställningar. Import valideras och kräver bekräftelse innan den ersätter befintliga data; en export av nuvarande data initieras först. Webbläsaren behöver tillåta nedladdningen. Sparfel visas i appen. Oläsbar lagrad data skrivs inte över och kan exporteras i originalformat.

Flikar på samma enhet uppdateras via `storage`-händelsen. Om en annan flik ändrar data medan redigering är öppen stängs dialogen och användaren informeras, så att en gammal redigering inte skrivs över den nya.

## Hemskärm och offline

Manifest, PNG/SVG-ikoner och en service worker ingår. På iPhone: öppna i Safari → Dela → Lägg till på hemskärmen. Appskalet cachas efter första lyckade besöket. Service workern är avgränsad till `daily-planner/`, hämtar nätverksversionen när anslutning finns och faller tillbaka på cache offline.

Service workern skickar inga pushnotiser. Bakgrundspåminnelser och kalenderintegration ingår inte.

Vid ändring av cachelagrade filer: öka `CACHE` i `sw.js`. En ny worker aktiveras när föregående öppna appflikar stängts.

## Filer

| Fil | Ansvar |
| --- | --- |
| `index.html` | Semantisk appstruktur, dialoger, mobilmeny |
| `styles.css` | Layout, responsiva brytpunkter, färger, rörelse |
| `app.mjs` | Rendering, inmatning, lagring, import/export |
| `model.mjs` | Datum, återkommande aktiviteter, tidslogik, validering |
| `model.test.mjs` | Riktade kontroller av tids- och datalogiken |
| `sw.js` | Offlinecache, endast för appens egen sökväg |
| `manifest.webmanifest` | Installation och hemskärmsläge |
| `icon.svg`, `icon-192.png`, `icon-512.png` | Appikoner |

## Design och prestanda

Färgerna hämtar inspiration från portfolio-v2: bakgrund `#0b0e14`, varm bärnsten, blått och mint. Systemtypsnitt, mjuka ljusfält, tunn tidslinje, aktivitetsring och en fast mobilmeny. Dialoger öppnas som sheets på mindre skärmar, med scrollås och native fokusbegränsning via `<dialog>`.

Inga canvas- eller WebGL-scener. Bakgrundsrörelsen använder CSS-transformer. `prefers-reduced-motion` respekteras. Klockan kontrolleras varje sekund medan sidan är synlig, men vyn uppdateras högst en gång per minut. Kalendern följer enhetens lokala datum och tid, även över sommartidsgränser. Inmatningstext renderas med HTML-escaping.

## Lokal utveckling och verifiering

Servera mappen med en vanlig statisk HTTP-server; ES-moduler och service worker behöver HTTP/HTTPS. Ingen `npm install` behövs.

```sh
node --check daily-planner/app.mjs
node --check daily-planner/model.mjs
node --check daily-planner/sw.js
node --test daily-planner/model.test.mjs
```

Kontroller vid första implementationen:

- Syntax och fem riktade modelltester: tidsgränser, starttid utan slut, samtidiga aktiviteter, återkommande undantag, överlapp, datum och importvalidering.
- Verklig Chromium-förhandsvisning på desktop och i en 390 × 844 iframe, inklusive granskade screenshots av tidslinje, fokusläge och dialog.
- Skapa med intervall respektive enbart starttid, återkommande klarmarkering per dag samt bibehållen planering efter omladdning provades i gränssnittet.
- Safari/WebKit och installation på fysisk iPhone är inte verifierade i denna miljö. Responsiv iframe är en layoutkontroll och emulerar inte iOS-tangentbord eller safe-area.
