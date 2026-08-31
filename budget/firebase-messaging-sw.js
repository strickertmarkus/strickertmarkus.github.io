/* global firebase */
'use strict';

self.window = self;
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');
importScripts('auth-config.js');

if (!firebase.apps.length) firebase.initializeApp(self.FIREBASE_CONFIG);
var messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  var data = payload && payload.data ? payload.data : {};
  var title = data.title || 'Familjekalender';
  var options = {
    body: data.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || undefined,
    renotify: false,
    data: {
      url: data.url || 'home.html'
    }
  };
  return self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var target = event.notification && event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : 'home.html';
  var targetUrl = new URL(target, self.registration.scope).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windows) {
      for (var i = 0; i < windows.length; i++) {
        var client = windows[i];
        if (client.url.indexOf(self.registration.scope) === 0 && 'focus' in client) {
          if ('navigate' in client) {
            return client.navigate(targetUrl).then(function () { return client.focus(); });
          }
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
      return null;
    })
  );
});
