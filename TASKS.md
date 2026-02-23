# Suivi du Projet - Tâches et Progression (TASKS.md)

Ce document sert de backlog et de suivi de progression pour le développement de l'application de Mangathèque. 
**Règle d'or :** Une seule sous-tâche doit être implémentée à la fois, suivie d'un test manuel et d'une validation par l'utilisateur réel avant de passer à la suivante.

Le but est d'y aller par incréments (MVP d'abord).

---

## 🎯 Phase 1 : Initialisation (MVP V0)

### Étape 1 : Setup des Dépôts
- [x] Initialiser le projet Backend `laravel-api` (Laravel 12).
- [x] Configurer la connexion à la base de données Supabase (PostgreSQL) dans le `.env`.
- [x] Installer et configurer Laravel Pint, PestPHP et Telescope.
- [x] Mettre en place la CI GitHub Actions de base pour le Backend (Tests & Pint).
- [x] Initialiser le projet Frontend `pwa-client` (Next.js, Tailwind, TypeScript).
- [x] Installer shadcn/ui et initialiser la configuration de base.

---

## 🔐 Phase 2 : Authentification (L'Utilisateur)

### Étape 2 : Backend - Auth API
- [x] Mettre en place le modèle `User` (Migration, Factory, Seeder).
- [x] Créer l'endpoint API Registration (Route, Controller, Request, Action, DTO, JsonResource).
- [x] Créer le test d'intégration Pest pour l'Inscription (Registration).
- [x] Créer le fichier `http-tests/auth/register.http`.
- [x] Créer l'endpoint API Login (Sanctum Token creation).
- [x] Créer le test d'intégration Pest pour la Connexion (Login).
- [x] Créer le fichier `http-tests/auth/login.http`.
- [x] Créer l'endpoint API Logout (Sanctum Token revocation).
- [x] Créer le test d'intégration Pest pour la Déconnexion (Logout).
- [x] Créer le fichier `http-tests/auth/logout.http`.
### Étape 3 : Frontend - Auth UI
- [x] Configurer la gestion du state d'authentification (Context, Zustand ou server-side cookies).
- [x] Développer la page UI / Composant : Formulaire d'inscription.
- [x] Intégrer l'appel API (fetch/axios) pour l'inscription.
- [x] Développer la page UI / Composant : Formulaire de connexion.
- [x] Intégrer l'appel API pour la connexion (stockage token).
- [x] Gérer la redirection et la protection des routes privées.

---

## 📚 Phase 3 : Le Cœur Métier - Recherche de Mangas

### Étape 4 : Backend - Manga Domain & Externe API
- [x] Créer le Bounded Context `Manga` (Dossiers `Application/`, `Domain/`, `Infrastructure/`).
- [x] Créer l'infrastructure : Service `MangaLookupService` (Google Books API ou MangaDex).
- [x] Créer l'endpoint API de recherche globale (par Titre ou ISBN) sans stockage BDD.
- [x] Créer le test d'intégration Pest pour la recherche de manga. (mock Google Books API)
- [x] Créer le fichier `http-tests/manga/search.http`.

### Étape 5 : Frontend - Recherche UI
- [x] Créer la barre de recherche textuelle globale (Composant UI).
- [x] Intégrer l'appel API pour la recherche.
- [x] Afficher les résultats sous forme de liste/grille de cartes (Couverture, Titre).

---

## 🗂 Phase 4 : La Mangathèque de l'Utilisateur (La Collection)

### Étape 6 : Backend - Ajout à la collection
- [x] Créer les Modèles et Migrations pour le Domaine `Manga` (`mangas`, table pivot `user_manga`).
- [x] Créer le test d'intégration pour l'ajout d'un manga à la collection (Scan ou manuel).
- [x] Créer l'Action `AddScannedMangaAction` (DDD) avec gestion DB Transaction et Création si inexistant.
- [x] Créer le test unitaire/intégration pour le Domain Event `MangaAddedToCollection` (si utilisé).
- [x] Créer l'endpoint API pour ajouter un Manga avec son fichier `.http`.
- [x] Créer l'endpoint API pour lister les mangas possédés par l'utilisateur authentifié.

### Étape 7 : Frontend - Vues Séries, Éditions et Volumes
- [x] Créer le bouton "Ajouter à ma collection" depuis les résultats de recherche.
- [x] Intégrer l'appel API pour ajouter l'œuvre.
- [x] Créer la page principale Collection affichant la liste des Séries possédées.
- [x] Créer la Vue Série (au clic sur une série) :
  - Afficher les éditions possédées pour cette série.
  - Ajouter une barre de progression d'obtention et le ratio (ex: 45 / 65 tomes).
  - Ajouter un bouton pour ajouter l'édition complète (tous les volumes) d'un coup.
- [x] Créer la Vue Édition (au clic sur une édition) :
  - Afficher tous les tomes (volumes) de l'édition.
  - Différencier visuellement les tomes acquis et manquants (image en noir et blanc pour les manquants).
  - Ajouter un système de multisélection pour ajouter facilement plusieurs tomes acquis.
- [x] Écrire le test d'intégration E2E (Playwright) validant la navigation Séries -> Éditions et l'ajout multiple.

---

## 📱 Phase 5 : Fonctionnalités Avancées (PWA & Mobile)

### Étape 8 : Scan Code-barres
- [x] Intégrer une librairie JS de lecture de code-barres.
- [x] Créer une vue optimisée mobile pour le scan à la chaîne.
- [x] Finaliser l'envoi groupé des ISBN vers l'API.

### Étape 9 : Offline & PWA
- [x] Configurer les manifestes PWA sur Next.js.
- [x] Configurer les Service Workers pour cacher les requêtes GET (liste de mangas).
- [x] Gérer l'état `navigator.onLine` et désactiver les boutons d'ajout si offline.

---

## 📖 Phase 6 : Emprunts, Souhaits et Visibilité

### Étape 10 : Gestion des Prêts
- [ ] Backend : Modélisation et endpoints pour définir un manga comme "Prêté à [Nom]".
- [ ] Frontend : Onglet dédié aux Prêts et interface de déclaration de prêt / rendu.

### Étape 11 : Liste de Souhaits
- [ ] Backend : Endpoint API pour ajouter à la Wishlist.
- [ ] Frontend : Interface Wishlist et bouton "Ajout Souhait" depuis la recherche.

### Étape 12 : Visibilité publique (Profils)
- [ ] Backend : Migration préférences utilisateur (Toggles visibilité).
- [ ] Backend : Endpoints pour mettre à jour les Settings et récupérer un profil public "anonyme".
- [ ] Frontend : Page des Paramètres de confidentialité.
- [ ] Frontend : Page Profil Publique (`/user/leoelmy/collection`).

---

**Historique des Actions (Mini-rapports) :**
- **Phase 1, Étape 1 terminée :** Création des dossiers `laravel-api` (avec la config db pour PostgreSQL, Telescope, Pest, Pint) et `pwa-client` (Next.js 15, Tailwind v4, shadcn/ui), et configuration d'une Github Action de base (`.github/workflows/backend-ci.yml`). Prêt pour validation utilisateur.
- **Phase 2, Étape 2 (Login) terminée :** Mise en place de `LoginAction`, `LoginDTO`, `LoginRequest`, et mise à jour de `AuthController` avec tests Pest et fichier `.http`.
- **Phase 2, Étape 2 (Logout) terminée :** Mise en place de `LogoutAction`, mise à jour de `AuthController`, `UserRepositoryInterface` et `EloquentUserRepository` pour la révocation des tokens.
- **Phase 2, Étape 3 (Inscription UI) terminée :** Création de la page d'inscription (`/register`) avec validation Zod et design moderne utilisant shadcn/ui.
- **Phase 2, Étape 3 (Inscription API) terminée :** Intégration de l'appel API avec Axios, gestion du token d'authentification via le `AuthContext` et redirection vers une page d'accueil personnalisée. Migration des tokens Sanctum exécutée sur le backend.
- **Phase 2, Étape 3 (Connexion UI & API) terminée :** Création de la page de connexion (`/login`) avec validation Zod et design moderne utilisant shadcn/ui. Intégration de l'appel API et gestion du stockage du token via `AuthContext`.
- **Phase 2, Étape 3 (Protection des Routes) terminée :** Mise en place d'un composant `AuthGuard` et de layouts spécifiques (`(auth)` et `(protected)`) pour gérer la redirection automatique et la protection des pages privées. Création d'un tableau de bord de test sous `/dashboard`.
- [x] Initialiser Playwright dans pwa-client
- [x] Ajouter Playwright dans la CI GitHub Actions
- [x] Ajouter les tests de base pour Login et Register avec Playwright
- **Phase 2, Étape 3 (Tests End-to-End) terminée :** Initialisation de Playwright configuré pour la PWA Next.js, ajout à la CI Github Actions via un workflow Playwright spécifique. Création des tests E2E pour les pages de connexion (`/login`) et d'inscription (`/register`).
- **Phase 3, Étape 5 (Recherche UI) terminée :** Création d'une page de recherche avec barre de recherche et grille de résultats. Mise en place d'une navigation globale avec un composant `Shell` pour toutes les pages protégées. Ajout de tests E2E Playwright pour le flux de recherche.
- **Phase 4, Étape 6 (Ajout à la collection Backend) terminée :** Mise en place du domaine Manga complet (Modèles, Repositories, Actions). Création des endpoints pour ajouter (via API ID ou Scan ISBN) et lister la collection. Intégration de domain events et tests Pest complets.
- **Phase 4, Étape 7 (Gestion de la collection Frontend) terminée :** Implémentation du bouton "Ajouter à ma collection" dans les résultats de recherche, intégration de l'API avec toasts de notification (Sonner), et mise à jour du Dashboard pour afficher dynamiquement le nombre de mangas et les dernières acquisitions. Création des pages "Vue Série" et "Vue Édition" avec barre de progression de complétion, ainsi qu'un système de multisélection pour ajouter rapidement les tomes manquants via le nouvel endpoint bulkApi. Ajout d'un test E2E Playwright de la navigation et modification de la base de données.
- **Phase 5, Étape 8 (Scan Code-barres) terminée :** Intégration de la librairie `html5-qrcode` et création d'un composant de scan optimisé pour mobile. Ajout d'une nouvelle page UI (`/scan`) pour le scan à la chaîne de plusieurs codes-barres en continu. Création de l'endpoint API backend (`/mangas/scan-bulk`) pour gérer l'envoi groupé des ISBNs et les ajouter à la collection en une seule requête.
- **Phase 5, Étape 9 (Offline & PWA) terminée :** Configuration du manifest PWA et des Service Workers via `@ducanh2912/next-pwa`. Mise en place d'un `OfflineProvider` et d'un hook `useOffline` pour détecter l'état de la connexion. Désactivation visuelle et fonctionnelle de tous les boutons d'écriture (ajout, retrait, bulk add, scan) en mode hors ligne avec notifications Toast explicites.