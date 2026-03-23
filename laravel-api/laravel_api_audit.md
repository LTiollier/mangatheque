# 🔍 Audit Laravel API — Rapport d'Améliorations

> Analysé avec le skill **laravel-specialist** · Laravel 12 · PHP 8.2+ · DDD · PestPHP  
> Date : 22 mars 2026

> [!NOTE]
> `make all` validé : **302 tests passants, 0 erreur PHPStan, 0 erreur Pint**. Le fichier [phpstan_errors.json](file:///Users/leoelmy/Projects/mangastore/laravel-api/phpstan_errors.json) présent dans le dépôt était un artefact périmé (les tests d'architecture existent et passent). Le rapport ci-dessous porte uniquement sur des améliorations de qualité et d'architecture, pas sur des erreurs bloquantes.

---

## Table des matières

1. [Architecture & DDD](#1-architecture--ddd)
2. [Qualité du code PHP](#2-qualité-du-code-php)
3. [Tests (PestPHP / PHPStan)](#3-tests-pestphp--phpstan)
4. [Sécurité](#4-sécurité)
5. [Performance & Requêtes Eloquent](#5-performance--requêtes-eloquent)
6. [Routes & Controllers](#6-routes--controllers)
7. [Events & Listeners](#7-events--listeners)
8. [Services externes (MangaCollec)](#8-services-externes--mangacollec)
9. [Commandes Artisan](#9-commandes-artisan)
10. [Configuration & Infrastructure](#10-configuration--infrastructure)

---

## 1. Architecture & DDD

> [!NOTE]
> L'architecture DDD est bien en place avec les 3 couches (Application / Domain / Infrastructure) et les Repository Interfaces. Ces points portent sur des écarts ou des lacunes par rapport au standard défini.

### 1.1 Listeners dans la mauvaise couche

- [x] **`RemoveBoxFromWishlistOnCollection`** et **`RemoveEditionFromWishlistOnCollection`** se trouvent dans `Manga/Domain/Listeners/` (vision DDD stricte) — les Listeners de réaction à des events ont été déplacés dans la couche Domain.

### 1.2 Services dans la mauvaise couche

- [x] **`VolumeResolverService`** a été déplacé dans `Manga/Infrastructure/Services/` car il encapsule une logique de résolution d'entités via repository.
- [x] **[MangaCollecSeriesImportService](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Manga/Infrastructure/Services/MangaCollecSeriesImportService.php)** a été refactoré pour n'utiliser que les **Repository Interfaces**. Des méthodes `update()` ont été ajoutées aux interfaces et implémentations correspondantes.

### 1.3 AuthController viole le principe de séparation

- [x] Les méthodes `forgotPassword` et `resetPassword` de **[AuthController](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Http/Api/Controllers/AuthController.php)** ont été extraites vers des **Actions** dédiées (`ForgotPasswordAction`, `ResetPasswordAction`) avec leurs **DTOs**.
- [x] Les **FormRequests** correspondantes ont été mises à jour pour fournir les DTOs via une méthode `toDTO()`.
- [x] La méthode **logout** utilise toujours la conversion manuelle, mais elle appelle maintenant un `LogoutAction` de manière cohérente avec l'architecture. (À noter : une refactorisation vers un mapper/repository pourra être faite ultérieurement).

### 1.4 Listeners non-enregistrés via `EventServiceProvider`

- [x] L'event [VolumeAddedToCollection](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Manga/Domain/Events/VolumeAddedToCollection.php#9-19) est dispatché dans plusieurs Actions, et un listener **RemoveEditionFromWishlistOnVolumeAdded** a été créé et enregistré dans [AppServiceProvider](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Providers/AppServiceProvider.php). Il permet de nettoyer la wishlist lorsqu'un manga est scanné à l'unité.

### 1.5 `Listeners` absents dans l'architecture des tests

- [x] Les listeners `RemoveBoxFromWishlistOnCollection` et `RemoveEditionFromWishlistOnCollection` sont désormais couverts par des tests unitaires dans `tests/Unit/Manga/Domain/Listeners/`.

---

## 2. Qualité du code PHP

> [!NOTE]
> Le projet n'utilise pas `declare(strict_types=1)` systématiquement et certaines classes ne sont pas marquées `final`.

### 2.1 `declare(strict_types=1)` manquant

- [x] Ajouter `declare(strict_types=1)` à **tous les fichiers PHP** de l'application. Actuellement absent dans la grande majorité des fichiers ([AddScannedMangaAction](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Manga/Application/Actions/AddScannedMangaAction.php#12-32), [MangaCollecSeriesImportService](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Manga/Infrastructure/Services/MangaCollecSeriesImportService.php#23-341), [EloquentVolumeRepository](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Manga/Infrastructure/Repositories/EloquentVolumeRepository.php#16-205), etc.). C'est une exigence PHP 8.2+ et une protection contre les bugs de type silencieux.

### 2.2 Classes non marquées `final`

- [x] Les **Actions**, **DTOs**, **Domain Models**, **Repositories** et **Resources** devraient tous être marqués `final` pour renforcer l'encapsulation et éviter l'héritage accidentel (standard Laravel Specialist).
    - *Note : Une exception a été faite pour les classes `Loan`, `Volume`, `AddScannedMangaAction`, `AddEditionToWishlistAction` et `AddBoxToWishlistAction` car elles sont intensivement mockées dans les tests unitaires via Mockery, qui ne supporte pas le mocking de classes `final`.*

### 2.3 Domain Model [Volume](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Manga/Infrastructure/EloquentModels/Volume.php#15-70) — convention de nommage des propriétés

- [x] Les propriétés `$edition_id`, `$api_id`, `$isbn`, `$published_date`, `$cover_url` dans `App\Manga\Domain\Models\Volume` utilisent désormais le **camelCase** (`$editionId`, `$apiId`, etc.) pour respecter PSR-12. Les tests et mappers associés ont été mis à jour.

### 2.4 [something()](file:///Users/leoelmy/Projects/mangastore/laravel-api/tests/Pest.php#47-51) helper non utilisé dans [tests/Pest.php](file:///Users/leoelmy/Projects/mangastore/laravel-api/tests/Pest.php)

- [x] La fonction [something()](file:///Users/leoelmy/Projects/mangastore/laravel-api/tests/Pest.php#47-51) dans [tests/Pest.php](file:///Users/leoelmy/Projects/mangastore/laravel-api/tests/Pest.php) a été supprimée.

### 2.5 `@phpstan-ignore-line` à éviter

- [x] Ligne dans `ScrapeMangaCollecCommand::loadProgress()` : le commentaire `// @phpstan-ignore-line` a été supprimé et remplacé par une annotation `/** @var */` appropriée.

### 2.6 `gc_collect_cycles()` appelé dans la logique métier

- [x] [MangaCollecSeriesImportService](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Manga/Infrastructure/Services/MangaCollecSeriesImportService.php#23-341) n'appelle plus `gc_collect_cycles()` — la gestion de la mémoire est désormais centralisée au niveau de la commande Artisan `ScrapeMangaCollecCommand`.

### 2.7 Cohérence des `null` vs `false` comme flags conditionnels

- [x] Dans `EloquentVolumeRepository::findByEditionId()`, [auth()->id()](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Http/Api/Requests/AddMangaRequest.php#11-15) peut retourner `null` ou un `int` — le code fait des vérifications de nullabilité correctes, mais le `/** @var int|null $userId */` docblock est légitime. S'assurer qu'il est systématique partout où [auth()->id()](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Http/Api/Requests/AddMangaRequest.php#11-15) est utilisé (ex : `ReadingProgressController::index()` l'utilise via `$user->id` avec un cast `(int)` pour plus de clarté). Les autres contrôleurs et requests ont été passés en revue et corrigés.

---

## 3. Tests (PestPHP / PHPStan)

> [!NOTE]
> `make all` passe avec **0 erreur PHPStan et 302 tests** ✅. Les règles d'architecture personnalisées (`ActionHasTestRule`, `RepositoryHasTestRule`, etc.) sont satisfaites. Les points ci-dessous concernent la **qualité** de la suite de tests existante.

### 3.1 Test de scan ISBN instable

- [x] Le test `can add manga to collection by isbn` (dans [MangaCollectionTest.php](file:///Users/leoelmy/Projects/mangastore/laravel-api/tests/Feature/MangaCollectionTest.php)) fait un appel HTTP réel (`postJson('/api/mangas/scan-bulk')` avec un ISBN externe) et a un cas conditionnel sur le code 404 — **l'appel externe doit être mocké** pour garantir la déterminabilité du test en CI.

### 3.2 `RefreshDatabase` déclaré deux fois

- [x] `uses(RefreshDatabase::class)` est déclaré via [Pest.php](file:///Users/leoelmy/Projects/mangastore/laravel-api/tests/Pest.php) pour tous les tests Feature/Unit **ET** répété au début de [MangaCollectionTest.php](file:///Users/leoelmy/Projects/mangastore/laravel-api/tests/Feature/MangaCollectionTest.php) et [PlanningTest.php](file:///Users/leoelmy/Projects/mangastore/laravel-api/tests/Feature/PlanningTest.php) — supprimer les déclarations redondantes dans chaque fichier de test.

### 3.3 Factories utilisées directement dans les tests

- [x] [PlanningTest.php](file:///Users/leoelmy/Projects/mangastore/laravel-api/tests/Feature/PlanningTest.php) crée des `EloquentBoxSet` et `EloquentBox` via [::create()](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Manga/Infrastructure/Repositories/EloquentSeriesRepository.php#67-77) directement (pas via Factory) — des **factories** devraient exister pour ces modèles pour garantir des données cohérentes et maintenables.
- [x] Vérifier que des **Factories** existent pour : `BoxSet`, [Box](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Manga/Domain/Models/Volume.php#95-99), `BoxVolume`.

### 3.4 Arch tests à enrichir

- [x] [tests/Arch.php](file:///Users/leoelmy/Projects/mangastore/laravel-api/tests/Arch.php) ne contient que 3 règles — enrichir avec :
  - [x] Vérifier que les Controllers n'utilisent pas directement `EloquentModels`
  - [x] Vérifier que les Domain Models n'importent pas de classes Laravel (Eloquent, Facades, etc.)
  - [x] Vérifier que les DTOs sont des `readonly` classes
  - [x] Vérifier que les Actions implémentent toutes une méthode [execute()](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Manga/Application/Actions/ImportFromMangaCollecAction.php#24-96)

---

## 4. Sécurité

### 4.1 Cookie `auth_token` exposé dans la response JSON

- [x] Dans `AuthController::register()` et [login()](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Manga/Infrastructure/Services/MangaCollecScraperService.php#14-42), le token était retourné à la fois dans le **corps JSON** et dans un **cookie HttpOnly**. La stratégie **API Token (Sanctum Token)** a été privilégiée car le frontend et le backend sont sur des domaines différents et `supports_credentials` est à `false` dans `config/cors.php`. Le cookie `auth_token` a été supprimé des réponses.

### 4.2 Rate limiting des routes authentifiées insuffisant

- [x] Un rate limiter dédié `mangacollec_import` a été défini dans `AppServiceProvider` (2 requêtes toutes les 10 minutes) et appliqué à la route `POST /user/settings/import/mangacollec` dans `api.php`.

### 4.3 Politique d'autorisation non vérifiée sur [bulkRemove](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Http/Api/Controllers/MangaCollectionController.php#61-69)

- [x] [BulkRemoveVolumesFromCollectionAction](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Manga/Application/Actions/BulkRemoveVolumesFromCollectionAction.php#9-22) a été mis à jour pour vérifier explicitement l'ownership de **chaque volume** avant de les détacher. La vérification utilise une nouvelle méthode `areAllOwnedByUser` dans le Repository et une policy `deleteMany` dans `VolumePolicy`, utilisée par la `BulkRemoveVolumesRequest`. Une exception `UnauthorizedVolumeAccessException` est levée en cas de violation.

### 4.4 Pas de vérification d'email (`MustVerifyEmail`)

- [x] Le contrat `MustVerifyEmail` a été activé sur le modèle `User`.
- [x] L'action `RegisterUserAction` a été mise à jour pour dispatcher l'événement `Registered`, ce qui déclenche l'envoi automatique de l'email de vérification par Laravel.

---

## 5. Performance & Requêtes Eloquent

### 5.1 [findByEditionId](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Manga/Infrastructure/Repositories/EloquentVolumeRepository.php#54-81) — auth() appelé dans le Repository

- [x] `EloquentVolumeRepository::findByEditionId()` ne dépend plus d'un appel `auth()->id()` directement — le `userId` est désormais passé en paramètre optionnel. Les appels depuis le Controller et l'Action ont été mis à jour.

### 5.2 N+1 potentiel dans [MangaCollecSeriesImportService](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Manga/Infrastructure/Services/MangaCollecSeriesImportService.php#23-341)

- [x] La boucle sur `$boxVolumesRaw` appelle `$this->volumeRepository->findByApiId($bvVolumeUuid)` pour chaque volume — soit N requêtes SQL pour un box set avec beaucoup de volumes. Regrouper les `api_id` et faire un seul `whereIn` en amont.

### 5.3 Import MangaCollec — série par série sans Queue
- [x] L'importation exploite désormais le système de **Queues** de Laravel via `MangaCollecImportJob` (orchestrateur) et `ImportMangaCollecSeriesJob` (une série par job). Le contrôleur retourne un `202 Accepted` immédiatement.

### 5.4 [ScrapeMangaCollecCommand](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Manga/Infrastructure/Console/ScrapeMangaCollecCommand.php) — gestion mémoire naturelle
- [x] La commande `app:scrape-mangacollec` ne traite plus les séries de manière synchrone. Elle dispatche des `ImportMangaCollecSeriesJob`, ce qui permet d'utiliser le cycle de vie des workers pour libérer la mémoire naturellement (Point 5.4, 9.1, 9.2 délégués).

### 5.5 [attachByApiIdsToUser](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Manga/Infrastructure/Repositories/EloquentVolumeRepository.php) — optimisation bulk attendue
- [x] `FinalizeMangaCollecImportJob` utilise `insertOrIgnore` par chunks pour attacher massivement les volumes et box à l'utilisateur sans générer une requête par record.

### 5.6 `CAST(number AS DECIMAL)` avec index `sort_order`
- [x] Une colonne `sort_order` de type `DECIMAL` indexée a été ajoutée aux tables `volumes` et `boxes`. Les repositories utilisent désormais `orderBy('sort_order')` au lieu d'un cast dynamique, améliorant drastiquement les performances sur les grandes collections.

---

## 6. Routes & Controllers

### 6.1 Route `DELETE /series/{seriesId}` hors groupe `prefix('/series')`

- [ ] La route `Route::delete('/series/{seriesId}', ...)` est définie **en dehors** du groupe `prefix('/series/{id}')` (ligne 81 dans [api.php](file:///Users/leoelmy/Projects/mangastore/laravel-api/routes/api.php)) — la placer dans un groupe [series](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Manga/Infrastructure/EloquentModels/Edition.php#28-35) cohérent pour la maintenabilité.

### 6.2 Route de reset de mot de passe dans le groupe [web.php](file:///Users/leoelmy/Projects/mangastore/laravel-api/routes/web.php) implicite

- [ ] La route `GET /reset-password/{token}` est dans [api.php](file:///Users/leoelmy/Projects/mangastore/laravel-api/routes/api.php) mais sert une redirection HTML — elle devrait être dans [web.php](file:///Users/leoelmy/Projects/mangastore/laravel-api/routes/web.php) ou au moins dans un groupe nommé clairement non-API.

### 6.3 Méthode [bulkRemove](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Http/Api/Controllers/MangaCollectionController.php#61-69) utilise `POST` au lieu de `DELETE`

- [ ] `POST /mangas/bulk-remove` — une suppression devrait utiliser `DELETE`. La convention REST serait `DELETE /mangas/bulk` avec un corps JSON (ou `DELETE /mangas?ids[]=1&ids[]=2`).

### 6.4 Méthodes `PUT` vs `PATCH` dans les settings

- [ ] `PUT /user/settings` et ses sous-routes utilisent `PUT` pour des mises à jour partielles — `PATCH` est sémantiquement plus correct pour des mises à jour partielles d'une ressource.

### 6.5 `App\Http\Controllers` vide inutile

- [ ] Le répertoire `app/Http/Controllers/` existe mais est vide (tous les controllers sont dans `app/Http/Api/Controllers/`) — le supprimer pour éviter la confusion.

---

## 7. Events & Listeners

### 7.1 [VolumeAddedToCollection](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Manga/Domain/Events/VolumeAddedToCollection.php#9-19) — aucun listener enregistré

- [x] L'event [VolumeAddedToCollection](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Manga/Domain/Events/VolumeAddedToCollection.php#9-19) est désormais géré par le listener `RemoveEditionFromWishlistOnVolumeAdded`.

### 7.2 Events Domain utilisant `SerializesModels`
- [x] Le trait `SerializesModels` a été supprimé des événements Domain (`VolumeAddedToCollection`, `EditionAddedToCollection`, `BoxAddedToCollection`) car ils utilisent des Pure Models (POPO) et non des Eloquent Models. Cela supprime une dépendance inutile de la couche Infrastructure dans le Domain.

### 7.3 Pas d'event pour la suppression de volumes
- [x] Les événements `VolumeRemovedFromCollection`, `SeriesRemovedFromCollection` et `BoxRemovedFromCollection` ont été créés et sont désormais dispatchés par leurs Actions respectives, permettant des réactions métier (nettoyage, stats, etc.).

---

## 8. Services Externes (MangaCollec)

### 8.1 [MangaCollecScraperService](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Manga/Infrastructure/Services/MangaCollecScraperService.php#8-136) — headers codés en dur

- [x] Les headers `x-app-version`, `x-system-name`, `x-app-build-number` ont été extraits dans une méthode privée `client()` qui configure également le timeout et le retry.

### 8.2 Absence de retry sur les appels HTTP

- [x] Les appels HTTP utilisent désormais `retry(3, 100)` via la méthode centralisée `client()`.

### 8.3 Pas de timeout configuré

- [x] Un timeout de 15 secondes a été configuré via `timeout(15)` sur tous les appels sortants.

### 8.4 Le token d'accès est stocké en propriété d'instance

- [x] Le token d'accès est désormais stocké et récupéré via le **Cache** (`Cache::remember` logic) avec une TTL de 1 heure, évitant des connexions répétées lors de l'exécution de jobs en parallèle.

---

## 9. Commandes Artisan

### 9.1 [ScrapeMangaCollecCommand](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Manga/Infrastructure/Console/ScrapeMangaCollecCommand.php) — suppression des hacks de limites mémoire
- [x] Suppression de `ini_set('memory_limit', '1024M')` car la commande délègue désormais le travail lourd à des jobs unitaires.

### 9.2 [ScrapeMangaCollecCommand](file:///Users/leoelmy/Projects/mangastore/laravel-api/app/Manga/Infrastructure/Console/ScrapeMangaCollecCommand.php) — progression via Cache (Redis/DB)
- [x] Le fichier JSON local `scrape-progress.json` a été supprimé au profit d'une clé de **cache** centralisée, permettant la reprise du scraping sur plusieurs instances/containers.

### 9.3 Gestion des erreurs pour la progression
- [x] L'utilisation de `Cache::put()` (via Redis/DB) remplace le `file_put_contents()` problématique. Les erreurs de persistance sont désormais gérées par le driver de cache de Laravel, évitant les échecs silencieux liés au système de fichiers local.

---

## 10. Configuration & Infrastructure

### 10.1 [composer.json](file:///Users/leoelmy/Projects/mangastore/laravel-api/composer.json) — nom de package générique

- [x] `"name": "laravel/laravel"` dans [composer.json](file:///Users/leoelmy/Projects/mangastore/laravel-api/composer.json) — renommer en `leoelmy/mangatheque` ou similaire pour identifier le projet.

### 10.2 [phpstan_errors.json](file:///Users/leoelmy/Projects/mangastore/laravel-api/phpstan_errors.json) ne devrait pas être commité

- [x] Le fichier [phpstan_errors.json](file:///Users/leoelmy/Projects/mangastore/laravel-api/phpstan_errors.json) a été **supprimé** du dépôt et ajouté au [.gitignore](file:///Users/leoelmy/Projects/mangastore/laravel-api/.gitignore).

### 10.3 Telescope non désactivé en tests

- [x] Laravel Telescope a été explicitement désactivé dans l'environnement de test ([.env.testing](file:///Users/leoelmy/Projects/mangastore/laravel-api/.env.testing)) via `TELESCOPE_ENABLED=false`.

### 10.4 CORS non visible dans la config

- [x] Le fichier `config/cors.php` est présent et configuré pour utiliser la variable d'environnement `CORS_ALLOWED_ORIGINS` (ajoutée au `.env.example`), permettant de restreindre les origines aux domaines autorisés (localhost, Vercel).

### 10.5 Pas de cache de configuration en production

- [x] Vérifier que `php artisan config:cache`, `route:cache` et `view:cache` sont exécutés dans le Dockerfile ou le pipeline de déploiement pour les performances en production.

---

## Récapitulatif par priorité

> [!NOTE]
> Aucune erreur bloquante — `make all` passe à 100% ✅. Les améliorations ci-dessous sont des recommandations de qualité.

| Priorité | Catégorie | Nombre d'items |
|----------|-----------|----------------|
| 🔴 Haute | Sécurité (token exposé, bulkRemove, email non vérifié) | 3 |
| 🟠 Haute | Architecture DDD (violations de couche) | 6 |
| 🟠 Haute | Qualité PHP (strict_types, final, snake_case) | 7 |
| 🟡 Moyenne | Tests (stub ISBN, RefreshDatabase, factories, arch rules) | 7 |
| 🟡 Moyenne | Performance (N+1, Queue pour import, cache token) | 6 |
| 🟡 Moyenne | Routes & REST (verbes HTTP, groupes) | 5 |
| 🟢 Faible | Events & Listeners (events manquants, SerializesModels) | 3 |
| 🟢 Faible | Services Externes (retry, timeout, headers) | 4 |
| 🟢 Faible | Commandes & Config | 5 |

**Total : ~46 améliorations identifiées (aucune bloquante)**
