const CACHE_NAME = 'mil-v2';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Scheherazade+New:wght@400;700&family=Tajawal:wght@300;400;500;700&display=swap'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    // استراتيجية: الشبكة أولاً مع الرجوع للتخزين المؤقت عند الفشل
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
