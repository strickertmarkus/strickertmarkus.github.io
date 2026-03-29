/**
 * Firebase Realtime Sync Module
 * 
 * Replaces localStorage with Firebase Realtime Database for real-time multi-device sync.
 * Falls back to localStorage if Firebase unavailable.
 * 
 * Usage:
 *   - Include this file BEFORE any page scripts
 *   - Call initFirebaseSync() once on page load
 *   - Existing localStorage.setItem/getItem calls work unchanged
 */

let firebaseInitialized = false;
let db = null;
let syncEnabled = true;
const syncQueue = {}; // { key: timeoutId } for debouncing

// Firebase config from console.firebase.google.com
const firebaseConfig = {
  apiKey: "AIzaSyCgGL762gcglRpix4-akfP7NydFj5ChxfM",
  authDomain: "frick-budget.firebaseapp.com",
  projectId: "frick-budget",
  storageBucket: "frick-budget.firebasestorage.app",
  messagingSenderId: "231130144804",
  appId: "1:231130144804:web:49ad446a858c585d2838b1"
};

// Keys to sync (read from localStorage, write to Firebase)
const SYNC_KEYS = [
  "budgetTracker",
  "budgetTracker_maja",
  "savingsGoals",
  "savingsGoals_maja",
  "familjebudget_data",
  "darkMode"
];

/**
 * Initialize Firebase and set up real-time listeners
 */
async function initFirebaseSync() {
  if (firebaseInitialized) return;
  
  try {
    // Load Firebase SDK from CDN if not already loaded
    if (typeof firebase === 'undefined') {
      console.log('[Firebase] SDK not loaded yet, waiting...');
      // Wait for firebase to load (it's in the HTML <script> tag)
      await new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (typeof firebase !== 'undefined') {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Firebase SDK failed to load'));
        }, 5000);
      });
    }

    // Initialize Firebase
    const app = firebase.initializeApp(firebaseConfig);
    db = firebase.database(app);
    firebaseInitialized = true;
    console.log('[Firebase] ✓ Connected to Realtime Database');

    // Load all synced data from Firebase on first load
    await loadAllFromFirebase();

    // Set up listeners for real-time updates from other devices
    setupRealtimeListeners();

  } catch (error) {
    console.warn('[Firebase] ✗ Failed to initialize:', error.message);
    console.log('[Firebase] Using localStorage as fallback');
    syncEnabled = false;
  }
}

/**
 * Load all synced keys from Firebase on first load
 */
async function loadAllFromFirebase() {
  if (!db) return;

  try {
    for (const key of SYNC_KEYS) {
      const snapshot = await db.ref(key).get();
      if (snapshot.exists()) {
        const value = snapshot.val();
        localStorage.setItem(key, value);
        console.log(`[Firebase] Loaded '${key}' from database`);
      }
    }
  } catch (error) {
    console.warn('[Firebase] Failed to load initial data:', error.message);
  }
}

/**
 * Set up real-time listeners for all keys
 * When data changes on another device, update here automatically
 */
function setupRealtimeListeners() {
  if (!db) return;

  for (const key of SYNC_KEYS) {
    db.ref(key).on('value', (snapshot) => {
      if (!snapshot.exists()) return;

      const value = snapshot.val();
      const currentValue = localStorage.getItem(key);

      // Only update if value actually changed (avoid redundant updates)
      if (currentValue !== value) {
        console.log(`[Firebase] Received update for '${key}' from Firebase`);
        localStorage.setItem(key, value);

        // Dispatch custom event so pages can react to Firebase changes
        window.dispatchEvent(new CustomEvent('firebase-sync', {
          detail: { key, value }
        }));
      }
    }, (error) => {
      console.warn(`[Firebase] Failed to listen to '${key}':`, error.message);
    });
  }
}

/**
 * Write a key-value pair to Firebase (debounced to avoid too many writes)
 * @param {string} key - localStorage key
 * @param {string} value - JSON string or scalar value
 */
function syncToFirebase(key, value) {
  if (!syncEnabled || !db) return;

  // Clear any pending write for this key
  if (syncQueue[key]) {
    clearTimeout(syncQueue[key]);
  }

  // Debounce writes by 500ms to batch rapid changes
  syncQueue[key] = setTimeout(async () => {
    try {
      await db.ref(key).set(value);
      console.log(`[Firebase] Synced '${key}'`);
    } catch (error) {
      console.warn(`[Firebase] Failed to sync '${key}':`, error.message);
      // Fall back to localStorage only on write error
      syncEnabled = false;
    }
    delete syncQueue[key];
  }, 500);
}

/**
 * Monkey-patch localStorage.setItem to auto-sync to Firebase
 */
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  // Always write to localStorage first (local cache)
  originalSetItem.call(this, key, value);

  // Then sync to Firebase if this is a tracked key
  if (SYNC_KEYS.includes(key)) {
    syncToFirebase(key, value);
  }
};

/**
 * Listen for Firebase sync events and reload affected page content
 * Pages should set up a handler like:
 *   window.addEventListener('firebase-sync', (e) => {
 *     if (e.detail.key === 'budgetTracker') { loadLocal(); renderAll(); }
 *   });
 */
window.addEventListener('firebase-sync', (event) => {
  // Custom event fired when data arrives from Firebase
  // Page scripts can handle this to refresh their UI
});

/**
 * Manually trigger a full sync from Firebase (useful for recovery)
 */
async function forceSyncFromFirebase() {
  console.log('[Firebase] Forcing full sync from database...');
  await loadAllFromFirebase();
  window.dispatchEvent(new Event('firebase-force-sync'));
}

/**
 * Check Firebase connection status
 */
function isFirebaseConnected() {
  return syncEnabled && firebaseInitialized && db !== null;
}

// Auto-init when DOM is ready
document.addEventListener('DOMContentLoaded', initFirebaseSync, { once: true });
