// Service worker minimo: la sua unica funzione è mostrare le notifiche
// tramite showNotification(), il meccanismo che iOS/Safari richiede per le
// PWA installate sulla schermata Home (il costruttore `new Notification()`
// da solo non è affidabile in modalità standalone su iPhone).
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'show-notification') return;

  const { title, options } = data;
  event.waitUntil(self.registration.showNotification(title, options));
});

// Al tap sulla notifica, porta in primo piano una finestra dell'app già
// aperta oppure ne apre una nuova.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});
