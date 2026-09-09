# Pulse Flow – checkpoint före stretch och meditation

- Datum: 2026-09-09
- Commit: `3d1f51b2fc7b0fc6de05c97563eb5c233a37f43f`
- Commitmeddelande: `Restore original large ECG while keeping compact glow`
- Checkpointgren: `checkpoint/pulse-flow-before-stretch-meditation-2026-09-09`
- Huvudsida: `budget/exercise.html`

Grenen pekar på tillståndet innan stretch och meditation infördes. Den innehåller det ursprungliga stora EKG:t och de senaste glow-justeringarna för små EKG:n och timers.

För att undersöka versionen lokalt utan att ändra main:

```sh
git fetch origin
git switch --detach 3d1f51b2fc7b0fc6de05c97563eb5c233a37f43f
```

För att återgå till main efter granskning:

```sh
git switch main
```

Checkpointen omfattar koden. Träningsloggar och andra uppgifter i Firebase återställs inte genom att byta kodversion.
