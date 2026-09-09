(function () {
  'use strict';

  var SETTINGS_KEY = 'cal_push_settings_v1';
  var DEVICE_KEY = 'cal_push_device_id_v1';
  var SW_URL = 'firebase-messaging-sw.js?v=20260831-push-v1';
  var MEMBER_KEYS = ['markus','maja','mila','melker','family'];
  var registrationPromise = null;
  var messagingInstance = null;

  function parseJSON(raw, fallback) {
    try { return raw ? JSON.parse(raw) : fallback; }
    catch (_) { return fallback; }
  }

  function defaultSettings() {
    return {
      enabled: false,
      members: { markus:true, maja:true, mila:true, melker:true, family:true }
    };
  }

  function loadSettings() {
    var current = parseJSON(localStorage.getItem(SETTINGS_KEY), null);
    if (current && current.members) return current;

    var legacy = parseJSON(localStorage.getItem('cal_notif'), null);
    var next = defaultSettings();
    if (legacy) {
      MEMBER_KEYS.forEach(function (member) {
        if (legacy[member] !== undefined) next.members[member] = !!legacy[member];
      });
      next.enabled = !!legacy.enabled && typeof Notification !== 'undefined' && Notification.permission === 'granted';
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    return next;
  }

  function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  function deviceId() {
    var id = localStorage.getItem(DEVICE_KEY);
    if (id) return id;
    if (window.crypto && typeof window.crypto.randomUUID === 'function') id = window.crypto.randomUUID();
    else id = 'device-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    localStorage.setItem(DEVICE_KEY, id);
    return id;
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent || '');
  }

  function isStandalone() {
    return !!(navigator.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches));
  }

  function supportsPush() {
    return 'serviceWorker' in navigator && 'Notification' in window && window.firebase && typeof firebase.messaging === 'function';
  }

  function setStatus(text, tone) {
    var el = document.getElementById('push-notif-status');
    if (!el) return;
    el.textContent = text;
    el.dataset.tone = tone || 'neutral';
  }

  function toast(text) {
    try {
      if (typeof window.showToast === 'function') window.showToast(text);
    } catch (_) {}
  }

  function ensureStyle() {
    if (document.getElementById('push-notification-style-v1')) return;
    var style = document.createElement('style');
    style.id = 'push-notification-style-v1';
    style.textContent =
      '.push-notif-intro{font-size:12px;color:var(--text-sec);margin-bottom:10px;line-height:1.45}' +
      '.push-notif-status{font-size:11px;line-height:1.45;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:rgba(255,255,255,.035);color:var(--text-sec);margin:8px 0 10px}' +
      '.push-notif-status[data-tone="ok"]{color:#86EFAC;border-color:rgba(134,239,172,.25);background:rgba(134,239,172,.06)}' +
      '.push-notif-status[data-tone="warn"]{color:#FBBF24;border-color:rgba(251,191,36,.25);background:rgba(251,191,36,.06)}' +
      '.push-notif-status[data-tone="error"]{color:#FCA5A5;border-color:rgba(248,113,113,.25);background:rgba(248,113,113,.06)}' +
      '.push-notif-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}' +
      '.push-notif-action{border:1px solid rgba(251,191,36,.28);background:rgba(251,191,36,.08);color:#FBBF24;border-radius:8px;padding:7px 11px;font:700 11px/1 Inter,sans-serif;cursor:pointer}' +
      '.push-notif-action:disabled{opacity:.38;cursor:default}' +
      '.push-notif-hint{font-size:10px;color:var(--text-dim);margin-top:8px;line-height:1.45}' +
      '.push-mobile-bell{display:none}' +
      '.push-reminder-note{display:block;margin-top:4px;font-size:10px;color:var(--text-dim)}' +
      '@media(max-width:768px){.push-mobile-bell{display:flex;position:absolute;top:12px;left:12px;width:38px;height:38px;align-items:center;justify-content:center;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:17px;z-index:101;cursor:pointer}.notif-panel{margin-left:1rem!important;margin-right:1rem!important}}';
    document.head.appendChild(style);
  }

  function buildPanel() {
    var panel = document.getElementById('notif-panel');
    if (!panel) return;
    panel.innerHTML =
      '<div class="push-notif-intro"><strong>Pushnotiser på den här enheten</strong><br>Kalenderpåminnelser skickas även när sidan är stängd.</div>' +
      '<div class="notif-row"><span>Aktivera pushnotiser</span><label class="toggle"><input type="checkbox" id="notif-enabled"><span class="toggle-slider"></span></label></div>' +
      '<div style="font-size:10px;color:var(--text-dim);margin:8px 0 3px">Ta emot händelser för</div>' +
      MEMBER_KEYS.map(function (member) {
        var labels = {markus:'Markus',maja:'Maja',mila:'Mila',melker:'Melker',family:'Familjen'};
        return '<div class="notif-row"><span>' + labels[member] + '</span><label class="toggle"><input type="checkbox" id="notif-' + member + '"><span class="toggle-slider"></span></label></div>';
      }).join('') +
      '<div class="push-notif-status" id="push-notif-status" data-tone="neutral">Kontrollerar den här enheten…</div>' +
      '<div class="push-notif-actions"><button type="button" class="push-notif-action" id="push-test-btn">Skicka testnotis</button></div>' +
      '<div class="push-notif-hint">Schemalagda påminnelser kontrolleras ungefär var femte minut. Händelsen måste ha en starttid och en vald påminnelse.</div>';

    var mobileBell = document.getElementById('push-mobile-bell');
    if (!mobileBell) {
      var header = document.querySelector('.app-header');
      if (header) {
        mobileBell = document.createElement('button');
        mobileBell.type = 'button';
        mobileBell.id = 'push-mobile-bell';
        mobileBell.className = 'push-mobile-bell';
        mobileBell.setAttribute('aria-label','Notiser');
        mobileBell.textContent = '🔔';
        mobileBell.addEventListener('click', function () { window.toggleNotifPanel(); });
        header.appendChild(mobileBell);
      }
    }

    var settings = loadSettings();
    document.getElementById('notif-enabled').checked = !!settings.enabled;
    MEMBER_KEYS.forEach(function (member) {
      document.getElementById('notif-' + member).checked = settings.members[member] !== false;
    });

    document.getElementById('notif-enabled').addEventListener('change', handleSettingsChange);
    MEMBER_KEYS.forEach(function (member) {
      document.getElementById('notif-' + member).addEventListener('change', handleSettingsChange);
    });
    document.getElementById('push-test-btn').addEventListener('click', queueTestNotification);
  }

  function injectReminderField() {
    if (document.getElementById('ev-reminder')) return;
    var repeat = document.getElementById('ev-repeat');
    if (!repeat) return;
    var anchor = repeat.closest('.form-row') || repeat.closest('.form-group');
    if (!anchor || !anchor.parentNode) return;

    var group = document.createElement('div');
    group.className = 'form-group';
    group.id = 'push-reminder-group';
    group.innerHTML =
      '<label>Påminnelse</label>' +
      '<select id="ev-reminder">' +
        '<option value="">Ingen</option>' +
        '<option value="0">Vid starttid</option>' +
        '<option value="15">15 min före</option>' +
        '<option value="60">1 timme före</option>' +
        '<option value="180">3 timmar före</option>' +
        '<option value="1440">1 dag före</option>' +
      '</select>' +
      '<span class="push-reminder-note">Kräver att händelsen har en starttid.</span>';
    anchor.parentNode.insertBefore(group, anchor.nextSibling);
  }

  function wrapEventModal() {
    var originalOpen = window.openEventModal;
    if (typeof originalOpen === 'function' && !originalOpen.__pushWrapped) {
      var wrappedOpen = function () {
        var result = originalOpen.apply(this, arguments);
        var reminder = document.getElementById('ev-reminder');
        if (reminder) reminder.value = '60';
        return result;
      };
      wrappedOpen.__pushWrapped = true;
      window.openEventModal = wrappedOpen;
    }

    var originalEdit = window.editEvent;
    if (typeof originalEdit === 'function' && !originalEdit.__pushWrapped) {
      var wrappedEdit = function (id) {
        var result = originalEdit.apply(this, arguments);
        var reminder = document.getElementById('ev-reminder');
        if (reminder && typeof window.getEvents === 'function') {
          var ev = (window.getEvents() || []).find(function (item) { return item && item.id === id; });
          reminder.value = ev && ev.reminderMinutes !== undefined && ev.reminderMinutes !== null ? String(ev.reminderMinutes) : '';
        }
        return result;
      };
      wrappedEdit.__pushWrapped = true;
      window.editEvent = wrappedEdit;
    }
  }

  function collectSettings() {
    var settings = defaultSettings();
    var enabled = document.getElementById('notif-enabled');
    settings.enabled = !!(enabled && enabled.checked);
    MEMBER_KEYS.forEach(function (member) {
      var input = document.getElementById('notif-' + member);
      settings.members[member] = !input || !!input.checked;
    });
    return settings;
  }

  async function waitForFirebase() {
    if (!window.firebase) throw new Error('Firebase SDK saknas');
    if (!firebase.apps || !firebase.apps.length) {
      if (!window.FIREBASE_CONFIG) throw new Error('Firebase-konfiguration saknas');
      firebase.initializeApp(window.FIREBASE_CONFIG);
    }
    if (!firebase.auth) return;
    var auth = firebase.auth();
    if (auth.currentUser) return;
    await new Promise(function (resolve, reject) {
      var done = false;
      var unsub = auth.onAuthStateChanged(function (user) {
        if (!user || done) return;
        done = true;
        try { unsub(); } catch (_) {}
        resolve();
      });
      setTimeout(function () {
        if (done) return;
        done = true;
        try { unsub(); } catch (_) {}
        reject(new Error('Inloggningen blev inte klar i tid'));
      }, 10000);
    });
  }

  function serviceWorkerRegistration() {
    if (!registrationPromise) {
      registrationPromise = navigator.serviceWorker.register(SW_URL, { scope: './' });
    }
    return registrationPromise;
  }

  async function messaging() {
    await waitForFirebase();
    if (!messagingInstance) messagingInstance = firebase.messaging();
    return messagingInstance;
  }

  async function saveDevice(token, settings) {
    await waitForFirebase();
    var payload = {
      token: token || '',
      enabled: !!settings.enabled,
      members: settings.members,
      updatedAt: firebase.database.ServerValue.TIMESTAMP,
      platform: isIOS() ? 'ios-web' : 'web',
      standalone: isStandalone()
    };
    await firebase.database().ref('pushDevices/' + deviceId()).set(payload);
  }

  async function getTokenForDevice() {
    var reg = await serviceWorkerRegistration();
    var msg = await messaging();
    var options = { serviceWorkerRegistration: reg };
    if (window.FIREBASE_VAPID_KEY) options.vapidKey = window.FIREBASE_VAPID_KEY;
    return msg.getToken(options);
  }

  async function enablePush(settings) {
    if (!supportsPush()) throw new Error('Webbläsaren saknar stöd för pushnotiser');
    if (isIOS() && !isStandalone()) {
      throw new Error('På iPhone måste sidan först läggas till på hemskärmen och öppnas därifrån');
    }
    var permission = Notification.permission;
    if (permission !== 'granted') permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Notisbehörighet nekades');

    setStatus('Registrerar den här enheten…', 'neutral');
    var token = await getTokenForDevice();
    if (!token) throw new Error('Firebase gav ingen registreringstoken');
    await saveDevice(token, settings);
    setStatus('Pushnotiser är aktiva på den här enheten.', 'ok');
    return token;
  }

  async function disablePush(settings) {
    try {
      await waitForFirebase();
      var ref = firebase.database().ref('pushDevices/' + deviceId());
      var snap = await ref.once('value');
      var current = snap.val() || {};
      current.enabled = false;
      current.members = settings.members;
      current.updatedAt = firebase.database.ServerValue.TIMESTAMP;
      await ref.set(current);
    } catch (_) {}
    setStatus('Pushnotiser är avstängda på den här enheten.', 'neutral');
  }

  async function handleSettingsChange() {
    var settings = collectSettings();
    saveSettings(settings);
    if (!settings.enabled) {
      await disablePush(settings);
      return;
    }
    try {
      await enablePush(settings);
    } catch (error) {
      settings.enabled = false;
      saveSettings(settings);
      var checkbox = document.getElementById('notif-enabled');
      if (checkbox) checkbox.checked = false;
      setStatus(error.message || 'Kunde inte aktivera pushnotiser.', 'error');
    }
  }

  async function queueTestNotification() {
    var button = document.getElementById('push-test-btn');
    if (button) button.disabled = true;
    try {
      var settings = collectSettings();
      if (!settings.enabled || Notification.permission !== 'granted') {
        settings.enabled = true;
        var enabled = document.getElementById('notif-enabled');
        if (enabled) enabled.checked = true;
        saveSettings(settings);
        await enablePush(settings);
      } else {
        var token = await getTokenForDevice();
        await saveDevice(token, settings);
      }
      await waitForFirebase();
      await firebase.database().ref('pushQueue').push({
        type: 'test',
        deviceId: deviceId(),
        title: 'Testnotis',
        body: 'Pushnotiser från familjekalendern fungerar.',
        url: 'home.html',
        status: 'pending',
        createdAt: firebase.database.ServerValue.TIMESTAMP
      });
      setStatus('Testnotisen ligger i kön och skickas vid nästa 5-minuterskörning.', 'ok');
      toast('Testnotis köad 🔔');
    } catch (error) {
      setStatus(error.message || 'Kunde inte köa testnotisen.', 'error');
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function refreshStatus() {
    var settings = loadSettings();
    if (!supportsPush()) {
      setStatus('Den här webbläsaren stöder inte webbpush.', 'error');
      return;
    }
    if (isIOS() && !isStandalone()) {
      setStatus('iPhone: välj Dela → Lägg till på hemskärmen. Öppna sedan appen från hemskärmen för att aktivera notiser.', 'warn');
      return;
    }
    if (Notification.permission === 'denied') {
      setStatus('Notiser är blockerade i systeminställningarna för den här webbappen.', 'error');
      return;
    }
    if (!settings.enabled) {
      setStatus('Pushnotiser är avstängda på den här enheten.', 'neutral');
      return;
    }
    if (Notification.permission !== 'granted') {
      setStatus('Tryck på Aktivera pushnotiser för att ge behörighet.', 'warn');
      return;
    }
    try {
      var token = await getTokenForDevice();
      await saveDevice(token, settings);
      setStatus('Pushnotiser är aktiva på den här enheten.', 'ok');
    } catch (error) {
      setStatus('Registreringen behöver förnyas: ' + (error.message || 'okänt fel'), 'warn');
    }
  }

  function attachForegroundHandler() {
    if (!supportsPush()) return;
    messaging().then(function (msg) {
      msg.onMessage(function (payload) {
        var data = payload && payload.data ? payload.data : {};
        serviceWorkerRegistration().then(function (reg) {
          reg.showNotification(data.title || 'Familjekalender', {
            body: data.body || '',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: data.tag || undefined,
            data: { url: data.url || 'home.html' }
          });
        }).catch(function () {});
      });
    }).catch(function () {});
  }

  function installGlobals() {
    window.toggleNotifPanel = function () {
      var panel = document.getElementById('notif-panel');
      if (panel) panel.classList.toggle('show');
    };
    window.saveNotifSettings = function () { return handleSettingsChange(); };
    window.loadNotifSettings = function () { return refreshStatus(); };
  }

  function init() {
    ensureStyle();
    buildPanel();
    injectReminderField();
    wrapEventModal();
    installGlobals();
    refreshStatus();
    attachForegroundHandler();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
