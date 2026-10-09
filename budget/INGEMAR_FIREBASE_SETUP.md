# Ingemars egen träningssida – Firebase

## Öppna

- Sida: `https://strickertmarkus.github.io/budget/ingemar.html`
- Separat förhandsvisning (demodata): `/budget/ingemar-preview.html` (påverkas inte)
- Eget konto skapas via **Skapa konto** på Ingemars sida. Därefter loggar han in med sin egen e-post och sitt lösenord.
- Kontrollera i Firebase Console → Authentication → Sign-in method att **Email/Password** är aktiverat. Det här kan inte aktiveras från GitHub.

## Databas

Firebase-projektet är samma som familjen redan använder (`frick-budget`), men sidan använder en **namngiven Firebase-app** (`ingemar-personal`) med separat autentiseringssession. Träningsdata sparas i Realtime Database under:

```
ingemar_v1/<firebase-auth-uid>/state
  json: "{...alla träningspass, planer, mallar, stretch/meditation-logg...}"
  updatedAt: Firebase server timestamp
```

**Viktigt: aktivera säkerhetsregler innan sidan används för privata uppgifter.** Utan Firebase-regler som spärrar andra användare är en URL och användar-ID inte tillräckligt för integritet. Vi har ingen anslutning som får skriva reglerna direkt till det befintliga Firebase-projektet; ändra därför reglerna i Firebase Console → Realtime Database → Rules.

Infoga följande **gren i befintliga `rules`**, utan att ersätta eller ta bort någon av familjens andra regler:

```json
"ingemar_v1": {
  "$uid": {
    ".read": "auth != null && auth.uid === $uid",
    ".write": "auth != null && auth.uid === $uid"
  }
}
```

Exempel endast för en databas som saknar andra regler:

```json
{
  "rules": {
    "ingemar_v1": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}
```

Observera att en mer tillåtande regel **högre upp** (t.ex. `".read": true` eller `".write": true` under `rules`) kan tillåta åtkomst trots regler på barnnoden. Kontrollera därför även befintliga föräldraregler. Testa i Rules Playground med Ingemars UID och ett annat autentiserat UID: endast den förstnämnda ska kunna läsa och skriva hans gren.

## Vad som synkas

- Träningsplaner och egna pass
- Genomförda styrke-/konditionspass och statistik
- Träningsmallar, veckomallar och mål
- Stretch och meditation: pass, dagplanering och loggar

Första gången Ingemar loggar in börjar sidan **tom på historiska pass**, men standardövningar och färdiga Stretch/Meditation-rutiner finns tillgängliga. Förhandsvisningens **fiktiva loggar importeras inte automatiskt**.

Data cachelagras per Firebase-UID i samma webbläsare. Vid nätverksproblem visas synkstatus och lokala ändringar försöker synkas på nytt. På flera samtidiga enheter används senaste skrivna kompletta datamängden (inte konfliktfri sammanslagning av parallella redigeringar), så undvik att redigera samma pass på två enheter samtidigt.

## Om något inte fungerar

1. Kontrollera att rätt Firebase-konto används i Ingemars inloggning.
2. Kontrollera att Email/Password är aktivt.
3. Kontrollera reglerna ovan inklusive att inga öppna föräldraregler gör datan läsbar.
4. När Firebase ger `permission_denied`, låser sidan datavyn i stället för att ange att allt är synkat.
5. Förändringar på `ingemar-preview.html` påverkar inte data på `ingemar.html`.

Ingen API-hemlighet eller lösenord ska läggas in i GitHub. Firebase web-konfigurationen är en publik klientkonfiguration, inte en säkerhetsregel.
