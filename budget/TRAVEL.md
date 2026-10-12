# Family travel planner

`travel.html` is linked from the Home task widget. Production starts empty.

## Shared storage

Firebase Realtime Database root: `family_travel_v1`.
- `items/<uuid>`: trip, itinerary, place, cost, booking, task, note and media metadata.
- `files/<uuid>`: resized JPEG or PDF data URI. PDFs are limited to 1 MiB and images resized to 1600 px.
- Records are patched independently; deletions are reversible `deleted` tombstones. Trip deletion hides its contents without destroying them.
- IndexedDB `family-travel-v1` stores records, files and a durable operation outbox. Failed writes remain queued and retry online/every 30 seconds. The UI distinguishes device storage from cloud sync.
- Export includes all records, tombstones and file content. Import uses new IDs so current trips remain unchanged.
- Monetary rates are entered per expense; no automatic/current FX rates are implied.
- Map view embeds the selected saved address; navigation opens Google Maps. Offline map tiles are not downloaded.
- Countdown stores departure as an absolute ISO instant; schedule dates/times are entered as local destination times.

## Firebase access setup

The new root needs its own security rule, since siblings do not inherit one another's rules.
In Firebase Console > Realtime Database > Rules, add `family_travel_v1` alongside existing roots, copying the family's existing authorized-user `.read` and `.write` expressions (for example those on `family_todos_v2`). Do not replace the full rules document or make this root publicly readable/writable. Include only the family accounts meant to share trips.

This repository does not include Firebase deployment credentials, so a Pages deployment does not deploy database rules. If the rule is missing, the UI explicitly reports missing Firebase permission and retains changes in the device outbox for upload once access is granted.

## Verification

`node --test budget/tests/travel.test.cjs`

`node budget/tests/travel-browser.cjs` with a server on port 4173 and Playwright WebKit/Chromium. The browser test uses isolated Firebase doubles; it never reads or writes the family's live records. GitHub workflow `travel-verify.yml` captures phone/narrow/desktop screenshots.
