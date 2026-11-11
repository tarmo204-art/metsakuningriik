// Metsakuningriigi teenustöötaja: alati proovib enne võrku (nii tuleb uus versioon kohe), võrguta näitab viimast salvestatud versiooni.
const C = 'mk-v1';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(['./', 'vendor/supabase.js', 'icons/icon-192.png']).catch(() => { }))) });
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return; // Supabase ja fondid lähevad otse
  e.respondWith(fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)) } return res })
    .catch(() => caches.match(r).then(m => m || caches.match('./'))));
});
