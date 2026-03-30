/**
 * IndexedDB Fallback for localStorage
 * On iOS Safari (GitHub Pages HTTPS), localStorage.setItem() is blocked.
 * This module provides fallbackSetItem/fallbackGetItem that:
 * 1. Try localStorage first (faster, direct access)
 * 2. Fall back to IndexedDB if localStorage fails or is unavailable
 * 3. Keep both in sync for firebase-sync.js to pick up changes
 */

const DB_NAME = 'budgetDB';
const DB_VERSION = 1;
const STORE_NAME = 'keyValueStore';

// Save the ORIGINAL localStorage.setItem before firebase-sync.js monkey-patches it
const originalSetItem = localStorage.setItem;
const originalGetItem = localStorage.getItem;

let dbPromise = null;

/**
 * Initialize IndexedDB if needed
 */
function initIndexedDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });

  return dbPromise;
}

/**
 * Check if we're on a mobile device (iOS/Android)
 */
function isMobileDevice() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua.toLowerCase());
}

/**
 * Fallback setItem: Try localStorage, fall back to IndexedDB
 * @param {string} key - The storage key
 * @param {string} value - The value to store
 */
async function fallbackSetItem(key, value) {
  // Try localStorage first (desktop is faster with localStorage) using ORIGINAL function
  try {
    originalSetItem.call(localStorage, key, value);
    // Success - also sync to IndexedDB as backup
    if (isMobileDevice()) {
      // Mobile: IndexedDB is primary, localStorage is secondary
      try {
        const db = await initIndexedDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(value, key);
      } catch (e) {
        // IndexedDB failed, but localStorage succeeded - that's ok
      }
    }
    return true;
  } catch (e) {
    // localStorage failed or is unavailable (iOS Safari GitHub Pages)
    console.warn(
      '[Storage Fallback] localStorage blocked, using IndexedDB',
      key,
      e.message
    );
    try {
      const db = await initIndexedDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const request = tx.objectStore(STORE_NAME).put(value, key);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          // After IndexedDB write, also try to update localStorage
          // (this triggers firebase-sync.js monkey-patch if localStorage is partially working)
          try {
            originalSetItem.call(localStorage, key, value);
          } catch (ignored) {
            // localStorage is still blocked, that's ok
          }
          resolve(true);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('[Storage Fallback] Both localStorage and IndexedDB failed:', e);
      throw e;
    }
  }
}

/**
 * Fallback getItem: Try localStorage, fall back to IndexedDB
 * @param {string} key - The storage key
 * @returns {string|null} - The stored value or null if not found
 */
async function fallbackGetItem(key) {
  // Try localStorage first using ORIGINAL function
  try {
    const value = originalGetItem.call(localStorage, key);
    if (value !== null) {
      return value;
    }
  } catch (e) {
    // localStorage is unavailable
  }

  // Fall back to IndexedDB
  try {
    const db = await initIndexedDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);

    return new Promise((resolve) => {
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (e) {
    console.error('[Storage Fallback] Failed to read from IndexedDB:', e);
    return null;
  }
}

/**
 * Sync all IndexedDB keys to localStorage
 * Called on page load to restore data from IndexedDB if localStorage is empty
 */
async function syncIndexedDBToLocalStorage(keys) {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    for (const key of keys) {
      try {
        const value = originalGetItem.call(localStorage, key);
        if (value === null) {
          // localStorage is missing this key, try to restore from IndexedDB
          const request = store.get(key);
          request.onsuccess = () => {
            if (request.result !== undefined) {
              try {
                originalSetItem.call(localStorage, key, request.result);
              } catch (e) {
                // localStorage still blocked, that's ok
              }
            }
          };
        }
      } catch (e) {
        // localStorage access failed, continue
      }
    }
  } catch (e) {
    console.warn('[Storage Fallback] Failed to sync IndexedDB to localStorage:', e);
  }
}

// Export functions
window.fallbackSetItem = fallbackSetItem;
window.fallbackGetItem = fallbackGetItem;
window.syncIndexedDBToLocalStorage = syncIndexedDBToLocalStorage;
