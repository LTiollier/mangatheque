# 📊 Rapport de Qualité de Code — `pwa-client`

> **Date de l'analyse :** 24 février 2026  
> **Périmètre :** Dossier `pwa-client/` — Application Next.js 16 / React 19 / TypeScript  
> **Analyste :** Revue statique complète de code  
> **Notation par section :** ✅ Bon · ⚠️ À améliorer · ❌ Problème critique

---

## Table des Matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture et Organisation](#2-architecture-et-organisation)
3. [TypeScript & Typage](#3-typescript--typage)
4. [Gestion de l'État et des Données](#4-gestion-de-létat-et-des-données)
5. [Sécurité](#5-sécurité)
6. [Performance](#6-performance)
7. [Patterns React](#7-patterns-react)
8. [CSS & Cohérence Visuelle](#8-css--cohérence-visuelle)
9. [Tests Playwright](#9-tests-playwright)
10. [Configuration & Outillage](#10-configuration--outillage)
11. [Accessibilité (a11y)](#11-accessibilité-a11y)
12. [Tableau de Bord des Priorités](#12-tableau-de-bord-des-priorités)
13. [Plan d'Action Recommandé](#13-plan-daction-recommandé)

---

## 1. Vue d'ensemble

### Points forts du projet ✅

- **Stack moderne** : Next.js 16, React 19, TypeScript strict, Tailwind CSS v4, shadcn/ui — stack de qualité.
- **PWA correctement configurée** : `@ducanh2912/next-pwa` avec stratégie `NetworkFirst` sur les appels API, manifest, `appleWebApp`, `themeColor`.
- **Design soigné** : Dark mode, glassmorphism, animations cohérentes, micro-interactions sur les éléments interactifs.
- **Gestion offline bien pensée** : `OfflineProvider`, toasts informatifs, désactivation des boutons d'écriture hors ligne.
- **AuthGuard** : Protection des routes claire et réutilisable avec gestion du `callbackUrl`.
- **AlertContext** : Pattern excellent pour les modales de confirmation asynchrones globales.
- **Validation des formulaires** : `react-hook-form` + `zod` sur les pages d'auth — bonne pratique.
- **Tests E2E** : 5 fichiers Playwright couvrant les flows principaux (login, register, logout, search, collection).

### Résumé des problèmes identifiés

| Sévérité | Nombre | Description courte |
|----------|--------|-------------------|
| 🔴 Critique | 4 | Sécurité, gestion d'erreur incomplète |
| 🟠 Important | 8 | Duplication de code, logique métier dans des pages |
| 🟡 Modéré | 10 | Cohérence stylistique, accessibilité, typage |
| 🟢 Mineur | 6 | Style, conventions, DX |

---

## 2. Architecture et Organisation

### 2.1. Structure des dossiers ⚠️

La structure globale est propre, mais deux anomalies existent :

#### ❌ Duplication `context/` vs `contexts/`

Il existe **deux dossiers distincts** pour les contextes React :
- `src/context/AuthContext.tsx` — dossier **singulier**
- `src/contexts/AlertContext.tsx` — dossier **pluriel**
- `src/contexts/OfflineContext.tsx` — dossier **pluriel**

```
src/
├── context/        ← AuthContext (singulier)
│   └── AuthContext.tsx
└── contexts/       ← AlertContext, OfflineContext (pluriel)
    ├── AlertContext.tsx
    └── OfflineContext.tsx
```

**Problème** : Incohérence structurelle. Un développeur cherchant les contextes doit regarder dans deux endroits différents.

**Recommandation** : Unifier dans `src/contexts/` (pluriel, aligné avec le dossier `hooks/` et `components/`). Déplacer `context/AuthContext.tsx` vers `contexts/AuthContext.tsx` et mettre à jour tous les imports.

---

#### ⚠️ Logique de groupement dans les pages (au lieu de hooks)

La logique `groupedBySeries`, `groupByEdition`, `filteredLoans` etc. est écrite directement dans les composants pages (`collection/page.tsx`, `loans/page.tsx`). Ces pages deviennent lourdes.

**Recommandation** : Extraire dans des **hooks personnalisés** dédiés :

```typescript
// src/hooks/useCollection.ts
export function useCollection() {
    const [mangas, setMangas] = useState<Manga[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => { /* fetch */ }, []);
    
    const groupedBySeries = useMemo(() => /* grouping logic */, [mangas]);
    
    return { mangas, isLoading, groupedBySeries };
}
```

---

#### ⚠️ `LoanCard` et `EmptyState` définis dans `loans/page.tsx`

Ces deux composants locaux (lignes 258–347 de `loans/page.tsx`) sont définis dans le fichier page. `EmptyState` notamment est un composant **réutilisable** qui devrait exister dans `src/components/ui/EmptyState.tsx`.

---

#### ⚠️ Interface `GroupedSeries` dupliquée

L'interface `GroupedSeries` est définie deux fois :
- Dans `src/components/collection/SeriesList.tsx` (lignes 9–12)
- Dans `src/app/(protected)/collection/page.tsx` (lignes 11–14)

**Recommandation** : La déplacer dans `src/types/manga.ts` et l'exporter depuis là.

---

### 2.2. Données en dur (valeurs magiques) ⚠️

Les URL API sont construites directement dans les pages sans centralisation :

```typescript
// Dans scan/page.tsx
await api.get(`/mangas/search?query=${encodeURIComponent(barcode)}`);
await api.post("/mangas/scan-bulk", { isbns: isbnsToSubmit });

// Dans search/page.tsx  
await api.get(`/mangas/search?query=${encodeURIComponent(query)}`);
await api.post("/mangas", { api_id: manga.api_id });
```

**Recommandation** : Créer un fichier `src/lib/api-endpoints.ts` ou un service dédié `src/services/manga.service.ts` :

```typescript
// src/services/manga.service.ts
import api from '@/lib/api';
import { MangaSearchResult } from '@/types/manga';

export const mangaService = {
    search: (query: string) => api.get(`/mangas/search?query=${encodeURIComponent(query)}`),
    addToCollection: (apiId: string) => api.post('/mangas', { api_id: apiId }),
    scanBulk: (isbns: string[]) => api.post('/mangas/scan-bulk', { isbns }),
    getCollection: () => api.get('/mangas'),
};
```

---

## 3. TypeScript & Typage

### 3.1. Types imprécis / `unknown` non exploités ⚠️

Dans plusieurs pages, les erreurs sont capturées avec `catch (err: unknown)` mais le typage est traité de façon inconsistante :

```typescript
// search/page.tsx – ligne 29 : utilise instanceof Error
const errorMessage = err instanceof Error ? err.message : "...";

// loans/page.tsx – ligne 43 : console.error simple
console.error(error);

// scan/page.tsx – ligne 101 : utilise instanceof AxiosError
const errorMessage = error instanceof AxiosError ? error.response?.data?.message : "...";
```

**Recommandation** : Créer un utilitaire centralisé :

```typescript
// src/lib/error.ts
import axios from 'axios';

export function getApiErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.message ?? fallback;
    }
    if (error instanceof Error) return error.message;
    return fallback;
}
```

---

### 3.2. Type `any` implicite sur les réponses API ⚠️

Les réponses API sont typées de façon générique :

```typescript
// collection/page.tsx
const response = await api.get('/mangas');
setMangas(response.data.data); // type: any
```

**Recommandation** : Typer les réponses axios explicitement :

```typescript
const response = await api.get<{ data: Manga[] }>('/mangas');
setMangas(response.data.data);
```

---

### 3.3. Propriété `is_public` optionnelle source de bugs potentiels ⚠️

```typescript
// types/auth.ts
export interface User {
    is_public?: boolean; // optionnel
}

// settings/page.tsx
const [isPublic, setIsPublic] = useState(user?.is_public || false);
```

`user?.is_public || false` est sûr, mais si `is_public` est `false`, `user?.is_public || false` retourne `false` — comportement correct ici. Cependant la chaîne optionnelle complique la lecture. Si `is_public` est systématiquement présent dans l'API, il devrait être non-optionnel.

---

### 3.4. Type de retour manquant sur les fonctions async ✅

Globalement bien géré — les fonctions `onSubmit`, `handleReturn` etc. ont leurs types inférés correctement depuis les signatures `React.FormEvent`.

---

## 4. Gestion de l'État et des Données

### 4.1. ✅ Absence de cache client React Query (CORRIGÉ)

Le dashboard et la collection page font **tous les deux** un appel à `/mangas` indépendamment, sans partager les données. Si l'utilisateur navigue entre les deux, deux appels réseau sont émis. Il n'y a **aucun cache client-side**.

```typescript
// dashboard/page.tsx – ligne 20
const response = await api.get('/mangas');

// collection/page.tsx – ligne 24 (même appel !)
const response = await api.get('/mangas');
```

**Recommandation forte** : Adopter **TanStack Query (React Query)** pour la gestion du cache et des états de chargement :

```typescript
// Remplacement immédiat possible sans refactoring lourd
import { useQuery } from '@tanstack/react-query';

function useMangas() {
    return useQuery({
        queryKey: ['mangas'],
        queryFn: () => api.get<{ data: Manga[] }>('/mangas').then(r => r.data.data),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
```

---

### 4.2. ✅ Gestion du token dans `localStorage` (CORRIGÉ - Cookies httpOnly)

```typescript
// lib/api.ts – lignes 15–19
const token = localStorage.getItem('auth_token');
if (token) {
    config.headers.Authorization = `Bearer ${token}`;
}

// AuthContext.tsx – ligne 15
const storedUser = localStorage.getItem('auth_user');
```

Le token JWT et les données utilisateur sont stockés en **`localStorage`**, accessible par n'importe quel JavaScript de la page. En cas d'attaque XSS, le token est immédiatement compromis.

**Recommandation** : Passer aux **cookies `httpOnly`** gérés côté serveur. Laravel Sanctum supporte nativement les cookies SPA. Alternativement, utiliser `sessionStorage` (légèrement mieux) ou implémenter un `BFF (Backend For Frontend)` pattern.

---

### 4.3. ✅ `fetchLoans` et warnings ESLint (CORRIGÉ - React Query)

```typescript
// loans/page.tsx – ligne 36
const fetchLoans = async () => { ... };

useEffect(() => {
    fetchLoans(); // fetchLoans change à chaque render
}, []);  // ← pas de fetchLoans dans le tableau de dépendances
```

**Recommandation** : Envelopper `fetchLoans` dans `useCallback` :

```typescript
const fetchLoans = useCallback(async () => {
    // ...
}, []);

useEffect(() => {
    fetchLoans();
}, [fetchLoans]);
```

---

### 4.4. ✅ Authentification — Suppression des `setTimeout` (CORRIGÉ)

```typescript
// AuthContext.tsx – ligne 18
setTimeout(() => {
    if (storedUser && storedToken) { ... }
    setIsLoading(false);
}, 0);
```

```typescript
// AuthGuard.tsx – ligne 43
setTimeout(() => {
    setIsAuthorized(true);
}, 0);
```

Ces `setTimeout(fn, 0)` sont des **hack anti-race-condition**. Ils fonctionnent mais sont fragiles et difficiles à tester.

**Recommandation** : Utiliser `useHasHydrated` (déjà présent dans `src/hooks/useHasHydrated.ts` !) pour détecter l'hydratation SSR, puis supprimer les `setTimeout` :

```typescript
// AuthContext.tsx
const hasHydrated = useHasHydrated();

useEffect(() => {
    if (!hasHydrated) return;
    const storedUser = localStorage.getItem('auth_user');
    // ...
    setIsLoading(false);
}, [hasHydrated]);
```

---

### 4.5. ✅ Duplication de logique dans `WishlistPage` (CORRIGÉ)

La `WishlistPage` duplique visuellement le composant `MangaCard` (affichage de la couverture, du titre, des auteurs) sans réutiliser `<MangaCard>` :

```tsx
// wishlist/page.tsx lignes 74-119 — clone de MangaCard sans la réutiliser
<Card key={manga.id} className="overflow-hidden flex flex-col...">
    <div className="relative aspect-[2/3]...">
        {manga.cover_url ? <Image ... /> : <div>Pas de couverture</div>}
    </div>
    ...
</Card>
```

**Recommandation** : Soit étendre `MangaCard` avec une prop `onRemove`, soit créer un `WishlistCard` qui wrapp `MangaCard`.

---

### 4.6. ✅ Requêtes parallèles non-transactionnelles dans `LoanDialog` (CORRIGÉ)

```typescript
// loan-dialog.tsx – ligne 40
await Promise.all(mangas.map(manga =>
    api.post("/loans", { volume_id: manga.id, ... })
));
```

Si 3 mangas sont prêtés et que la 3ème requête échoue, les 2 premières sont déjà enregistrées. **Pas de rollback possible côté front**.

**Recommandation** : Soit créer un endpoint `/loans/bulk` côté API pour atomicité, soit afficher une erreur partielle claire expliquant quels prêts ont réussi/échoué.

---

## 5. Sécurité

### 5.1. ✅ Ressource externe dans le CSS (CORRIGÉ)

```tsx
// page.tsx – ligne 19
<div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]...">

// login/page.tsx – ligne 81
<div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]...">
```

Le chargement de ressources depuis un **domaine externe** `transparenttextures.com` crée plusieurs problèmes :
1. **Performance** : Dépendance réseau au rendu.
2. **Sécurité** : Si le domaine est compromis, du contenu malveillant peut être injecté.
3. **Vie privée** : Le serveur externe connaît l'IP de chaque visiteur.
4. **PWA** : Ces ressources ne sont pas dans le cache du service worker.

**Recommandation** : Télécharger les images et les placer dans `/public/patterns/` :

```bash
curl -o public/patterns/carbon-fibre.png https://www.transparenttextures.com/patterns/carbon-fibre.png
curl -o public/patterns/cubes.png https://www.transparenttextures.com/patterns/cubes.png
```

---

### 5.2. ✅ Token sécurisé via cookies httpOnly (CORRIGÉ)

### 5.3. ✅ Validation des données API côté client (CORRIGÉ - Zod ACL)

Les données de l'API sont utilisées directement sans validation :

```typescript
setMangas(response.data.data); // pas de validation de schema
```

**Recommandation** : Valider les réponses avec `zod` pour détecter les incohérences de types API précocement :

```typescript
const MangaSchema = z.object({ id: z.number(), title: z.string(), ... });
const MangaArraySchema = z.array(MangaSchema);

const parsed = MangaArraySchema.safeParse(response.data.data);
if (!parsed.success) console.error('API response schema mismatch', parsed.error);
else setMangas(parsed.data);
```

---

### 5.4. ✅ Réinitialisation de mot de passe fonctionnelle (CORRIGÉ)

```tsx
// login/page.tsx – ligne 145
<button type="button" className="text-xs text-blue-400 ...">
    Oublié ?
</button>
```

Ce bouton n'a aucun `onClick` handler. Si la feature n'est pas encore implémentée, il devrait être retiré ou clairement marqué `disabled`.

---

## 6. Performance

### 6.1. ✅ Images non optimisées (`unoptimized` systématique) (CORRIGÉ)

```tsx
// SeriesList.tsx, VolumeGrid.tsx, MangaCard.tsx ...
<Image src={...} alt={...} fill className="object-cover" unoptimized />
```

Le prop `unoptimized` désactive l'optimisation Next.js Image (WebP, lazy loading, responsive). Utilisé pour éviter la restriction de domaines, mais c'est au prix de la performance.

**Recommandation** : Configurer les domaines autorisés dans `next.config.ts` :

```typescript
const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'books.google.com' },
            { protocol: 'https', hostname: 'covers.openlibrary.org' },
            // Ajouter les domaines réels des couvertures
        ],
    },
};
```

---

### 6.2. ⚠️ PWA — Cache API incomplet

```typescript
// next.config.ts – ligne 12
urlPattern: /^https:\/\/.*\/api\/.*$/,
```

Le pattern ne matche que les URL `https://`. En développement local (`http://`), le cache ne s'applique jamais. De plus, `disable: process.env.NODE_ENV === "development"` désactive aussi le SW en dev, ce qui rend les tests offline difficiles.

**Recommandation** : Ajouter un environnement de test PWA dédié, et documenter dans le README comment tester le mode offline.

---

### 6.3. ✅ `useMemo` absent sur les calculs coûteux (CORRIGÉ)

Le calcul `filteredMangas` et `groupedBySeries` dans `collection/page.tsx` s'exécute à **chaque render** :

```typescript
// collection/page.tsx – lignes 36-61
const filteredMangas = mangas.filter(...);  // recalculé à chaque render
const groupedBySeries = filteredMangas.reduce(...); // idem
const seriesList = Object.values(groupedBySeries);  // idem
```

**Recommandation** :

```typescript
const filteredMangas = useMemo(() =>
    mangas.filter(manga => 
        manga.title.toLowerCase().includes(searchQuery.toLowerCase()) || ...
    ),
    [mangas, searchQuery]
);

const seriesList = useMemo(() => {
    const grouped = filteredMangas.reduce(...);
    return Object.values(grouped);
}, [filteredMangas]);
```

---

### 6.4. ✅ Animation CSS (`style jsx global`) — Alternative Tailwind disponible (CORRIGÉ)

```tsx
// page.tsx – lignes 102-108
<style jsx global>{`
    @keyframes shimmer { ... }
`}</style>

// barcode-scanner.tsx – lignes 139-145
<style jsx global>{`
    @keyframes scan { ... }
`}</style>
```

L'utilisation de `style jsx global` dans des composants clients injecte du CSS dynamique à chaque mount. C'est un anti-pattern Next.js.

**Recommandation** : Déplacer les keyframes dans `globals.css` ou utiliser `tw-animate-css` (déjà installé) :

```css
/* globals.css */
@keyframes shimmer {
    100% { transform: translateX(100%); }
}
@keyframes scan {
    0%, 100% { top: 0%; }
    50% { top: 100%; }
}
```

---

## 7. Patterns React

### 7.1. ✅ `useCallback` bien utilisé dans `AuthContext`

Les fonctions `login`, `logout`, `updateUser` sont mémorisées avec `useCallback` — évite les re-renders inutiles des composants consommateurs.

### 7.2. ✅ `useHasHydrated` — Excellent pattern SSR

L'utilisation de `useSyncExternalStore` pour détecter l'hydratation est la **meilleure pratique recommandée** par l'équipe React. Bien que peu utilisé actuellement (voir §4.4).

### 7.3. ✅ Re-fetch après mutation — Pattern non optimisé (CORRIGÉ)

```typescript
// loans/page.tsx
const handleReturn = async (volumeId: number) => {
    await api.post("/loans/return", { volume_id: volumeId });
    fetchLoans(); // re-fetche TOUT au lieu de mettre à jour l'état local
};
```

**Recommandation** : Mettre à jour l'état local optimistement pour éviter un aller-retour réseau :

```typescript
const handleReturn = async (volumeId: number) => {
    // Mise à jour optimiste
    setLoans(prev => prev.map(loan =>
        loan.volume_id === volumeId
            ? { ...loan, is_returned: true, returned_at: new Date().toISOString() }
            : loan
    ));
    try {
        await api.post("/loans/return", { volume_id: volumeId });
    } catch {
        fetchLoans(); // Rollback si erreur
    }
};
```

### 7.4. ✅ `BarcodeScanner` — `onScan` dans les dépendances du `useEffect` (CORRIGÉ)

```typescript
// barcode-scanner.tsx – ligne 97
}, [onScan]);    // onScan est une dépendance du useEffect qui initialise la caméra
```

Si `onScan` change (ex: la page parent re-render), le scanner se ré-initialise (stop + re-start caméra). Dans `scan/page.tsx`, `handleScan` est bien wrappé dans `useCallback(async () => {...}, [])` ce qui est correct. Mais c'est fragile — une dépendance oubliée sur `useCallback` recréerait la fonction et redémarrerait le scanner.

**Recommandation** : Utiliser un `ref` pour `onScan` dans le scanner afin d'éviter les restarts :

```typescript
const onScanRef = useRef(onScan);
useEffect(() => { onScanRef.current = onScan; }, [onScan]);

// Dans le callback du scanner :
onScanRef.current(decodedText);
```

---

### 7.5. ⚠️ `useOnlineStatus` hook redondant

```
src/hooks/useOnlineStatus.ts  ← hook standalone
src/contexts/OfflineContext.tsx  ← contexte qui réimplémente la même logique
```

`useOnlineStatus` est un hook qui gère les events `online`/`offline` sur `window`. `OfflineContext` réimplémente **exactement la même logique** (avec en plus les toasts). Le hook standalone ne semble **pas être utilisé** dans le codebase.

**Recommandation** : Soit supprimer `useOnlineStatus.ts` (redondant), soit le faire utiliser par `OfflineProvider` (composition) :

```typescript
// OfflineContext.tsx — composition du hook
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineProvider({ children }) {
    const isOnline = useOnlineStatus();
    const isOffline = !isOnline;
    // Gérer les toasts avec useEffect sur isOffline
    ...
}
```

---

## 8. CSS & Cohérence Visuelle

### 8.1. ⚠️ Incohérence stylistique entre les pages

Deux styles coexistent dans l'application :

**Style A — Thème système shadcn** (variables CSS) :
```tsx
// search/page.tsx, wishlist/page.tsx, settings/page.tsx
className="bg-card text-muted-foreground border-border"
```

**Style B — Couleurs Tailwind hardcodées** (slate-950, purple-500 etc.) :
```tsx
// collection/page.tsx, loans/page.tsx, scan/page.tsx
className="bg-slate-900 border-slate-800 text-purple-400"
```

Cette incohérence suggère une migration progressive vers le système de design shadcn qui n'est pas terminée. La page `settings` mélange les deux (`dark:bg-blue-900/20` côté shadcn vs `.bg-blue-50/50` hardcodé).

**Recommandation** : Choisir **un seul système** et l'appliquer uniformément. Si le dark mode est exclusif (`.dark` sur `<html>`), le thème shadcn devrait être paramétré uniquement pour le dark. Supprimer les `bg-card` etc. dans les pages déjà en dark mode explicite.

---

### 8.2. ⚠️ Classe CSS custom `custom-scrollbar` non définie

```tsx
// scan/page.tsx – ligne 173
<div className="overflow-y-auto max-h-[350px] space-y-2 pr-2 custom-scrollbar flex-1">
```

La classe `custom-scrollbar` est utilisée mais **n'est définie nulle part** dans `globals.css` ou dans les config Tailwind. Le scrollbar s'affichera avec le style par défaut du navigateur.

**Recommandation** : Soit définir la classe dans `globals.css`, soit la supprimer :

```css
/* globals.css */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: oklch(0.145 0 0); }
.custom-scrollbar::-webkit-scrollbar-thumb { background: oklch(0.3 0 0); border-radius: 3px; }
```

---

### 8.3. ⚠️ Shell importé dans `loans/page.tsx` alors qu'il est déjà dans le layout

```tsx
// loans/page.tsx – ligne 4
import { Shell } from "@/components/layout/Shell";

// ...ligne 115
return (
    <Shell>  {/* Shell wrappé manuellement */}
        <div className="space-y-8 ...">
```

Or, le layout `(protected)/layout.tsx` enveloppe **déjà** le Shell autour de tous les enfants :

```tsx
// (protected)/layout.tsx
return (
    <AuthGuard requireAuth={true}>
        <Shell>{children}</Shell>  {/* Shell déjà là */}
    </AuthGuard>
);
```

Résultat : la `LoansPage` est **wrappée dans deux Shell imbriqués**, ce qui crée un double fond avec deux sidebars potentiellement imbriquées.

**Recommandation** : Supprimer l'import et l'utilisation de `<Shell>` dans `loans/page.tsx`.

---

## 9. Tests Playwright

### 9.1. ✅ Couverture des flows principaux

5 specs couvrent : login, register, logout, search, collection navigation. C'est une bonne base.

### 9.2. ❌ Tests collection incomplets / basés sur des sélecteurs fragiles

```typescript
// collection.spec.ts – ligne 65
await expect(page.locator('text=Naruto')).toBeVisible();
await expect(page.locator('text=1 Tome')).toBeVisible();

// ligne 75
await expect(page.locator('text=1 tomes possédés')).toBeVisible();  // pluriel incohérent
```

- `text=1 Tome` mais le composant affiche `1 Tome` (majuscule). La vérification textuelle est fragile aux refactoring UI.
- `text=1 tomes possédés` — "1 tomes" est grammaticalement incorrect, et sur la page `EditionList.tsx`, la phrase est `tomes possédés`. Si l'UI corrige cette faute, le test échoue.

**Recommandation** : Utiliser des `data-testid` pour les assertions UI critiques :

```tsx
// EditionList.tsx
<span data-testid="edition-possessed-count">{possessedCount} tomes possédés</span>
```

```typescript
// collection.spec.ts
await expect(page.locator('[data-testid="edition-possessed-count"]')).toContainText('1');
```

---

### 9.3. ⚠️ Pages critiques sans tests E2E

Les pages suivantes **n'ont pas de test Playwright** :
- `loans/page.tsx` — workflow prêt/retour (complexe, à fort risque de régression)
- `scan/page.tsx` — scan de code-barres (nécessite mocking caméra)
- `settings/page.tsx` — profil public/privé
- `wishlist/page.tsx` — ajout/suppression
- Pages publiques `user/[username]/collection/*`

**Recommandation** : Prioriser les tests des workflows `loans` (retour, multi-sélection) et `settings`.

---

### 9.4. ⚠️ Tests E2E mobiles commentés dans `playwright.config.ts`

```typescript
// playwright.config.ts – lignes 52-60
// {
//   name: 'Mobile Chrome',
//   use: { ...devices['Pixel 5'] },
// },
// {
//   name: 'Mobile Safari',
//   use: { ...devices['iPhone 12'] },
// },
```

L'application est une **PWA mobile-first** mais les tests mobiles sont désactivés.

**Recommandation** : Activer au moins `Mobile Chrome` dans la CI pour valider le responsive.

---

## 10. Configuration & Outillage

### 10.1. ⚠️ `react-hook-form` et `zod` installés mais peu utilisés

```json
"@hookform/resolvers": "^5.2.2",
"react-hook-form": "^7.71.2",
"zod": "^4.3.6",
```

Ces packages sont utilisés **uniquement** dans les pages `login` et `register`. Les formulaires des pages `settings`, `loan-dialog` et `barcode-scanner` utilisent du state React natif sans validation typée.

**Recommandation** : Étendre `zod` pour valider :
- Le formulaire settings (validation du `username` : format, longueur)
- Le formulaire de prêt dans `LoanDialog` (nom emprunteur, longueur des notes)

---

### 10.2. ⚠️ `radix-ui` et `shadcn` listés séparément — confusion des dépendances

```json
"radix-ui": "^1.4.3",  // dans dependencies (runtime)
"shadcn": "^3.8.5",    // dans devDependencies (tooling CLI)
```

`shadcn` est la CLI de génération, pas une dépendance runtime. `radix-ui` est un méta-package qui inclut des primitives. Les composants shadcn générés dans `src/components/ui/` dépendent de packages `@radix-ui/*` individuels (ex: `@radix-ui/react-dialog`). Vérifier que les bonnes dépendances sont bien dans `package.json`.

---

### 10.3. ⚠️ Variables d'environnement non documentées

Le fichier `.env.local` contient une seule variable (`NEXT_PUBLIC_API_URL`). Il n'y a pas de fichier `.env.example` ou de documentation des variables nécessaires.

**Recommandation** : Créer `.env.example` :

```bash
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Playwright E2E Tests
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

---

### 10.4. ✅ ESLint bien configuré

La config ESLint utilise `eslint-config-next/core-web-vitals` et `eslint-config-next/typescript` — c'est la configuration recommandée pour Next.js avec TypeScript.

---

### 10.5. ⚠️ Absence de script de type-check dans `package.json`

```json
"scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "eslint",
    "lint:fix": "eslint --fix",
    "test:e2e": "playwright test"
}
```

Aucun script `typecheck`. La CI ne vérifie pas les erreurs TypeScript séparément du build.

**Recommandation** :

```json
"scripts": {
    "typecheck": "tsc --noEmit",
    "ci": "npm run typecheck && npm run lint && npm run test:e2e"
}
```

---

## 11. Accessibilité (a11y)

### 11.1. ⚠️ Éléments interactifs sans labels accessibles

```tsx
// VolumeGrid.tsx – ligne 83
<div
    className="absolute bottom-2 left-2 ... cursor-pointer ..."
    onClick={(e) => { e.stopPropagation(); onLoanClick?.(vol); }}
>
    <ArrowLeftRight className="h-4 w-4" />
</div>
```

Un `<div>` avec `onClick` n'est pas accessible au clavier et n'a pas de label ARIA. Les lecteurs d'écran ne peuvent pas l'identifier.

**Recommandation** : Remplacer par un `<button>` avec `aria-label` :

```tsx
<button
    type="button"
    aria-label={`Prêter le tome ${vol.number}`}
    className="absolute bottom-2 left-2 ..."
    onClick={(e) => { e.stopPropagation(); onLoanClick?.(vol); }}
>
    <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
</button>
```

---

### 11.2. ⚠️ Images `aria-hidden` manquant sur les icônes décoratives

Les icônes Lucide sont utilisées partout sans `aria-hidden="true"` quand elles sont purement décoratives, ce qui ajoute du bruit pour les lecteurs d'écran.

**Recommandation** : Systématiser `aria-hidden="true"` sur les icônes décoratives.

---

### 11.3. ⚠️ `<h1>` utilisé dans `Shell.tsx`

```tsx
// Shell.tsx – ligne 67
<h1 className="text-xl font-black tracking-tight uppercase">Mangathèque</h1>
```

Le logo dans la sidebar est un `<h1>`. Les pages protégées ont aussi leur propre `<h1>` (ex: "Ma Collection", "Mes Prêts", etc.). **Deux `<h1>` par page** — violation des bonnes pratiques HTML (une seule balise `<h1>` par page).

**Recommandation** : Remplacer le `<h1>` dans Shell par un `<span>` ou `<p>` stylé en gras.

---

## 12. Tableau de Bord des Priorités

| Priorité | Fichier(s) | Problème | Impact |
|----------|-----------|---------|--------|
| 🔴 P0 | `lib/api.ts`, `context/AuthContext.tsx` | Token JWT dans localStorage | Sécurité (XSS) |
| 🔴 P0 | `loans/page.tsx` | Double `<Shell>` imbriqué | Bug UI |
| 🔴 P0 | `page.tsx`, `login/page.tsx` | Ressources CSS externes | Sécurité + Performance |
| 🔴 P0 | `hooks/useOnlineStatus.ts` | Logique online dupliquée | Confusion, bug potentiel |
| 🟠 P1 | Toutes les pages | Absence de cache (double fetch) | Performance |
| 🟠 P1 | `collection/page.tsx`, `loans/page.tsx` | `useMemo` manquant | Performance |
| 🟠 P1 | `loans/page.tsx` | `fetchLoans` sans `useCallback` | Warning ESLint, potentiel bug |
| 🟠 P1 | `context/` vs `contexts/` | Dossiers dupliqués | Architecture |
| 🟠 P1 | `wishlist/page.tsx` | Duplication de `MangaCard` | Maintenabilité |
| 🟠 P1 | `scan/page.tsx` | `custom-scrollbar` non défini | Bug visuel |
| 🟡 P2 | Toutes les pages | Incohérence stylistique slate vs shadcn | Maintenabilité |
| 🟡 P2 | `VolumeGrid.tsx` | `div` clickable non accessible | Accessibilité |
| 🟡 P2 | `Shell.tsx` | Double `<h1>` | SEO, accessibilité |
| 🟡 P2 | `barcode-scanner.tsx`| `style jsx global` dans composant | Performance |
| 🟡 P2 | Tests Playwright | Sélecteurs textuels fragiles | Fiabilité des tests |
| 🟡 P2 | Tests Playwright | Tests mobiles désactivés | Couverture |
| 🟢 P3 | `package.json` | Pas de script `typecheck` | DX/CI |
| 🟢 P3 | Pas de `.env.example` | Variables non documentées | Onboarding |
| 🟢 P3 | `loan-dialog.tsx` | Import `axios` direct inutile | Cohérence |
| 🟢 P3 | Types | `GroupedSeries` dupliqué | DRY |

---

## 13. Plan d'Action Recommandé

### Sprint 1 — Corrections critiques (P0) ⏱️ ~2-3h

1. **Supprimer l'import `<Shell>` dans `loans/page.tsx`** (1 ligne à retirer)
2. **Télécharger les patterns CSS en local** dans `/public/patterns/`
3. **Unifier les dossiers `context/` → `contexts/`** et mettre à jour les imports
4. **Supprimer `useOnlineStatus.ts`** ou le faire consommer par `OfflineContext`
5. **Définir `.custom-scrollbar`** dans `globals.css`

### Sprint 2 — Améliorations importantes (P1) ⏱️ ~1 jour

1. **Installer TanStack Query** et refactorer les hooks de fetch des pages `collection`, `dashboard`, `loans`, `wishlist`
2. **Wraper `fetchLoans` dans `useCallback`**
3. **Ajouter `useMemo`** sur les computations `filteredMangas`, `groupedBySeries`, `groupedLoans`
4. **Créer `src/services/manga.service.ts`** pour centraliser les appels API
5. **Refactorer `WishlistPage`** pour réutiliser `MangaCard`

### Sprint 3 — Qualité et tests (P2) ⏱️ ~1 jour

1. **Activer les tests mobiles** dans `playwright.config.ts`
2. **Ajouter `data-testid`** sur les éléments critiques et mettre à jour les tests
3. **Écrire les tests E2E manquants** : `loans.spec.ts`, `settings.spec.ts`, `wishlist.spec.ts`
4. **Corriger les `<h1>` multiples** dans Shell
5. **Remplacer les `div` clickables par des `button`** dans VolumeGrid

### Sprint 4 — DX et polish (P3) ⏱️ ~2-3h

1. **Ajouter `"typecheck": "tsc --noEmit"`** dans `package.json`
2. **Créer `.env.example`**
3. **Déplacer `GroupedSeries`** dans `src/types/manga.ts`
4. **Migrer `style jsx global`** vers `globals.css`
5. **Supprimer l'import `axios` direct** dans `loan-dialog.tsx` (déjà importé via `api`)

---

## Synthèse des Métriques

| Métrique | Score | Note |
|----------|-------|------|
| **Architecture** | 6/10 | Dossiers dupliqués, logique dans les pages, bonne séparation globale |
| **TypeScript** | 7/10 | Typage correct mais réponses API non typées |
| **Performance** | 5/10 | Absence de cache, recalculs inutiles, images non optimisées |
| **Sécurité** | 4/10 | Token localStorage, ressources externes en CSS |
| **Tests** | 6/10 | Bonne base Playwright, mais couverture incomplète et sélecteurs fragiles |
| **Accessibilité** | 4/10 | Éléments cliquables non accessibles, `<h1>` multiple |
| **Cohérence code** | 5/10 | Duplication wishlist/manga-card, styles mixtes |
| **DX / Config** | 7/10 | ESLint bien configuré, PWA fonctionnelle |
| **Score global** | **5.5/10** | Base solide, améliorations importantes à apporter |

---

> **Note finale** : Le projet présente une **base de code saine** avec de bonnes intuitions architecturales (AuthGuard, AlertContext, PWA). Les problèmes identifiés sont principalement liés à la croissance rapide du projet (duplication de code, incohérences de style introduites lors d'ajouts successifs). Un sprint de refactoring ciblé permettrait d'atteindre un score de 7.5-8/10.
