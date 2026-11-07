// Catálogo Eshara: guarda la app en el celular para que abra sin internet.
// Si cambiás los archivos, subí también este y cambiá el número de VERSION.
const VERSION = 'catalogo-eshara-v1';
const FUENTES = 'catalogo-eshara-fuentes-v1';
const BASE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== FUENTES).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Los archivos de la app: con internet se usa la versión más nueva; sin internet, la guardada.
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req)
        .then(r => { if (r && r.ok) { const copia = r.clone(); caches.open(VERSION).then(c => c.put(req, copia)); } return r; })
        .catch(() => caches.match(req).then(m => m || caches.match('./index.html')))
    );
    return;
  }

  // Las letras de Google Fonts: se guardan la primera vez para que se vean también sin internet.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(FUENTES).then(c =>
        c.match(req).then(m => m || fetch(req).then(r => { c.put(req, r.clone()); return r; }))
      )
    );
  }
  // Todo lo demás (por ejemplo la IA para quitar fondos) va directo a internet.
});
