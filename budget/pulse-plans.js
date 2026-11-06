/* Four-week training plans built from the explorer's exercise catalogue.
   Shared by the explorer (inspiration) and the training planner (apply to weeks).
   Items: [exerciseId, sets, reps] for strength, {name, distance, time} for cardio.
   pattern: one array of 7 session keys (Mon–Sun, null = rest) per week. */
(function () {
  'use strict';
  var DAY_NAMES = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];
  var _ = null;
  function weeks(a, b) { return [a, b || a, a, b || a]; }
  function prog(id, sets, reps) {
    var p = window.PulseExplore && window.PulseExplore.programs.find(function (x) { return x.id === id; });
    return p ? p.ids.map(function (i) { return [i, sets || p.sets, reps || (Array.isArray(p.reps) ? p.reps[0] : p.reps)]; }) : [];
  }
  var plans = [
    {
      id: 'stronglifts-5x5', name: 'StrongLifts 5×5', group: 'Skivstång', level: 'Nybörjare', equipment: 'Skivstång & bänk', perWeek: 3,
      source: { label: 'stronglifts.com', url: 'https://stronglifts.com/stronglifts-5x5/workout-program/' },
      summary: 'Två helkroppspass, A och B, som växlar tre dagar i veckan. Fem tunga basövningar, fem set med fem repetitioner.',
      how: 'Klarar du alla 5×5 höjer du vikten nästa pass, 2,5 kg på överkroppen och 2,5–5 kg i knäböj och marklyft. Missar du repetitioner kör du samma vikt igen. Varje övning följs för sig.',
      weekNotes: ['Börja lätt, med ungefär hälften av din max', 'Lägg på vikt varje pass du klarar 5×5', 'Fortsätt höja så länge tekniken håller', 'Repetera vikten på övningar där du missade'],
      sessions: {
        A: { name: 'StrongLifts A', type: 'Helkropp', items: [[27, 5, 5], [5, 5, 5], [19, 5, 5]] },
        B: { name: 'StrongLifts B', type: 'Helkropp', items: [[27, 5, 5], [66, 5, 5], [28, 1, 5]] }
      },
      pattern: weeks(['A', _, 'B', _, 'A', _, _], ['B', _, 'A', _, 'B', _, _])
    },
    {
      id: 'gzclp-4', name: 'GZCLP · fyra dagar', group: 'Skivstång', level: 'Nybörjare–medel', equipment: 'Skivstång & latsdrag', perWeek: 4,
      source: { label: 'Liftosaur · GZCLP', url: 'https://www.liftosaur.com/programs/gzclp' },
      summary: 'Varje pass har en tung huvudövning (T1, 5×3), en volymövning (T2, 3×10) och en lätt hjälpövning (T3, 3×15).',
      how: 'Höj vikten när alla set går. Fastnar T1 byter du till 6×2 och sedan 10×1. Fastnar T2 byter du till 3×8 och sedan 3×6. Sista setet i T1 och T3 kan köras till max.',
      weekNotes: ['Välj T1-vikter som känns som 85 % av max', 'Höj vikten varje pass', 'Byt steg på de lyft som fastnar', 'Fortsätt; testa nytt max när steg 3 tar slut'],
      sessions: {
        A1: { name: 'GZCLP A1 · knäböj', type: 'Underkropp', items: [[27, 5, 3], [5, 3, 10], [10, 3, 15]] },
        B1: { name: 'GZCLP B1 · axelpress', type: 'Överkropp', items: [[66, 5, 3], [28, 3, 10], [19, 3, 15]] },
        A2: { name: 'GZCLP A2 · bänkpress', type: 'Överkropp', items: [[5, 5, 3], [27, 3, 10], [10, 3, 15]] },
        B2: { name: 'GZCLP B2 · marklyft', type: 'Underkropp', items: [[28, 5, 3], [66, 3, 10], [19, 3, 15]] }
      },
      pattern: weeks(['A1', 'B1', _, 'A2', 'B2', _, _])
    },
    {
      id: 'reddit-ppl', name: 'Push · Pull · Ben (6 dagar)', group: 'Gym', level: 'Nybörjare–medel', equipment: 'Gym', perWeek: 6,
      source: { label: 'Liftosaur · Reddit PPL', url: 'https://www.liftosaur.com/programs/metallicadpappl' },
      summary: 'Push, pull och ben två gånger i veckan med en vilodag. En tung basövning först, sedan hjälpövningar.',
      how: 'Basövningarna höjs varje pass du klarar alla repetitioner. Hjälpövningarna går från 8 till 12 repetitioner, och sedan höjer du vikten och börjar om på 8. Missar du tre pass i rad sänker du vikten med 10 %.',
      weekNotes: ['Lär dig övningarna med måttliga vikter', 'Lägg på vikt i basövningarna', 'Öka repetitionerna i hjälpövningarna', 'Fortsätt eller ta en lättare vecka om kroppen är sliten'],
      sessions: {
        PA: { name: 'Push · bänkpress', type: 'Bröst + Triceps', items: [[5, 5, 5], [66, 3, 8], [7, 3, 8], [3, 3, 8], [8, 3, 15]] },
        LA: { name: 'Pull · marklyft', type: 'Rygg + Biceps', items: [[28, 1, 5], [10, 3, 8], [11, 3, 8], [15, 5, 15], [17, 4, 8]] },
        BE: { name: 'Ben', type: 'Underkropp', items: [[27, 3, 5], [29, 3, 8], [21, 3, 8], [23, 3, 8], [26, 5, 8]] },
        PB: { name: 'Push · axelpress', type: 'Bröst + Triceps', items: [[66, 5, 5], [5, 3, 8], [7, 3, 8], [3, 3, 8], [8, 3, 15]] },
        LB: { name: 'Pull · rodd', type: 'Rygg + Biceps', items: [[19, 5, 5], [10, 3, 8], [11, 3, 8], [15, 5, 15], [17, 4, 8]] }
      },
      pattern: weeks(['PA', 'LA', 'BE', 'PB', 'LB', 'BE', _])
    },
    {
      id: 'bwf-rr', name: 'Recommended Routine · kroppsvikt', group: 'Kroppsstyrka', level: 'Nybörjare', equipment: 'Chinsstång, dips & bänk', perWeek: 3,
      source: { label: 'r/bodyweightfitness', url: 'https://redditbwf.github.io/wiki/recommended_routine.html' },
      summary: 'Helkropp tre dagar i veckan: tre par styrkeövningar (drag + ben, dips + höft, rodd + armhävningar) och tre bålövningar.',
      how: 'Kör 3 set med 5–8 repetitioner. När du klarar 3×8 byter du till en svårare variant, till exempel negativa chins till pull-ups eller knäböj till bulgarisk utfallsböj. Bålövningarna körs 3×8–12.',
      weekNotes: ['Hitta en variant där du klarar 5 repetitioner', 'Sikta på 6–7 repetitioner', 'Sikta på 3×8', 'Byt till en svårare variant där du klarar 3×8'],
      sessions: {
        RR: { name: 'Recommended Routine', type: 'Helkropp', items: [[59, 3, 5], [77, 3, 6], [54, 3, 5], [78, 3, 8], [74, 3, 6], [9, 3, 6], [32, 3, 30], [51, 3, 10], [75, 3, 10]] }
      },
      pattern: weeks(['RR', _, 'RR', _, 'RR', _, _])
    },
    {
      id: 'own-bodyweight-4w', name: 'Kroppsstyrka · fyra veckor', group: 'Kroppsstyrka', level: 'Alla nivåer', equipment: 'Kroppsvikt & låda', perWeek: 3, own: true,
      summary: 'Helkropp, överkropp och ben utan redskap, byggt av utforskarens kroppsviktsprogram. Fler repetitioner varje vecka och en lättare fjärde vecka.',
      how: 'Vecka 1 är bas. Vecka 2 har två repetitioner till per set, och vecka 3 ett extra set. Vecka 4 är lättare med ett set mindre, så att kroppen hinner återhämta sig.',
      progress: [{}, { reps: 2 }, { reps: 2, sets: 1 }, { sets: -1 }],
      weekNotes: ['Bas: lär dig rörelserna', '+2 repetitioner per set', '+1 set', 'Lätt vecka: ett set mindre'],
      sessions: {
        H: { name: 'Kroppsstyrka · helkropp', type: 'Helkropp', items: function () { return prog('mm-bodyonly-full'); } },
        O: { name: 'Kroppsstyrka · överkropp', type: 'Överkropp', items: function () { return prog('mm-bodyonly-upper'); } },
        B: { name: 'Kroppsstyrka · ben', type: 'Underkropp', items: function () { return prog('mm-bodyonly-legs'); } }
      },
      pattern: weeks(['H', _, 'O', _, 'B', _, _])
    },
    {
      id: 'own-barbell-4w', name: 'Skivstång · fyra veckor', group: 'Skivstång', level: 'Medel', equipment: 'Skivstång & bänk', perWeek: 3, own: true,
      summary: 'Helkropp A och B från utforskaren varvas tre dagar i veckan. Färre men tyngre repetitioner för varje vecka, och sedan en lätt vecka.',
      how: 'Vecka 1 kör du 3×8, vecka 2 3×6 med lite tyngre vikt och vecka 3 4×5 med tyngst vikt. Vecka 4 är en avlastningsvecka med 2×8 på lätt vikt.',
      progress: [{ sets: 3, reps: 8, abs: true }, { sets: 3, reps: 6, abs: true }, { sets: 4, reps: 5, abs: true }, { sets: 2, reps: 8, abs: true }],
      weekNotes: ['3×8 · måttlig vikt', '3×6 · lite tyngre', '4×5 · tyngst', '2×8 · avlastning'],
      sessions: {
        A: { name: 'Skivstång · helkropp A', type: 'Helkropp', items: function () { return prog('mm-barbell-full-a'); } },
        B: { name: 'Skivstång · helkropp B', type: 'Helkropp', items: function () { return prog('mm-barbell-full-b'); } }
      },
      pattern: weeks(['A', _, 'B', _, 'A', _, _], ['B', _, 'A', _, 'B', _, _])
    },
    {
      id: 'own-upper-lower', name: 'Över- och underkropp · fyra dagar', group: 'Gym', level: 'Medel', equipment: 'Gym', perWeek: 4, own: true,
      summary: 'Klassisk uppdelning i överkropp och underkropp två gånger i veckan, med fria vikter först och maskiner sist.',
      how: 'Vecka 1 kör du 3×10, vecka 2 3×8 tyngre och vecka 3 4×8. Vecka 4 är lätt med 2×10. Höj vikten i nästa fyraveckorsblock.',
      progress: [{ sets: 3, reps: 10, abs: true }, { sets: 3, reps: 8, abs: true }, { sets: 4, reps: 8, abs: true }, { sets: 2, reps: 10, abs: true }],
      weekNotes: ['3×10', '3×8 · tyngre', '4×8', '2×10 · lätt vecka'],
      sessions: {
        UA: { name: 'Överkropp A', type: 'Överkropp', items: [[5], [19], [44], [10], [17], [3]] },
        LA: { name: 'Underkropp A', type: 'Underkropp', items: [[27], [29], [21], [23], [26]] },
        UB: { name: 'Överkropp B', type: 'Överkropp', items: [[7], [18], [2], [20], [8], [15]] },
        LB: { name: 'Underkropp B', type: 'Underkropp', items: [[28], [30], [22], [31], [32]] }
      },
      pattern: weeks(['UA', 'LA', _, 'UB', 'LB', _, _])
    },
    {
      id: 'own-strength-run', name: 'Styrka och löpning · fyra dagar', group: 'Kondition', level: 'Alla nivåer', equipment: 'Gym & löpning', perWeek: 4, own: true,
      summary: 'Två helkroppspass och två löppass i veckan: ett kortare tempopass och ett längre lugnt pass.',
      how: 'Styrkepassen följer 3×8 med vikten höjd när det går. Löpningen ökar ungefär 10 % per vecka, och vecka 4 är lättare.',
      progress: [{}, { run: 1.1 }, { run: 1.2 }, { run: .8, sets: -1 }],
      weekNotes: ['Bas', 'Löpning +10 %', 'Löpning +20 %', 'Lätt vecka'],
      sessions: {
        S1: { name: 'Helkropp A', type: 'Helkropp', items: [[27, 3, 8], [5, 3, 8], [19, 3, 8], [32, 2, 30]] },
        R1: { name: 'Löpning · tempo', type: 'Kondition', items: [{ name: 'Löpning', distance: 5, time: 30 }] },
        S2: { name: 'Helkropp B', type: 'Helkropp', items: [[29, 3, 8], [44, 3, 8], [20, 3, 6], [53, 3, 10]] },
        R2: { name: 'Löpning · långpass', type: 'Kondition', items: [{ name: 'Löpning', distance: 8, time: 50 }] }
      },
      pattern: weeks(['S1', 'R1', _, 'S2', _, 'R2', _])
    }
  ];

  function items(session) { return typeof session.items === 'function' ? session.items() : session.items; }
  // One planned session in the training page's format for a given week (0–3).
  function session(plan, key, week) {
    var s = plan.sessions[key], step = (plan.progress && plan.progress[week]) || {}, X = window.PulseExplore;
    if (!s || !X) return null;
    var exercises = items(s).map(function (it) {
      if (!Array.isArray(it)) {
        var factor = step.run || 1;
        return { kind: 'cardio', name: it.name, distance: Math.round(it.distance * factor * 10) / 10, time: Math.round(it.time * factor) };
      }
      var e = X.exercises[it[0]];
      if (!e) return null;
      var sets = step.abs ? step.sets : (it[1] || 3) + (step.sets || 0);
      var reps = step.abs ? step.reps : (it[2] || 8) + (step.reps || 0);
      var timed = e.id === 32;
      if (e.group === 'Kondition') return { kind: 'cardio', name: e.name, distance: 0, time: 20 };
      return { kind: 'strength', name: e.name, sets: Math.max(1, sets), reps: timed ? (it[2] || 30) : Math.max(1, reps), weight: 0, weightMode: e.equipment === 'Kroppsvikt' ? 'bodyweight' : 'kg' };
    }).filter(Boolean);
    return { type: s.type, name: s.name, planId: plan.id, planName: plan.name, planWeek: week + 1, planWeeks: plan.pattern.length, exercises: exercises };
  }
  function find(id) { return plans.find(function (p) { return p.id === id; }) || null; }
  function sessionIds(plan, key) { return items(plan.sessions[key]).filter(Array.isArray).map(function (it) { return it[0]; }); }
  window.PulsePlans = { plans: plans, find: find, session: session, sessionIds: sessionIds, items: items, DAY_NAMES: DAY_NAMES };
})();
