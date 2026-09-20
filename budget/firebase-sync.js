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
let accessContext = null;
let activeSyncKeys = [];
let db = null;
let syncEnabled = true;
const syncQueue = {};
let remotePollInterval = null;
let localPollInterval = null;
const lastKnownValues = {};
console.log('[Firebase] firebase-sync.js v9 loaded');

// Save REAL localStorage methods before any monkey-patching.
const _realSetItem = localStorage.setItem.bind(localStorage);
const _realGetItem = localStorage.getItem.bind(localStorage);
const _nativeStorageGetItem = Storage.prototype.getItem;
const _nativeStorageSetItem = Storage.prototype.setItem;
const _nativeStorageRemoveItem = Storage.prototype.removeItem;

const EXERCISE_KEYS = [
  'ex_wk',
  'ex_goals',
  'ex_templates',
  'ex_weekTemplates',
  'ex_plannedSessions',
  'ex_prs',
  'ex_plan',
  'ex_vo2'
];
const PRIVATE_EXERCISE_KEYS = EXERCISE_KEYS.concat(['ex_bw', 'ex_weekPlans']);
const isExercisePage = /\/exercise\.html$/.test(window.location.pathname);
const requestedExerciseUser = new URLSearchParams(window.location.search).get('user');
const exerciseUser = requestedExerciseUser && requestedExerciseUser.toLowerCase() === 'maja' ? 'maja' : 'markus';

function trainingSuffix() {
  return accessContext && accessContext.role === 'training_only' ? '__training_' + accessContext.uid : '';
}

function scopedExerciseKey(key) {
  if (!isExercisePage || !key.startsWith('ex_')) return key;
  if (!accessContext) return null; // Never load a family cache before identity resolution.
  if (accessContext.role === 'training_only') return key + trainingSuffix();
  return EXERCISE_KEYS.includes(key) && exerciseUser === 'maja' ? key + '_maja' : key;
}

function logicalExerciseKey(key) {
  if (!isExercisePage) return key;
  const suffix = trainingSuffix();
  if (suffix && key.endsWith(suffix)) return key.slice(0, -suffix.length);
  if (exerciseUser === 'maja' && key.endsWith('_maja')) {
    const baseKey = key.slice(0, -5);
    if (EXERCISE_KEYS.includes(baseKey)) return baseKey;
  }
  return key;
}

function firebaseRef(key) {
  const suffix = trainingSuffix();
  if (suffix) {
    if (!key.endsWith(suffix)) throw new Error('Blocked cross-account training key');
    return db.ref('training_users/' + accessContext.uid + '/data/' + key.slice(0, -suffix.length));
  }
  return db.ref(key);
}

// Scope exercise storage before exercise.html's inline script runs. Markus keeps the
// original keys; Maja receives a completely separate *_maja data set.
Storage.prototype.getItem = function(key) {
  const stringKey = String(key);
  const mappedKey = this === localStorage ? scopedExerciseKey(stringKey) : stringKey;
  return mappedKey === null ? null : _nativeStorageGetItem.call(this, mappedKey);
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
  "darkMode",
  "sh_lists",
  "sh_saved_templates",
  "sh_active_template_id",
  "sh_header_title",
  "cal_events",
  "cal_todos",
  "cal_notif",
  "cal_trip",
  ...EXERCISE_KEYS,
  ...EXERCISE_KEYS.map(key => `${key}_maja`)
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
    // Role must be verified before any existing family key is read or synchronized.
    accessContext = window.AppAccess ? await window.AppAccess.ready : null;
    if (!accessContext) return;
    activeSyncKeys = accessContext.role === 'training_only'
      ? PRIVATE_EXERCISE_KEYS.map(key => key + trainingSuffix())
      : SYNC_KEYS;
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
  // Initial reads use native Storage.setItem and populate lastKnownValues before
  // listeners attach, so a hydration event is needed even for unchanged snapshots.
  if (isExercisePage) window.dispatchEvent(new CustomEvent('firebase-sync', {
    detail:{key:'ex_wk', value:null, initial:true}
  }));
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
    for (const key of activeSyncKeys) {
      const snapshot = await firebaseRef(key).get();
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
  for (const key of activeSyncKeys) {
    firebaseRef(key).on('value', (snapshot) => {
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
      for (const key of activeSyncKeys) {
        const snapshot = await firebaseRef(key).get();
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
    for (const key of activeSyncKeys) {
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

  const eventKey = logicalExerciseKey(key);
  if (accessContext && accessContext.role === 'training_only' && !key.endsWith(trainingSuffix())) return;
  if (isExercisePage && accessContext && accessContext.role === 'family' && exerciseUser === 'maja' && EXERCISE_KEYS.includes(key)) return;
  if (isExercisePage && accessContext && accessContext.role === 'family' && exerciseUser === 'markus' && key.endsWith('_maja')) return;

  window.dispatchEvent(new CustomEvent('firebase-sync', {
    detail: { key: eventKey, value }
  }));
}

/** Write to Firebase (debounced 500ms) */
function syncToFirebase(key, value) {
  if (!syncEnabled || !db || !accessContext || !activeSyncKeys.includes(key)) return;
  lastKnownValues[key] = value;
  if (syncQueue[key]) clearTimeout(syncQueue[key]);
  syncQueue[key] = setTimeout(async () => {
    try {
      await firebaseRef(key).set(value);
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
  if (mappedKey === null) return;
  try {
    _nativeStorageSetItem.call(this, mappedKey, value);
  } catch (error) {
    if (this === localStorage && typeof fallbackSetItem !== 'undefined') {
      fallbackSetItem(mappedKey, value).catch(() => {});
    }
  }
  if (this === localStorage && accessContext && activeSyncKeys.includes(mappedKey)) {
    syncToFirebase(mappedKey, value);
  }
};

/** Remove only the authenticated profile's local training key, never a family key. */
Storage.prototype.removeItem = function(key) {
  const stringKey = String(key);
  const mappedKey = this === localStorage ? scopedExerciseKey(stringKey) : stringKey;
  if (mappedKey === null) return;
  return _nativeStorageRemoveItem.call(this, mappedKey);
};

/** Force reload all data from Firebase */
async function forceSyncFromFirebase() {
  console.log('[Firebase] Forcing full sync...');
  for (const key of activeSyncKeys) delete lastKnownValues[key];
  await loadAllFromFirebase();
  window.dispatchEvent(new Event('firebase-force-sync'));
}

function isFirebaseConnected() {
  return syncEnabled && firebaseInitialized && db !== null;
}

function switchExerciseUser(user) {
  if (!isExercisePage || !accessContext || accessContext.role !== 'family' || !['markus', 'maja'].includes(user)) return;
  const url = new URL(window.location.href);
  url.searchParams.set('user', user);
  window.location.href = url.toString();
}

function applyExerciseUserToggle() {
  if (!isExercisePage || !accessContext) return;
  if (accessContext.role === 'training_only') {
    document.title = 'Ingemars träning';
    const brandSub = document.querySelector('.brand-text p');
    if (brandSub) brandSub.textContent = 'Ingemar';
    const headerBrand = document.querySelector('.brand-text h1');
    if (headerBrand) headerBrand.onclick = function () { location.href = 'exercise.html'; };
    const toggle = document.getElementById('exercise-user-toggle');
    if (toggle) toggle.remove();
    return;
  }

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
  if (!isExercisePage) return;
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
document.addEventListener('DOMContentLoaded', function () {
  if (window.AppAccess) window.AppAccess.ready.then(applyExerciseUserToggle);
}, { once: true });
document.addEventListener('DOMContentLoaded', applyExerciseLogDateFieldFix, { once: true });
