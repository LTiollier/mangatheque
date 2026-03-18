# Direction artistique — Void

> Specs formalisées pour la Phase 2 du redesign Mangastore PWA v2.
> Thème : **Void** · Palette défaut : **Abyss & Ember** · Décisions arrêtées en Phase 0.
> Ce fichier est la source de vérité pour la Phase 3 (système de design) et la Phase 4 (composants).

---

## 1. Typographie

### Polices

| Rôle | Police | Variantes à charger | Usage |
|---|---|---|---|
| **Display** | **Syne** | 400, 700 | Titres de page, chiffres héros, éléments forts |
| **Body** | **Nunito Sans** | 400, 600, 700 | Tout le contenu courant, labels, boutons |
| **Mono** | **IBM Plex Mono** | 400 | Numéros de volumes, ISBN, données techniques |

### Chargement via `next/font` (à coller dans `app/layout.tsx`)

```tsx
import { Syne, Nunito_Sans, IBM_Plex_Mono } from 'next/font/google';

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-syne',
  display: 'swap',
});

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-nunito-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono',
  display: 'swap',
});

// Sur <html> : className={`${syne.variable} ${nunitoSans.variable} ${ibmPlexMono.variable}`}
```

### Tokens CSS à définir dans `globals.css`

```css
:root {
  --font-display: var(--font-syne), 'Syne', sans-serif;
  --font-body: var(--font-nunito-sans), 'Nunito Sans', sans-serif;
  --font-mono: var(--font-mono), 'IBM Plex Mono', monospace;
}

body {
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.6;
}
```

### Scale typographique Void

| Token Tailwind | Taille | Line-height | Font | Usage |
|---|---|---|---|---|
| `text-xs` | 11px | 1.4 | Nunito Sans 400 | Badges, labels discrets, captions |
| `text-sm` | 13px | 1.5 | Nunito Sans 400 | Métadonnées, info secondaire, numéros |
| `text-base` | 15px | 1.6 | Nunito Sans 400 | Corps de texte, descriptions |
| `text-lg` | 18px | 1.4 | Nunito Sans 600 | Sous-titres, headers de carte |
| `text-xl` | 22px | 1.3 | Syne 700 | Titres de section |
| `text-2xl` | 28px | 1.2 | Syne 700 | Titres de page |
| `text-3xl` | 40px | 1.1 | Syne 700 | Chiffres héros (stats dashboard) |

> **Règle** : max 3 tailles de texte par page. Hierarchy obligatoire : titre → body → caption.
> Les chiffres héros (stats) utilisent toujours Syne 700 — c'est l'élément le plus fort de chaque section dashboard.

### Config Tailwind CSS 4 (`tailwind.config.ts`)

```ts
theme: {
  extend: {
    fontFamily: {
      display: ['var(--font-syne)', 'Syne', 'sans-serif'],
      sans:    ['var(--font-nunito-sans)', 'Nunito Sans', 'sans-serif'],
      mono:    ['var(--font-mono)', 'IBM Plex Mono', 'monospace'],
    },
    fontSize: {
      xs:   ['11px', { lineHeight: '1.4' }],
      sm:   ['13px', { lineHeight: '1.5' }],
      base: ['15px', { lineHeight: '1.6' }],
      lg:   ['18px', { lineHeight: '1.4' }],
      xl:   ['22px', { lineHeight: '1.3' }],
      '2xl':['28px', { lineHeight: '1.2' }],
      '3xl':['40px', { lineHeight: '1.1' }],
    },
  }
}
```

---

## 2. Espacements

Toute valeur d'espacement est un **multiple de 4px**. Aucune exception.

| Token | Valeur | Usage |
|---|---|---|
| `space-1` | 4px | Micro — entre icône et label, gap dot/texte |
| `space-2` | 8px | Petit — padding badges, gap grille covers |
| `space-3` | 12px | Base — padding interne cards mobile, gap grille séries |
| `space-4` | 16px | Moyen — padding horizontal page mobile, gap entre éléments |
| `space-6` | 24px | Large — espacement entre sections |
| `space-8` | 32px | XL — padding page desktop, sections majeures |
| `space-12` | 48px | 2XL — sections héros |

### Padding par contexte

| Contexte | Mobile | Desktop |
|---|---|---|
| Page (padding horizontal) | 16px | 32px |
| Card interne | 12px | 16px |
| Badge | 4px 8px | 4px 8px |
| Bottom nav (hauteur utile) | 64px + safe-area-inset-bottom | 64px |
| Grille covers (gap) | 6px | 8px |
| Grille séries (gap) | 12px | 16px |

> **Principe galerie** : les covers sont serrées (`gap-1.5`) — l'effet est celui d'une vitrine. C'est délibéré dans le thème Void.

---

## 3. Radius

Le thème Void utilise un radius **minimal et cohérent**. Pas de mix de radius.

| Niveau | Valeur | Éléments |
|---|---|---|
| **Micro** | 4px (`rounded`) | Badges, status dots, inputs, items de menu |
| **Small** | 8px (`rounded-lg`) | Cards volume, boutons, tags |
| **Medium** | 12px (`rounded-xl`) | Panels, modals, bottom sheet |
| **Full** | 9999px (`rounded-full`) | Avatars, swatches palette, CTA Scanner |

Token CSS global dans `globals.css` :
```css
:root {
  --radius: 0.25rem; /* 4px — shadcn utilise cette variable */
}
```

> **Rappel** : shadcn génère des classes basées sur `--radius`. En définissant `0.25rem`, toutes les variantes (`rounded-md` = `--radius`, `rounded-lg` = `calc(--radius + 4px)`, etc.) restent cohérentes.

---

## 4. Ombres

Les ombres sont définies par **niveau d'altitude**. Les ombres de surbrillance (glow) sont teintées par `--primary` — elles changent automatiquement avec la palette active.

### Tokens CSS

```css
:root {
  /* Ombre de base — opacité fixe, fond sombre Void */
  --shadow-xs:    0 1px 2px oklch(0% 0 0 / 0.5);
  --shadow-sm:    0 2px 8px oklch(0% 0 0 / 0.5);
  --shadow-md:    0 4px 20px oklch(0% 0 0 / 0.6);
  --shadow-lg:    0 16px 60px oklch(0% 0 0 / 0.8);
  --shadow-sheet: 0 -8px 40px oklch(0% 0 0 / 0.6);

  /* Glow teinté par la palette active — change avec --primary */
  --shadow-glow-sm: 0 0 12px color-mix(in oklch, var(--primary) 30%, transparent);
  --shadow-glow-md: 0 0 24px color-mix(in oklch, var(--primary) 25%, transparent);
  --shadow-glow-lg: 0 0 80px color-mix(in oklch, var(--primary) 20%, transparent);
}
```

### Utilisation par niveau d'altitude

| Niveau | Ombre | Éléments |
|---|---|---|
| **0 — Fond** | aucune | Éléments sur le background direct |
| **1 — Hover** | `--shadow-sm` | VolumeCard au hover (desktop) |
| **2 — Surélevé** | `--shadow-md` | Cards flottantes, bottom nav |
| **3 — Sélectionné / actif** | `--shadow-sm, --shadow-glow-sm` | Card sélectionnée, bouton Scanner |
| **4 — Overlay** | `--shadow-lg` | Modals, popovers, dropdowns |
| **Sheet** | `--shadow-sheet` | Bottom sheet (ombre remonte vers le bas) |

### Config Tailwind

```ts
theme: {
  extend: {
    boxShadow: {
      'void-xs':    'var(--shadow-xs)',
      'void-sm':    'var(--shadow-sm)',
      'void-md':    'var(--shadow-md)',
      'void-lg':    'var(--shadow-lg)',
      'void-sheet': 'var(--shadow-sheet)',
      'void-glow':  'var(--shadow-glow-sm)',
      'void-glow-md': 'var(--shadow-glow-md)',
    },
  }
}
```

> **Note** : `color-mix(in oklch, ...)` est supporté dans tous les navigateurs modernes (Chrome 111+, Firefox 113+, Safari 16.2+). Pas de fallback nécessaire pour une PWA ciblant mobile récent.

---

## 5. Animations

### Principes fermes

| Règle | Détail |
|---|---|
| ✅ **Animer** | Transitions de page · ouverture/fermeture de bottom sheet · apparition de blocs dashboard · feedback d'action utilisateur |
| ❌ **Ne pas animer** | Chaque VolumeCard au mount · chaque ligne de liste · transition skeleton→contenu (fade simple max) |
| ❌ **Pas de stagger sur grilles** | Une collection de 80 volumes avec stagger = lag garanti sur mobile bas de gamme |

### Durées et courbes

| Type | Durée | Courbe | Quand |
|---|---|---|---|
| Micro-interaction | 100ms | `ease-out` | Tap bouton, toggle, press |
| Transition UI | 200ms | `ease-out` | Hover, fade contenu tabs |
| Entrée de bloc | 300ms | `ease-out` | Blocs dashboard, modals |
| Transition de page | 200ms | `ease-out` | Changement de route |
| Bottom sheet | 300ms spring | `stiffness: 400, damping: 40` | Ouverture depuis le bas |
| Sortie / fermeture | 150-200ms | `ease-in` | Toujours plus rapide que l'entrée |

### Variants Framer Motion — référence

```ts
// Transition de page (à utiliser dans PageTransition.tsx)
export const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit:    { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
};

// Bloc de section (Dashboard, première apparition uniquement)
export const sectionVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// Stat cards — stagger 80ms (SEULEMENT sur les 4 cards, jamais sur une grille)
export const statContainerVariants = {
  animate: { transition: { staggerChildren: 0.08 } },
};
export const statCardVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// Bottom sheet
export const bottomSheetVariants = {
  initial: { y: '100%' },
  animate: { y: 0,       transition: { type: 'spring', stiffness: 400, damping: 40 } },
  exit:    { y: '100%',  transition: { duration: 0.2, ease: 'easeIn' } },
};

// Feedback action (ajout, toggle lu, retour prêt)
export const feedbackVariants = {
  initial: { scale: 1 },
  tap:     { scale: 0.92, transition: { duration: 0.1, ease: 'easeOut' } },
};

// Toast / notification (géré par sonner — pas de variant custom nécessaire)
// Sonner gère nativement le slide-up + fade-in.
```

### `prefers-reduced-motion`

Tous les variants Framer Motion respectent automatiquement `prefers-reduced-motion` via `useReducedMotion()`. À intégrer dans le composant `PageTransition` :

```tsx
import { useReducedMotion } from 'framer-motion';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const variants = reduce
    ? { initial: {}, animate: {}, exit: {} } // pas d'animation
    : pageVariants;
  // ...
}
```

---

## 6. Composant signature — VolumeCard Void

Représentatif de la direction artistique. Référence pour les autres composants.

```
┌──────────────────┐
│                  │ ← rounded-lg (8px), overflow-hidden
│                  │
│  [Cover 2:3]     │ ← object-cover, w-full h-full
│                  │   Pas de fond visible — la cover EST la carte
│                  │
│ ● ⊗             │ ← Badges status en haut à gauche/droite (z-10)
│                  │   ● read : dot vert 8px    ⊗ loaned : ambre 14px
│████████████████  │ ← Gradient bas : transparent → oklch(0% 0 0 / 0.85)
│ Vol. 3       3   │ ← Texte sur overlay gradient (z-10)
└──────────────────┘
```

```tsx
// Exemple de classes Tailwind
<div className="relative overflow-hidden rounded-lg cursor-pointer
                transition-[transform,box-shadow] duration-200 ease-out
                hover:-translate-y-0.5 hover:shadow-void-glow">
  <div className="aspect-[2/3]">
    <Image src={cover} alt={title} fill className="object-cover" />
  </div>
  {/* Gradient overlay bas */}
  <div className="absolute inset-x-0 bottom-0 h-1/3
                  bg-gradient-to-t from-black/85 to-transparent" />
  {/* Badges status */}
  {isRead   && <span className="absolute top-1 left-1 size-2 rounded-full bg-[--color-read]" />}
  {isLoaned && <BookUp className="absolute top-1 right-1 size-3.5 text-[--color-loaned]" />}
  {/* Numéro volume */}
  <span className="absolute bottom-1 right-1.5 text-xs font-mono text-white/70">
    {volumeNumber}
  </span>
</div>
```

---

## 7. Checklist Phase 2 — implémentation Phase 3

Toutes les specs ci-dessus sont prêtes à implémenter. En Phase 3, coller directement :

- [ ] `app/layout.tsx` — imports `next/font`, variables CSS sur `<html>`
- [ ] `tailwind.config.ts` — `fontFamily`, `fontSize`, `boxShadow`
- [ ] `globals.css` — tokens fixes `:root` (fonts, shadows, radius `--radius: 0.25rem`)
- [ ] `lib/motion.ts` — exporter tous les variants Framer Motion de ce document
- [ ] Vérifier `color-mix()` dans les DevTools sur la palette Ember défaut

---

*Source : `rapport.md` §7 (typographie, espacements) + §8 (animations) · Décisions Phase 0 (Void + Syne/Nunito Sans)*
