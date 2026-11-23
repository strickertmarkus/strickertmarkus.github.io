# Dayline · Daily planner

Dagsplanerare för GitHub Pages med Firebase-synk. Ingen byggprocess eller externa typsnitt. Firebase SDK laddas från Googles CDN; synk och bottennavigation använder familjeappens gemensamma moduler i `budget/`.

Öppna: **https://strickertmarkus.github.io/daily-planner/**

## Användning

Appen börjar tom. Ingen exempeldag eller automatiskt skapade aktiviteter finns. Egna sparade aktiviteter behålls.

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

Logga in under **Mer → Logga in för att synka** med ditt befintliga konto i projektet `frick-budget`. Inloggningen delas med familjeappen på samma domän. Använd samma konto på båda enheterna.

Planeringen sparas som en JSON-sträng i Realtime Database på `daily_planner_v1/<auth.uid>`. Aktiviteter, återkommande undantag, dagsanteckningar och inställningar ingår. Varje konto har en egen planering. Lokalt lagras en cache och ej bekräftade ändringar under `dayline.firebase.v1.<uid>`; inloggade ändringar skrivs inte till gästernas data.

Ändringar sparas lokalt innan de skickas. En transaction sammanfogar ändrade aktiviteter och datum med senaste serverversionen; vid ändring av samma aktivitet eller samma dagsanteckning gäller sista skrivningen. Appen väntar på första Firebase-läsningen innan den skriver. `Synkat med Firebase` visas först när inga ändringar väntar på serverbekräftelse. Åtkomstfel och offline visas separat. Lokala ändringar finns kvar efter omladdning och skickas när anslutningen återkommer. Ingen polling sker i bakgrunden.

Äldre egen planering i `dayline.planner.v1` förs över en gång till det första inloggade kontot. Originalet behålls lokalt som backup och markeras med `dayline.legacy-owner` för att inte importeras till ett annat konto. Exempeldagen i föregående version sparades aldrig och migreras därför inte.

Export och import finns under Mer. Import valideras, laddar först ner en kopia och ersätter därefter den aktuella planeringen; ändringen synkas. Oläsbar data ska exporteras innan den återställs. Flikuppdateringar och molnändringar uppdaterar vyn och nollställer gamla ångra-snapshots.

### Firebase-regler

Befintliga regler kunde inte läsas eller publiceras från arbetsmiljön. Om appen visar **Firebase nekar åtkomst**, lägg till denna gren i det befintliga `rules`-objektet i Firebase Console → Realtime Database → Rules. Behåll andra grenar:

```json
"daily_planner_v1": {
  "$uid": {
    ".read": "auth != null && auth.uid === $uid",
    ".write": "auth != null && auth.uid === $uid",
    ".validate": "newData.isString() && newData.val().length <= 5000000"
  }
}
```

En bredare tillåtelse på en föräldranod kan inte begränsas av en barnregel; granska befintliga regler. Efter publicering, välj **Synka igen** i appen. Ingen databas skrivs med exempelaktiviteter.

## Hemskärm och offline

Manifest, PNG/SVG-ikoner och en service worker ingår. På iPhone: öppna i Safari → Dela → Lägg till på hemskärmen. Appskalet cachas efter första lyckade besöket. Service workern styr bara `daily-planner/`. Den cachar även de två uttryckligen listade delade modulerna och Firebase SDK. Nätversion används när anslutning finns och cache offline.

Service workern skickar inga pushnotiser. Bakgrundspåminnelser och kalenderintegration ingår inte.

Vid ändring av cachelagrade filer: öka `CACHE` i `sw.js`. En ny worker aktiveras när föregående öppna appflikar stängts. Stäng därför öppna appfönster och öppna igen efter uppdatering.

## Filer

| Fil | Ansvar |
| --- | --- |
| `index.html` | Semantisk appstruktur, dialoger, mobilmeny |
| `styles.css` | Layout, responsiva brytpunkter, färger, rörelse |
| `app.mjs` | Rendering, inmatning, lagring, import/export |
| `model.mjs` | Datum, återkommande aktiviteter, tidslogik, validering |
| `model.test.mjs` | Riktade kontroller av tids- och datalogiken |
| `sw.js` | Offlinecache för appen och dess uttryckliga beroenden |
| `../budget/firebase-sync.js` | Gemensam Firebase-konfiguration och kontoavgränsad Dayline-synk |
| `../budget/pulse-bottom-nav-v1.js` | Gemensamma rörelsekurvor för Homes och Daylines bottenpunkt |
| `manifest.webmanifest` | Installation och hemskärmsläge |
| `icon.svg`, `icon-192.png`, `icon-512.png` | Appikoner |

## Design och prestanda

Färgerna hämtar inspiration från portfolio-v2: bakgrund `#0b0e14`, varm bärnsten, blått och mint. Systemtypsnitt, mjuka ljusfält, tunn tidslinje, aktivitetsring och en fast mobilmeny. Bottenbaren har Homes genomskinliga bakgrund, orange markering och gemensamma 300 ms-animation: framkanten leder och bakkanten följer tills punkten dras ihop igen. Mobilvyn använder dynamisk viewporthöjd och safe-area i hemskärmsläge. Baren döljs när tangentbord eller dialog är öppet. Dialoger öppnas som sheets på mindre skärmar, med scrollås och native fokusbegränsning via `<dialog>`.

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

Den senaste uppdateringen har syntaxkontrollerats. Synk mellan riktiga Firebase-konton och regler kräver verifiering med användarens inloggning. Inga regressionssviter kördes.
