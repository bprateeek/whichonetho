// Service Worker for WhichOneTho PWA

const CACHE_NAME = "whichonetho-v1";

// Install event - skip waiting to activate immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate event - claim all clients
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch event - network-first strategy (no caching for now)
self.addEventListener("fetch", (event) => {
  // Let all requests pass through to the network
  // This is a minimal SW just for PWA qualification
});
