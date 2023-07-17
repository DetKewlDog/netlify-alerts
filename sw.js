self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => self.clients.claim());
self.addEventListener("push", e => {
    const data = e.data.json();
    self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon,
        image: data.image
    });
});