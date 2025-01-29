const CACHE_NAME = 'podclass-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install service worker and cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(STATIC_ASSETS)
          .catch(error => {
            console.error('Failed to cache static assets:', error);
            // Continue with installation even if caching fails
            return Promise.resolve();
          });
      })
  );
});

// Activate service worker and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
});

// Fetch event handler with network-first strategy
self.addEventListener('fetch', (event) => {
  // Skip Supabase API calls and other external resources
  if (
    event.request.url.includes('supabase.co') ||
    event.request.url.includes('firestore.googleapis.com') ||
    event.request.url.includes('cdn.simplecast.com')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for static assets
        if (response.ok && STATIC_ASSETS.includes(event.request.url)) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request)
          .then((response) => {
            return response || Promise.reject('no-match');
          });
      })
  );
});