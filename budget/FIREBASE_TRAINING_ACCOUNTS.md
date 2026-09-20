# Ingemars träning – Firebase-aktivering

Status: Kod på separat branch feature/training-only-accounts-20260920. Ingemars konto är INTE aktiverat och är inte säkert att bjuda in förrän nedanstående manuella Firebase-steg och produktionstester har genomförts. GitHub-anslutningen ger inte åtkomst till Firebase Console eller databasreglerna.

## Princip

Befintliga familjekonton får rollen 'family' och behåller alla nuvarande databasnycklar (inklusive ex_wk / ex_wk_maja). Den externa användaren har rollen 'training_only'. Då visas Ingemars träning med Push, Pull, Kondition samt Stretch och Meditation. Träningsdata lagras under training_users/<UID>/data/ex_*, Zen under zen_v1/<UID>/self/entries. Ingen befintlig historik migreras.

## Manuell aktivering i Firebase Console

1. Exportera en säkerhetskopia av Realtime Database och spara nuvarande Security Rules. Ändra INTE webbplatsens produktionsbranch ännu.
2. Under Authentication → Users: notera UID för samtliga befintliga familjekonton. Skapa i Realtime Database /app_roles/<familje-UID> med strängvärdet "family" för varje sådant konto. Utan rätt roll nekar den nya koden kontot åtkomst.
3. Skapa ett separat Authentication-konto med e-post/lösenord åt Ingemar. Lägg sedan manuellt till /app_roles/<Ingemars-UID> med strängvärdet "training_only". Klienter får inte kunna skapa eller uppdatera roller. Lagra aldrig lösenord i GitHub eller Realtime Database.
4. Ta bort samtliga öppna .read:true och .write:true i Firebase-reglernas överordnade noder, framför allt roten. En tillåtelse på en föräldranod kan inte återkallas av en snävare barnregel. Skapa uttryckliga family-regler för ALLA befintliga privata familjenycklar – inte bara budgeten – och bevara önskad familjefunktionalitet.
5. Lägg till den här regelskissen i de befintliga reglerna. Skissen är INTE ett komplett, direkt publicerbart ersättningsdokument: den saknar uttryckliga family-regler för andra privata familjenycklar som budgetTracker, budgetTracker_maja, savingsGoals, familjebudget_data, sh_lists, sh_recipes_v3, cal_events, cal_todos, ex_wk, ex_wk_maja, eventuella barn- och notisvägar och flera andra.

~~~json
{
  "rules": {
    ".read": false,
    ".write": false,
    "app_roles": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": false
      }
    },
    "training_users": {
      "$uid": {
        "data": {
          ".read": "auth != null && auth.uid === $uid && root.child('app_roles').child(auth.uid).val() === 'training_only'",
          ".write": "auth != null && auth.uid === $uid && root.child('app_roles').child(auth.uid).val() === 'training_only'",
          "$key": {
            ".validate": "newData.isString() && newData.val().length <= 1000000"
          }
        }
      }
    },
    "zen_v1": {
      "$uid": {
        "$profile": {
          ".read": "auth != null && auth.uid === $uid && ((root.child('app_roles').child(auth.uid).val() === 'family' && ($profile === 'markus' || $profile === 'maja')) || (root.child('app_roles').child(auth.uid).val() === 'training_only' && $profile === 'self'))",
          ".write": "auth != null && auth.uid === $uid && ((root.child('app_roles').child(auth.uid).val() === 'family' && ($profile === 'markus' || $profile === 'maja')) || (root.child('app_roles').child(auth.uid).val() === 'training_only' && $profile === 'self'))"
        }
      }
    }
  }
}
~~~

Exempel för VARJE separat familjenyckel under rules, i samma JSON-objekt (justera även eventuell äldre validering):

~~~json
"budgetTracker": {
  ".read": "auth != null && root.child('app_roles').child(auth.uid).val() === 'family'",
  ".write": "auth != null && root.child('app_roles').child(auth.uid).val() === 'family'"
}
~~~

6. Testa i Rules Playground eller Emulator med minst två olika familje-UID, Ingemars UID och oinloggat läge. Familjen ska kunna använda tidigare data; Ingemar får bara läsa/skriva sitt eget training_users/<UID>/data och zen_v1/<UID>/self, aldrig familjens eller en annan användares nycklar eller app_roles. Familjen ska inte kunna tilldela roller genom klienten.
7. Testa inloggning, hela träningsflödet, sparning/synk, Push/Pull/Kondition, Stretch, Meditation och direkta URL:er till budget/kalender på separat enhet eller ren webbläsarprofil innan merge till main. En redan använd familjewebbläsare kan ha gammal familjedata i samma domäns localStorage: rensa webbplatsdata eller använd separat profil före utlåning.
8. GitHub Pages serverar statiska filer offentligt: dessa regler skyddar Firebase-DATA, inte HTML-källkoden. Molnsynk på produktionskonton har ännu inte provats av dessa automatiska tester.

Koden är avsiktligt fail-closed när någon saknar serverprovisionerad roll. Publicera inte den nya branchen innan roller och databasregler är på plats och verifierade.
