# Documentation Technique & Architecture (AGENTS.md)

Ce fichier définit les choix technologiques de l'application de suivi de mangathèque, la structure globale, ainsi que les directives d'architecture pour le développement (règles à suivre par les agents IA et les développeurs).

## 1. Stack Technique Globale

### 1.1. Frontend (Client)
* **Framework de base :** React avec TypeScript.
* **Langue :** Interface utilisateur en français, mais l'ensemble du code de l'application (variables, fonctions, composants) sera rédigé en **anglais**.
* **Méta-framework & Bundler :** Next.js (Note : Si ViteJS est préféré pour un focus PWA sans SSR, cela est modifiable. Pour le moment, Next.js est retenu comme standard).
* **UI et Styling :** shadcn/ui et Tailwind CSS pour un design moderne.
* **PWA (Progressive Web App) et Mode Hors-ligne :**
* Mise en cache (Service Workers) des appels "GET" pour permettre la consultation hors-ligne des tomes, prêts et wishlist.
* En cas de déconnexion, blocage de l'interface graphique pour les actions d'écriture (POST, PUT, DELETE) avec affichage explicite ou boutons grisés.
* **Composants Spécifiques :**
* *Scan Code-Barres :* Intégration d'une bibliothèque capable de lire la caméra côté web (accessible sur mobile PWA).
* *Recherche Textuelle :* Barre de recherche globale.
* **Intégration d'Outils :** Support MCP (Model Context Protocol).

### 1.2. Backend (API & Logique Métier)
* **Framework :** Laravel 12. L'application agit entièrement en tant qu'API RESTful.
* **Langue :** Le code sera écrit en **anglais** uniquement (classes, variables, exceptions).
* **Base de Données :** PostgreSQL déployé via **Supabase**. Identifiants classiques dans le `.env` de Laravel.
* **Authentification :** **Laravel Sanctum** (moteur natif de Laravel).
* **Formatage des Réponses API :** Utilisation stricte des **API Resources** (`JsonResource`) de Laravel.
* **Fichiers .http (JetBrains) :** Chaque endpoint de l'API doit posséder son propre fichier `.http` pour faciliter les tests et l'utilisation. Ces fichiers seront regroupés dans un dossier dédié (ex: `http-tests/`) à la racine du projet.
* **Debugging & Monitoring :** Utilisation de **Laravel Telescope** en environnement local.

### 1.3. Infrastructure, CI/CD et Qualité
* **Hébergement du Code :** GitHub.
* **Intégration Continue (CI) :** GitHub Actions (tests, linting).
* **Hébergement & Déploiement :** Vercel (Frontend Next.js).
* **Qualité et Formatage de Code :** Utilisation de **Laravel Pint**. La CI bloquera tout code mal formaté.

---

## 2. Architecture Logicielle : Domain-Driven Design (DDD)

Pour maintenir un code robuste, orienté métier, tout en profitant de la puissance et des facilités de Laravel (ORM Eloquent, Events, Queues), nous adoptons une architecture **DDD**. 
L'idée est de regrouper le code par "Domaine" (Bounded Contexts) plutôt que par type de fichier (Controllers, Models séparés).

### Principes de Base :
1.**Bounded Contexts :** Le code est séparé par contexte (Ex: `Manga`, `User`, `Borrowing`) directement dans le dossier `app/`. Chaque Bounded Context possède 3 couches strictes : `Application`, `Domain`, et `Infrastructure`.
2.**Couche Application (Orchestration) :** Elle contient les `Actions` (cas d'usages) et les `DTOs`. Elle orchestre le flux sans contenir de logique métier pure.
3.**Couche Domaine (Cœur métier) :** Contient les `Models` (Entités métiers pures, **sans** dépendre d'Eloquent), les interfaces de `Repositories`, les `Events` (Domain Events) et les `Exceptions` spécifiques.
4.**Couche Infrastructure :** Contient l'implémentation technique propre au contexte (ex: Modèles Eloquent pour interagir avec la DB, implémentations des Repositories, un service appelant une API externe).
5.  **Domain Events :** Les changements d'états cruciaux lèvent des événements métiers. Ceux-ci sont capturés par des Listeners **Synchrones** (au sein d'une transaction DB) ou **Asynchrones** (via les Queues Laravel).

### 2.1. Structure Typique d'un Bounded Context (ex: Manga)

Le framework standard de Laravel est restructuré conceptuellement pour isoler les contextes avec leurs 3 couches internes :

```text
app/
├── Manga/                    # Bounded Context : Manga
│   ├── Application/          # Couche Application (Orchestration)
│   │   ├── Actions/          # Les Cas d'Usage (ex: AddScannedMangaAction)
│   │   └── DTOs/             # Objets stricts transportant les données (ex: ScanMangaDTO)
│   ├── Domain/               # Couche Domaine (Règles métiers et Modèles)
│   │   ├── Models/           # Modèles métiers purs (Entités sans Eloquent)
│   │   ├── Repositories/     # Interfaces des Repositories
│   │   ├── Events/           # Événements métiers (ex: MangaScanned)
│   │   ├── Listeners/        # Écouteurs du Domaine (ex: UpdateLibraryStatsListener)
│   │   └── Exceptions/       # Exceptions métier (ex: MangaNotFoundException)
│   └── Infrastructure/       # Couche Infrastructure
│       ├── EloquentModels/   # Modèles Eloquent (Modèles base de données purs)
│       ├── Repositories/     # Implémentations concrètes des Repositories (ex: EloquentMangaRepository)
│       └── Services/         # Classes appelant des APIs externes (ex: MangaLookupService)
├── Http/                     # Couche Présentation / API
│   ├── Api/
│   │   ├── Controllers/      # Interceptent les requêtes, fabriquent le DTO et appellent l'Action
│   │   ├── Requests/         # FormRequests Laravel pour validation basique
│   │   └── Resources/        # API Resources pour le formatage JSON
└── Providers/                # Inscriptions globales de Laravel
```

### 2.2. Exemples d'Implémentation DDD (Standard Attendu)

#### 1. Le DTO (Objet Typé pour transporter la donnée)
*Fichier : `app/Manga/Application/DTOs/ScanMangaDTO.php`*
```php
namespace App\Manga\Application\DTOs;

class ScanMangaDTO
{
    public function __construct(
        public readonly string $isbn,
        public readonly int $userId,
    ) {}
}
```

#### 2. L'Action (Couche Application) + Orchestration des Événements et Transactions
*Fichier : `app/Manga/Application/Actions/AddScannedMangaAction.php`*
L'Action orchestre le flux sans porter de logique entité. Si un Event synchrone échoue, la DB Rollback.
```php
namespace App\Manga\Application\Actions;

use App\Manga\Application\DTOs\ScanMangaDTO;
use App\Manga\Domain\Models\Manga;
use App\Manga\Domain\Repositories\MangaRepositoryInterface;
use App\Manga\Domain\Events\MangaAddedToCollection;
use App\Manga\Domain\Exceptions\MangaNotFoundException;
use App\Manga\Infrastructure\Services\MangaLookupService;
use Illuminate\Support\Facades\DB;

class AddScannedMangaAction
{
    public function __construct(
        private readonly MangaLookupService $lookupService,
        private readonly MangaRepositoryInterface $mangaRepository
    ) {}

    public function execute(ScanMangaDTO $dto): Manga
    {
        return DB::transaction(function () use ($dto) {
            
            // 1. Appel du Service (Infrastructure)
            $mangaData = $this->lookupService->findByIsbn($dto->isbn);
            if (!$mangaData) {
                throw new MangaNotFoundException("Manga not found for barcode: {$dto->isbn}");
            }

            // 2. Création ou récupération via Repository (Domaine ne connaît pas Eloquent)
            $manga = $this->mangaRepository->findByIsbnOrCreate(
                $dto->isbn, 
                $mangaData['title']
            );
            
            // 3. Liaison avec l'utilisateur via Repository
            $this->mangaRepository->attachToUser($manga->getId(), $dto->userId);

            // 4. Lancement du Domain Event (Synchrone ici)
            event(new MangaAddedToCollection($manga, $dto->userId));

            return $manga;
        });
    }
}
```

#### 3. Événement et Listeners (Synchrones vs Asynchrones)
* Event : *Fichier `app/Manga/Domain/Events/MangaAddedToCollection.php`*
* Listener Synchrone (S'exécute de suite / Bloque si erreur) :
  *Fichier `app/User/Domain/Listeners/IncrementUserMangaCountListener.php`*
* Listener Asynchrone :
  *Fichier `app/Manga/Domain/Listeners/FetchDetailedCoversListener.php`* (Implémente l'interface `ShouldQueue` de Laravel).

#### 4. Le Contrôleur (API / Couche Présentation)
*Fichier : `app/Http/Api/Controllers/MangaCollectionController.php`*
Il se contente de valider la requête, fabriquer le DTO, lancer l'action de la couche Application, et renvoyer la Ressource.
```php
namespace App\Http\Api\Controllers;

use App\Manga\Application\Actions\AddScannedMangaAction;
use App\Manga\Application\DTOs\ScanMangaDTO;
use App\Http\Api\Requests\ScanMangaRequest;
use App\Http\Api\Resources\MangaResource;

class MangaCollectionController
{
    public function store(ScanMangaRequest $request, AddScannedMangaAction $action)
    {
        // On construit le DTO avec des données strictes
        $dto = new ScanMangaDTO(
            isbn: $request->validated('isbn'),
            userId: auth()->id()
        );

        $manga = $action->execute($dto);

        return new MangaResource($manga);
    }
}
```

---

## 3. Qualité et Tests (PestPHP)

L'application maintient des standards stricts pour les tests automatisés :

*   **Framework :** Tous les tests seront écrits avec **PestPHP**.
*   **Couverture de code (Code Coverage) obligatoire :**
    *   **Domain :** 100% de couverture stricte sur les actions complexes et le code critique.
    *   **Infrastructure & Validation :** 95% minimum pour le reste de l'application.
*   **Jeux de Données et Seeders :**
    *   L'infrastructure de tests se base sur des **Seeders de Laravel** réalistes.
*   **Database Transactions :**
    *   Pour garantir des performances rapides, la base de données est construite au début des suites de tests. Chaque suite et chaque test unitaire utilise le trait `DatabaseTransactions` de PestPHP pour annuler (rollback) automatiquement les changements effectués sur l'état de la base.
*   **Intégration et Mocking :**
    *   Les Actions doivent être testées de bout en bout avec leurs Événements synchrones et l'insertion en BDD.
    *   Seules les APIs externes (comme `MangaLookupService`) devront être mockées lors des suites principales pour éviter des appels réseau lents en CI.

---

## 4. Git et Versioning

Pour garantir un historique propre et facile à lire, le projet applique des règles strictes sur la gestion des commits :

*   **Pas de "Conventional Commits" ni de description :** Seul le titre du commit sera utilisé, accompagné d'un Gitmoji.
*   **Commits légers et découpés :** Ne pas faire de "gros commits" qui mélangent plusieurs fonctionnalités. Chaque commit doit représenter une seule petite action claire.
*   **Format d'un commit :** `:[emoji]: [Message en anglais court et précis]` (ex: `:sparkles: Add scan barcode to PWA`).

### Liste des Gitmojis Autorisés (À respecter scrupuleusement) :

* :art: `Improve structure / format of the code.`
* :zap: `Improve performance.`
* :fire: `Remove code or files.`
* :bug: `Fix a bug.`
* :ambulance: `Critical hotfix.`
* :sparkles: `Introduce new features.`
* :memo: `Add or update documentation.`
* :rocket: `Deploy stuff.`
* :lipstick: `Add or update the UI and style files.`
* :tada: `Begin a project.`
* :white_check_mark: `Add, update, or pass tests.`
* :lock: `Fix security or privacy issues.`
* :rotating_light: `Fix compiler / linter warnings.`
* :construction: `Work in progress.`
* :green_heart: `Fix CI Build.`
* :arrow_down: `Downgrade dependencies.`
* :arrow_up: `Upgrade dependencies.`
* :construction_worker: `Add or update CI build system.`
* :recycle: `Refactor code.`
* :heavy_plus_sign: `Add a dependency.`
* :heavy_minus_sign: `Remove a dependency.`
* :wrench: `Add or update configuration files.`
* :hammer: `Add or update development scripts.`
* :pencil2: `Fix typos.`
* :rewind: `Revert changes.`
* :truck: `Move or rename resources (e.g.: files, paths, routes).`
* :bento: `Add or update assets.`
* :wheelchair: `Improve accessibility.`
* :speech_balloon: `Add or update text and literals.`
* :children_crossing: `Improve user experience / usability.`
* :building_construction: `Make architectural changes.`
* :iphone: `Work on responsive design.`
* :clown_face: `Mock things.`
* :mag: `Improve SEO.`
* :seedling: `Add or update seed files.`
* :triangular_flag_on_post: `Add, update, or remove feature flags.`
* :goal_net: `Catch errors.`
* :passport_control: `Work on code related to authorization, roles and permissions.`
* :airplane: `Improve offline support.`

---

## 5. Workflow de Validation (Post-Développement)

Avant de considérer une tâche comme terminée, l'agent ou le développeur doit **systématiquement** :
1. Exécuter le linter : `./vendor/bin/pint` (dans le dossier `laravel-api`).
2. Exécuter les tests : `php artisan test`.
3. Effectuer le commit en respectant les règles de Gitmojis citées ci-dessus.
