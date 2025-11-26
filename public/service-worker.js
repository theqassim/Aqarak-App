javascript
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {

});

self.addEventListener('push', function(event) {
    const data = event.data.json();
    
    const options = {
        body: data.body,
        icon: data.icon || '/logo.jpg',
        badge: '/logo.jpg', // أيقونة صغيرة تظهر في شريط الحالة (للأندرويد)
        data: {
            url: data.url // نحفظ الرابط عشان نفتحه لما يضغط
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close(); // اقفل الإشعار لما يضغط عليه

    // افتح الرابط
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});