/**
 * Firebase Realtime Sync Module v9
 * 
 * Syncs localStorage keys to Firebase Realtime Database for multi-device updates.
 * Self-contained: does NOT depend on indexeddb-fallback.js.
 * Realtime listeners for the keys this page uses, plus polling as a fallback:
 *   - Reads from Firebase every 3s while the WebSocket is down, every 30s while it is up
 *   - Checks localStorage every 1s for changes to push (local → remote)
 * Nothing polls while the page is hidden. The polling avoids depending on
 * monkey-patching localStorage.setItem, which fails silently on iOS Safari.
 */

let firebaseInitialized = false;
let authReady = false;
let authUser = null;
let db = null;
let syncEnabled = true;
const syncQueue = {};
let remotePollTimer = null;
let localPollInterval = null;
let remotePolling = null;
let lastRemotePollAt = 0;
// True while the realtime WebSocket is up (Firebase '.info/connected'). Polling is then only a slow safety net.
let realtimeConnected = false;
const lastKnownValues = {};
// Keys whose server value was actually read this session. A key the first load never
// reached (e.g. the request failed) is not pushed from the local copy, which may be old.
const remoteCheckedKeys = new Set();
const isShoppingPage = /\/(?:budget\/)?shopping\.html$/i.test(window.location.pathname);
console.log('[Firebase] firebase-sync.js v9 loaded');

// Save REAL localStorage methods before any monkey-patching.
const _realSetItem = localStorage.setItem.bind(localStorage);
const _realGetItem = localStorage.getItem.bind(localStorage);
const _nativeStorageGetItem = Storage.prototype.getItem;
const _nativeStorageSetItem = Storage.prototype.setItem;

const EXERCISE_KEYS = [
  'ex_wk',
  'ex_goals',
  'ex_templates',
  'ex_weekTemplates',
  'ex_plannedSessions',
  'ex_weekPlans',
  'ex_prs',
  'ex_plan',
  'ex_vo2',
  'ex_hiddenExerciseNamesV1',
  'ex_gyms'          // gym profiles and their equipment (exercise explorer programme filter)
];
const isPulseFieldPage = /\/training-pulse-field\.html$/i.test(window.location.pathname);
const isExercisePage = /\/(?:exercise|training-pulse-field)\.html$/i.test(window.location.pathname);
const requestedExerciseUser = new URLSearchParams(window.location.search).get('user');
const exerciseUser = requestedExerciseUser && requestedExerciseUser.toLowerCase() === 'maja' ? 'maja' : 'markus';

function scopedExerciseKey(key) {
  if (!isExercisePage || !EXERCISE_KEYS.includes(key)) return key;
  return exerciseUser === 'maja' ? `${key}_maja` : key;
}

function logicalExerciseKey(key) {
  if (!isExercisePage || exerciseUser !== 'maja' || !key.endsWith('_maja')) return key;
  const baseKey = key.slice(0, -5);
  return EXERCISE_KEYS.includes(baseKey) ? baseKey : key;
}

// Scope exercise storage before exercise.html's inline script runs. Markus keeps the
// original keys; Maja receives a completely separate *_maja data set.
Storage.prototype.getItem = function(key) {
  const stringKey = String(key);
  const mappedKey = this === localStorage ? scopedExerciseKey(stringKey) : stringKey;
  return _nativeStorageGetItem.call(this, mappedKey);
};

const firebaseConfig = window.FIREBASE_CONFIG || {
  apiKey: "AIzaSyCgGL762gcglRpix4-akfP7NydFj5ChxfM",
  authDomain: "frick-budget.firebaseapp.com",
  projectId: "frick-budget",
  storageBucket: "frick-budget.firebasestorage.app",
  messagingSenderId: "231130144804",
  appId: "1:231130144804:web:49ad446a858c585d2838b1",
  databaseURL: "https://frick-budget-default-rtdb.europe-west1.firebasedatabase.app"
};

const SYNC_KEYS = [
  "budgetTracker",
  "budgetTracker_maja",
  "savingsGoals",
  "savingsGoals_maja",
  "familjebudget_data",
  "home_transfer_income_v1",
  "darkMode",
  "sh_lists",
  "sh_saved_templates",
  "sh_active_template_id",
  "sh_header_title",
  "sh_store_places",      // where items go in each shop, learned from dragging (shopping-store-sort-v1.js)
  "pay_merchant_rules",   // which budget post each shop goes to, learned in the Apple Pay inbox (budget-pay-inbox-v1.js)
  "pay_recurring_done",   // fixed ICA-card costs already sorted this month in the Apple Pay inbox
  "cal_events",
  "cal_todos",
  "cal_notif",
  "cal_trip",
  ...EXERCISE_KEYS,
  ...EXERCISE_KEYS.map(key => `${key}_maja`)
];

/*
 * Keys this page actually shows and edits. Realtime listeners and polling only cover these;
 * the one-time load at start still reads every key, so other pages open with fresh data.
 * Training pages: the active profile's training keys. Shopping: the list keys. Others: all.
 */
const LIVE_KEYS = isExercisePage
  ? EXERCISE_KEYS.map(key => exerciseUser === 'maja' ? `${key}_maja` : key).concat('darkMode')
  : isShoppingPage
    ? SYNC_KEYS.filter(key => key.startsWith('sh_')).concat('darkMode')
    : SYNC_KEYS.slice();
const REMOTE_POLL_OFFLINE_MS = 3000;   // WebSocket down (seen on iOS): poll as before
const REMOTE_POLL_ONLINE_MS = 30000;   // WebSocket up: listeners deliver, poll only as a safety net

/** Safe write to localStorage (won't throw even if blocked on iOS) */
function safeSetLocal(key, value) {
  try { _realSetItem(key, value); return true; }
  catch (e) { return false; }
}

/** Initialize Firebase and start syncing */
async function initFirebaseSync() {
  if (firebaseInitialized) return;
  try {
    if (typeof firebase === 'undefined') {
      console.log('[Firebase] Waiting for SDK...');
      await new Promise((resolve, reject) => {
        const iv = setInterval(() => {
          if (typeof firebase !== 'undefined') { clearInterval(iv); resolve(); }
        }, 100);
        setTimeout(() => { clearInterval(iv); reject(new Error('SDK timeout')); }, 5000);
      });
    }
    const app = (firebase.apps && firebase.apps.length)
      ? firebase.app()
      : firebase.initializeApp(firebaseConfig);

    if (firebase.auth && !authReady) {
      const auth = firebase.auth(app);
      try {
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      } catch (error) {
        console.warn('[Firebase] Auth persistence fallback:', error.message);
      }
      auth.onAuthStateChanged((user) => {
        authUser = user || null;
        authReady = true;
        if (user && !firebaseInitialized) {
          bootstrapFirebaseSync(app);
        }
      });
      if (!auth.currentUser) {
        console.log('[Firebase] Waiting for auth user before starting sync');
        return;
      }
      authUser = auth.currentUser;
      authReady = true;
    }

    bootstrapFirebaseSync(app);
  } catch (error) {
    console.warn('[Firebase] ✗ Failed to initialize:', error.message);
    syncEnabled = false;
  }
}

async function bootstrapFirebaseSync(app) {
  if (firebaseInitialized) return;
  db = firebase.database(app);
  firebaseInitialized = true;
  console.log('[Firebase] ✓ Connected to Realtime Database');

  if (!authUser && firebase.auth && firebase.auth(app).currentUser) {
    authUser = firebase.auth(app).currentUser;
  }

  if (!authUser && firebase.auth) {
    console.log('[Firebase] Sync paused until login');
    return;
  }

  await loadAllFromFirebase();
  // Pages that must build on fresh remote data (budget auto months) wait for this.
  window.__firebaseInitialLoadDone = true;
  window.dispatchEvent(new Event('firebase-initial-load'));
  await runBodyweight78Migration();
  setupRealtimeListeners();
  scheduleRemotePoll();
  startLocalPolling();
}

/**
 * One-time data fix for Markus: every strength exercise he logged at exactly
 * 78 kg was really bodyweight. Convert those to weightMode 'bodyweight' and keep
 * the 78 kg as the session's body mass so volume stays the same. Idempotent:
 * once converted nothing matches any more, so other devices can safely re-run it.
 */
const MARKUS_BODY_MASS = 78;
function isMass78(v) { return Number(v) === MARKUS_BODY_MASS; }
function bodyweight78Exercise(ex) {
  if (!ex || typeof ex !== 'object' || ex.weightMode === 'bodyweight') return false;
  if ((ex.kind || ((ex.distance || ex.time) ? 'cardio' : 'strength')) !== 'strength') return false;
  const logs = Array.isArray(ex.logs) ? ex.logs : [];
  const logWeights = logs.map(log => Number(log && log.actualWeight) || 0).filter(Boolean);
  if (logWeights.length) return logWeights.every(isMass78) && (!Number(ex.weight) || isMass78(ex.weight));
  return isMass78(ex.weight);
}
function convertBodyweight78(ex) {
  ex.weightMode = 'bodyweight';
  ex.weight = 0;
  if (Array.isArray(ex.logs)) ex.logs.forEach(log => { if (log) { log.actualWeight = 0; log.weightMode = 'bodyweight'; } });
}
function migrateBodyweight78(store) {
  const names = new Set();
  let changed = false;
  const fixList = (list, workout) => (Array.isArray(list) ? list : []).forEach(ex => {
    if (!bodyweight78Exercise(ex)) return;
    convertBodyweight78(ex);
    names.add(String(ex.name || '').trim().toLocaleLowerCase('sv-SE'));
    if (workout && !(Number(workout.bodyweightKg) > 0)) workout.bodyweightKg = MARKUS_BODY_MASS;
    changed = true;
  });
  (Array.isArray(store.ex_wk) ? store.ex_wk : []).forEach(w => w && fixList(w.exercises, w));
  const templates = store.ex_templates;
  (Array.isArray(templates) ? templates : Object.values(templates || {})).forEach(t => t && fixList(t.exercises));
  Object.values(store.ex_plannedSessions || {}).forEach(day => day && fixList(day.exercises));
  if (store.ex_prs && typeof store.ex_prs === 'object') Object.keys(store.ex_prs).forEach(name => {
    if (isMass78(store.ex_prs[name]) && names.has(name.trim().toLocaleLowerCase('sv-SE'))) { delete store.ex_prs[name]; changed = true; }
  });
  if (changed && store.ex_goals && typeof store.ex_goals === 'object' && !(Number(store.ex_goals.bodyweightKg) > 0)) store.ex_goals.bodyweightKg = MARKUS_BODY_MASS;
  return changed;
}
/**
 * One-time import for Markus: outdoor runs from his watch that he asked to have
 * in the training log. Each run has a fixed id (its start time), so it is only
 * added once, and it is skipped if a run of about the same distance is already
 * logged that day.
 */
const WATCH_RUNS_2026 = [{"id":1777661160000,"date":"2026-05-01","type":"Löpning","exercises":[{"kind":"cardio","name":"Löpning","distance":2.34,"time":16.0667}],"duration":16,"hrAvg":150,"hrMax":159,"hrMin":85,"vo2":null,"runDistance":2.34,"runTime":16.0667,"avgPaceKm":6.8667,"runMetricsDerived":false,"notes":"Utomhuslöpning","source":"apple-watch","startTime":"20:46","kcalActive":146,"kcalTotal":171,"elevationM":7,"powerW":186,"cadenceSpm":159,"splits":[{"km":1,"timeSec":408,"paceSec":408,"hr":143},{"km":2,"timeSec":408,"paceSec":408,"hr":155},{"km":3,"timeSec":143,"paceSec":421,"hr":154}]},{"id":1777829460000,"date":"2026-05-03","type":"Löpning","exercises":[{"kind":"cardio","name":"Löpning","distance":1.73,"time":12.9167}],"duration":13,"hrAvg":157,"hrMax":169,"hrMin":84,"vo2":null,"runDistance":1.73,"runTime":12.9167,"avgPaceKm":7.45,"runMetricsDerived":false,"notes":"Utomhuslöpning","source":"apple-watch","startTime":"19:31","kcalActive":126,"kcalTotal":147,"powerW":107,"cadenceSpm":149,"splits":[{"km":1,"timeSec":426,"paceSec":426,"hr":152},{"km":2,"timeSec":337,"paceSec":458,"hr":164}]},{"id":1778004840000,"date":"2026-05-05","type":"Löpning","exercises":[{"kind":"cardio","name":"Löpning","distance":4.39,"time":26.8}],"duration":27,"hrAvg":165,"hrMax":null,"hrMin":null,"vo2":null,"runDistance":4.39,"runTime":26.8,"avgPaceKm":6.1,"runMetricsDerived":false,"notes":"Utomhuslöpning","source":"apple-watch","startTime":"20:14","kcalActive":295,"kcalTotal":337,"elevationM":14,"powerW":207,"cadenceSpm":160},{"id":1778261940000,"date":"2026-05-08","type":"Löpning","exercises":[{"kind":"cardio","name":"Löpning","distance":3.81,"time":22.55}],"duration":23,"hrAvg":168,"hrMax":182,"hrMin":106,"vo2":null,"runDistance":3.81,"runTime":22.55,"avgPaceKm":5.9333,"runMetricsDerived":false,"notes":"Utomhuslöpning","source":"apple-watch","startTime":"19:39","elevationM":27,"powerW":212,"splits":[{"km":1,"timeSec":349,"paceSec":349,"hr":152},{"km":2,"timeSec":346,"paceSec":346,"hr":172},{"km":3,"timeSec":362,"paceSec":362,"hr":174},{"km":4,"timeSec":296,"paceSec":366,"hr":175}]},{"id":1779094680000,"date":"2026-05-18","type":"Löpning","exercises":[{"kind":"cardio","name":"Löpning","distance":4.65,"time":29.4833}],"duration":29,"hrAvg":167,"hrMax":183,"hrMin":117,"vo2":null,"runDistance":4.65,"runTime":29.4833,"avgPaceKm":6.3333,"runMetricsDerived":false,"notes":"Utomhuslöpning","source":"apple-watch","startTime":"10:58","kcalActive":348,"kcalTotal":394,"elevationM":26,"powerW":204,"cadenceSpm":162,"effort":8,"splits":[{"km":1,"timeSec":357,"paceSec":357,"hr":144},{"km":2,"timeSec":388,"paceSec":388,"hr":167},{"km":3,"timeSec":377,"paceSec":377,"hr":175},{"km":4,"timeSec":383,"paceSec":383,"hr":177},{"km":5,"timeSec":261,"paceSec":399,"hr":176}]},{"id":1782926760000,"date":"2026-07-01","type":"Löpning","exercises":[{"kind":"cardio","name":"Löpning","distance":3.09,"time":20.9833}],"duration":21,"hrAvg":158,"hrMax":172,"hrMin":102,"vo2":null,"runDistance":3.09,"runTime":20.9833,"avgPaceKm":6.7667,"runMetricsDerived":false,"notes":"Utomhuslöpning","source":"apple-watch","startTime":"19:26","kcalActive":212,"kcalTotal":245,"elevationM":15,"powerW":189,"cadenceSpm":158,"effort":6,"splits":[{"km":1,"timeSec":395,"paceSec":395,"hr":146},{"km":2,"timeSec":405,"paceSec":405,"hr":163},{"km":3,"timeSec":413,"paceSec":413,"hr":164},{"km":4,"timeSec":43,"paceSec":429,"hr":164}]}];
const WATCH_RUNS_MARK = 'watchRunsImported20261102';
function addWatchRuns(store) {
  // Imported once per account: a synced mark in the goals keeps a run he later
  // deletes from coming back on the next load or on another device.
  if (store.ex_goals && store.ex_goals[WATCH_RUNS_MARK]) return false;
  if (!Array.isArray(store.ex_wk)) store.ex_wk = [];
  store.ex_goals = Object.assign({ weeklyWk: 4, runDistanceGoal: 10, vo2Goal: 45 }, store.ex_goals || {}, { [WATCH_RUNS_MARK]: true });
  let changed = true;
  WATCH_RUNS_2026.forEach(run => {
    if (store.ex_wk.some(w => w && String(w.id) === String(run.id))) return;
    const sameDay = store.ex_wk.some(w => w && w.date === run.date && (w.exercises || []).some(ex => ex && Math.abs((Number(ex.distance) || 0) - run.runDistance) < 0.2));
    if (sameDay) return;
    store.ex_wk.push(JSON.parse(JSON.stringify(run)));
    changed = true;
  });
  return changed;
}
/**
 * One-time: Markus' weekly VO2 max from the watch's fitness view. Each week's value
 * goes on the cardio passes logged that week (where none is set) and into the VO2
 * history, unless that week already has a VO2 entry. A synced mark keeps it to once.
 */
const WATCH_VO2_WEEKS = [
  ['2026-04-27', 41.9], ['2026-05-04', 43.7], ['2026-05-11', 43.6], ['2026-05-18', 43.8],
  ['2026-06-01', 42.9], ['2026-06-15', 42.9], ['2026-06-22', 42.9], ['2026-06-29', 42.5],
  ['2026-08-24', 42.1], ['2026-08-31', 42.8], ['2026-09-21', 43.7]
];
const WATCH_VO2_MARK = 'watchVo2Imported20261102';
function isoPlusDays(iso, days) { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); }
function isCardioWorkout(w) {
  return !!w && (Number(w.runDistance) > 0 || (w.exercises || []).some(ex => ex && (ex.kind === 'cardio' || Number(ex.distance) > 0)));
}
function isRunWorkout(w) {
  if (!w) return false;
  const words = [w.type, w.name].concat((w.exercises || []).map(ex => ex && ex.name)).join(' ');
  return /löp|run|jogg/i.test(words);
}
function addWatchVo2(store) {
  // Only running passes without a VO2 of their own get the week's value.
  if (store.ex_goals && store.ex_goals[WATCH_VO2_MARK]) return false;
  if (!Array.isArray(store.ex_wk)) store.ex_wk = [];
  WATCH_VO2_WEEKS.forEach(([monday, score]) => {
    const sunday = isoPlusDays(monday, 6);
    store.ex_wk.forEach(w => {
      if (w && String(w.date) >= monday && String(w.date) <= sunday && isRunWorkout(w) && !(Number(w.vo2) > 0)) w.vo2 = score;
    });
  });
  store.ex_goals = Object.assign({ weeklyWk: 4, runDistanceGoal: 10, vo2Goal: 45 }, store.ex_goals || {}, { [WATCH_VO2_MARK]: true, [WATCH_VO2_FIX_MARK]: true });
  return true;
}
/**
 * Undo the first VO2 import's extras: the history entries it added for each week and
 * the week values it put on cardio passes that are not runs.
 */
const WATCH_VO2_FIX_MARK = 'watchVo2Fixed20261102';
function fixWatchVo2(store) {
  if (!store.ex_goals || !store.ex_goals[WATCH_VO2_MARK] || store.ex_goals[WATCH_VO2_FIX_MARK]) return false;
  const workouts = Array.isArray(store.ex_wk) ? store.ex_wk : [];
  WATCH_VO2_WEEKS.forEach(([monday, score]) => {
    const sunday = isoPlusDays(monday, 6);
    const inWeek = date => String(date) >= monday && String(date) <= sunday;
    workouts.forEach(w => { if (w && inWeek(w.date) && isCardioWorkout(w) && !isRunWorkout(w) && Number(w.vo2) === score) w.vo2 = null; });
    const cardioDates = workouts.filter(w => w && inWeek(w.date) && isCardioWorkout(w)).map(w => String(w.date));
    if (Array.isArray(store.ex_vo2)) store.ex_vo2 = store.ex_vo2.filter(e => !(e && inWeek(e.date) && Number(e.score) === score && (String(e.date) === sunday || cardioDates.includes(String(e.date)))));
  });
  store.ex_goals[WATCH_VO2_FIX_MARK] = true;
  return true;
}
/**
 * One-time backfill for Markus: workouts saved before body mass was stored per
 * session (or while no mass was set) get his current body mass, so bodyweight
 * exercises count in total volume. Only adds fields; nothing is removed, and
 * sessions that already hold a mass keep it. Maja's data is never touched.
 */
const BODYWEIGHT_BACKFILL_MARK = 'bodyweightBackfill20261105';
function backfillBodyweight(store) {
  if (store.ex_goals && store.ex_goals[BODYWEIGHT_BACKFILL_MARK]) return false;
  if (!Array.isArray(store.ex_wk)) return false;
  const mass = Number(store.ex_goals && store.ex_goals.bodyweightKg) > 0 ? Number(store.ex_goals.bodyweightKg) : MARKUS_BODY_MASS;
  let count = 0;
  store.ex_wk.forEach(w => {
    if (!w || typeof w !== 'object' || Number(w.bodyweightKg) > 0) return;
    const usesBodyweight = (w.exercises || []).some(ex => ex && ex.weightMode === 'bodyweight'
      && (ex.kind || ((ex.distance || ex.time) ? 'cardio' : 'strength')) === 'strength');
    if (!usesBodyweight) return;
    w.bodyweightKg = mass;
    w.bodyweightBackfilled = true;
    count++;
  });
  store.ex_goals = Object.assign({ weeklyWk: 4, runDistanceGoal: 10, vo2Goal: 45 }, store.ex_goals || {}, { [BODYWEIGHT_BACKFILL_MARK]: { date: '2026-11-05', mass, workouts: count } });
  return true;
}

async function runBodyweight78Migration() {
  if (!isExercisePage || !db || !syncEnabled) return;
  const keys = ['ex_wk', 'ex_templates', 'ex_plannedSessions', 'ex_prs', 'ex_goals', 'ex_vo2'];
  const before = {}, store = {};
  // Work only on what the server holds right now. A device whose first load failed
  // or that has an old local copy must never push that copy back over newer data.
  try {
    for (const key of keys) {
      const snapshot = await db.ref(key).get();
      before[key] = snapshot.exists() ? snapshot.val() : null;
      store[key] = before[key] ? JSON.parse(before[key]) : null;
    }
  } catch (error) {
    console.warn('[Firebase] Training data fixes skipped, server read failed:', error.message);
    return;
  }
  const fixed = migrateBodyweight78(store);
  const added = addWatchRuns(store);
  const vo2Fixed = fixWatchVo2(store);
  const vo2Added = addWatchVo2(store);
  const backfilled = backfillBodyweight(store);
  if (!fixed && !added && !vo2Added && !vo2Fixed && !backfilled) return;
  // Keep the untouched workout list on this device before anything is written.
  if (backfilled && before.ex_wk) safeSetLocal('ex_wk_backup_before_bodyweight_backfill', before.ex_wk);
  let workoutsFailed = false;
  for (const key of keys) {
    if (store[key] == null) continue;
    // If the workouts could not be written, leave the backfill unmarked so it runs again.
    if (key === 'ex_goals' && workoutsFailed && backfilled) delete store.ex_goals[BODYWEIGHT_BACKFILL_MARK];
    const value = JSON.stringify(store[key]);
    if (value === before[key]) continue;
    try {
      // Commit only if the server still holds the value the fix was computed from.
      const result = await db.ref(key).transaction(current => (current == null || current === before[key]) && (before[key] != null || current == null) ? value : undefined);
      if (!result || !result.committed) { if (key === 'ex_wk') workoutsFailed = true; console.warn('[Firebase] Training data fix skipped, data changed meanwhile:', key); continue; }
    } catch (error) { if (key === 'ex_wk') workoutsFailed = true; console.warn('[Firebase] Training data fix failed', key, error.message); continue; }
    safeSetLocal(key, value);
    lastKnownValues[key] = value;
    if (exerciseUser === 'markus') window.dispatchEvent(new CustomEvent('firebase-sync', { detail: { key, value } }));
  }
  console.log('[Firebase] One-time training data fixes applied', { fixed, added, vo2Added, vo2Fixed, backfilled });
}

/**
 * Load all keys from Firebase (one-time REST-like fetch).
 * Writes directly to localStorage using _realSetItem (bypasses monkey-patch).
 */
async function loadAllFromFirebase() {
  if (!db) return;
  try {
    for (const key of SYNC_KEYS) {
      const snapshot = await db.ref(key).get();
      remoteCheckedKeys.add(key);
      if (snapshot.exists()) {
        const value = snapshot.val();
        if (isShoppingPage && key.startsWith('sh_')) {
          // The shopping UI may already be rendered while the initial fetch runs.
          handleRemoteUpdate(key, value);
        } else {
          const previousValue = _realGetItem(key);
          safeSetLocal(key, value);
          lastKnownValues[key] = value;
          // Pages may have rendered before the initial asynchronous Firebase load.
          // Refresh finance views if their shared income / transfer source changed.
          if (previousValue !== value &&
              (key === 'familjebudget_data' || key === 'home_transfer_income_v1')) {
            window.dispatchEvent(new CustomEvent('firebase-sync', {
              detail: { key, value }
            }));
          }
        }
        console.log(`[Firebase] Loaded '${key}'`);
      }
    }
  } catch (error) {
    console.warn('[Firebase] Load failed:', error.message);
  }
}

/**
 * Real-time listeners (WebSocket-based) for this page's keys.
 * May not work on iOS Safari — polling acts as fallback.
 */
function setupRealtimeListeners() {
  if (!db) return;
  for (const key of LIVE_KEYS) {
    db.ref(key).on('value', (snapshot) => {
      if (!snapshot.exists()) return;
      handleRemoteUpdate(key, snapshot.val());
    }, (error) => {
      console.warn(`[Firebase] Listener error '${key}':`, error.message);
    });
  }
  try {
    db.ref('.info/connected').on('value', (snapshot) => {
      const connected = snapshot.val() === true;
      if (connected === realtimeConnected) return;
      realtimeConnected = connected;
      scheduleRemotePoll();
    });
  } catch (_) { realtimeConnected = false; }
  console.log(`[Firebase] Real-time listeners active (${LIVE_KEYS.length} keys)`);
}

/**
 * Read this page's keys once from Firebase. A key with a local edit waiting to be pushed,
 * or edited while the read ran, keeps the local value.
 */
async function pollRemoteOnce() {
  if (!db) return;
  if (remotePolling) return remotePolling;
  lastRemotePollAt = Date.now();
  remotePolling = (async () => {
    for (const key of LIVE_KEYS) {
      if (syncQueue[key]) continue;
      const before = lastKnownValues[key];
      try {
        const snapshot = await db.ref(key).get();
        if (snapshot.exists() && !syncQueue[key] && lastKnownValues[key] === before) {
          handleRemoteUpdate(key, snapshot.val());
        }
      } catch (error) { break; /* offline: retry next round */ }
    }
  })();
  try { await remotePolling; } finally { remotePolling = null; }
}

/**
 * Remote polling (fallback for a broken WebSocket on iOS). Every 3 s while the realtime
 * connection is down, every 30 s while it is up, and not at all while the page is hidden.
 */
function scheduleRemotePoll() {
  clearTimeout(remotePollTimer);
  remotePollTimer = null;
  if (!db || document.hidden) return;
  const delay = realtimeConnected ? REMOTE_POLL_ONLINE_MS : REMOTE_POLL_OFFLINE_MS;
  remotePollTimer = setTimeout(async () => {
    await pollRemoteOnce();
    scheduleRemotePoll();
  }, delay);
}

/**
 * Push local changes that the setItem patch could not catch (iOS tracking prevention
 * can make it fail silently; edits may then sit in IndexedDB via indexeddb-fallback.js).
 */
async function flushLocalChanges() {
  if (!db || !syncEnabled) return;
  for (const key of LIVE_KEYS) {
    let currentValue = null;
    try {
      currentValue = _realGetItem(key);
    } catch (e) { /* blocked */ }

    if ((currentValue === null || currentValue === lastKnownValues[key])
         && typeof fallbackGetItem !== 'undefined') {
      try {
        const idbValue = await fallbackGetItem(key);
        if (idbValue !== null && idbValue !== lastKnownValues[key]) {
          currentValue = idbValue;
        }
      } catch (e) { /* IndexedDB read failed */ }
    }

    if (currentValue !== null && currentValue !== lastKnownValues[key]) {
      console.log(`[Firebase] Local change detected: '${key}'`);
      lastKnownValues[key] = currentValue;
      syncToFirebase(key, currentValue);
    }
  }
}

/** Check for local changes every second while the page is visible. */
function startLocalPolling() {
  if (localPollInterval || document.hidden) return;
  for (const key of LIVE_KEYS) {
    if (lastKnownValues[key] === undefined && !remoteCheckedKeys.has(key)) {
      try { lastKnownValues[key] = _realGetItem(key); } catch (_) {}
    }
  }
  localPollInterval = setInterval(flushLocalChanges, 1000);
}

function stopLocalPolling() {
  clearInterval(localPollInterval);
  localPollInterval = null;
}

/*
 * Hidden page (another tab, locked phone, Home Screen app in the background): push what is
 * waiting and stop all polling. Back in view: read the latest once, then resume.
 * This also covers the old shopping-only refresh on resume.
 */
function onPageHidden() {
  if (!db) return;
  flushLocalChanges();
  stopLocalPolling();
  clearTimeout(remotePollTimer);
  remotePollTimer = null;
}
async function onPageShown() {
  if (!db || document.hidden) return;
  startLocalPolling();
  if (Date.now() - lastRemotePollAt > 2000) await pollRemoteOnce();
  scheduleRemotePoll();
}
document.addEventListener('visibilitychange', () => { if (document.hidden) onPageHidden(); else onPageShown(); });
window.addEventListener('pagehide', onPageHidden);
window.addEventListener('pageshow', onPageShown);
window.addEventListener('focus', onPageShown);

/**
 * Handle a remote update from Firebase (via listener OR polling).
 * Writes to localStorage and dispatches event for page UI refresh.
 */
function handleRemoteUpdate(key, value) {
  if (lastKnownValues[key] === value) return;
  // A local write is about to be pushed: it wins, so an older remote value must not overwrite it
  // locally in the meantime (the polling path already skips these keys).
  if (syncQueue[key]) return;
  console.log(`[Firebase] Remote update: '${key}'`);
  lastKnownValues[key] = value;
  safeSetLocal(key, value);

  const eventKey = logicalExerciseKey(key);
  if (isExercisePage && exerciseUser === 'maja' && EXERCISE_KEYS.includes(key)) return;
  if (isExercisePage && exerciseUser === 'markus' && key.endsWith('_maja')) return;

  window.dispatchEvent(new CustomEvent('firebase-sync', {
    detail: { key: eventKey, value }
  }));
}

/** Write to Firebase (debounced 500ms) */
function syncToFirebase(key, value) {
  if (!syncEnabled || !db) return;
  lastKnownValues[key] = value;
  if (syncQueue[key]) clearTimeout(syncQueue[key]);
  syncQueue[key] = setTimeout(async () => {
    try {
      await db.ref(key).set(value);
      console.log(`[Firebase] Synced '${key}'`);
    } catch (error) {
      console.warn(`[Firebase] Sync failed '${key}':`, error.message);
    }
    delete syncQueue[key];
  }, 500);
}

/** Scope localStorage writes and auto-sync tracked keys to Firebase. */
Storage.prototype.setItem = function(key, value) {
  const stringKey = String(key);
  const mappedKey = this === localStorage ? scopedExerciseKey(stringKey) : stringKey;
  try {
    _nativeStorageSetItem.call(this, mappedKey, value);
  } catch (error) {
    if (this === localStorage && typeof fallbackSetItem !== 'undefined') {
      fallbackSetItem(mappedKey, value).catch(() => {});
    }
  }
  if (this === localStorage && SYNC_KEYS.includes(mappedKey)) {
    syncToFirebase(mappedKey, value);
  }
};

/** Force reload all data from Firebase */
async function forceSyncFromFirebase() {
  console.log('[Firebase] Forcing full sync...');
  for (const key of SYNC_KEYS) delete lastKnownValues[key];
  await loadAllFromFirebase();
  window.dispatchEvent(new Event('firebase-force-sync'));
}

function isFirebaseConnected() {
  return syncEnabled && firebaseInitialized && db !== null;
}

function switchExerciseUser(user) {
  if (!isExercisePage || !['markus', 'maja'].includes(user)) return;
  const url = new URL(window.location.href);
  url.searchParams.set('user', user);
  window.location.href = url.toString();
}

function applyExerciseUserToggle() {
  // Pulse Field owns its profile switch and title; only share data scoping here.
  if (!isExercisePage || isPulseFieldPage) return;

  document.title = `${exerciseUser === 'maja' ? 'Maja' : 'Markus'} Träning`;
  const brandSub = document.querySelector('.brand-text p');
  if (brandSub) brandSub.textContent = exerciseUser === 'maja' ? 'Maja' : 'Markus';

  const header = document.querySelector('.app-header');
  const brand = document.querySelector('.app-header .brand');
  if (!header || !brand || document.getElementById('exercise-user-toggle')) return;

  const style = document.createElement('style');
  style.id = 'exercise-user-toggle-style';
  style.textContent = `
    .exercise-user-toggle {
      display:flex;
      align-items:center;
      flex-shrink:0;
      height:30px;
      max-height:30px;
      padding:2px;
      gap:1px;
      border:1px solid var(--profile-border,var(--border));
      border-radius:9px;
      background:rgba(255,255,255,.035);
    }
    .exercise-user-option {
      display:flex;
      align-items:center;
      justify-content:center;
      min-width:0 !important;
      min-height:26px !important;
      height:26px !important;
      margin:0 !important;
      border:0;
      background:transparent;
      color:var(--profile-muted,var(--text-sec));
      border-radius:7px;
      padding:0 8px !important;
      font:600 10px/1 'Inter',sans-serif;
      cursor:pointer;
      transition:background .15s,color .15s,box-shadow .15s;
    }
    #exercise-user-toggle .exercise-user-option.active {
      background:var(--profile-soft,var(--accent-dim));
      color:var(--profile-accent,var(--accent));
      box-shadow:inset 0 0 0 1px var(--profile-border,var(--border-a)),0 0 12px var(--profile-glow,transparent);
    }
    @media(max-width:430px) {
      .app-header { gap:7px !important; padding-left:12px !important; padding-right:12px !important; }
      .exercise-user-option { min-height:24px !important; height:24px !important; padding:0 7px !important; font-size:9px !important; }
      .streak-badge { padding-left:8px !important; padding-right:8px !important; }
    }
  `;
  document.head.appendChild(style);

  const toggle = document.createElement('div');
  toggle.id = 'exercise-user-toggle';
  toggle.className = 'exercise-user-toggle';
  toggle.setAttribute('role', 'group');
  toggle.setAttribute('aria-label', 'Välj träningsprofil');
  toggle.innerHTML = `
    <button type="button" class="exercise-user-option${exerciseUser === 'markus' ? ' active' : ''}" data-user="markus">Markus</button>
    <button type="button" class="exercise-user-option${exerciseUser === 'maja' ? ' active' : ''}" data-user="maja">Maja</button>
  `;
  toggle.addEventListener('click', event => {
    const button = event.target.closest('[data-user]');
    if (!button || button.dataset.user === exerciseUser) return;
    switchExerciseUser(button.dataset.user);
  });
  brand.insertAdjacentElement('afterend', toggle);
}

// Exercise page layout correction for native date controls.
function applyExerciseLogDateFieldFix() {
  if (!isExercisePage || isPulseFieldPage) return;
  const style = document.createElement('style');
  style.id = 'exercise-log-date-field-fix';
  style.textContent = `
    .log-detail-row .form-group {
      min-width: 0 !important;
      overflow: visible !important;
    }
    .log-detail-row input {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      text-align: left !important;
    }
    .log-detail-row input[type="date"] {
      text-align: left !important;
      direction: ltr !important;
    }
    .log-detail-row input[type="date"]::-webkit-datetime-edit,
    .log-detail-row input[type="date"]::-webkit-datetime-edit-fields-wrapper {
      text-align: left !important;
      padding: 0 !important;
    }

    @media (max-width: 430px) {
      .log-detail-box {
        overflow-x: visible !important;
      }
      .log-detail-box .log-detail-row {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
        gap: 6px !important;
      }
      .log-detail-row .form-group {
        min-width: 0 !important;
        width: 100% !important;
        overflow: visible !important;
      }
      .log-detail-row input[type="date"] {
        display: block !important;
        box-sizing: border-box !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        padding: 6px 7px !important;
        text-align: left !important;
        direction: ltr !important;
        -webkit-appearance: none !important;
        appearance: none !important;
      }
      .log-detail-row input[type="date"]::-webkit-date-and-time-value,
      .log-detail-row input[type="date"]::-webkit-datetime-edit,
      .log-detail-row input[type="date"]::-webkit-datetime-edit-fields-wrapper {
        display: block !important;
        width: 100% !important;
        min-width: 0 !important;
        text-align: left !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .log-detail-row input[type="date"]::-webkit-calendar-picker-indicator {
        margin-left: auto !important;
        flex: 0 0 auto !important;
      }
    }
  `;
  document.head.appendChild(style);
}

// Auto-init when DOM is ready
document.addEventListener('DOMContentLoaded', initFirebaseSync, { once: true });
document.addEventListener('DOMContentLoaded', applyExerciseUserToggle, { once: true });
document.addEventListener('DOMContentLoaded', applyExerciseLogDateFieldFix, { once: true });
