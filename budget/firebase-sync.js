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

const firebaseConfig = {
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
  "darkMode"
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
    const app = firebase.initializeApp(firebaseConfig);
    db = firebase.database(app);
    firebaseInitialized = true;
    console.log('[Firebase] ✓ Connected to Realtime Database');

    await loadAllFromFirebase();
    setupRealtimeListeners();
    startRemotePolling();
    startLocalPolling();
  } catch (error) {
    console.warn('[Firebase] ✗ Failed to initialize:', error.message);
    syncEnabled = false;
  }
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
      // Try localStorage first
      try {
        currentValue = _realGetItem(key);
      } catch (e) { /* blocked */ }

      // If localStorage didn't have a new value, check IndexedDB
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
  if (lastKnownValues[key] === value) return; // No change
  console.log(`[Firebase] Remote update: '${key}'`);
  lastKnownValues[key] = value;
  safeSetLocal(key, value);

  // Dispatch event — page handlers should use event.detail.value
  // to get the data, not rely on localStorage (which may be stale on iOS)
  window.dispatchEvent(new CustomEvent('firebase-sync', {
    detail: { key, value }
  }));
}

/** Write to Firebase (debounced 500ms) */
function syncToFirebase(key, value) {
  if (!syncEnabled || !db) return;
  // Mark as known to prevent echo from our own write
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
  // Write to real localStorage
  try {
    _realSetItem(key, value);
  } catch (error) {
    // localStorage blocked (iOS Safari) — try IndexedDB fallback if available
    if (typeof fallbackSetItem !== 'undefined') {
      fallbackSetItem(key, value).catch(() => {});
    }
  }
  // Sync tracked keys to Firebase
  if (SYNC_KEYS.includes(key)) {
    syncToFirebase(key, value);
  }
};

/** Force reload all data from Firebase */
async function forceSyncFromFirebase() {
  console.log('[Firebase] Forcing full sync...');
  // Reset known values so handleRemoteUpdate sees everything as new
  for (const key of SYNC_KEYS) delete lastKnownValues[key];
  await loadAllFromFirebase();
  window.dispatchEvent(new Event('firebase-force-sync'));
}

function isFirebaseConnected() {
  return syncEnabled && firebaseInitialized && db !== null;
}

// Auto-init when DOM is ready
document.addEventListener('DOMContentLoaded', initFirebaseSync, { once: true });
