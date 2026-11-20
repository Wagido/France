/* Service worker : rend le site installable comme une application, et utilisable hors connexion.
   - pages HTML et données : d'abord le réseau (pour avoir la dernière version), le cache en secours ;
   - scripts, styles, images, polices : le cache tout de suite, mis à jour en arrière-plan. */
const CACHE = "fp-v1";
const BASE = self.registration.scope;
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll([BASE, BASE + "style.css", BASE + "lib/icons/icon-192.png"]).catch(() => {})));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const reseauDabord = async req => {
  const c = await caches.open(CACHE);
  try {
    const r = await fetch(req);
    if (r && r.ok) c.put(req, r.clone());
    return r;
  } catch (err) {
    return (await c.match(req, { ignoreSearch: req.mode === "navigate" })) || (req.mode === "navigate" ? c.match(BASE) : Response.error());
  }
};
const cacheDabord = async req => {
  const c = await caches.open(CACHE), hit = await c.match(req);
  const maj = fetch(req).then(r => { if (r && (r.ok || r.type === "opaque")) c.put(req, r.clone()); return r; }).catch(() => hit);
  return hit || maj;
};
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  if (url.hostname.includes("goatcounter")) return;                       // mesure d'audience : jamais en cache
  if (req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith(".json")) { e.respondWith(reseauDabord(req)); return; }
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com|cdnjs|jsdelivr|unpkg/.test(url.hostname)) e.respondWith(cacheDabord(req));
});
