# Zen – fristående återhämtning

`zen.html` är en egen sida för stretch och meditation. Träningssidan länkar hit genom headerns Träning/Zen-toggle. Inga träningsmoduler, träningsmallar eller `ex_*`-nycklar används av Zen.

## Checkpoints

- Ursprunglig Pulse Flow innan stretch/meditation: **`3d1f51b2fc7b0fc6de05c97563eb5c233a37f43f`**.
- GitHub-branch: **`checkpoint/pulse-flow-before-stretch-meditation-2026-09-09`**.
- Main precis före fristående Zen, inklusive den tidigare previewsidan: **`18a852de652e33d8a2742b8b24c1e63889d3eac5`**.

Du kan inspektera en checkpoint i en separat checkout med `git switch --detach <commit>`. Det skriver inte över den publicerade sidan. Återställning av publicerad kod görs med en ny commit från önskad checkpoint.

- Zen före renderade scener och konkretare texter: **`bcf52bb2cc02acab1fba72442f38c83eadf207f1`**.

## Innehåll

- Stretch: Helkropp, Axlar & överkropp och Höfter & rygg; egen byggare med ordning, rörelser och tider.
- Meditation: Guidad andning, Kort meditation och Utan guide; 1–60 minuter, andningsguide eller öppen närvaro.
- Ett pass åt gången, paus, återupptagning efter omladdning, valfri klang och möjlighet att avsluta tidigare.
- Reflektioner, historik, veckominuter, dagar i följd och samlingar från verkliga sparade stunder, separat för varje kategori.
- Anpassat för mobil, tangentbord och reducerad rörelse.

## Filer och data

- `zen-model.js`: ren logik för ritualer, timer, validering och framsteg.
- `zen-store.js`: egen datalagring och befintlig Firebase-inloggning.
- `zen.js`, `zen.css`, `zen.html`: det fristående gränssnittet.
- `training-zen-nav.js/css`: delad headernavigation. Bevarar `?user=maja`.
- `zen-scene.js`: två lokalt renderade Canvas-scener utan bildfiler. Förgrenat träd, lövverk, ljussken och eldflugor för stretch; bambu, sten, vattenflöde och reflektioner för meditation.
- Scenerna uppdateras högst 25 gånger per sekund, pausar utanför vyn och i bakgrunden och visas utan rörelse vid reducerad rörelse. Upplösningen är begränsad för mobil.

Sparade stunder och egna ritualer synkas till `zen_v1/<auth.uid>/<markus|maja>/entries/<id>` när kontots befintliga databasregler tillåter det. Inga databasregler ändras här. Om läsning eller skrivning nekas visar sidan att informationen sparas på enheten; export/import finns i menyn. Molnsynk har verifierats med simulerad Firebase, inte mot ett inloggat produktionskonto.

Pågående timer och inställningar är avsiktligt lokala. Timern använder väggklockan och fortsätter om en aktiv flik går i bakgrunden. Att gå tillbaka till Zen-startsidan pausar. Sparade ID:n och borttagningsmarkörer förhindrar dubbletter och att raderad historik kommer tillbaka efter synk.

## Verifiering

Kör från repo-roten:

```sh
node --test budget/tests/zen.test.cjs
node --check budget/zen.js
node --check budget/zen-store.js
```

Kontroller omfattar tid, paus/återupptagning, kategoriseparering, datum/streak, validering, importsäkerhet, lagringsfel och molnsynk. HTML-referenser och asset-sökvägar kontrolleras också. Ingen webbläsar- eller skärmbildsgranskning utfördes i den här ändringen.


## Synk mellan dator och telefon

Zen använder Firebase Realtime Database under `zen_v1/<auth.uid>/<markus|maja>/entries`. Historiken för Markus och Maja är separerad, men varje inloggningskonto har också en egen `auth.uid`. För att se samma pass på flera enheter måste båda vara inloggade på **samma Firebase-konto** och öppna samma profil.

I Inställningar → Sparade data visar sidan numera både Firebase-inloggat konto och tydlig status för lokal lagring/molnsynk. Vid nekad läsning eller skrivning finns `Försök synka igen`; lokal historik behålls och försöker laddas upp efter en lyckad återanslutning. `Sparat på ditt konto` visas först när de lokala posterna finns bekräftade i serverkopian.

Om status anger att Firebase nekar åtkomst behöver databasadministratören kontrollera Firebase Console → Realtime Database → Rules. Ett exempel på **en avgränsad regelgren** är:

```json
"zen_v1": {
  "$uid": {
    ".read": "auth != null && auth.uid === $uid",
    ".write": "auth != null && auth.uid === $uid"
  }
}
```

Lägg bara till grenen i det befintliga `rules`-objektet efter granskning av övriga regler; ersätt aldrig hela regeluppsättningen med exemplet. Testa även läsning, skrivning, offline → online och återöppning på ett riktigt inloggat produktionskonto. Klientkod och simulerade tester kan inte bekräfta hur de nu publicerade reglerna faktiskt ser ut. Om de två enheterna använder **olika** konton krävs en separat, explicit delningsmodell och motsvarande behörighetsregler; ändra inte till en oskyddad gemensam databasnod.
