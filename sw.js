/* Service worker: l'app si apre anche senza rete (i dati arrivano quando torna).
   Rete prima, copia salvata come riserva: così un aggiornamento su GitHub arriva subito. */
const CACHE = "chemanca-v2";
const FILE = ["./", "index.html", "style.css", "app.js", "logica.js", "catalogo.js", "importa_pdf.js", "config.js", "piano.json", "manifest.webmanifest", "icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== CACHE).map((x) => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); return r; })
      .catch(() => caches.match(e.request))
  );
});
