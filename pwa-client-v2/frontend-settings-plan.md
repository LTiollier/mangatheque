# Plan d'Action — Paramètres de Sécurité (Email & Mot de Passe)

Ce document détaille la stratégie et les étapes d'implémentation pour permettre aux utilisateurs de modifier leur email et leur mot de passe depuis les paramètres de l'application.

---

## 🧐 Audit & Stratégie UX (par @ux-expert)

Pour une application PWA moderne, la gestion des données sensibles doit être à la fois **accessible** et **sécurisée**.

### 1. Structure et Emplacement
*   **Contextualisation** : Enrichissement de la section "Compte" actuelle (plutôt que d'en créer une nouvelle), pour centraliser les informations personnelles.
*   **Progressive Disclosure** (Divulgation progressive) : Les formulaires de modification ne seront pas visibles par défaut. Utilisation d'un bouton "Modifier" pour l'email et "Changer" pour le mot de passe afin de garder l'interface épurée.

### 2. Sécurité et Friction Positive
*   **Validation du mot de passe actuel** : Requis pour toute modification d'email ou de mot de passe.
*   **Feedback Immédiat** : Utilisation de `sonner` (toasts) pour confirmer le succès ou expliquer précisément l'erreur (ex: "Mot de passe actuel incorrect").

---

## 🎨 Spécifications UI (par @ui-designer)

L'esthétique reste fidèle au design système actuel (glassmorphism léger, typographie "Outfit" pour le corps et mono pour les données).

### 1. Composant "Account Security"
*   **Transition** : Animation via `framer-motion` avec `layout` prop pour une expansion fluide de la carte lors de l'ouverture d'un formulaire.
*   **Inputs** : Utilisation des tokens CSS existants (`var(--input)`, `var(--border)`).
*   **Icônes** : `Mail` pour l'email et `Lock` pour le mot de passe (`lucide-react`).

### 2. États visuels
*   **Default** : Affichage statique de l'email + bouton outline discret.
*   **Editing** : Apparition du formulaire. État `loading` géré sur le bouton principal (spinner) pendant la mutation.

---

## 🛠 Plan d'Action Technique (Frontend)

### Étape 1 : Services et Hooks (Data Layer)
*   **`userService.ts`** : Ajouter les méthodes `updateEmail()` et `updatePassword()`.
*   **`queries.ts`** : Ajouter les hooks de mutation `useUpdateEmail` et `useUpdatePassword` (via TanStack Query).

### Étape 2 : Logique de Formulaire (Validation Layer)
*   Définir les schémas Zod :
    *   `emailUpdateSchema` : validation du format email + mot de passe actuel requis.
    *   `passwordUpdateSchema` : mot de passe actuel + nouveau mot de passe (min 8 car.) + confirmation.

### Étape 3 : Intégration UI (`SettingsClient.tsx`)
*   Refactoriser la section "Compte" de `SettingsClient.tsx`.
*   Ajouter les états `isEditingEmail` et `isEditingPassword`.
*   Implémenter les formulaires avec `react-hook-form`.
*   Ajouter les animations de transition.

---

> [!NOTE]
> **Dépendance Backend** : Ce plan nécessite que les endpoints Laravel correspondants soient implémentés dans `laravel-api`.
