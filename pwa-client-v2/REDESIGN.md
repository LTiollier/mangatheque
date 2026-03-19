# Refonte Frontend — Mangastore PWA v2

> Refonte complète from scratch. Le backend Laravel DDD ne change pas.
> Stack cible : Next.js 16 · React 19 · Tailwind CSS 4 · shadcn/ui · Framer Motion · React Query v5
> Rapport de design complet : [`rapport.md`](./rapport.md)
---

## Progression globale

**61 / 87 tâches complètes** — Dernière mise à jour : 2026-03-19

```
Phase 0 — Décisions    ██████████  5/5  ✅ COMPLÈTE
Phase 1 — Audit        ██████████  7/7  ✅ COMPLÈTE
Phase 2 — Direction    ██████████  5/5  ✅ COMPLÈTE
Phase 3 — Design sys.  ██████████  9/9  ✅ COMPLÈTE
Phase 3.5 — Bootstrap  ██████████  8/8  ✅ COMPLÈTE
Phase 3.6 — Env local  ██████████  5/5  ✅ COMPLÈTE
Phase 4 — Composants   ██████████  16/16  ✅ COMPLÈTE
Phase 5 — Pages        ███░░░░░░░  6/20
Phase 6 — Polish       ░░░░░░░░░░  0/12
```

> **⚙️ Décisions arrêtées :**
> - **Thème unique : Void** — noir absolu · radius 4px · Syne + Nunito Sans · hardcodé, pas de sélecteur de thème
> - **Palette par défaut : Abyss & Ember** (accent ambre `hue 55`)
> - Les **4 palettes** (Ember · Crimson · Indigo · Forest) sont toutes implémentées et switchables depuis les Settings
> - Obsidian et Washi sont **abandonnés** — hors scope

---

## Phase 0 — Décisions bloquantes ⚡

> Ces décisions doivent être prises **avant** d'écrire la moindre ligne de code.
> Référence : section 9 de `rapport.md`.

- [x] **Thème : Void uniquement** — ~~Obsidian et Washi abandonnés~~ · radius 4px · Syne + Nunito Sans · hardcodé ✓
- [x] **Palette par défaut : Abyss & Ember** — les 4 palettes (Ember · Crimson · Indigo · Forest) sont switchables depuis les Settings ✓
- [x] **Architecture de navigation : Hub Collection** — bottom nav 5 items · Collection = hub avec sous-tabs (Bibliothèque · Prêts · Wishlist · Lu) ✓
- [x] **Interactions mobile : boutons explicites** — pas de swipe actions · icônes d'action visibles directement sur les cartes ✓
- [x] **Pas de dark mode toggle** — le fond Void est fixe (`#0a0a0b`), les 4 palettes sont toutes sombres par nature · pas de variante light à prévoir ✓

---

## Phase 1 — Audit de l'existant ✅

> Audit réalisé sur `pwa-client/`. Toutes les conclusions sont ci-dessous.

- [x] Recenser les 13 pages existantes et leurs rôles
- [x] Identifier les composants réutilisables à porter tel quel (logique, pas le style)
- [x] Lister les hooks React Query à conserver sans modification
- [x] Lister les services API à conserver tels quels
- [x] Documenter les patterns visuels incohérents
- [x] Auditer les contrastes WCAG actuels
- [x] Inventorier les dépendances à garder / supprimer / upgrader

---

### 1.1 — Pages recensées

**Auth** (4 routes — hors layout protégé)
| Route | Rôle |
|---|---|
| `/login` | Email + password, liens register + forgot |
| `/register` | Name + email + password |
| `/forgot-password` | Envoi du lien de reset |
| `/reset-password` | Nouveau mot de passe + confirmation |

**App protégée** (8 routes + profondeur série)
| Route | Rôle |
|---|---|
| `/dashboard` | Stats, derniers ajouts, raccourcis |
| `/collection` | Liste des séries possédées |
| `/search` | Catalogue complet, ajout à la collection |
| `/scan` | Scanner codes-barres + ajout batch |
| `/loans` | Prêts actifs + historique |
| `/reading-progress` | Progression de lecture par série |
| `/settings` | Username, visibilité profil |
| `/wishlist` | Éditions/coffrets souhaités |

**Sous-pages série** (profondeur 3)
| Route | Rôle |
|---|---|
| `/series/[id]` | Éditions + box-sets d'une série |
| `/series/[id]/edition/[id]` | Grille volumes avec statuts |
| `/series/[id]/box-set/[id]` | Détail box-set |
| `/series/[id]/box/[id]` | Détail d'une boîte |

**Public** (sans auth)
| Route | Rôle |
|---|---|
| `/user/[username]` | Profil public, stats |
| `/user/[username]/collection` | Collection publique read-only |
| `/user/[username]/series/[id]/...` | Miroir des sous-pages série en read-only |

---

### 1.2 — Composants : ce qu'on garde

**Logique pure — porter tel quel**
| Fichier | Ce qu'il fait | Verdict Vercel |
|---|---|---|
| `hooks/queries.ts` | React Query hooks + optimistic updates | ✅ Pattern correct |
| `contexts/AuthContext.tsx` | `useSyncExternalStore` hydration-safe | ✅ Correct — retirer `useHasHydrated` (redondant) |
| `manga/barcode-scanner.tsx` | Logique HTML5-QRCode | ✅ |
| `contexts/OfflineContext.tsx` | Détection online/offline | ✅ |
| `lib/api.ts` | Client Axios + interceptors | ✅ |
| `lib/tokenStorage.ts` | Persistance JWT localStorage | ✅ |
| `lib/error.ts` | Parsing erreurs API | ✅ |
| `schemas/` | Zod schemas | ✅ |
| `types/` | Types TypeScript | ✅ |
| `providers/ReactQueryProvider.tsx` | Setup TanStack Query | ✅ |

**Logique bonne — refaire le style uniquement**
| Fichier | Changement v2 |
|---|---|
| `common/PageTransition.tsx` | Garder la logique, appliquer style Void |
| `layout/BottomNav.tsx` | Refaire le rendu Void |
| `layout/Shell.tsx` | Refaire le rendu Void |
| `manga/loan-dialog.tsx` | Migrer en `BottomSheet` |
| `ui/EmptyState.tsx` | Refaire visuellement |

**Pages — réécrire avec Server Components** *(règle `async-waterfalls` — CRITIQUE)*
> Toutes les pages actuelles sont `"use client"` avec data fetching client-side.
> En v2, adopter le vrai pattern App Router :
```
Page (Server Component)       ← fetch en parallèle côté serveur, Promise.all()
  └── ClientIsland (use client) ← mutations, état UI, interactions seulement
```
| Page | Impact |
|---|---|
| Dashboard | 3 fetches → `Promise.all()` serveur, zéro loading state |
| Collection | Données disponibles dès le rendu, `initialData` dans React Query |
| Toutes les autres | Même pattern : Server Component + Client island minimal |

**Remplacer**
| Fichier | Par |
|---|---|
| `auth/AuthGuard.tsx` | `middleware.ts` Next.js — redirect auth au niveau edge, plus performant |

**Supprimer**
| Fichier | Raison |
|---|---|
| `contexts/AlertContext.tsx` | Remplacé par `sonner` |
| `common/ActionToolbar.tsx` | Remplacé par BottomSheet + boutons explicites |
| `hooks/useLoans.ts` | Doublon de `queries.ts` — sans cache, sans optimistic updates |

---

### 1.3 — Hooks — verdict Vercel

| Hook | Décision | Règle |
|---|---|---|
| `hooks/queries.ts` | ✅ Garder + support `initialData` en v2 | Pattern correct |
| `hooks/useGroupedCollection.ts` | ✅ Garder tel quel | `rerender-memo` ✅ |
| `hooks/useHasHydrated.ts` | ✅ Garder tel quel | `rendering-hydration-no-flicker` ✅ |
| `hooks/useOnlineStatus.ts` | 🔄 Réécrire avec `useSyncExternalStore` | `rendering-hydration-no-flicker` |
| **`hooks/useLoans.ts`** | **❌ Supprimer** — doublon de `queries.ts` | `client-swr-dedup` |

**`useOnlineStatus` — réécriture requise**
```ts
// Actuel : useState + useEffect (pattern déprécié pour stores externes)
// v2 : useSyncExternalStore (React 18)
const subscribe = (cb: () => void) => {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => { window.removeEventListener('online', cb); window.removeEventListener('offline', cb); };
};
export const useOnlineStatus = () =>
  useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
```

**`useLoans.ts` — pourquoi le supprimer**
Gère manuellement ce que `queries.ts` fait déjà mieux : pas de cache partagé, refetch séquentiel après mutation (lent), pas de rollback sur erreur. `useLoansQuery` + `useReturnLoan` + `useBulkReturnLoans` le remplacent intégralement.

**Évolution `queries.ts` en v2**
Ajouter `initialData` optionnel sur chaque query pour hydrater depuis les Server Components :
```ts
export function useMangas(initialData?: Manga[]) {
  return useQuery({ queryKey: queryKeys.mangas, queryFn: mangaService.getCollection, initialData });
}
```

---

### 1.4 — Services API — verdict Vercel

| Service | Décision | Règle |
|---|---|---|
| `auth.service.ts` | ✅ Garder tel quel | — |
| `loan.service.ts` | ✅ Garder tel quel | — |
| `readingProgress.service.ts` | ✅ Garder tel quel | — |
| `user.service.ts` | ✅ Garder tel quel | — |
| `wishlist.service.ts` | ✅ Garder tel quel | — |
| `manga.service.ts` | 🔄 2 améliorations | `server-cache-react` |
| `lib/api.ts` | ✅ Garder tel quel | `server-hoist-static-io` ✅ |

**`manga.service.ts` — 2 améliorations**

1. **Supprimer le silent validation failure** — laisser Zod jeter, React Query gère l'état erreur :
```ts
// Actuel : avale les erreurs, passe des données invalides
} catch { return r.data.data as unknown as Manga[]; }

// v2 : laisse remonter — React Query affiche l'état erreur proprement
getCollection: () => api.get('/mangas').then(r => z.array(MangaSchema).parse(r.data.data)),
```

2. **Wrapper avec `React.cache()`** pour la déduplication dans les Server Components :
```ts
import { cache } from 'react';
export const getCollection = cache(() =>
  api.get<ApiResponse<Manga[]>>('/mangas').then(r => z.array(MangaSchema).parse(r.data.data))
);
// Sans cache() : 2 Server Components qui appellent getCollection() → 2 requêtes HTTP
// Avec cache()  : même render → 1 seule requête
```

---

### 1.5 — Patterns visuels incohérents à corriger

| Problème | Localisation | Impact |
|---|---|---|
| `.manga-grid-item` anime chaque card au mount (`slide-in-from-bottom-4`) | `globals.css:191` | **Lag garanti** sur collections 50+ volumes — violation règle animations |
| `.manga-panel` shadow hardcodée `4px 4px 0px` style comic book | `globals.css:178` | Incohérent avec le style Void épuré — à supprimer |
| `border-2` + `rounded-xl` (12px) sur les cards | `globals.css:174` | Radius 12px ≠ Void radius 4px |
| Font display : Bebas Neue | `globals.css:11` | À remplacer par Syne |
| `--radius: 0.75rem` global | `globals.css:72` | À remplacer par `0.25rem` |
| Labels nav : `text-[9px] font-black uppercase tracking-widest` | `BottomNav.tsx:40` | Trop compact, illisible sur petits écrans |
| Active state nav : background blob `bg-primary/10 rounded-xl` | `BottomNav.tsx:57` | Peu visible sur fond sombre Void — remplacer par dot |
| `@custom-variant dark (&:is(.dark *))` dans globals.css | `globals.css:5` | Inutile — plus de dark mode toggle |

---

### 1.6 — Audit contrastes WCAG actuels

| Paire | Ratio actuel | Requis AA | Statut |
|---|---|---|---|
| `--foreground` sur `--background` (dark) | ~18:1 | 4.5:1 | ✅ AAA |
| `--muted-foreground` sur `--background` (dark) | ~6.5:1 | 4.5:1 | ✅ AA |
| `--primary-foreground` blanc sur `--primary` orange (`oklch(0.65 0.25 35)`) | ~2.5:1 | 4.5:1 | ❌ **FAIL** |
| Texte sur `--card` (dark) | ~16:1 | 4.5:1 | ✅ AAA |

> **Violation critique :** le texte blanc sur le bouton primary orange est illisible (~2.5:1). Dans la palette Ember (ambre L=72%), ce problème disparaît si le texte des boutons est sombre (`--btn-text: oklch(8% ...)`) — déjà prévu dans `rapport.md` §5 Palette 3.

---

### 1.7 — Dépendances

**À conserver sans changement**
`next` · `react` · `react-dom` · `@tanstack/react-query` · `axios` · `date-fns` · `framer-motion` · `html5-qrcode` · `sonner` · `lucide-react` · `react-hook-form` · `@hookform/resolvers` · `zod` · `@ducanh2912/next-pwa` · `tailwindcss@^4` · `shadcn` · `class-variance-authority` · `clsx` · `tailwind-merge` · tous les `@radix-ui/*` · `@types/*` · `typescript` · `eslint`

**À supprimer**
| Package | Raison |
|---|---|
| `tw-animate-css` | Fournit des classes d'animation CSS Tailwind — inutile avec la règle "animations avec parcimonie". Framer Motion couvre les cas restants. |

**À ajouter**
| Package | Raison |
|---|---|
| `next/font` (intégré Next.js) | Chargement optimisé Syne + Nunito Sans — pas de package supplémentaire |

---

## Phase 2 — Direction artistique ✅

> Thème Void = décision finale. Cette phase ne fait que formaliser les specs.
> Skills recommandés : `/ui-designer` · `/ux-expert`
> Specs complètes dans [`direction.md`](./direction.md)

- [x] **Syne** (display) + **Nunito Sans** (body) + **IBM Plex Mono** — imports `next/font` spécifiés dans `direction.md` §1 ✓
- [x] Scale typographique Void formalisée (xs 11px → 3xl 40px, 7 niveaux) — `direction.md` §1 ✓
- [x] Système d'espacements formalisé (multiples de 4px, micro 4px → 2XL 48px) — `direction.md` §2 ✓
- [x] Ombres par niveau d'altitude définies — teintées `color-mix(--primary)`, tokens `--shadow-*` + `--shadow-glow-*` — `direction.md` §4 ✓
- [x] Animations cibles définies — variants Framer Motion, durées, courbes, règles parcimonie — `direction.md` §5 ✓
  - **Règle ferme : animations avec parcimonie.** Pas d'animation sur les éléments répétés en grille (covers, volumes) au chargement — ça lag sur mobile.
  - ✅ Animer : transitions de page · ouverture/fermeture de bottom sheet · apparition d'un gros bloc (section dashboard) · feedback d'une action utilisateur (ajout, retour de prêt, toggle lu)
  - ❌ Ne pas animer : chaque VolumeCard au mount · chaque ligne de liste · skeleton → contenu (fade simple max)

---

## Phase 3 — Système de design ✅

> Skills recommandés : `/color-system`
> **Principe :** le thème Void est hardcodé (tokens fixes). Seule la **palette** est dynamique via une classe CSS sur `<html>`.
> Tailwind et shadcn lisent toujours les mêmes noms de tokens — seule la classe `.palette-*` change.

### Tokens & CSS
- [x] Tokens fixes du thème Void dans `:root` — `--radius: 0.25rem`, fond `oklch(7% 0.008 250)`, typographie, ombres — `src/app/globals.css` ✓
- [x] 4 palettes de couleurs définies en OKLch :
  - `:root, .palette-ember { --primary: oklch(72% 0.24 55); ... }` ← **défaut** ✓
  - `.palette-crimson { --primary: oklch(62% 0.24 18); ... }` ✓
  - `.palette-indigo  { --primary: oklch(65% 0.26 290); ... }` ✓
  - `.palette-forest  { --primary: oklch(62% 0.22 155); ... }` ✓
- [x] Tokens sémantiques Mangastore dans chaque palette (`--color-read` · `--color-loaned` · `--color-wishlist` · `--color-owned`) ✓
- [x] Contrastes WCAG AA vérifiés — foreground/fond ~14:1 AAA · muted/fond ~5.5:1 AA · primary-fg/primary ≥ 5.9:1 AA sur les 4 palettes ✓
- [x] Classes utilitaires Void dans `globals.css` — `.manga-grid` · `.manga-card` · `.status-dot` · `.manga-progress` · `.safe-area-*` ✓
- [x] `components.json` configuré — style `new-york`, baseColor `zinc`, cssVariables `true` ✓

### Infrastructure
- [x] `PaletteContext` créé — `src/contexts/PaletteContext.tsx` · `useSyncExternalStore` hydration-safe · persisté en `localStorage` ✓
- [x] Classe `.palette-X` appliquée sur `<html>` au mount, sans flash, sans re-render de l'arbre ✓
- [x] Convention de tokens documentée en tête de `globals.css` ✓

> **Bonus :** `src/lib/motion.ts` — tous les variants Framer Motion (page · section · stat cards · bottom sheet · feedback · fade · tab)

---

## Phase 3.5 — Bootstrap & Installation

> Scaffolder le projet Next.js et installer toutes les dépendances avant d'écrire le moindre composant.
> Les fichiers de design system (`globals.css`, `PaletteContext.tsx`, `motion.ts`, `components.json`) sont déjà créés — il suffit de les intégrer.

### Scaffolding
- [x] `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `.gitignore`, `.env.example` créés manuellement (évite l'écrasement des fichiers Phase 3 par `create-next-app`) ✓
- [x] Aucun fichier de démo à nettoyer — projet créé sans template ✓

### Dépendances
- [x] `npm install` — 597 packages installés ✓
- [x] shadcn configuré via `components.json` existant — composants à installer au besoin avec `npx shadcn@latest add <composant>` ✓

### Configuration
- [x] `next.config.ts` — PWA (`@ducanh2912/next-pwa`), `turbopack`, `images.remotePatterns` ✓
- [x] `src/middleware.ts` — AuthGuard edge avec fallback `laravel_session` cookie ✓
- [x] TypeScript check `tsc --noEmit` — aucune erreur ✓

### Porter la logique de `pwa-client/`
- [x] Hooks : `queries.ts` (+ `initialData` sur `useMangas`) · `useGroupedCollection.ts` · `useHasHydrated.ts` · `useOnlineStatus.ts` (réécrit `useSyncExternalStore` — règle `client-event-listeners`) ✓
- [x] Lib : `api.ts` · `tokenStorage.ts` · `error.ts` · `utils.ts` ✓
- [x] Services : auth · loan · manga (+ `React.cache()` + Zod strict) · readingProgress · user · wishlist ✓
- [x] Contexts : `AuthContext.tsx` · `OfflineContext.tsx` · `PaletteContext.tsx` (Phase 3) ✓
- [x] Providers : `ReactQueryProvider.tsx` ✓

> **Non porté (audit Phase 1)** : `AlertContext.tsx` → remplacé par `sonner` · `useLoans.ts` → doublon de `queries.ts` supprimé

---

## Phase 3.6 — Environnement local (cohabitation v1/v2) ✅

> `pwa-client` (port 3000) et `pwa-client-v2` (port 3001) tournent simultanément
> avec le même backend Laravel sur le port 8000.

### Décision de port
- [x] **Port 3001** retenu pour `pwa-client-v2` — `package.json` : `"dev": "next dev --port 3001"` ✓

### Docker
- [x] Service `frontend-v2` ajouté dans `../docker-compose.yml` — port `3001:3001`, volume `./pwa-client-v2:/app` ✓

### Laravel Sanctum
- [x] `laravel-api/.env` déjà correct — `SANCTUM_STATEFUL_DOMAINS` et `CORS_ALLOWED_ORIGINS` incluaient déjà `localhost:3001` ✓
  ```
  FRONTEND_URL=http://localhost:3000
  SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000,localhost:3001
  CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001
  ```

### Variables d'environnement
- [x] `pwa-client-v2/.env.local` créé — `NEXT_PUBLIC_API_URL=http://localhost:8000` ✓

> **Note Phase 5** : pour les Server Components qui fetchent côté serveur (dans le conteneur Docker),
> ajouter `API_URL=http://backend:8000` (sans `NEXT_PUBLIC_`) pour les appels internes Docker.

---

## Phase 4 — Composants

> Construire les composants dans `pwa-client-v2/src/components/`.

### Navigation
- [x] **BottomNav** — 5 items, Scanner CTA flottant, active dot, safe-area (voir spec `rapport.md` §6.1) ✓
- [x] **Shell** — Layout wrapper mobile-first, sidebar desktop (w-64), padding safe-area ✓

### Cartes & Grilles
- [x] **VolumeCard** — Ratio 2:3, status dots (lu/prêté), progress bar, hover élévation (voir spec `rapport.md` §6.2) ✓
- [x] **SeriesCard** — Cover + titre + progress bar + "X/Y vol.", 2 colonnes mobile ✓
- [x] **BoxCard** — Variante pour les coffrets (icône distincte) ✓
- [x] **MangaGrid** — Wrapper grille responsive (2 col mobile → 4-5 desktop) ✓

### Formulaires & Inputs
- [x] **SearchBar** — Icône loupe intégrée, placeholder, clear button ✓
- [x] **LoanForm** — Bottom sheet : nom emprunteur (autocomplete), date, note, CTA ✓
- [x] **AuthForms** — Login · Register · ForgotPassword (style cohérent) ✓

### Feedback & États
- [x] **EmptyState** — Illustration + titre + CTA, déclinable par contexte (collection vide, wishlist vide…) ✓
- [x] **SkeletonCard** — Shimmer shimmer, même ratio que VolumeCard ✓
- [x] **StatusBadge** — Lu (vert) · Prêté (ambre) · Wishlist (violet) — 4 variantes ✓
- [x] **BottomSheet** — Sheet mobile swipe-to-dismiss, handle pill, overlay (voir spec `rapport.md` §6.4) ✓

### Palette
- [x] **PaletteSwitcher** — 4 swatches circulaires (Ember · Crimson · Indigo · Forest) avec ring actif, changement instantané, persistance auto ✓
- [x] **PaletteProvider** — Context React, lit `localStorage` au mount, applique `.palette-X` sur `<html>`, expose `usePalette()` hook ✓ *(Phase 3)*

### Dashboard
- [x] **StatCard** — Icône + chiffre hero + label, stagger animation, variante highlight (voir spec `rapport.md` §6.5) ✓

---

## Phase 5 — Pages

> Construire les pages dans `pwa-client-v2/src/app/`.
> Ordre recommandé : Layout shell → Auth → Dashboard → Collection hub → Sous-pages → Public

### Auth (hors layout protégé)
- [x] `/login` — Email + password, lien register + forgot ✓
- [x] `/register` — Name + email + password ✓
- [x] `/forgot-password` — Email input ✓
- [x] `/reset-password` — New password + confirm ✓

### App (layout protégé)
- [x] `layout.tsx` (protected) — Shell + BottomNav + AuthGuard + transitions de page ✓
- [x] `/dashboard` — Stats 2×2 · Derniers ajouts · Alerte prêts en retard ✓
- [ ] `/collection` — Hub avec sous-tabs : Bibliothèque · Prêts · Wishlist · Lu
- [ ] `/collection` → Bibliothèque — Grille séries + recherche/filtre
- [ ] `/series/[id]` — Détail série : liste des éditions + box-sets
- [ ] `/series/[id]/edition/[editionId]` — Grille volumes avec statuts + actions
- [ ] `/series/[id]/box-set/[boxSetId]` — Détail box-set
- [ ] `/series/[id]/box/[boxId]` — Détail boîte individuelle
- [ ] `/collection` → Prêts — Actifs/Historique, multi-retour
- [ ] `/collection` → Wishlist — Liste éditions/coffrets souhaités
- [ ] `/collection` → Lu — Progression par série, bulk toggle
- [ ] `/scan` — Vue caméra + panneau résumé + ajout batch
- [ ] `/search` — Recherche catalogue, résultats avec statut collection
- [ ] `/settings` — Username + visibilité profil + **PaletteSwitcher** (4 swatches : Ember · Crimson · Indigo · Forest)

### Profils publics (hors auth)
- [ ] `/user/[username]` — Profil public : stats bio
- [ ] `/user/[username]/collection` — Collection publique read-only

---

## Phase 6 — Tests & Polish

- [ ] Vérifier rendu sur mobile 360px (Samsung Galaxy S) — largeur minimale cible
- [ ] Vérifier rendu sur mobile 390px (iPhone 14)
- [ ] Vérifier rendu sur tablette 768px
- [ ] Vérifier rendu desktop 1280px+
- [ ] Vérifier le rendu sur fond sombre sur toutes les pages (pas de dark mode toggle — fond fixe)
- [ ] Vérifier tous les contrastes WCAG AA (ratio ≥ 4.5:1 texte, ≥ 3:1 UI)
- [ ] Tester les animations : pas de layout shift · `prefers-reduced-motion` respecté · **aucun stagger sur les grilles de volumes** (risque de lag sur collections de 50+ volumes)
- [ ] Profiler les performances sur mobile bas de gamme (CPU throttle ×4 dans DevTools) — valider que les pages collection/search restent fluides sans animation de masse
- [ ] Tester le mode PWA standalone (pas de barre browser, safe-areas iOS)
- [ ] Tester offline : pages cachées vs. pages nécessitant le réseau
- [ ] Tester le changement de **palette** en 1 clic : accent mis à jour immédiatement sur boutons, progress bars, dots de status, bottom nav — sans rechargement ni flash
- [ ] Review UX finale : parcours complet d'un collector (ajouter → lire → prêter → retourner)

---

## Référence rapide des specs

### Thème (hardcodé — Void)

| Propriété | Valeur |
|---|---|
| Fond | `#0a0a0b` — noir absolu |
| Radius | 4px |
| Police display | **Syne** |
| Police body | **Nunito Sans** |
| Ombres | Teintées par `--primary` (change avec la palette) |

### Palettes switchables (depuis les Settings)

| Palette | Accent | Hue OKLch | CSS class |
|---|---|---|---|
| **Ember** ⭐ défaut | Ambre chaud | 55° | `.palette-ember` |
| Crimson | Rouge sang | 18° | `.palette-crimson` |
| Indigo | Violet | 290° | `.palette-indigo` |
| Forest | Vert forêt | 155° | `.palette-forest` |

---

## Commandes utiles

```bash
# Lancer le QA pipeline
/qa

# Mettre à jour ce plan
/redesign-plan
```

---

*Ce fichier est la source de vérité du redesign. Mettre à jour avec `/redesign-plan` après chaque session de travail.*
