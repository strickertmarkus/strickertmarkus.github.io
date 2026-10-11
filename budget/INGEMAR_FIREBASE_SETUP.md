# Ingemars träningssida – aktuell Firebase-konfiguration

Sida: https://strickertmarkus.github.io/budget/ingemar.html
Den tidigare demolänken öppnar samma sida. Fiktiva pass importeras inte.

## Konto och data

Sidan använder projektet `frick-budget`, dess standardapp och Email/Password-inloggning, precis som familjens sidor. Ingemar kan skapa ett eget Authentication-konto. Att skapa kontot ger inte automatiskt tillgång till databasen.

Ingemars gemensamma profil ligger i Realtime Database på **`ex_ingemar`**, som en JSON-sträng med pass, planer, mallar, stretch/meditation, träningslogg, redigerbart veckomål och personliga rekord (automatiska samt manuellt tillagda äldre rekord). Markus och Ingemar ska båda få läsa och skriva just denna nod. De äldre personliga uppgifterna under `ingemar_v1/<uid>/state` är orörda och används inte av denna version.

## Behörighet – konfigurera i Firebase Console

Vi har ingen anslutning som kan läsa eller publicera projektets databasregler. Kontrollera därför aktuella regler innan ändring:

1. Skapa Ingemars konto via sidan eller Authentication → Users.
2. Hämta **User UID** för både Ingemars och Markus befintliga konto i Authentication → Users. Lösenord behövs inte.
3. Öppna Realtime Database → Rules. Lägg till följande gren i det befintliga `rules`-objektet. Ersätt de två platshållarna med verifierade UID-värden. Behåll övriga regler.

```json
"ex_ingemar": {
  ".read": "auth != null && (auth.uid === 'INGEMARS_UID' || auth.uid === 'MARKUS_UID')",
  ".write": "auth != null && (auth.uid === 'INGEMARS_UID' || auth.uid === 'MARKUS_UID')"
}
```

Publicera inte exemplet med platshållarna kvar. Granska också föräldraregler: en bredare tillåtelse på roten kan inte begränsas med denna barnregel. Att ta bort sidlänkar skyddar inte familjens andra data; reglerna måste även neka Ingemars konto åtkomst till de andra noderna om sådan åtkomst inte önskas. Ändra inte andra kontons befintliga behörighet utan att granska reglerna först.

Testa läsa/skriva `ex_ingemar` med båda godkända UID:erna samt nekad åtkomst med ett annat UID i Rules Playground. Kontrollera därefter sparande och omladdning på sidan med båda riktiga kontona.


## Funktioner och sparstatus

- Träningsloggen kan skapa, visa, redigera och ta bort styrke-/konditionspass samt ändra övningar och enskilda set. Äldre pass går också att öppna.
- Personliga rekord beräknas från genomförda styrkeset; äldre rekord kan kompletteras manuellt (`manualPrs` i samma `ex_ingemar`-dokument). Redigering/borttagning av loggade pass räknar om automatiska rekord.
- Veckomålet (`goal`) kan ändras på översikten och sparas med övriga uppgifter.
- En sparning är inte bekräftad förrän sidans synkstatus visar `Synkat via Firebase`. `Sparat lokalt` eller ett åtkomstfel betyder att servern ännu inte har bekräftat ändringen.
- Samma inloggning på två telefoner ger samma Firebase-identitet. Två separata konton kräver varsin tillåtelse i reglerna. En användare som kan läsa profilen kan fortfarande sakna skrivrätt om `.read` och `.write` skiljer sig åt.

## Fel vid inloggning

- **Firebase nekar åtkomst:** inloggningen fungerar, men databasreglerna måste kontrolleras enligt ovan. Ett nytt konto löser inte en saknad regel.
- **Databasen svarar inte:** kontrollera nätanslutningen och välj **Försök igen**.
- Inloggningsbekräftelsen får aldrig skriva över ett databasfel. Träningsvyn öppnas först när profilen har lästs korrekt.
- Synk och rekord är testade med simulerad Firebase i WebKit. Riktiga regler och synk mellan produktionskonton måste verifieras separat.

Ändringar cachelagras lokalt och försöker synkas på nytt. Senaste kompletta skrivning gäller vid samtidiga redigeringar; detta är inte konfliktfri sammanslagning.
