# Aktivera Daylines pushnotiser

Pushklienten är förberedd. Serverfunktionen måste publiceras innan tidsnotiser fungerar med appen stängd. Den befintliga kalenderavsändaren ändras inte.

1. Firebase-projektet `frick-budget` behöver Blaze och Cloud Scheduler för den schemalagda funktionen. Dessa tjänster kan medföra kostnad.
2. Lägg till följande gren i befintliga Realtime Database-regler (ersätt inte andra regler):

```json
"dayline_push": {
  "$uid": {
    ".read": "auth != null && auth.uid === $uid",
    "$device": {
      ".write": "auth != null && auth.uid === $uid",
      ".validate": "newData.hasChildren(['token','enabled','updatedAt']) && newData.child('token').isString() && newData.child('token').val().length < 4096 && newData.child('enabled').isBoolean() && newData.child('updatedAt').isNumber()"
    }
  }
}
```

`dayline_push_sent` ska inte ges klientåtkomst. Servern använder Admin SDK. Kontrollera att bredare föräldraregler inte redan medger obehörig åtkomst.

3. Från denna mapp, med Firebase CLI och behörighet till projektet:

```sh
npm install
firebase deploy --only functions:daylineReminders --project frick-budget
```

4. På iPhone: lägg Dayline på hemskärmen, öppna därifrån, logga in och välj Mer → Aktivera notiser. Tillåt notiser. Återaktivera om enhetens token ändras eller appen installeras om.

Notiser avser starttiden, eller sluttiden när endast slut anges. Utan tid skickas ingen notis. Utförda och borttagna förekomster hoppas över. Tider tolkas som Europe/Stockholm. Avsändaren kör varje minut, tar igen högst fem minuter och deduplicerar per enhet. Leverans kan fördröjas av operativsystem/nätverk; det är inte ett exakt alarm. En omkörning efter ett avbrott precis efter leverans kan ge en dubblett, samma tag ersätter den normalt.

Ingen serverfunktion eller databasregel har publicerats av kodändringen. Inga enhetstokens eller servicekontonycklar ska läggas i Git.
