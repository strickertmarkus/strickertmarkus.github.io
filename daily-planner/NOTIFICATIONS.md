# Daylines pushnotiser

Dayline använder den befintliga avsändaren `budget/push-worker.mjs` och dess befintliga Firebase Admin-konto. Varje körning behandlar också Daylines aktiviteter via `daily-planner/push-reminders.mjs`. Ingen separat Cloud Function, Firebase CLI-publicering eller Blaze-uppgradering krävs för denna ändring.

Den befintliga externa minutstarten anropar arbetsflödet Calendar push reminders via workflow_dispatch. Körhistoriken 2026-11-25 visar lyckade körningar med en minuts mellanrum. Arbetsflödets egna dagliga cron är en separat start; den externa minutstarten måste fortsätta vara aktiv. Ingen ny schemaläggare skapas här.

## Mobilen

På iPhone: öppna Dayline från hemskärmen, logga in och välj Mer → Aktivera notiser. Redan registrerade enheter behöver inte registreras igen. Registreringen är separat från budgetappens enheter och kopplad till användarens uid.

## Utskick

- Starttid ger en notis vid start. Endast sluttid ger en notis vid slut. Utan tid skickas ingen notis.
- Utförda och borttagna förekomster hoppas över. Återkommande aktiviteter använder samma modell och undantag som appen.
- Svensk tidszon, Europe/Stockholm. Högst fem minuters försenade aktiviteter tas igen.
- Utskicken dedupliceras per konto, förekomst, tid och enhet. Samtidiga körningar använder en databastransaktion. Avbrott precis efter leverans kan ge en dubblett med samma notistagg.
- Operativsystem och kötid kan fördröja leveransen. Telefonleverans behöver verifieras på den registrerade enheten.

## Databasregler

Behåll de redan publicerade reglerna: daily_planner_v1/$uid och dayline_push/$uid är kontoavgränsade. dayline_push_sent är server-only och läses/skrivs med Admin SDK. Inga enhetstokens eller servicekontonycklar får läggas i Git.
