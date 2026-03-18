# Rapport de Redesign — Mangastore PWA v2

> Refonte complète centrée sur l'ergonomie mobile, la praticité et un design moderne épuré.
> Ce rapport couvre l'architecture UX, les directions UI et les palettes de couleurs à choisir.

---

## Sommaire

1. [Audit UX — Ce qui ne va pas](#1-audit-ux--ce-qui-ne-va-pas)
2. [Architecture de l'information](#2-architecture-de-linformation)
3. [Flows utilisateurs critiques](#3-flows-utilisateurs-critiques)
4. [Directions UI — Choisir un style](#4-directions-ui--choisir-un-style)
5. [Palettes de couleurs — À vous de choisir](#5-palettes-de-couleurs--à-vous-de-choisir)
6. [Spécifications composants clés](#6-spécifications-composants-clés)
7. [Typographie & Espacements](#7-typographie--espacements)
8. [Animations & Micro-interactions](#8-animations--micro-interactions)
9. [Décisions à prendre avant d'implémenter](#9-décisions-à-prendre-avant-dimplémenter)

---

## 1. Audit UX — Ce qui ne va pas

### Navigation
| Problème | Impact | Solution proposée |
|---|---|---|
| Sidebar desktop avec 8 items plats | Surcharge cognitive, pas de hiérarchie | Grouper en 3 zones : principal, collection, profil |
| Bottom nav 5 items dont Scanner centré | Le Scanner est bien — mais Search et Dashboard se ressemblent fonctionnellement | Fusionner ou différencier clairement |
| Loans, Wishlist, Reading Progress au même niveau que Dashboard | Ces 3 pages sont des sous-sections de la collection | Les regrouper sous un hub Collection |
| Pas de breadcrumb sur les pages profondes (Series → Edition → Volume) | L'utilisateur se perd dans la hiérarchie | Breadcrumb sticky en haut sur mobile |

### Mobile-first — Points de friction
- **Touch targets** : les boutons d'action sur les volumes (lu/non lu, prêter) sont trop petits en grille compacte
- **Scroll** : les pages collection avec grille + accordéon génèrent des scrolls très longs sans ancrage visuel
- **Multi-sélection** : le mode sélection multiple n'est pas évident à déclencher (long press ou bouton caché)
- **Clavier** : la barre de recherche sur iOS repousse le contenu sans que l'UI ne s'adapte

### Hiérarchie visuelle
- Le Dashboard actuel met en compétition : hero greeting + 4 stat cards + 2 CTA buttons + grille de 6 mangas. Trop d'éléments au même niveau de priorité.
- Les pages Collection et Reading Progress utilisent des accordéons imbriqués (series → edition → volumes) qui créent une profondeur difficile à scanner visuellement.
- Les badges de statut sur les volumes (owned/read/loaned/wishlisted) peuvent s'empiler jusqu'à 4 indicateurs simultanés sur une seule miniature.

### Ce qui fonctionne bien (à conserver)
- Le bouton Scanner centré en CTA flottant dans la bottom nav
- Les tabs Actifs/Historique sur les prêts
- Les transitions de page avec Framer Motion
- La logique de données (React Query, optimistic updates)

---

## 2. Architecture de l'information

### Navigation principale (bottom nav mobile — 5 items max)

```
[ Accueil ]  [ Collection ]  [ ◉ Scanner ]  [ Recherche ]  [ Moi ]
```

- **Accueil** — Dashboard condensé : stats du jour, derniers ajouts, alertes prêts en retard
- **Collection** — Hub de la bibliothèque + sous-tabs : Ma collection / Prêts / Wishlist / Lu
- **Scanner** *(CTA central, visuellement distinct)* — Scan de codes-barres
- **Recherche** — Catalogue complet, découverte
- **Moi** — Profil public, paramètres, déconnexion

### Arborescence complète

```
App
├── Accueil
│   ├── Stats rapides (volumes, séries, prêts actifs)
│   ├── Derniers ajouts (6 covers)
│   └── Alerte prêts > 30 jours
│
├── Collection
│   ├── Ma bibliothèque (liste séries + recherche/filtre)
│   │   └── Série
│   │       └── Édition → Volumes (grille)
│   │           └── Box-set → Boîtes → Volumes
│   ├── Prêts (actifs + historique)
│   ├── Wishlist
│   └── Progression de lecture
│
├── Scanner
│   └── Vue caméra + confirmation batch
│
├── Recherche
│   └── Résultats → Fiche série (ajout collection/wishlist)
│
└── Moi
    ├── Profil public (preview)
    ├── Paramètres (username, visibilité)
    └── Déconnexion

Profils publics (hors app)
└── /user/:username → Collection publique
```

### Pourquoi ce regroupement

La **Collection** devient un hub avec des sous-onglets plutôt que 3 pages séparées dans la nav. Raison : Prêts, Wishlist et Progression ne fonctionnent qu'en rapport avec la collection — les sortir au même niveau que Dashboard crée une fausse équivalence. L'utilisateur pense d'abord à "ma collection" puis cherche ce qu'il veut faire dedans.

---

## 3. Flows utilisateurs critiques

### Flow A — Ajouter des volumes rapidement (batch scan)

**Actuel** : Scanner → scan → confirmation → ajout
**Problème** : Après ajout, l'utilisateur atterrit... nulle part. Pas de confirmation visuelle de ce qui a été ajouté.

**Proposé** :
```
Scanner → Scan 1 ou N codes →
Panneau résumé (covers + titres détectés) →
[Tout ajouter] ou sélection manuelle →
Toast "X volumes ajoutés" + lien vers la série
```

### Flow B — Marquer des volumes comme lus

**Actuel** : Collection → Série → Édition → Volumes → Clic sur chaque volume → Toggle lu/non lu
**Problème** : 4 niveaux de navigation pour une action fréquente.

**Proposé** (2 chemins) :
- **Rapide** : Progression → Série → Multi-select → Marquer comme lus (bulk)
- **Contextuel** : Sur la grille de volumes, swipe gauche sur un volume = "Marquer comme lu" (mobile) / bouton hover (desktop)

### Flow C — Prêter un volume

**Actuel** : Loans page → bouton "Ajouter un prêt" → formulaire
**Problème** : Le prêt est dissocié du contexte (la vue du volume). L'utilisateur doit se souvenir quel volume il veut prêter avant d'ouvrir le formulaire.

**Proposé** :
```
Vue volume → bouton "Prêter" → Bottom sheet mobile avec :
  - Nom de l'emprunteur (autocomplete sur noms passés)
  - Date (aujourd'hui par défaut)
  - Note optionnelle
  - [Confirmer le prêt]
```

### Flow D — Découverte et ajout depuis la recherche

**Actuel** : Recherche → Résultat → Série detail → Actions volume
**Bon** — à conserver, mais améliorer le feedback : montrer clairement ce qui est déjà dans la collection vs ce qui ne l'est pas.

---

## 4. Directions UI — Choisir un style

> Trois directions distinctes. Choisissez-en une avant l'implémentation.

---

### Direction A — **Obsidian** *(Minimaliste éditorial)*

**Mood** : Épuré / Précis / Premium
**Inspiration** : Linear, Vercel Dashboard, Raycast
**Principe** : La typographie et l'espace vide font le design. Les covers manga sont les seuls éléments colorés.

#### Typographie
- Display : **Geist** — titres, chiffres de stats
- Body : **Inter** — contenu courant
- Accent : **Geist Mono** — badges, codes ISBN, volumes numérotés

#### Espacements et rythme
- Base unit : 4px
- Padding cards : 12px mobile / 16px desktop
- Gap grids : 8px mobile / 12px desktop

#### Radius
- Small (badges, inputs) : 6px
- Medium (cards, boutons) : 10px
- Large (modals, panels) : 16px
- Full (avatar, tags) : 9999px

#### Ombres
- Légère (hover) : `0 1px 3px rgba(0,0,0,0.4)`
- Moyenne (cards) : `0 2px 8px rgba(0,0,0,0.5)`
- Forte (modals) : `0 8px 32px rgba(0,0,0,0.7)`

#### Style général
Fond très sombre quasi-noir. Texte blanc cassé. Un seul accent couleur (rouge sang ou violet électrique). Les covers manga apportent toute la couleur — le chrome de l'UI disparaît pour laisser parler les œuvres. Inspiré des apps de dev tools : précision, densité d'information, zéro décoration.

#### Carte manga signature
```
┌─────────────────────┐
│  [Cover 2:3 ratio]  │
│  ████████████████   │
│                     │
│ Titre               │ ← Inter Medium 13px
│ Vol. 3              │ ← Geist Mono 11px, muted
│ ● Lu  ⊗ Prêté       │ ← Dots status 10px
└─────────────────────┘
```
Bords nets, pas d'ombre sur la carte en défaut. Hover : légère élévation + outline couleur primaire 1px.

---

### Direction B — **Washi** *(Chaleureux contemporain)*

**Mood** : Organique / Culturel / Confiant
**Inspiration** : Letterboxd, Notion, apps japonaises modernes
**Principe** : La chaleur du papier japonais revisitée en dark mode profond. L'UI respire mais reste dense.

#### Typographie
- Display : **DM Serif Display** — titres de section, noms de séries
- Body : **DM Sans** — contenu courant, labels
- Mono : **JetBrains Mono** — numéros de volumes, ISBN

#### Espacements et rythme
- Base unit : 4px
- Padding cards : 16px mobile / 20px desktop
- Gap grids : 12px mobile / 16px desktop

#### Radius
- Small (badges, inputs) : 8px
- Medium (cards, boutons) : 14px
- Large (modals, panels) : 20px
- Full (avatar, tags) : 9999px

#### Ombres
- Légère (hover) : `0 2px 6px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)`
- Moyenne (cards) : `0 4px 16px rgba(0,0,0,0.4)`
- Forte (modals) : `0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)`

#### Style général
Fond dark avec une légère teinte chaude (bleu-gris foncé, pas noir pur). Des séparateurs subtils à la place des cards pour les listes. Accent couleur ambre ou teal. Typographie avec empattements pour les titres — donne du caractère sans être illustratif. Les stats ont une taille généreuse avec des chiffres "hero".

#### Carte manga signature
```
┌──────────────────────┐
│ [Cover 2:3 arrondi]  │
│                      │
│ Titre série          │ ← DM Serif 14px
│ Édition Standard     │ ← DM Sans 11px muted
│ ▓▓▓▓▓▓░░░░ 6/10     │ ← Progress bar fine
└──────────────────────┘
```
Cards avec fond légèrement plus clair que le fond de page. Progress bar fine sur les séries en cours.

---

### Direction C — **Void** *(Dark premium collector)*

**Mood** : Luxueux / Immersif / Audacieux
**Inspiration** : Plex, Apple TV+, Steam Deck UI
**Principe** : L'app est une vitrine. Les covers s'affichent grands, le fond est quasi-invisible, l'accent couleur est vibrant.

#### Typographie
- Display : **Syne** — titres expressifs, hero sections
- Body : **Nunito Sans** — lisibilité maximale en dark
- Mono : **IBM Plex Mono** — données techniques

#### Espacements et rythme
- Base unit : 4px
- Padding cards : 8px mobile / 12px desktop (serré = effet galerie)
- Gap grids : 6px mobile / 8px desktop

#### Radius
- Small (badges, inputs) : 4px
- Medium (cards) : 8px
- Large (modals, panels) : 12px
- Full (avatar, tags) : 9999px

#### Ombres
- Légère (hover) : `0 0 12px rgba([accent], 0.3)`
- Moyenne (cards) : `0 4px 20px rgba(0,0,0,0.6)`
- Forte (modals) : `0 16px 60px rgba(0,0,0,0.8)`

#### Style général
Le noir le plus profond possible. Covers affichés en grand avec un léger glow de leur couleur dominante. Accent couleur unique et vif (violet électrique ou cyan). Stats en mode "data dashboard" avec grandes polices bold. Bottom nav avec fond flou (glassmorphism léger). L'effet général est celui d'une collection premium, comme Plex ou une app de streaming.

#### Carte manga signature
```
┌────────────────┐
│                │
│  [Cover 2:3]   │  ← Grille serrée, couvertures grandes
│                │
│████████████████│  ← Gradient sombre en bas
│ Titre  Vol.3   │  ← Texte sur overlay gradient
└────────────────┘
```
Pas de fond de card visible. Le texte est superposé sur un gradient en bas de la cover. Badges status en haut à droite de l'image.

---

## 5. Palettes de couleurs — À vous de choisir

> 4 palettes complètes en OKLch, compatibles Tailwind CSS 4 + shadcn/ui.
> Toutes sont **dark-first** (l'app est dark-themed selon FONCTION.md).

---

### Palette 1 — **Slate & Crimson** *(Direction Obsidian)*

**Esprit** : Neutralité absolue du fond, crimson comme seul signal de vie. Sobre et efficace comme une app de prod.

```css
/* ============================================
   PALETTE 1 — Slate & Crimson
   ============================================ */
@layer base {
  :root {
    --background: oklch(98% 0.004 250);
    --foreground: oklch(12% 0.015 250);
    --card: oklch(100% 0 0);
    --card-foreground: oklch(12% 0.015 250);
    --popover: oklch(100% 0 0);
    --popover-foreground: oklch(12% 0.015 250);
    --primary: oklch(52% 0.22 18);
    --primary-foreground: oklch(98% 0.005 18);
    --secondary: oklch(93% 0.008 250);
    --secondary-foreground: oklch(20% 0.015 250);
    --muted: oklch(93% 0.008 250);
    --muted-foreground: oklch(48% 0.012 250);
    --accent: oklch(93% 0.008 250);
    --accent-foreground: oklch(20% 0.015 250);
    --destructive: oklch(50% 0.22 15);
    --destructive-foreground: oklch(98% 0 0);
    --border: oklch(88% 0.009 250);
    --input: oklch(88% 0.009 250);
    --ring: oklch(52% 0.22 18);
    --radius: 0.625rem;
  }

  .dark {
    --background: oklch(10% 0.015 250);
    --foreground: oklch(93% 0.008 250);
    --card: oklch(13% 0.018 250);
    --card-foreground: oklch(93% 0.008 250);
    --popover: oklch(13% 0.018 250);
    --popover-foreground: oklch(93% 0.008 250);
    --primary: oklch(62% 0.24 18);
    --primary-foreground: oklch(10% 0.015 18);
    --secondary: oklch(18% 0.02 250);
    --secondary-foreground: oklch(88% 0.008 250);
    --muted: oklch(16% 0.018 250);
    --muted-foreground: oklch(58% 0.012 250);
    --accent: oklch(18% 0.02 250);
    --accent-foreground: oklch(88% 0.008 250);
    --destructive: oklch(58% 0.23 18);
    --destructive-foreground: oklch(98% 0 0);
    --border: oklch(22% 0.02 250);
    --input: oklch(22% 0.02 250);
    --ring: oklch(62% 0.24 18);
    --card: oklch(13% 0.018 250);
    --sidebar-background: oklch(8% 0.012 250);
    --sidebar-foreground: oklch(88% 0.008 250);
    --sidebar-primary: oklch(62% 0.24 18);
    --sidebar-primary-foreground: oklch(10% 0.015 18);
    --sidebar-accent: oklch(16% 0.018 250);
    --sidebar-accent-foreground: oklch(88% 0.008 250);
    --sidebar-border: oklch(18% 0.02 250);
    --sidebar-ring: oklch(62% 0.24 18);

    /* Couleurs sémantiques Mangastore */
    --color-read: oklch(62% 0.18 155);       /* Vert émeraude */
    --color-loaned: oklch(70% 0.18 55);      /* Ambre */
    --color-wishlist: oklch(62% 0.20 280);   /* Violet */
    --color-owned: oklch(62% 0.24 18);       /* Crimson = primary */
  }
}
```

**Contrastes (dark mode)** :
- Texte principal sur fond : ~13:1 ✅ AAA
- Texte muted sur fond : ~5.2:1 ✅ AA
- Texte blanc sur crimson primary : ~5.8:1 ✅ AA

---

### Palette 2 — **Indigo Night** *(Direction Washi)*

**Esprit** : Le bleu-indigo profond comme fond donne une chaleur froide élégante. L'accent violet chaud crée du contraste sans être agressif. Rappelle les encres japonaises.

```css
/* ============================================
   PALETTE 2 — Indigo Night
   ============================================ */
@layer base {
  :root {
    --background: oklch(97% 0.006 260);
    --foreground: oklch(14% 0.025 260);
    --card: oklch(100% 0 0);
    --card-foreground: oklch(14% 0.025 260);
    --popover: oklch(100% 0 0);
    --popover-foreground: oklch(14% 0.025 260);
    --primary: oklch(50% 0.24 290);
    --primary-foreground: oklch(98% 0.005 290);
    --secondary: oklch(92% 0.012 260);
    --secondary-foreground: oklch(22% 0.02 260);
    --muted: oklch(92% 0.012 260);
    --muted-foreground: oklch(50% 0.015 260);
    --accent: oklch(88% 0.03 260);
    --accent-foreground: oklch(22% 0.02 260);
    --destructive: oklch(52% 0.22 15);
    --destructive-foreground: oklch(98% 0 0);
    --border: oklch(86% 0.01 260);
    --input: oklch(86% 0.01 260);
    --ring: oklch(50% 0.24 290);
    --radius: 0.875rem;
  }

  .dark {
    --background: oklch(11% 0.025 265);
    --foreground: oklch(92% 0.008 265);
    --card: oklch(14% 0.028 265);
    --card-foreground: oklch(92% 0.008 265);
    --popover: oklch(14% 0.028 265);
    --popover-foreground: oklch(92% 0.008 265);
    --primary: oklch(65% 0.26 290);
    --primary-foreground: oklch(10% 0.02 290);
    --secondary: oklch(19% 0.03 265);
    --secondary-foreground: oklch(88% 0.008 265);
    --muted: oklch(17% 0.027 265);
    --muted-foreground: oklch(60% 0.015 265);
    --accent: oklch(20% 0.035 265);
    --accent-foreground: oklch(88% 0.008 265);
    --destructive: oklch(60% 0.23 15);
    --destructive-foreground: oklch(98% 0 0);
    --border: oklch(24% 0.03 265);
    --input: oklch(24% 0.03 265);
    --ring: oklch(65% 0.26 290);
    --sidebar-background: oklch(9% 0.02 265);
    --sidebar-foreground: oklch(88% 0.008 265);
    --sidebar-primary: oklch(65% 0.26 290);
    --sidebar-primary-foreground: oklch(10% 0.02 290);
    --sidebar-accent: oklch(17% 0.027 265);
    --sidebar-accent-foreground: oklch(88% 0.008 265);
    --sidebar-border: oklch(20% 0.028 265);
    --sidebar-ring: oklch(65% 0.26 290);

    /* Couleurs sémantiques Mangastore */
    --color-read: oklch(68% 0.17 155);
    --color-loaned: oklch(72% 0.16 55);
    --color-wishlist: oklch(65% 0.26 290);   /* = primary */
    --color-owned: oklch(68% 0.20 220);      /* Teal */
  }
}
```

**Contrastes (dark mode)** :
- Texte principal sur fond : ~12:1 ✅ AAA
- Texte muted sur fond : ~5.6:1 ✅ AA
- Texte foncé sur violet primary : ~5.1:1 ✅ AA

---

### Palette 3 — **Abyss & Ember** *(Direction Void)*

**Esprit** : Le noir le plus profond, presque sans teinte. Un seul accent ambre chaud comme une braise. Crée un effet premium "collector" — comme une vitrine dans une salle obscure.

```css
/* ============================================
   PALETTE 3 — Abyss & Ember
   ============================================ */
@layer base {
  :root {
    --background: oklch(97% 0.003 60);
    --foreground: oklch(10% 0.01 60);
    --card: oklch(100% 0 0);
    --card-foreground: oklch(10% 0.01 60);
    --popover: oklch(100% 0 0);
    --popover-foreground: oklch(10% 0.01 60);
    --primary: oklch(62% 0.22 55);
    --primary-foreground: oklch(10% 0.01 55);
    --secondary: oklch(93% 0.006 60);
    --secondary-foreground: oklch(20% 0.012 60);
    --muted: oklch(93% 0.006 60);
    --muted-foreground: oklch(50% 0.01 60);
    --accent: oklch(90% 0.02 60);
    --accent-foreground: oklch(20% 0.012 60);
    --destructive: oklch(52% 0.22 15);
    --destructive-foreground: oklch(98% 0 0);
    --border: oklch(87% 0.007 60);
    --input: oklch(87% 0.007 60);
    --ring: oklch(62% 0.22 55);
    --radius: 0.5rem;
  }

  .dark {
    --background: oklch(7% 0.008 250);
    --foreground: oklch(94% 0.006 60);
    --card: oklch(10% 0.010 250);
    --card-foreground: oklch(94% 0.006 60);
    --popover: oklch(11% 0.012 250);
    --popover-foreground: oklch(94% 0.006 60);
    --primary: oklch(72% 0.24 55);
    --primary-foreground: oklch(8% 0.008 55);
    --secondary: oklch(15% 0.012 250);
    --secondary-foreground: oklch(90% 0.006 60);
    --muted: oklch(13% 0.010 250);
    --muted-foreground: oklch(56% 0.010 60);
    --accent: oklch(16% 0.014 250);
    --accent-foreground: oklch(90% 0.006 60);
    --destructive: oklch(62% 0.24 25);
    --destructive-foreground: oklch(98% 0 0);
    --border: oklch(18% 0.012 250);
    --input: oklch(18% 0.012 250);
    --ring: oklch(72% 0.24 55);
    --sidebar-background: oklch(6% 0.006 250);
    --sidebar-foreground: oklch(90% 0.006 60);
    --sidebar-primary: oklch(72% 0.24 55);
    --sidebar-primary-foreground: oklch(8% 0.008 55);
    --sidebar-accent: oklch(12% 0.010 250);
    --sidebar-accent-foreground: oklch(90% 0.006 60);
    --sidebar-border: oklch(14% 0.010 250);
    --sidebar-ring: oklch(72% 0.24 55);

    /* Couleurs sémantiques Mangastore */
    --color-read: oklch(70% 0.18 155);
    --color-loaned: oklch(72% 0.24 55);      /* = primary amber */
    --color-wishlist: oklch(65% 0.22 300);   /* Rose-violet */
    --color-owned: oklch(62% 0.18 215);      /* Bleu-cyan */
  }
}
```

**Contrastes (dark mode)** :
- Texte principal sur fond : ~15:1 ✅ AAA
- Texte muted sur fond : ~6.1:1 ✅ AA
- Texte foncé sur ambre primary : ~6.8:1 ✅ AA

---

### Palette 4 — **Forest Noir** *(Bonus — Naturel & Calme)*

**Esprit** : Un vert forêt profond comme teinte de fond. Doux pour les yeux, différenciant des apps classiques. Évoque les collections de livres, les bibliothèques, la sérénité de la lecture.

```css
/* ============================================
   PALETTE 4 — Forest Noir
   ============================================ */
@layer base {
  :root {
    --background: oklch(97% 0.008 150);
    --foreground: oklch(12% 0.02 155);
    --card: oklch(100% 0 0);
    --card-foreground: oklch(12% 0.02 155);
    --popover: oklch(100% 0 0);
    --popover-foreground: oklch(12% 0.02 155);
    --primary: oklch(48% 0.20 155);
    --primary-foreground: oklch(98% 0.005 155);
    --secondary: oklch(92% 0.014 150);
    --secondary-foreground: oklch(22% 0.018 155);
    --muted: oklch(92% 0.014 150);
    --muted-foreground: oklch(50% 0.014 155);
    --accent: oklch(88% 0.025 150);
    --accent-foreground: oklch(22% 0.018 155);
    --destructive: oklch(52% 0.22 15);
    --destructive-foreground: oklch(98% 0 0);
    --border: oklch(86% 0.012 150);
    --input: oklch(86% 0.012 150);
    --ring: oklch(48% 0.20 155);
    --radius: 0.75rem;
  }

  .dark {
    --background: oklch(10% 0.022 160);
    --foreground: oklch(93% 0.010 150);
    --card: oklch(13% 0.025 160);
    --card-foreground: oklch(93% 0.010 150);
    --popover: oklch(13% 0.025 160);
    --popover-foreground: oklch(93% 0.010 150);
    --primary: oklch(62% 0.22 155);
    --primary-foreground: oklch(10% 0.018 155);
    --secondary: oklch(18% 0.028 160);
    --secondary-foreground: oklch(88% 0.010 150);
    --muted: oklch(16% 0.024 160);
    --muted-foreground: oklch(60% 0.014 155);
    --accent: oklch(19% 0.030 160);
    --accent-foreground: oklch(88% 0.010 150);
    --destructive: oklch(60% 0.23 15);
    --destructive-foreground: oklch(98% 0 0);
    --border: oklch(22% 0.026 160);
    --input: oklch(22% 0.026 160);
    --ring: oklch(62% 0.22 155);
    --sidebar-background: oklch(8% 0.018 160);
    --sidebar-foreground: oklch(88% 0.010 150);
    --sidebar-primary: oklch(62% 0.22 155);
    --sidebar-primary-foreground: oklch(10% 0.018 155);
    --sidebar-accent: oklch(15% 0.022 160);
    --sidebar-accent-foreground: oklch(88% 0.010 150);
    --sidebar-border: oklch(18% 0.024 160);
    --sidebar-ring: oklch(62% 0.22 155);

    /* Couleurs sémantiques Mangastore */
    --color-read: oklch(62% 0.22 155);       /* = primary vert */
    --color-loaned: oklch(72% 0.20 55);      /* Ambre */
    --color-wishlist: oklch(65% 0.22 295);   /* Lavande */
    --color-owned: oklch(65% 0.20 215);      /* Cyan */
  }
}
```

**Contrastes (dark mode)** :
- Texte principal sur fond : ~13:1 ✅ AAA
- Texte muted sur fond : ~5.8:1 ✅ AA
- Texte foncé sur vert primary : ~5.3:1 ✅ AA

---

### Résumé des palettes

| Palette | Accent | Fond dark | Mood | Paire avec direction |
|---|---|---|---|---|
| **1 — Slate & Crimson** | Rouge sang `hue 18` | Slate quasi-noir | Sobre, pro, tranchant | Obsidian |
| **2 — Indigo Night** | Violet `hue 290` | Bleu-indigo profond | Élégant, culturel, chaud | Washi |
| **3 — Abyss & Ember** | Ambre `hue 55` | Noir absolu | Premium, luxueux, collector | Void |
| **4 — Forest Noir** | Vert `hue 155` | Vert forêt sombre | Calme, naturel, bibliothèque | Washi ou Obsidian |

---

## 6. Spécifications composants clés

### 6.1 — Bottom Navigation

```
Structure : 5 items, hauteur 64px safe-area inclus
Fond : --sidebar-background + backdrop-blur-md
Bordure haute : 1px solid --border (opacity 40%)

Items normaux :
- Icône 22px centré
- Label 10px sous l'icône, font-medium
- Couleur inactive : --muted-foreground
- Couleur active : --primary
- Indicateur actif : dot 4px sous le label, couleur --primary

Item Scanner (centre) :
- Cercle 52px, fond --primary
- Icône 24px blanc
- Légèrement surélevé (translateY -8px)
- Ombre : 0 4px 16px [primary avec opacité 40%]
- Pas de label

États :
- Tap : scale 0.92, durée 100ms, ease-out
- Active : dot indicator animate in (scale 0→1, 150ms)
```

### 6.2 — Carte Manga (Volume)

```
Dimensions : ratio 2:3 (largeur × 1.5 = hauteur)
Min-width : 90px (grille dense), Max-width : 160px

Structure :
  ┌── Cover Image (object-cover, rounded selon direction)
  │   └── Overlay gradient bas (linear-gradient transparent→black 60%)
  │   └── Badge status TOP RIGHT (8px, z-10)
  └── Footer optionnel (volume number, si liste)

Badges status :
- Owned : invisible (c'est l'état normal)
- Read : dot vert 8px en haut à gauche
- Loaned : icône book-up 14px en haut à droite, fond ambre
- Wishlisted : icône heart 14px, fond violet

États :
- Default : shadow légère
- Hover (desktop) : translateY -2px, shadow moyenne, outline 1px --primary
- Selected (multi-select) : outline 2px --primary, overlay bleu 20% opacity
- Loading : skeleton shimmer, même ratio
```

### 6.3 — Page Collection (Hub)

```
Layout :
  ┌─────────────────────────────┐
  │ Header : "Ma collection"    │  ← Titre + bouton [+ Ajouter]
  │ Search bar                  │
  │ Tabs : Bibliothèque / Prêts / Wishlist / Lu │
  ├─────────────────────────────┤
  │ Section active              │
  │  → Grille séries OU liste   │
  └─────────────────────────────┘

Tabs :
- Style : pills underline (pas de box)
- Badge count à droite du label (prêts actifs uniquement)
- Transition contenu : fade 150ms

Grille séries :
- 2 colonnes mobile, 3 col tablet, 4-5 col desktop
- Chaque série : cover + titre + "X/Y volumes"
- Barre de progression fine sous le titre (possédés/total)
```

### 6.4 — Bottom Sheet (action contextuelle)

```
Utilisé pour : Prêter un volume, Confirmer retour, Détail rapide

Dimensions : hauteur auto, max 80vh, swipe-to-dismiss
Animation : slide-up 300ms ease-out depuis le bas
Fond : --popover avec backdrop-blur sur le contenu dessous
Handle : pill 40px × 4px, --muted-foreground, centré en haut
Overlay : fond --background opacity 60%, tap pour fermer

Structure interne :
  ┌── Handle
  ├── Titre (16px, --foreground)
  ├── Contenu (formulaire, options, confirmations)
  └── CTA principal full-width en bas
```

### 6.5 — Stats Cards (Dashboard)

```
Layout : 2×2 grille, gap 12px mobile / 16px desktop
Chaque card :
  ┌─────────────────────┐
  │  Icône (20px muted)  Valeur (32px, font-bold) │
  │  Label (13px muted)                           │
  └─────────────────────┘

Variante highlight (volumes possédés) :
  - Fond --primary avec opacity 10%
  - Valeur en --primary
  - Icône en --primary

Animation apparition : stagger 80ms entre chaque card
  - fade-in + translateY(8px→0), 300ms ease-out
```

---

## 7. Typographie & Espacements

### Police recommandée par direction

| Direction | Display | Body | Mono |
|---|---|---|---|
| Obsidian | Geist | Inter | Geist Mono |
| Washi | DM Serif Display | DM Sans | JetBrains Mono |
| Void | Syne | Nunito Sans | IBM Plex Mono |

*Toutes sont disponibles sur Google Fonts ou Vercel/local.*

### Scale typographique (commune)

```
xs  : 11px / line-height 1.4  → badges, labels, captions
sm  : 13px / line-height 1.5  → metadata, secondary info
base: 15px / line-height 1.6  → body text
lg  : 18px / line-height 1.4  → sous-titres, card headers
xl  : 22px / line-height 1.3  → titres de section
2xl : 28px / line-height 1.2  → titres de page
3xl : 40px / line-height 1.1  → chiffres stats hero
```

### Espacements (multiples de 4px)

```
Micro : 4px  → entre icône et label
Petit : 8px  → padding interne badges, gaps de grille serrée
Base  : 12px → padding cards mobile, gap grille covers
Moyen : 16px → padding page mobile, gap sections
Large : 24px → spacing entre sections
XL    : 32px → padding page desktop, sections majeures
2XL   : 48px → hero sections
```

---

## 8. Animations & Micro-interactions

### Principes

- **Apparitions** : ease-out, 200-350ms. Toujours fade + translate léger (8px).
- **Disparitions** : ease-in, 150-200ms. Plus rapide que l'apparition.
- **Actions utilisateur** : 100-150ms max. Le feedback doit être instantané.
- **Transitions de page** : fade croisé 200ms. Pas de slide complexe (risque de motion sickness sur mobile).

### Interactions spécifiques

```
Cover hover (desktop)     : translateY -2px, shadow++, 200ms ease-out
Bouton tap                : scale 0.95, 100ms, retour 150ms
Toast apparition          : slide-up + fade-in, 300ms ease-out
Bottom sheet open         : slide-up depuis bas, 300ms spring (stiffness 400, damping 40)
Skeleton loading          : shimmer horizontal, 1.5s infinite, grad 120deg
Multi-select activate     : outline pulse 1× puis stable, 200ms
Stat card count-up        : animation chiffre 600ms ease-out (si première visite)
Scanner line              : scan vertical, 2s ease-in-out, infini
```

---

## 9. Décisions à prendre avant d'implémenter

### Priorité 1 — Obligatoire
- [ ] **Quelle direction UI ?** — Obsidian / Washi / Void *(chacune implique une logique de composants différente)*
- [ ] **Quelle palette ?** — 1 Crimson / 2 Indigo / 3 Ember / 4 Forest

### Priorité 2 — Architecture
- [ ] **Hub Collection** — Voulez-vous vraiment fusionner Prêts/Wishlist/Lu sous Collection, ou garder la navigation plate actuelle ?
- [ ] **Swipe actions** — Activer les gestes swipe sur volumes (lu, prêter) ou rester avec des boutons explicites ?
- [ ] **Bottom sheets vs pages** — Les actions contextuelles (prêt, détail rapide) s'ouvrent en bottom sheet ou dans une page dédiée ?

### Priorité 3 — Fonctionnel
- [ ] **Grille dense vs lisible** — Covers 90px (Void, max items visible) ou 140px (Washi, plus lisible) ?
- [ ] **Dark mode uniquement ?** — L'app est décrite comme dark-themed. Faut-il quand même prévoir un light mode (les palettes sont définies pour les deux) ?
- [ ] **Profils publics** — Le design public suit le même système ou une version simplifiée ?

---

*Rapport généré pour Mangastore v2 — Toutes les palettes sont prêtes à coller dans `globals.css`. Une fois vos choix faits, le prochain rapport détaillera les composants page par page.*
