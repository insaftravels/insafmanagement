/* ইনসাফ ম্যানেজমেন্ট — Service Worker
   প্রতিবার ডিপ্লয়ের সময় নিচের CACHE_NAME ভার্সন বাড়াবেন (v1 -> v2 ...)। */
const CACHE_NAME = 'insafmgmt-v7';

const ASSETS = [
  '/insafmanagement/',
  '/insafmanagement/index.html',
  '/insafmanagement/manifest.json',
  '/insafmanagement/icon-512.png',
  '/insafmanagement/icon-maskable-512.png'
];

// ইনস্টল — শেল ক্যাশ
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// অ্যাক্টিভেট — পুরোনো ক্যাশ মুছে ফেলা
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ফেচ কৌশল:
//  - navigation (HTML): network-first, ব্যর্থ হলে ক্যাশড index
//  - বাকি একই-অরিজিন GET: cache-first, না থাকলে network এনে ক্যাশ
//  - Firebase/বাইরের রিকোয়েস্ট: সরাসরি network (ক্যাশ করি না)
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('/insafmanagement/index.html'))
    );
    return;
  }

  if (!sameOrigin) return; // CDN/Firebase ইত্যাদি — ব্রাউজারের হাতে ছেড়ে দিই

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => hit))
  );
});
