const SPT_CACHE="spt-v35-cache";
const ASSETS=["./","./index.html","./style.css","./main.css","./main.js","./script.js","./payment_qr.jpg"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(SPT_CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==SPT_CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch",e=>{e.respondWith(fetch(e.request).catch(()=>caches.match(e.request).then(r=>r||caches.match("./index.html"))));});
