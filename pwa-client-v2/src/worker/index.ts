// Custom Service Worker — code ajouté au SW Workbox généré par @ducanh2912/next-pwa
// Ce fichier est mergé dans le SW final au build.

declare let self: ServiceWorkerGlobalScope;

// Noms de caches connus — mettre à jour si un cache est renommé entre déploiements
const KNOWN_CACHES = [
  "api-cache",
  "pages-cache",
  "next-static",
  "images-cache",
  "static-assets",
  "workbox-precache-v2",
];

// Nettoyage des anciens caches à chaque activation du nouveau SW
self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter(
            (name) =>
              !KNOWN_CACHES.some((known) => name.startsWith(known))
          )
          .map((name) => {
            console.log("[SW] Suppression ancien cache :", name);
            return caches.delete(name);
          })
      )
    )
  );
});
