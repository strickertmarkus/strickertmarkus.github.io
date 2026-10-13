# Family travel planner

Production starts empty. Existing `family_travel_v1` records remain readable. All work is scoped to the selected trip, except reusable pack templates.

## Views and ownership

- Trips: coming/current/past/archive; editable travelers, timezone, packing groups, base currency and cover. Date shifts preview affected activities. Duplicate selectively carries schedule/attachments, packing and budget plans, remaps references, and clears completion, booking references and actual payments.
- Overview: remaining packing and tasks, spending and linked summaries; upcoming activities before departure, today's remaining program, current stay and important documents during the trip.
- Schedule: date strip, date/time pickers, desktop multi-day view, timed/all-day/flexible activities, overlap indicators, explicit end date for overnight events. Pointer drag preserves duration and updates date/time. Legacy manual order cannot override clock order. Night hours are collapsible.
- Packing: checkable rows, quantity/unit/person/category, direct entry, person/status filters, per-person progress, collapsed completed rows, drag between groups, reusable user templates. People/groups can be changed in trip settings.
- Tasks: owner, deadline, priority, booking reference; overdue/soon/later/completed; explicit classification for ambiguous legacy records. `showHome` exposes the same canonical record to Home, Shopping and Calendar via `travel-home.js`. No mirrored task copies.
- Budget: category plans, separate payments and weighted payer balances. Category allocations override category item estimates, rather than double-counting. Empty actual means unregistered; zero means zero; refunds are negative. Each payment stores its exchange rate. A trip's base currency is protected once expenses exist. Partial payments attach to a booking. Receipt upload creates a linked document.
- Bookings: lodging/flight/train/ferry/car/activity-specific fields, independent booking/payment status, start/arrival timezones, references, participants, links and contacts. Schedule creation reuses existing linked entries; subsequent booking edits update generated schedule fields only when the user has not independently changed them.
- Places: local Leaflet 1.9.4, OSM tiles with attribution, markers using saved coordinates, coordinate picker, categories/visited/day filters, ordered daily stops and navigation links. No automatic geocoder or inferred road travel times. Address-only records remain navigable; set their position to show a marker.
- Gallery: batch image upload/resize with progress and retry; day/place links, full-screen swipe/keyboard viewer, reorder, edit/delete and cover selection.
- Documents: category/important/booking links; PDF/image preview, separate download, explicit local availability and fetch-for-offline action.
- Notes: heading/list formatting, editable long text, pinning, date/place links and conversion to activities/tasks.

## Persistence and migration

`travel-model.js` owns date, timezone, migration, budgeting and cloning rules. Old task records with explicit Packlista/Packning categories are projected as packing; ambiguous records remain visible under “Behöver sorteras”. Nothing is deleted by migration.

IndexedDB `family-travel-v1` persists records, files and the operation outbox before a save reports success. Related local mutations commit in one transaction. Outbox entries are chronological, drained including changes added during sync, and retained on failure. Web Locks prevent parallel flushes in tabs sharing one IndexedDB. Firebase updates individual records/fields, never whole trip lists. Remote snapshots overlay pending local patches. Deletion is an explicit tombstone; deleted trips hide their contents without destroying them.

Modal text drafts and quick-entry drafts persist locally. Incoming sync/status notifications do not rebuild an unchanged view or interrupt active inline input. Uploaded files are retained in the local file cache; retried batch uploads reuse already prepared files. Files selected in an unsaved form cannot be restored after closing the browser, as stated in the form.

Export includes deleted records, referenced files and covers. Import uses new record/file IDs and remaps relationships. It never replaces existing trips.

`travel-sw.js` is scoped to `budget/travel.html`, separate from the messaging worker. It caches the planner shell; files are held in IndexedDB. External map tiles, links and files not yet fetched need connectivity.

## Shared access

The workflow runs `scripts/travel-access.cjs` using the existing repository Firebase credential. If `family_travel_v1` lacks rules, it installs only that branch using the existing authenticated `family_todos_v2` read/write policy, preserving other branches. Existing travel access is preserved. No family data or credentials are printed. Missing credentials/policy fail verification instead of claiming cloud sync works.

## Verification

- `node --test budget/tests/travel.test.cjs`: migration, clock order, overlaps, midnight moves, timezones/DST, budgeting/refunds/shares and copy/reference rules.
- `node budget/tests/travel-browser.cjs`: WebKit mobile and desktop; dedicated workflows, two independent device contexts sharing an isolated Firebase fixture, Home canonical tasks, actual pointer drag, whole-trip date shift, bookings/payments/maps, batch uploads, document caching, backup/import, duplication, denied-write/reload/retry and geometry.
- Screenshots: `test-results/travel`. These are test-only fixtures and are never uploaded as user data.
