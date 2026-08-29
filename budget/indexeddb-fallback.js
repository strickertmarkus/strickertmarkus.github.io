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

// Save ORIGINAL localStorage methods (before firebase-sync.js monkey-patches)
// Use var to allow firebase-sync.js to also have its own reference
var _idbOrigSetItem = localStorage.setItem.bind(localStorage);
var _idbOrigGetItem = localStorage.getItem.bind(localStorage);

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
    _idbOrigSetItem( key, value);
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
            _idbOrigSetItem( key, value);
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
    const value = _idbOrigGetItem( key);
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
        const value = _idbOrigGetItem( key);
        if (value === null) {
          // localStorage is missing this key, try to restore from IndexedDB
          const request = store.get(key);
          request.onsuccess = () => {
            if (request.result !== undefined) {
              try {
                _idbOrigSetItem( key, request.result);
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

/* Shared finance shell: reserve the final header geometry before first paint,
   then let one versioned module normalize Budget / Analys / Familjebudget. */
(function () {
  var path = window.location.pathname.toLowerCase();
  var financePages = [
    '/budget/budget.html','/budget.html',
    '/budget/budget_maja.html','/budget_maja.html',
    '/budget/analytics.html','/analytics.html',
    '/budget/analytics_maja.html','/analytics_maja.html',
    '/budget/familjebudget.html','/familjebudget.html'
  ];
  var isFinance = financePages.some(function (suffix) { return path.endsWith(suffix); });
  if (!isFinance) return;

  document.documentElement.classList.add('finance-shell-booting-v8');
  if (!document.getElementById('finance-shell-critical-v8')) {
    var style = document.createElement('style');
    style.id = 'finance-shell-critical-v8';
    style.textContent =
      'html.finance-shell-booting-v8 body .header>*{visibility:hidden!important}' +
      'html.finance-shell-booting-v8 body .container{visibility:hidden!important}' +
      'html.finance-shell-booting-v8 body .header{min-height:150px!important;background:linear-gradient(135deg,#0B0F1A,#151C2C)!important}' +
      '@media(max-width:600px){html.finance-shell-booting-v8 body .header{min-height:144px!important}}';
    document.head.appendChild(style);
  }

  if (!document.querySelector('script[data-finance-shell-v8]')) {
    var script = document.createElement('script');
    script.src = 'finance-shell-v8.js?v=20260829-1305-finance-shell-v8';
    script.async = false;
    script.setAttribute('data-finance-shell-v8','true');
    document.head.appendChild(script);
  }

  setTimeout(function () {
    document.documentElement.classList.remove('finance-shell-booting-v8');
  },1800);
})();
