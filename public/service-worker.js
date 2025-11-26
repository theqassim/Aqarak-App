javascript
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {

});

// public/service-worker.js

self.addEventListener('push', function(event) {
    console.log('[Service Worker] Push Received.');
    
    const data = event.data.json();
    const title = data.title || 'عقارك';
    const options = {
        body: data.body || 'إشعار جديد من عقارك',
        icon: data.icon || '/logo.jpg', // تأكد من مسار اللوجو
        badge: '/logo.jpg',
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
    console.log('[Service Worker] Notification click received.');

    event.notification.close();

    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});