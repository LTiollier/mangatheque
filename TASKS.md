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
- [ ] Créer le test d'intégration Pest pour l'Inscription (Registration).
- [ ] Créer l'endpoint API Registration (Route, Controller, Request, Action, DTO, JsonResource).
- [ ] Créer le fichier `http-tests/auth/register.http`.
- [ ] Créer le test d'intégration Pest pour la Connexion (Login).
- [ ] Créer l'endpoint API Login (Sanctum Token creation).
- [ ] Créer le fichier `http-tests/auth/login.http`.
- [ ] Créer l'endpoint API Logout (Sanctum Token revocation).

### Étape 3 : Frontend - Auth UI
- [ ] Configurer la gestion du state d'authentification (Context, Zustand ou server-side cookies).
- [ ] Développer la page UI / Composant : Formulaire d'inscription.
- [ ] Intégrer l'appel API (fetch/axios) pour l'inscription.
- [ ] Développer la page UI / Composant : Formulaire de connexion.
- [ ] Intégrer l'appel API pour la connexion (stockage token).
- [ ] Gérer la redirection et la protection des routes privées.

---

## 📚 Phase 3 : Le Cœur Métier - Recherche de Mangas

### Étape 4 : Backend - Manga Domain & Externe API
- [ ] Créer le Bounded Context `Manga` (Dossiers `Application/`, `Domain/`, `Infrastructure/`).
- [ ] Créer l'infrastructure : Service `MangaLookupService` (Google Books API ou MangaDex).
- [ ] Créer l'endpoint API de recherche globale (par Titre ou ISBN) sans stockage BDD.
- [ ] Créer le fichier `http-tests/manga/search.http`.

### Étape 5 : Frontend - Recherche UI
- [ ] Créer la barre de recherche textuelle globale (Composant UI).
- [ ] Intégrer l'appel API pour la recherche.
- [ ] Afficher les résultats sous forme de liste/grille de cartes (Couverture, Titre).

---

## 🗂 Phase 4 : La Mangathèque de l'Utilisateur (La Collection)

### Étape 6 : Backend - Ajout à la collection
- [ ] Créer les Modèles et Migrations pour le Domaine `Manga` (`mangas`, table pivot `user_manga`).
- [ ] Créer le test d'intégration pour l'ajout d'un manga à la collection (Scan ou manuel).
- [ ] Créer l'Action `AddScannedMangaAction` (DDD) avec gestion DB Transaction et Création si inexistant.
- [ ] Créer le test unitaire/intégration pour le Domain Event `MangaAddedToCollection` (si utilisé).
- [ ] Créer l'endpoint API pour ajouter un Manga avec son fichier `.http`.
- [ ] Créer l'endpoint API pour lister les mangas possédés par l'utilisateur authentifié.

### Étape 7 : Frontend - Gestion de la collection
- [ ] Créer le bouton "Ajouter à ma collection" depuis les résultats de recherche.
- [ ] Intégrer l'appel API pour ajouter l'œuvre.
- [ ] Créer la page principale (Dashboard) affichant la liste des mangas possédés.
- [ ] Ajouter un indicateur de complétion ("45/65", etc.) si la donnée externe le permet.

---

## 📱 Phase 5 : Fonctionnalités Avancées (PWA & Mobile)

### Étape 8 : Scan Code-barres
- [ ] Intégrer une librairie JS de lecture de code-barres (ex: `html5-qrcode`).
- [ ] Créer une vue optimisée mobile pour le scan à la chaîne.
- [ ] Finaliser l'envoi groupé des ISBN vers l'API.

### Étape 9 : Offline & PWA
- [ ] Configurer les manifestes PWA sur Next.js.
- [ ] Configurer les Service Workers pour cacher les requêtes GET (liste de mangas).
- [ ] Gérer l'état `navigator.onLine` et désactiver les boutons d'ajout si offline.

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
