---
name: new-page
description: >
  Generates a new Next.js page in the mangastore PWA following the project's exact patterns and dark
  slate design system. Use this skill whenever the user asks to create a new page, add a route,
  scaffold a view, or says things like "nouvelle page", "crée la page X", "ajoute la route X",
  "génère la page", or describes a new screen they want to build. Always prefer this skill over
  writing a page from scratch.
---

# New Page Generator

Scaffold a new `"use client"` Next.js page under `app/(protected)/` that follows the project's
established design system and code conventions exactly.

## Step 1 — Gather information

Ask the user (or infer from context) these four things before writing any code:

1. **Page name** — The human-readable title shown in the header (e.g. "Wishlist", "Stats").
2. **Route segment** — The folder name inside `app/(protected)/` (e.g. `wishlist`, `stats`).
3. **Data source** — Which service and method fetches the page data
   (e.g. `wishlistService.getAll()`, `mangaService.search(query, page)`).
   If the page is purely static or uses an existing React Query hook, note that instead.
4. **Main content layout** — What the body of the page shows: a card grid, a list, a table,
   tabs, etc. Ask for the item type name so you can name variables correctly.

If the user's message already answers all four, skip the questions and go straight to generation.

## Step 2 — Generate the page

Create the file at:

```
pwa-client/src/app/(protected)/<route>/page.tsx
```

### Required structure

Follow this exact structure — every section must be present:

```
"use client"

imports (React hooks → lucide icons → local components/services/types/utils)

export default function <PageName>Page() {
  // 1. State declarations
  // 2. Data fetching (useEffect or React Query hook)
  // 3. Handler functions
  // 4. return (
  //      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
  //        <Header section>
  //        <Loading skeleton | Error state | Empty state | Main content>
  //      </div>
  //    )
}
```

---

### Header section

The header uses a gradient badge + large title + subtitle. Pick the most fitting lucide icon for
the page subject.

```tsx
<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
  <div className="space-y-2">
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
      <IconName className="h-3 w-3" />
      {/* Short category label, e.g. "Collection", "Exploration" */}
    </div>
    <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
      {/* Page title */}
    </h1>
    <p className="text-slate-400 font-medium">
      {/* One-line description */}
    </p>
  </div>
</div>
```

Add any action buttons (e.g. "Ajouter") or search inputs to the right column of this flex row
when the page needs them.

---

### Loading skeleton

Always render a skeleton while data is loading. Use a responsive grid of pulse cards:

```tsx
{isLoading ? (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="aspect-[2/3] animate-pulse bg-slate-900 rounded-2xl border border-slate-800" />
    ))}
  </div>
) : /* next condition */ }
```

For list-style pages swap the grid for vertical skeleton rows:

```tsx
<div className="space-y-4">
  {[1, 2, 3].map((i) => (
    <div key={i} className="h-20 rounded-xl bg-slate-900/50 animate-pulse border border-slate-800/50" />
  ))}
</div>
```

---

### Error state

Shown when the fetch throws. Use `getApiErrorMessage` from `@/lib/error`:

```tsx
} : error ? (
  <div className="bg-red-500/10 text-red-400 p-6 rounded-2xl flex items-center justify-center gap-3 border border-red-500/20">
    <p className="font-bold">{error}</p>
  </div>
) : /* next condition */
```

---

### Empty state

Shown when data loads successfully but the list is empty. Use a relevant lucide icon:

```tsx
} : items.length === 0 ? (
  <div className="p-20 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl">
    <div className="bg-slate-900/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-800">
      <IconName className="h-10 w-10 text-slate-700" />
    </div>
    <h3 className="text-xl font-bold mb-2">Aucun {/* item label */} trouvé</h3>
    <p className="text-slate-500 max-w-sm mx-auto">
      {/* Friendly explanation of why it's empty + call to action */}
    </p>
  </div>
) : ( /* main content */ )}
```

---

### Main content

Render the real content last. Adapt the layout to the data type:

- **Card grid** (manga covers, series cards): `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6`
- **Item list**: `space-y-3` with each row as `bg-slate-900/30 border border-slate-800/50 rounded-xl p-4`
- **Section groups**: wrap each group in a `space-y-3` block with a small label row above the items

---

### Data fetching pattern

**With React Query hook** (preferred when a hook already exists in `@/hooks/queries`):

```tsx
const { data: items = [], isLoading, error } = useSomeQuery();
// error here is an Error object — call error.message when rendering
```

**With manual fetch** (when no hook exists yet):

```tsx
const [items, setItems] = useState<ItemType[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await someService.method();
      setItems(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Une erreur est survenue."));
    } finally {
      setIsLoading(false);
    }
  };
  load();
}, []);
```

---

## Design system tokens (never deviate)

| Purpose | Classes |
|---|---|
| Page wrapper | `space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700` |
| Card / panel | `bg-slate-900/30 border border-slate-800 rounded-2xl` |
| Large panel / empty state | `bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl` |
| Skeleton pulse card | `animate-pulse bg-slate-900 rounded-2xl border border-slate-800` |
| Skeleton pulse row | `animate-pulse bg-slate-900/50 rounded-xl border border-slate-800/50` |
| Error banner | `bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl` |
| Badge / pill | `bg-primary/10 border border-primary/20 text-primary rounded-full` |
| Page title gradient | `bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent` |
| Subtitle | `text-slate-400 font-medium` |
| Muted label | `text-slate-500 text-xs font-bold uppercase tracking-wider` |

---

## Full minimal example

For a page called "Stats" at route `/stats` fetching `statsService.getSummary()`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { BarChart2 } from "lucide-react";
import { statsService } from "@/services/stats.service";
import { StatsSummary } from "@/types/manga";
import { getApiErrorMessage } from "@/lib/error";

export default function StatsPage() {
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await statsService.getSummary();
        setSummary(data);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Impossible de charger les statistiques."));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
            <BarChart2 className="h-3 w-3" />
            Statistiques
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Stats
          </h1>
          <p className="text-slate-400 font-medium">
            Vue d&apos;ensemble de votre activité de lecture.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[2/3] animate-pulse bg-slate-900 rounded-2xl border border-slate-800" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-500/10 text-red-400 p-6 rounded-2xl flex items-center justify-center gap-3 border border-red-500/20">
          <p className="font-bold">{error}</p>
        </div>
      ) : !summary ? (
        <div className="p-20 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl">
          <div className="bg-slate-900/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-800">
            <BarChart2 className="h-10 w-10 text-slate-700" />
          </div>
          <h3 className="text-xl font-bold mb-2">Aucune donnée disponible</h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            Commencez à ajouter des mangas à votre collection pour voir vos statistiques.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {/* render summary cards */}
        </div>
      )}
    </div>
  );
}
```
