/* Service worker: l'app si apre anche senza rete (i dati arrivano quando torna).
   Rete prima, copia salvata come riserva: così un aggiornamento su GitHub arriva subito. */
const CACHE = "chemanca-v12";
const FILE = ["./", "index.html", "style.css", "app.js", "logica.js", "catalogo.js", "importa_pdf.js", "config.js", "piano.json", "manifest.webmanifest", "icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== CACHE).map((x) => caches.delete(x)))).then(() => self.clients.claim()));
});
// "Condividi con CheManca?" su Android: il PDF arriva qui, si parcheggia nella cache
// e l'app lo apre appena parte (index.html?condiviso=N)
const PARCHEGGIO = "chemanca-condivisi";
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method === "POST" && url.pathname.endsWith("/condividi")) {
    e.respondWith((async () => {
      const form = await e.request.formData();
      const files = form.getAll("pdf").filter((f) => f && f.size);
      const cache = await caches.open(PARCHEGGIO);
      for (const k of await cache.keys()) await cache.delete(k);
      for (const [i, f] of files.entries()) {
        await cache.put(new Request(`./condiviso/${i}`), new Response(f, { headers: { "Content-Type": f.type || "application/pdf", "X-Nome": encodeURIComponent(f.name || "dieta.pdf") } }));
      }
      return Response.redirect(new URL(`./index.html?condiviso=${files.length}`, self.registration.scope).href, 303);
    })());
    return;
  }
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request.url, { cache: "no-cache" })
      .then((r) => { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); return r; })
      .catch(() => caches.match(e.request))
  );
});
