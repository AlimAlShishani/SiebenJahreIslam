self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || 'Nuruna';
  const body = data.body || 'Neue Aktivitaet';
  const url = data.url || '/hatim';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/nuruna-favicon.svg',
      badge: '/nuruna-favicon.svg',
      data: { url },
      tag: data.tag || 'nuruna-activity',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/hatim';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
