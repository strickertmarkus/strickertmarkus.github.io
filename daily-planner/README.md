# Dayline · Daily planner

Dagsplanerare för GitHub Pages med Firebase-synk. Ingen byggprocess eller externa typsnitt. Firebase SDK laddas från Googles CDN; synk och bottennavigation använder familjeappens gemensamma moduler i `budget/`.

Öppna: **https://strickertmarkus.github.io/daily-planner/**

## Användning

Appen börjar tom. Inga exempelaktiviteter skapas.

- Tryck **+** eller på en aktivitet för att öppna redigering direkt i sidan.
- Välj **Ingen**, **Start**, **Slut** eller **Start + slut**. Enbart sluttid visas som "Senast" och räknas inte som ett tidsintervall eller en pågående aktivitet.
- **Sätt som standard** sparar valet för nya aktiviteter. Det kan också ändras under Mer och synkas med kontot.
- Filterikonen öppnar typfilter, sökning, avklarade och valet **Hela dagen / Nu & nästa**.
- Återkommande aktiviteter: dagligen, vardagar eller veckovis. Ändra en dag eller hela serien.
- Svep en aktivitet åt vänster för att ta bort dagens förekomst: kortet glider ut, raden fälls ihop och raderna under glider upp. Ångra visas i åtta sekunder och fäller ut raden igen. Utförda aktiviteter markeras i bärnsten (fylld orange bock, tonad titel med orange genomstrykning); oavklarade tidsatta aktiviteter blir röda när sluttiden passerat eller nästa starttid har nåtts.
- Papperskorgen i redigeringen tar bort aktiviteten. Mer → Rensa kan rensa avklarade på vald dag, alla på vald dag eller all planering. Rensning av en dag behåller framtida återkommande aktiviteter. All planering exporteras innan total rensning; Ångra visas efteråt.
- Kalender, inställningar, filter och import öppnas som integrerade sektioner, utan popup eller bakgrundsöverlägg.
- Anteckningsdelen är synlig direkt i den öppna sidolayouten och har egen Rensa-knapp.
- N = ny aktivitet, / = sök, Escape = stäng redigering och öppna paneler.

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
| `index.html` | Semantisk appstruktur, inline-redigering, mobilmeny |
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

Färgerna hämtar inspiration från portfolio-v2: bakgrund `#0b0e14`, varm bärnsten, blått och mint. Systemtypsnitt, mjuka ljusfält, tunn tidslinje, aktivitetsring och en fast mobilmeny. Bottenbaren har Homes genomskinliga bakgrund, orange markering och gemensamma 300 ms-animation: framkanten leder och bakkanten följer tills punkten dras ihop igen. Mobilvyn använder dynamisk viewporthöjd och safe-area i hemskärmsläge. Baren döljs när tangentbordet används. Formulär och övriga paneler expanderar i sidans vanliga flöde, utan scrollås.

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

CSS, appmodul, datamodul och delade moduler har versionsparametrar i URL:erna så att en gammal browsercache inte blandar nya HTML-element med äldre kod vid uppdatering.
