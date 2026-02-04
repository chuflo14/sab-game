const CACHE_NAME = 'sab-game-media-cache-v1';
const SUPABASE_STORAGE_URL = 'ccxwkeriarlrzyicypee.supabase.co/storage/v1/object/public/';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Only intercept requests to our Supabase storage media
    if (url.href.includes(SUPABASE_STORAGE_URL) && (url.pathname.includes('/media/') || url.pathname.includes('/ads/'))) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        // Background update the cache for next time (stale-while-revalidate)
                        fetch(event.request).then((networkResponse) => {
                            if (networkResponse && networkResponse.status === 200) {
                                cache.put(event.request, networkResponse.clone());
                            }
                        }).catch(() => {
                            // Silent fail for background sync
                        });
                        return cachedResponse;
                    }

                    return fetch(event.request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch((error) => {
                        console.error('Fetch failed for media and not in cache:', error);
                        throw error;
                    });
                });
            })
        );
    }
});
