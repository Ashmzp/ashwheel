/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'ashwheel-cache-v2';
const OFFLINE_URL = '/offline.html';
const ALLOWED_ORIGINS = ['https://ashwheel.cloud', 'http://localhost:5173', 'https://supabase.ashwheel.cloud'];
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png',
  '/images/placeholder.jpg',
  OFFLINE_URL
];

// Validate request origin and protocol
const isValidRequest = (url) => {
  try {
    const requestUrl = new URL(url);
    // Check protocol
    if (!ALLOWED_PROTOCOLS.includes(requestUrl.protocol)) {
      return false;
    }
    // Check origin
    return ALLOWED_ORIGINS.some(origin => requestUrl.origin === origin || requestUrl.origin === self.location.origin);
  } catch {
    return false;
  }
};

// Install the service worker and cache the app shell
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate the service worker and clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercept fetch requests
self.addEventListener('fetch', event => {
  // Validate request URL and method
  if (!isValidRequest(event.request.url)) {
    console.warn('Blocked request to invalid origin:', event.request.url);
    return;
  }
  
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // For navigation requests, try network first, then cache, then offline page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // For other requests (CSS, JS, images), use a cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch from network, then cache it
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
      }).catch(() => {
        // If fetching fails (e.g., offline) and it's an image, show a placeholder
        if (event.request.destination === 'image') {
          return caches.match('/images/placeholder.jpg');
        }
      })
  );
});