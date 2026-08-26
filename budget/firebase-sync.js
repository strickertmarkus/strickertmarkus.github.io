/**
 * Firebase Realtime Sync Module v9
 * 
 * Syncs localStorage keys to Firebase Realtime Database for multi-device updates.
 * Self-contained: does NOT depend on indexeddb-fallback.js.
 * Uses polling for BOTH directions:
 *   - Reads from Firebase every 3s (remote → local)
 *   - Checks localStorage every 1s for changes to push (local → remote)
 * This avoids depending on monkey-patching localStorage.setItem,
 * which fails silently on iOS Safari with tracking prevention.
 */

let firebaseInitialized = false;
let authReady = false;
let authUser = null;
let db = null;
let syncEnabled = true;
const syncQueue = {};
let remotePollInterval = null;
let localPollInterval = null;
const lastKnownValues = {}; // Track values to detect changes in both directions
console.log('[Firebase] firebase-sync.js v9 loaded');

// Save REAL localStorage methods before any monkey-patching
const _realSetItem = localStorage.setItem.bind(localStorage);
const _realGetItem = localStorage.getItem.bind(localStorage);

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
  "darkMode",
  "sh_lists",
  "sh_saved_templates",
  "sh_active_template_id",
  "sh_header_title",
  "cal_events",
  "cal_todos",
  "cal_notif",
  "cal_trip",
  "ex_wk",
  "ex_goals",
  "ex_templates",
  "ex_weekTemplates",
  "ex_plannedSessions",
  "ex_prs",
  "ex_plan",
  "ex_vo2"
];

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
  setupRealtimeListeners();
  startRemotePolling();
  startLocalPolling();
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
      if (snapshot.exists()) {
        const value = snapshot.val();
        safeSetLocal(key, value);
        lastKnownValues[key] = value;
        console.log(`[Firebase] Loaded '${key}'`);
      }
    }
  } catch (error) {
    console.warn('[Firebase] Load failed:', error.message);
  }
}

/**
 * Real-time listeners (WebSocket-based).
 * May not work on iOS Safari — polling acts as fallback.
 */
function setupRealtimeListeners() {
  if (!db) return;
  for (const key of SYNC_KEYS) {
    db.ref(key).on('value', (snapshot) => {
      if (!snapshot.exists()) return;
      handleRemoteUpdate(key, snapshot.val());
    }, (error) => {
      console.warn(`[Firebase] Listener error '${key}':`, error.message);
    });
  }
  console.log('[Firebase] Real-time listeners active');
}

/**
 * Poll Firebase every 3s for remote changes (fallback for broken WebSocket on iOS).
 */
function startRemotePolling() {
  if (remotePollInterval) return;
  remotePollInterval = setInterval(async () => {
    if (!db) return;
    try {
      for (const key of SYNC_KEYS) {
        const snapshot = await db.ref(key).get();
        if (snapshot.exists()) {
          handleRemoteUpdate(key, snapshot.val());
        }
      }
    } catch (e) { /* retry next interval */ }
  }, 3000);
  console.log('[Firebase] Remote polling active (3s)');
}

/**
 * Poll localStorage (and IndexedDB on mobile) every 1s for local changes
 * to push to Firebase. This is the PRIMARY mechanism for detecting user edits,
 * because monkey-patching localStorage.setItem fails silently on iOS Safari.
 *
 * On Safari, localStorage writes may be blocked entirely, so user edits
 * go to IndexedDB instead (via indexeddb-fallback.js). We check both.
 */
function startLocalPolling() {
  if (localPollInterval) return;
  localPollInterval = setInterval(async () => {
    if (!db || !syncEnabled) return;
    for (const key of SYNC_KEYS) {
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
  }, 1000);
  console.log('[Firebase] Local polling active (1s)');
}

/**
 * Handle a remote update from Firebase (via listener OR polling).
 * Writes to localStorage and dispatches event for page UI refresh.
 */
function handleRemoteUpdate(key, value) {
  if (lastKnownValues[key] === value) return;
  console.log(`[Firebase] Remote update: '${key}'`);
  lastKnownValues[key] = value;
  safeSetLocal(key, value);

  window.dispatchEvent(new CustomEvent('firebase-sync', {
    detail: { key, value }
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

/** Monkey-patch localStorage.setItem to auto-sync tracked keys to Firebase */
localStorage.setItem = function(key, value) {
  try {
    _realSetItem(key, value);
  } catch (error) {
    if (typeof fallbackSetItem !== 'undefined') {
      fallbackSetItem(key, value).catch(() => {});
    }
  }
  if (SYNC_KEYS.includes(key)) {
    syncToFirebase(key, value);
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

// Exercise page layout correction for native date controls.
function applyExerciseLogDateFieldFix() {
  if (!/\/exercise\.html$/.test(window.location.pathname)) return;
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
document.addEventListener('DOMContentLoaded', applyExerciseLogDateFieldFix, { once: true });
