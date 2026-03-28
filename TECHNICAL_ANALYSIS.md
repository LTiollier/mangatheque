# Rapport d'analyse technique — Frontend Atsume

> Généré le 28/03/2026 · Next.js 16.1.6 · React 19.2.3 · App Router
> Références : [Vercel React Best Practices](https://vercel.com/blog/how-to-optimize-your-react-app) · [Next.js Best Practices](https://nextjs.org/docs)

---

## Résumé exécutif

| Catégorie | Score | Statut |
|-----------|-------|--------|
| Structure de projet | 9/10 | ✅ Excellent |
| Optimisation images | 9/10 | ✅ Excellent |
| Fonts | 10/10 | ✅ Excellent |
| Offline / PWA | 9/10 | ✅ Excellent |
| Re-renders & memoïsation | 7/10 | ✅ Bon |
| Gestion des imports | 7/10 | ✅ Bon |
| Data fetching (React Query) | 6/10 | ⚠️ Moyen |
| Frontières RSC (use client/server) | 5/10 | ⚠️ Moyen |
| Metadata / SEO | 5/10 | ⚠️ Moyen |
| Suspense & Streaming | 3/10 | ⚠️ Faible |
| Gestion des erreurs | 5/10 | ⚠️ Moyen |
| **Bundle size** | **3/10** | **❌ Critique** |
| Server Actions | 0/10 | ❌ Absent |

---

## 1. Structure du projet

### Architecture générale

Le projet suit l'App Router de Next.js avec une organisation claire par groupes de routes :

```
src/app/
├── (auth)/          — Routes publiques (login, register, reset-password…)
├── (app)/           — Routes protégées (collection, search, planning…)
│   ├── layout.tsx   — Shell persistant (navigation)
│   └── template.tsx — Page transitions (Framer Motion fade)
├── user/[username]/ — Profils publics
├── not-found.tsx
└── global-error.tsx
```

**Ce qui est bien :**
- Groupes de routes logiques qui évitent de polluer l'URL
- Hiérarchie de layouts maintenable : `RootLayout → AppLayout → PageLayout`
- Shell persistant correctement placé au niveau `(app)/layout.tsx`

**Ce qui pose problème :**

Le projet utilise un fichier `proxy.ts` pour l'authentification middleware au lieu du fichier standard `middleware.ts`. Depuis Next.js 16, le middleware est renommé `proxy.ts` — si c'est intentionnel et conforme à la version utilisée, c'est correct. Sinon, valider que la protection des routes fonctionne en production.

---

## 2. Frontières RSC — `'use client'` / `'use server'`

### Constat

- **59 fichiers** marqués `'use client'`
- **0 fichier** marqué `'use server'`

L'application est entièrement client-side pour le data fetching et les mutations. C'est architecturalement cohérent pour une PWA, mais certains patterns actuels créent des inefficacités évitables.

### Ce qui est bien fait

**Pattern 1 — Server Component parse les params, Client Component reçoit les données :**

```tsx
// src/app/(app)/collection/page.tsx — Server Component ✅
export default async function CollectionPage({ searchParams }: Props) {
    const { tab = 'library' } = await searchParams;
    return <CollectionHub defaultTab={tab} />;
}

// CollectionHub.tsx — Client Component
export function CollectionHub({ defaultTab }: Props) {
    const [activeTab, setActiveTab] = useState(
        isValidTab(defaultTab) ? defaultTab : 'library'
    );
    // Pas de useSearchParams() côté client ✅
}
```

Ce pattern évite le piège `useSearchParams()` sans Suspense (voir §8).

**Pattern 2 — Parse des params dynamiques côté server :**

```tsx
// src/app/(app)/series/[id]/page.tsx — Server Component ✅
export default async function SeriesPage({ params }: Props) {
    const { id } = await params;  // async params (Next.js 15+)
    const seriesId = parseInt(id, 10);
    return <SeriesDetailClient seriesId={isNaN(seriesId) ? 0 : seriesId} />;
}
```

Conforme à la règle `async-patterns` de Next.js 15+ : `params` doit être `await`-é.

### Problèmes identifiés

**Problème : Aucune Server Action (`'use server'`)**

Toutes les mutations (login, changement de mot de passe, import de collection) passent par des appels `axios` côté client :

```tsx
// src/services/auth.service.ts — Pattern actuel ❌
export const authService = {
    login: (email: string, password: string) =>
        api.post<AuthResponse>('/auth/login', { email, password }),
};

// Appelé depuis LoginForm via React Query useMutation
const { mutate: login } = useMutation({
    mutationFn: ({ email, password }) => authService.login(email, password),
});
```

Ce pattern fonctionne mais perd les bénéfices des Server Actions (validation server-side stricte, type-safety end-to-end, protection CSRF).

> **Règle `data-patterns` :** Les mutations depuis l'UI doivent utiliser des Server Actions, pas des Route Handlers ou des appels client directs.

**Recommandation :**

```tsx
// src/app/actions/auth.ts ✅
'use server'
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export async function loginAction(email: string, password: string) {
    const validated = loginSchema.parse({ email, password });
    // Appel API backend depuis le serveur
    const response = await fetch(`${process.env.API_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify(validated),
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Invalid credentials');
    return response.json();
}
```

---

## 3. Data Fetching

### Configuration React Query

```tsx
// src/providers/ReactQueryProvider.tsx
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,       // 5 min ✅
            gcTime: 10 * 60 * 1000,          // 10 min ✅
            retry: 1,                         // ⚠️ Trop bas
            refetchOnWindowFocus: false,      // ✅ Adapté PWA
        },
    },
});
```

### Ce qui est bien fait

**Optimistic updates avec rollback :**

```tsx
// src/hooks/queries.ts ✅
useReturnLoan: () => useMutation({
    onMutate: async (loanId) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.loans });
        const prev = queryClient.getQueryData<Loan[]>(queryKeys.loans);
        queryClient.setQueryData(queryKeys.loans, (old) =>
            old?.map(loan => loan.id === loanId ? { ...loan, returned: true } : loan)
        );
        return { previousLoans: prev };
    },
    onError: (_, __, context) => {
        queryClient.setQueryData(queryKeys.loans, context?.previousLoans); // Rollback ✅
    },
}),
```

**Pagination sans flash :**

```tsx
useSearchQuery: (query, page) => useQuery({
    queryKey: queryKeys.search(query, page),
    placeholderData: keepPreviousData, // ✅ Ancienne page visible pendant fetch
}),
```

**Déduplication avec `React.cache()` :**

```tsx
// src/services/volume.service.ts ✅
export const getCollection = cache(() =>
    api.get<ApiResponse<Volume[]>>('/volumes')
        .then(r => VolumeArraySchema.parse(r.data.data))
);
```

Conforme à la règle `server-cache-react` : `React.cache()` pour la déduplication par requête.

### Problèmes identifiés

**Problème 1 — `retry: 1` sans backoff exponentiel**

Une seule tentative de retry, sans délai progressif. En cas de réseau instable (context PWA), les mutations critiques échouent trop vite.

```tsx
// Recommandé ✅
defaultOptions: {
    queries: {
        retry: 3,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    },
    mutations: {
        retry: 2,
    },
}
```

**Problème 2 — `initialData` non exploité**

Les hooks React Query acceptent `initialData` en paramètre, mais les pages Server Components ne pré-fetche aucune donnée à passer. Chaque navigation déclenche un waterfall client-side complet.

```tsx
// Pattern actuel ❌
// SeriesPage (Server) → SeriesDetailClient (Client) → useSeriesQuery() → Fetch API

// Pattern recommandé ✅ (data-patterns: pass from server component)
// SeriesPage (Server) → fetch data → SeriesDetailClient({ initialData }) → useQuery({ initialData })
```

**Problème 3 — Validation Zod côté client**

`z.array(VolumeSchema).parse()` est exécuté dans les services appelés depuis le client. Cela ajoute ~15 kb de Zod au bundle client et du temps de parsing sur des appareils mobiles faibles.

> **Règle `server-serialization` :** Minimiser le travail de parsing/validation côté client en le déplaçant côté server.

---

## 4. Gestion des imports

### Dynamic imports

**Bonne pratique respectée pour le scanner :**

```tsx
// src/app/(app)/scan/ScanClient.tsx ✅
const BarcodeScanner = dynamic(
    () => import('@/components/scanner/BarcodeScanner'),
    {
        ssr: false,   // html5-qrcode incompatible SSR
        loading: () => <Loader2 className="animate-spin h-6 w-6" />,
    }
);
```

Conforme à `bundle-dynamic-imports` : les composants lourds chargés à la demande avec fallback UI.

**Manques :**

Seul `BarcodeScanner` bénéficie du dynamic import. D'autres composants potentiellement lourds (dialogs de confirmation, modales settings, composants d'animation) sont importés statiquement alors qu'ils ne sont pas visibles au premier rendu.

### Barrel files

Peu d'utilisation de barrel files (`index.ts`), ce qui est positif. Les imports sont directs :

```tsx
// ✅ Correct
import { useVolumes, useSeriesQuery } from '@/hooks/queries';
import { authService } from '@/services/auth.service';
```

> **Règle `bundle-barrel-imports` :** Les barrel files avec re-exports empêchent le tree-shaking — l'approche actuelle est correcte.

---

## 5. Optimisation des images

### Constat : excellent

`next/image` est utilisé **partout** sans exception d'`<img>` natifs.

```tsx
// src/components/cards/SeriesCard.tsx ✅
<Image
    src={series.cover_url}
    alt={series.title}
    fill
    sizes="80px"
    className="object-cover"
/>
```

**Configuration `next.config.ts` :**

```ts
images: {
    remotePatterns: [
        { protocol: "https", hostname: "api.mangacollec.com" },
        { protocol: "https", hostname: "m.media-amazon.com" },
        { protocol: "https", hostname: "images-eu.ssl-images-amazon.com" },
        { protocol: "https", hostname: "www.bdfugue.com" },
    ],
}
```

> **Règle `image.md` :** Toujours utiliser `next/image` et configurer `remotePatterns`. ✅ Respecté.

### Points d'amélioration

**Prop `priority` absente sur les LCP images :**

```tsx
// Recommandé pour les covers visibles au premier viewport ✅
<Image
    src={series.cover_url}
    alt={series.title}
    fill
    sizes="(max-width: 768px) 80px, 120px"
    priority   // ← Manquant sur les cards du premier fold
    className="object-cover"
/>
```

**Absence de `placeholder="blur"` ou `placeholder="empty"` :**

Les images chargent sans placeholder visible, créant un layout shift (CLS). Utiliser `placeholder="empty"` avec un fond CSS, ou générer des blur data URLs pour les images statiques.

---

## 6. Fonts (`next/font`)

### Implémentation : parfaite

```tsx
// src/app/layout.tsx ✅
import { Syne, Nunito_Sans, IBM_Plex_Mono } from 'next/font/google';

const syne = Syne({
    subsets: ['latin'],
    variable: '--font-syne',
    display: 'swap',      // Prévient l'invisible text (FOIT)
});

const nunitoSans = Nunito_Sans({
    subsets: ['latin'],
    variable: '--font-nunito-sans',
    display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
    subsets: ['latin'],
    weight: ['400', '500'],
    variable: '--font-ibm-mono',
    display: 'swap',
});
```

```css
/* globals.css ✅ */
:root {
    --font-display: var(--font-syne), 'Syne', sans-serif;
    --font-body: var(--font-nunito-sans), 'Nunito Sans', sans-serif;
    --font-mono: var(--font-ibm-mono), 'IBM Plex Mono', monospace;
}
```

> **Règle `font.md` :** Utiliser `next/font` avec `display: swap` et des subsets restreints (`latin`). ✅ Toutes les bonnes pratiques sont appliquées.

---

## 7. Metadata / SEO

### Ce qui est bien fait

Metadata statique par page :

```tsx
// src/app/(app)/collection/page.tsx ✅
export const metadata: Metadata = {
    title: 'Collection — Atsume',
};
```

Root layout avec support PWA complet :

```tsx
// src/app/layout.tsx ✅
export const metadata: Metadata = {
    title: 'Atsume',
    description: 'Gérez votre collection de mangas',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        startupImage: [ /* 8 breakpoints iOS */ ],
    },
};

export const viewport: Viewport = {
    themeColor: '#0a0a0b',
    viewportFit: 'cover',  // Notch support ✅
};
```

### Problèmes identifiés

**Manque 1 — Pas d'OG image**

Les pages `series/[id]` et `user/[username]` n'ont pas de `generateMetadata()` avec image OpenGraph. Les partages sur les réseaux sociaux affichent un lien générique.

```tsx
// Recommandé ✅ — src/app/(app)/series/[id]/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const series = await fetchSeries(parseInt(id, 10));

    return new ImageResponse(
        <div style={{ display: 'flex', backgroundImage: `url(${series.cover_url})` }}>
            <h1>{series.title}</h1>
        </div>,
        { width: 1200, height: 630 }
    );
}
```

**Manque 2 — `generateMetadata()` absent sur les pages dynamiques**

```tsx
// Recommandé ✅ — src/app/(app)/series/[id]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const series = await fetchSeries(parseInt(id, 10));
    return {
        title: `${series.title} — Atsume`,
        description: series.description,
        openGraph: {
            title: series.title,
            images: [series.cover_url],
        },
    };
}
```

**Manque 3 — Pas de structured data (JSON-LD)**

Pour une app de collection, les structured data permettent un rich snippet Google (Book, CreativeWork).

---

## 8. Suspense Boundaries et Streaming

### Constat : usage quasi inexistant

Un seul cas de Suspense dans toute l'application :

```tsx
// src/app/(auth)/verify-email/[id]/[hash]/page.tsx ✅
<Suspense fallback={<div><Loader2 className="animate-spin" /></div>}>
    <VerifyEmailClient />
</Suspense>
```

Tous les autres loading states sont gérés inline par React Query :

```tsx
// Pattern répété dans chaque page ❌
const { data, isLoading } = useSeriesQuery(seriesId);
if (isLoading) return <SeriesDetailSkeleton />;
```

### Problèmes identifiés

**Problème 1 — Pas de `loading.tsx`**

Aucun fichier `loading.tsx` dans les routes. Next.js ne peut pas afficher un squelette pendant la navigation avant que le composant soit hydraté.

```
Recommandé ✅ :
src/app/(app)/series/[id]/loading.tsx
src/app/(app)/collection/loading.tsx
src/app/(app)/planning/loading.tsx
```

**Problème 2 — `usePathname()` sans Suspense dans les routes dynamiques**

`SidebarNav` et `BottomNav` utilisent `usePathname()` dans la route dynamique `series/[id]`. Sans Suspense boundary, cela peut déclencher un CSR bailout qui force toute la page en client-side rendering.

> **Règle `suspense-boundaries.md` :** `usePathname()` requiert une Suspense boundary dans les routes avec paramètres dynamiques.

```tsx
// Recommandé ✅ — src/app/(app)/series/[id]/layout.tsx
import { Suspense } from 'react';
import { NavSkeleton } from '@/components/layout/NavSkeleton';

export default function SeriesLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Suspense fallback={<NavSkeleton />}>
                <BottomNav />
            </Suspense>
            {children}
        </>
    );
}
```

**Problème 3 — Waterfall client-side sur Series Detail**

```
Séquence actuelle ❌:
1. Navigate to /series/123
2. SeriesPage (Server) → rend SeriesDetailClient (aucune donnée)
3. Client hydration
4. useSeriesQuery() fire → fetch /api/series/123
5. Données arrivées → render real content

Séquence optimale ✅ (règle async-suspense-boundaries):
1. Navigate to /series/123
2. SeriesPage (Server) → commence le fetch immédiatement
3. Suspense boundary → stream le skeleton
4. Fetch terminé → stream le vrai contenu
```

---

## 9. Re-renders et memoïsation

### Ce qui est bien fait

**Composants extraits à module-level :**

```tsx
// src/app/(app)/series/[id]/SeriesDetailClient.tsx ✅
// Définis EN DEHORS du composant parent — pas de re-création à chaque render
function EditionCard({ edition, seriesId, onToggleWishlist, isPending }: Props) {
    return <SeriesCard ... />;
}

function WishlistButton({ isWishlisted, onToggle, isPending }: Props) {
    return <button onClick={onToggle}>...</button>;
}
```

> **Règle `rerender-no-inline-components` :** Ne jamais définir un composant à l'intérieur d'un autre composant — cela force React à unmount/remount à chaque render.

**`useMemo` pour calculs dérivés coûteux :**

```tsx
// src/components/collection/LibraryTab.tsx ✅
const ownedVolumes = useMemo(() => volumes.filter(m => m.is_owned), [volumes]);
const seriesCount = useMemo(() => new Set(ownedVolumes.map(v => v.series_id)).size, [ownedVolumes]);
const readVolumeIds = useMemo(() => new Set(readingProgress.map(r => r.volume_id)), [readingProgress]);
// O(1) lookups ✅
```

**`useDeferredValue` pour la recherche :**

```tsx
// src/components/collection/LibraryTab.tsx ✅
const deferredSearch = useDeferredValue(search);
const grouped = useGroupedCollection(ownedVolumes, deferredSearch);
// Le rendu de la liste ne bloque pas la saisie ✅
```

> **Règle `rerender-use-deferred-value` :** Différer les rendus coûteux pour garder les inputs responsifs.

### Points d'amélioration

**Manque de `React.memo()` sur les cards :**

`SeriesCard` et `BoxCard` sont re-rendus à chaque mise à jour de la liste parente, même quand leurs props n'ont pas changé.

```tsx
// Recommandé ✅
const SeriesCard = React.memo(function SeriesCard({ series, onToggleWishlist }: Props) {
    return <div>...</div>;
});
```

**`Framer Motion variants` recréés à chaque render :**

```tsx
// ❌ Pattern à éviter si dans le composant
function MyComponent() {
    const variants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
    return <motion.div variants={variants}>...</motion.div>;
}

// ✅ Hoist à module-level (déjà fait dans src/lib/motion.ts pour certains)
const variants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
function MyComponent() {
    return <motion.div variants={variants}>...</motion.div>;
}
```

> **Règle `rendering-hoist-jsx` :** Les objets statiques (variants, styles) doivent être définis à module-level.

---

## 10. Gestion des erreurs

### Ce qui est en place

```tsx
// src/app/(app)/error.tsx ✅
'use client'
export default function Error({ error, reset }: ErrorProps) {
    useEffect(() => console.error(error), [error]);
    return (
        <div>
            <AlertTriangle />
            <p>Une erreur est survenue</p>
            {error.digest && <p>Référence : #{error.digest}</p>}
            <button onClick={reset}>Réessayer</button>
        </div>
    );
}
```

```tsx
// src/app/global-error.tsx ✅
// src/app/not-found.tsx ✅
```

> **Règle `error-handling.md` :** `error.tsx`, `global-error.tsx`, et `not-found.tsx` présents. ✅ Couverture de base correcte.

### Problèmes identifiés

**Problème 1 — Intercepteur axios ne gère que le 401 :**

```tsx
// src/lib/api.ts ❌
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            tokenStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(error); // 403, 404, 500 → silencieux
    }
);
```

Les erreurs 403, 422, 500 ne sont pas gérées centralement.

**Problème 2 — Aucun service de monitoring**

En production, `console.error` ne remonte pas les erreurs. Aucun Sentry, LogRocket ou équivalent n'est configuré.

> **Règle `error-handling.md` :** Utiliser `unstable_rethrow` dans les blocs catch pour laisser Next.js gérer les redirections (`redirect()`, `notFound()`) correctement.

---

## 11. Bundle Size — Problèmes critiques

### Inventaire des dépendances client

| Package | Taille estimée (gzipped) | Statut |
|---------|--------------------------|--------|
| React 19.2.3 | ~42 kb | ✅ Incontournable |
| Framer Motion 12 | ~41 kb | ⚠️ Justifié (PWA transitions) |
| TanStack Query 5 | ~25 kb | ✅ OK |
| Three.js | **~150 kb** | **❌ IMPORTÉ MAIS NON UTILISÉ** |
| html5-qrcode | ~35 kb | ✅ Dynamic import |
| Axios | ~15 kb | ⚠️ `fetch` natif suffit |
| Zod 4 | ~15 kb | ⚠️ Devrait être server-side |
| Lucide React | ~24 kb | ✅ Tree-shakeable |
| Radix UI (×5) | ~20 kb | ✅ Tree-shakeable |

### Problème critique : Three.js chargé statiquement dans les pages d'erreur

`FirefliesBackground` utilise Three.js de manière intensive (WebGLRenderer, Sprites, SpriteMaterial, CanvasTexture, Clock…). L'import est **légitime**, mais le problème est qu'il est importé **statiquement** depuis `not-found.tsx` (Server Component) et `global-error.tsx`, ce qui force Three.js dans le bundle principal — alors que ces pages ne sont visitées qu'en cas d'erreur.

```tsx
// not-found.tsx et global-error.tsx — avant ❌
import FirefliesBackground from '@/components/FirefliesBackground';
// → Three.js (~150 kb) inclus dans le bundle de l'app entière
```

**Impact : ~150 kb gzipped chargés systématiquement pour tous les utilisateurs.**

**Correction appliquée — `next/dynamic` + `ssr: false` :**

```tsx
// not-found.tsx et global-error.tsx — après ✅
import dynamic from 'next/dynamic';

const FirefliesBackground = dynamic(
    () => import('@/components/FirefliesBackground'),
    { ssr: false }
);
// → Three.js chargé uniquement si la page 404 ou l'erreur globale est affichée
```

### Recommandation : bundle analyzer

```ts
// next.config.ts
import withBundleAnalyzer from '@next/bundle-analyzer';

const withAnalyzer = withBundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
});

export default withAnalyzer(nextConfig);
```

```bash
ANALYZE=true npm run build
```

### Remplacer Axios par `fetch` natif

Next.js 15+ étend `fetch` nativement avec le cache, les tags de revalidation, et les cookies. Axios ajoute 15 kb sans apport réel.

```ts
// src/lib/api.ts — Migration vers fetch natif ✅
export async function apiGet<T>(path: string): Promise<T> {
    const token = tokenStorage.getToken();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        next: { revalidate: 300 }, // Cache 5 min
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json();
}
```

---

## 12. Script d'injection de thème

### Excellent pattern anti-FOUC

```tsx
// src/app/layout.tsx ✅
<html
    suppressHydrationWarning  // ← Évite la plainte hydration mismatch
    className={`${syne.variable} ...`}
>
    <head>
        <script dangerouslySetInnerHTML={{ __html: `
            (function(){
                try {
                    // Lecture localStorage synchrone AVANT le premier paint
                    var t = localStorage.getItem('atsume-theme:v1');
                    if (t) document.documentElement.classList.add('theme-' + t);
                    var p = localStorage.getItem('atsume-palette:v1');
                    if (p) document.documentElement.classList.add('palette-' + p);
                } catch(e) {}
            })();
        ` }} />
    </head>
```

> **Règle `rendering-hydration-no-flicker` :** Script inline synchrone pour appliquer les préférences client avant le FCP — élimine le flash de thème. ✅ Implémentation correcte.

---

## Priorités d'action

### Critique (impact immédiat)

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 1 | ~~**Supprimer `import * as THREE`**~~ → **`next/dynamic`** sur `not-found` et `global-error` ✅ | −150 kb bundle | **Corrigé** |
| 2 | ~~**Ajouter `loading.tsx`** pour les routes principales~~ ✅ | UX navigation | **Corrigé** |
| 3 | ~~**Corriger `retry` config**~~ avec backoff exponentiel ✅ | Stabilité réseau | **Corrigé** |

### Important (semaine suivante)

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 4 | ~~Implémenter **Server Actions**~~ pour login/settings ✅ | Sécurité, DX | **Corrigé** |
| 5 | **Suspense boundary** autour de `BottomNav`/`SidebarNav` dans routes dynamiques | CSR bailout | 1h |
| 6 | **`generateMetadata()`** sur `series/[id]` et `user/[username]` | SEO/OG | 2h |
| 7 | **`priority` prop** sur les images LCP (premier fold) | LCP score | 30 min |

### Nice-to-have

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 8 | Configurer **bundle analyzer** | Monitoring bundle | 30 min |
| 9 | Remplacer **Axios par `fetch` natif** | −15 kb, meilleure intégration Next.js | 4h |
| 10 | Ajouter **monitoring d'erreurs** (Sentry) | Production debugging | 2h |
| 11 | **`React.memo`** sur `SeriesCard`, `BoxCard` | Performances listes | 1h |
| 12 | Déplacer **Zod parsing server-side** | −15 kb client | 2h |

---

## Conformité aux règles des skills

### Vercel React Best Practices

| Règle | Statut | Notes |
|-------|--------|-------|
| `async-parallel` | ✅ | `Promise.all` dans les services |
| `bundle-barrel-imports` | ✅ | Pas de barrel files |
| `bundle-dynamic-imports` | ⚠️ | Seulement BarcodeScanner |
| `server-cache-react` | ✅ | `React.cache()` sur `getCollection` |
| `server-serialization` | ⚠️ | Zod parsing côté client |
| `rerender-no-inline-components` | ✅ | Composants extraits correctement |
| `rerender-memo` | ⚠️ | Absent sur les cards |
| `rerender-use-deferred-value` | ✅ | `useDeferredValue` sur la recherche |
| `rendering-hoist-jsx` | ⚠️ | Variants Framer Motion inline par endroits |
| `rendering-hydration-no-flicker` | ✅ | Script d'injection thème excellent |
| `js-index-maps` | ✅ | `Set` pour lookups O(1) |

### Next.js Best Practices

| Règle | Statut | Notes |
|-------|--------|-------|
| `async-patterns` (params async) | ✅ | `await params` respecté |
| `rsc-boundaries` | ✅ | Pas d'async client components |
| `data-patterns` (server actions) | ❌ | Aucune Server Action |
| `suspense-boundaries` (usePathname) | ❌ | Manquant dans routes dynamiques |
| `image.md` | ✅ | `next/image` partout |
| `font.md` | ✅ | `next/font` + `display: swap` |
| `metadata.md` | ⚠️ | Statique OK, dynamique manquant |
| `error-handling.md` | ⚠️ | `error.tsx` présent, monitoring absent |
| `bundling.md` | ❌ | Three.js inutilisé, pas d'analyzer |

---

*Rapport généré avec `/vercel-react-best-practices` et `/next-best-practices`*
