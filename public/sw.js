// Minimal service worker: only makes the app installable (required by PWABuilder/Android).
// No offline caching logic is added so app behavior stays 100% identical to the web version.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {
  // No-op: always fall through to the network, never intercept responses.
});
