const CACHE_NAME = 'mil-v12'; // Bumped version
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './app_icon_1774282580592.png',
    './css/ottoman.css',
    './js/quran.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Scheherazade+New:wght@400;700&family=Tajawal:wght@300;400;500;700&display=swap'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // استثناء طلبات Supabase من التخزين بـ API - اتركها للشبكة دائماً
    if (url.hostname.includes('supabase.co')) {
        return; 
    }

    // استراتيجية الشبكة أولاً للأصول الثابتة (Network-First)
    e.respondWith(
        fetch(e.request).then((response) => {
            // تحديث التخزين المؤقت بالنسخة الجديدة
            if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, responseClone);
                });
            }
            return response;
        }).catch(() => {
            // إذا فشل الاتصال بالشبكة، استخدم النسخة المخزنة
            return caches.match(e.request).then((response) => {
                return response || new Response('Offline: Resource not found');
            });
        })
    );
});
