const CACHE_NAME = 'mil-v2';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './app_icon_1774282580592.png',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Scheherazade+New:wght@400;700&family=Tajawal:wght@300;400;500;700&display=swap'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // استثناء طلبات Supabase من التخزين بـ API - اتركها للشبكة دائماً
    if (url.hostname.includes('supabase.co')) {
        return; // العودة للسلوك الافتراضي للمتصفح (الشبكة فقط)
    }

    // استراتيجية التخزين أولاً للأصول الثابتة (Static Assets)
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});
