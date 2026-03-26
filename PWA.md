# Rapport PWA — Atsume

> **Objectif** : Transformer le support PWA existant en une expérience native-like sur iOS et Android, avec un cache progressif orienté "Ma Collection", des données toujours fraîches, et une gestion offline stricte (zéro queue, toutes actions bloquées).

---

## État actuel

| Élément | Statut | Notes |
|---|---|---|
| Service Worker | ⚠️ Auto-généré | Via `@ducanh2912/next-pwa`, pas de contrôle fin |
| Manifest | ✅ Présent | Quelques champs manquants pour iOS |
| Icônes 192 / 512 | ✅ Présents | Maskable non vérifié |
| Cache images/assets | ⚠️ Partiel | Stratégie générique, pas par page |
| Cache "Ma Collection" | ❌ Absent | Aucun cache orienté navigation |
| Offline detection | ✅ Présent | `OfflineContext` + toast |
| Toast online/offline | ✅ Présent | Sonner, toast persistant offline |
| Actions désactivées offline | ⚠️ Partiel | `isOffline` tracked mais pas forcément appliqué partout |
| Bouton d'installation | ❌ Absent | Pas de `beforeinstallprompt` |
| Support iOS (Add to Home) | ⚠️ Partiel | Meta tags présents mais incomplets |
| Support Android | ⚠️ Partiel | Manifest OK mais pas d'invite personnalisée |

---

## 1. Service Worker & Stratégies de Cache

> Reprendre la configuration du SW pour avoir un contrôle précis par type de ressource et par route.

- [x] **Passer à un SW custom** via `@ducanh2912/next-pwa` en mode `customWorkerSrc` ou migrer vers `next-pwa` officiel avec `serwist` pour un contrôle total
- [x] **Précaching des assets statiques** : JS, CSS, fonts — stratégie `CacheFirst` avec versioning automatique (hash Webpack)
- [x] **Cache des images** : stratégie `CacheFirst`, expiration 30 jours, max 100 entrées
  ```js
  // urlPattern: /\.(png|jpg|jpeg|webp|avif|svg|ico)$/i
  // handler: CacheFirst
  // cache: 'images-cache', maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60
  ```
- [x] **Cache des chunks JS/CSS Next.js** (`/_next/static/`) : stratégie `CacheFirst`, expiration 365 jours (déjà versionnés par hash)
- [x] **Supprimer la limite de taille** sur le précache (déjà fait selon git : commit `062d31a`) — vérifier que c'est bien actif en prod
- [x] **Nettoyer les anciens caches** à chaque activation du nouveau SW (`activate` event avec purge des caches obsolètes)

---

## 2. Cache Progressif — "Ma Collection" & Onglets

> Le cache des pages et données doit se construire au fil de la navigation, pas en précachant tout au départ.

- [x] **Cache des navigations (pages HTML)** : stratégie `NetworkFirst` pour toutes les routes sous `/(app)/` — la page est mise en cache lors de la première visite, puis servie depuis le cache si offline
  ```js
  // urlPattern: /^\/(collection|loans|stats|settings).*/
  // handler: NetworkFirst
  // cache: 'pages-cache', maxAgeSeconds: 24 * 60 * 60
  ```
- [x] **Cache progressif par onglet** : lors de la visite d'un onglet de "Ma Collection" (ex: `/collection?tab=mangas`), la réponse réseau est mise en cache — les visites suivantes bénéficient du cache immédiatement
- [x] **Cache des réponses API** (`/api/...`) : stratégie `NetworkFirst` avec fallback cache
  - Timeout réseau : 5s max avant fallback
  - Expiration cache : 24h
  - Max entrées : 150 (couvre collection + détails items)
  ```js
  // urlPattern: /\/api\/.*/
  // handler: NetworkFirst
  // networkTimeoutSeconds: 5
  // cache: 'api-cache', maxEntries: 150, maxAgeSeconds: 24 * 60 * 60
  ```
- [x] **Mise à jour en arrière-plan** : quand l'utilisateur revient sur un onglet déjà visité, le SW refetch en background et met à jour le cache sans bloquer l'affichage (les données fraîches remplacent les anciennes silencieusement)
- [x] **Invalider le cache API sur mutation** : côté client (React Query), déclencher une invalidation des queries concernées après chaque mutation réussie — le prochain fetch re-populera le cache SW

---

## 3. Gestion Offline — Zéro Queue, Actions Bloquées

> Aucune action d'écriture ne doit être possible hors connexion. Pas de background sync, pas de queue.

- [ ] **Vérifier et compléter `OfflineContext`** : s'assurer que `isOffline` est bien consommé dans tous les composants contenant des mutations (formulaires, boutons d'ajout, édition, suppression)
- [ ] **Bloquer tous les boutons de mutation** quand `isOffline === true` : prop `disabled` conditionnelle ou wrapper global
  ```tsx
  // Exemple : désactiver visuellement et fonctionnellement
  <Button disabled={isOffline} title={isOffline ? "Non disponible hors ligne" : undefined}>
    Ajouter
  </Button>
  ```
- [ ] **Bloquer les soumissions de formulaires** : vérifier `isOffline` dans chaque `onSubmit` / action TanStack mutation et retourner sans appel API
- [ ] **Aucun `BackgroundSyncPlugin`** dans le SW — ne pas l'implémenter
- [ ] **Page offline fallback** : si l'utilisateur tente d'accéder à une route jamais visitée en offline, servir une page `/offline.html` précachée avec un message clair
  - [ ] Créer `public/offline.html` (minimal, branded)
  - [ ] Précacher `/offline.html` dans le SW
  - [ ] Configurer le SW pour servir ce fallback pour les navigations non cachées en offline

---

## 4. Toasts Online / Offline

> Déjà existants — vérifications et ajustements mineurs.

- [x] Toast "Vous êtes hors ligne" (persistant, icône WifiOff) — **existant**
- [x] Toast "Vous êtes de nouveau en ligne" — **existant**
- [ ] **Vérifier le comportement du toast offline** : s'assurer qu'il ne disparaît pas tant que la connexion n'est pas rétablie (`duration: Infinity` ou toast contrôlé par `id`)
- [ ] **Vérifier que le toast online** dismiss bien le toast offline (dismiss par `id` avec Sonner)
- [ ] **Tester les edge cases** : connexion instable (offline/online en boucle rapide) → pas de spam de toasts

---

## 5. Manifest & Installation iOS

> iOS ne supporte pas `beforeinstallprompt` — l'installation passe par "Ajouter à l'écran d'accueil" dans Safari.

- [ ] **Vérifier `apple-mobile-web-app-capable`** dans le layout Next.js (`<meta name="apple-mobile-web-app-capable" content="yes">`) — déjà présent, confirmer
- [ ] **Vérifier `apple-mobile-web-app-status-bar-style`** : `black-translucent` pour fond sombre — déjà présent, confirmer le rendu
- [ ] **Vérifier `apple-mobile-web-app-title`** : `"Atsume"` — déjà présent
- [ ] **Apple Touch Icon** : vérifier que `apple-touch-icon.png` (180×180) est correctement déclaré dans le `<head>` ET référencé dans le manifest
- [ ] **Splash screens iOS** : ajouter les `apple-touch-startup-image` pour les tailles d'écrans courants (iPhone 14/15, iPad) — optionnel mais améliore le launch
- [ ] **Tester "Add to Home Screen" sur Safari iOS** :
  - [ ] L'icône est correcte (non déformée, pas de fond blanc)
  - [ ] L'app s'ouvre en mode standalone (sans barre d'URL Safari)
  - [ ] La status bar est cohérente avec le thème sombre
  - [ ] Le splash screen s'affiche correctement

---

## 6. Manifest & Installation Android

- [ ] **Vérifier l'icône maskable** : s'assurer que l'icône 512×512 déclarée avec `"purpose": "maskable"` a bien une zone de sécurité (safe zone 80% du centre) pour les adaptive icons Android
  - [ ] Si l'icône actuelle déborde hors de la safe zone : générer une version maskable avec fond coloré (`#0a0a0b`) et logo centré
  - Outil recommandé : [maskable.app](https://maskable.app/editor)
- [ ] **Ajouter icône `"purpose": "any maskable"`** ou deux entrées séparées dans le manifest :
  ```json
  { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
  { "src": "/icons/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ```
- [ ] **Bouton d'installation personnalisé** : implémenter `beforeinstallprompt` pour afficher un CTA discret dans l'app (bannière, menu, settings)
  ```tsx
  // src/hooks/useInstallPrompt.ts
  // Capturer beforeinstallprompt, exposer prompt(), isInstallable
  ```
  - [ ] Créer le hook `useInstallPrompt`
  - [ ] Ajouter un point d'entrée UI (ex: dans les Settings ou une bannière dismissable)
  - [ ] Gérer `appinstalled` pour masquer le CTA après installation
- [ ] **Tester l'installation sur Chrome Android** :
  - [ ] La bannière native apparaît ou le bouton custom fonctionne
  - [ ] L'icône adaptive est correcte dans le launcher
  - [ ] L'app s'ouvre en standalone

---

## 7. Manifest — Champs Complémentaires

- [ ] **Ajouter `screenshots`** pour enrichir la UI d'installation (Android Chrome) :
  ```json
  "screenshots": [
    { "src": "/screenshots/mobile-collection.png", "sizes": "390x844", "type": "image/png", "form_factor": "narrow" }
  ]
  ```
- [ ] **Vérifier `start_url`** : utiliser `/?source=pwa` pour tracker les lancements depuis l'app installée dans les analytics
- [ ] **Vérifier `scope`** : doit être `/` pour couvrir toutes les routes
- [ ] **Ajouter `id`** dans le manifest (identifiant stable pour éviter les réinstallations en cas de changement de `start_url`) :
  ```json
  "id": "atsume-pwa"
  ```

---

## 8. Performance & Expérience Native

- [ ] **Désactiver le pull-to-refresh natif** du navigateur quand l'app est installée (évite les rechargements accidentels) via CSS : `overscroll-behavior: none` sur `body`
- [ ] **Désactiver le tap highlight** sur iOS : `-webkit-tap-highlight-color: transparent`
- [ ] **Désactiver la sélection de texte** sur les éléments interactifs en mode PWA
- [ ] **Vérifier le viewport** : `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` — `viewport-fit=cover` essentiel pour les encoches iOS
- [ ] **Safe area insets** : vérifier que le bottom nav utilise `padding-bottom: env(safe-area-inset-bottom)` pour ne pas être masqué par la home bar iOS
- [ ] **Lighthouse PWA audit** : viser un score PWA 100 en production
  ```bash
  npx lighthouse https://atsume.app --view
  ```

---

## 9. Tests & Validation

- [ ] **Tester offline sur iOS Safari** : mode avion, ouvrir l'app → "Ma Collection" doit s'afficher depuis le cache
- [ ] **Tester offline sur Android Chrome** : mode avion, ouvrir l'app → idem
- [ ] **Vérifier que les mutations sont bloquées offline** : essayer d'ajouter/modifier un item → bouton disabled, aucune requête envoyée
- [ ] **Tester la mise à jour du cache** : modifier des données depuis un autre appareil, revenir sur l'app online → les données se mettent à jour
- [ ] **Tester le rechargement du SW** : déployer une nouvelle version → vérifier que le SW se met à jour et que les anciens caches sont purgés
- [ ] **Tester les toasts** : couper/rétablir le Wi-Fi → toast offline puis toast online, pas de doublon
- [ ] **Vérifier DevTools** : Application > Service Workers, Application > Cache Storage — inspecter les entrées mises en cache après navigation

---

## Ordre de priorité suggéré

1. **SW custom + stratégies de cache** (section 1 & 2) — fondation de tout le reste
2. **Offline actions bloquées** (section 3) — comportement critique
3. **Installation Android** avec maskable icon + install prompt (section 6)
4. **Installation iOS** vérifications et splash screens (section 5)
5. **Tests complets** (section 9)
6. **Polish** : manifest screenshots, performance native (sections 7 & 8)
