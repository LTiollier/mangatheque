---
trigger: always_on
---

# Technical & Architectural Documentation (AGENTS.md)

This file defines the technological choices for the manga library tracking application, the global structure, and the architectural guidelines for development (rules to be followed by both AI agents and developers).

## 1. Global Technical Stack

### 1.1. Frontend (Client)
* **Core Framework:** React with TypeScript.
* **Language:** User interface in French, but all application code (variables, functions, components) will be written in **English**.
* **Meta-framework & Bundler:** Next.js (Note: If ViteJS is preferred for a PWA focus without SSR, this is subject to change. For now, Next.js is retained as the standard).
* **UI and Styling:** shadcn/ui and Tailwind CSS for a modern design.
* **PWA (Progressive Web App) and Offline Mode:**
    * Caching (Service Workers) of "GET" calls to allow offline consultation of volumes, loans, and wishlist.
    * In case of disconnection, UI locking for write actions (POST, PUT, DELETE) with explicit display or grayed-out buttons.
* **Specific Components:**
    * *Barcode Scan:* Integration of a library capable of reading the camera on the web side (accessible on mobile PWA).
    * *Text Search:* Global search bar.
* **Tool Integration:** MCP (Model Context Protocol) support.

### 1.2. Backend (API & Business Logic)
* **Framework:** Laravel 12. The application acts entirely as a RESTful API.
* **Language:** The code will be written in **English** only (classes, variables, exceptions).
* **Database:** PostgreSQL deployed via **Supabase**. Classic credentials in Laravel's `.env`.
* **Authentication:** **Laravel Sanctum** (Laravel's native engine).
* **API Response Formatting:** Strict use of Laravel's **API Resources** (`JsonResource`).
* **.http Files (JetBrains):** Each API endpoint must have its own `.http` file to facilitate testing and use. These files will be grouped in a dedicated folder (e.g., `http-tests/`) at the project root.
* **Debugging & Monitoring:** Use of **Laravel Telescope** in the local environment.

### 1.3. Infrastructure, CI/CD, and Quality
* **Code Hosting:** GitHub.
* **Continuous Integration (CI):** GitHub Actions (tests, linting).
* **Hosting & Deployment:** Vercel (Next.js Frontend).
* **Code Quality & Formatting:** Use of **Laravel Pint**. CI will block any poorly formatted code.
* **Static Analysis and Typing:** Use of **Larastan (PHPStan) at Level 9**. To assert extrinsic types (e.g., `$request->user()`), the use of **PHPDoc** comments (`/** @var Type $var */`) is **strictly mandatory** in place of the `assert()` procedural function.

---

## 2. Software Architecture: Domain-Driven Design (DDD)

To maintain robust, business-oriented code while leveraging the power and ease of Laravel (Eloquent ORM, Events, Queues), we adopt a **DDD** architecture.
The idea is to group code by "Domain" (Bounded Contexts) rather than by file type (separate Controllers, Models).

### Core Principles:
1. **Bounded Contexts:** Code is separated by context (e.g., `Manga`, `User`, `Borrowing`) directly in the `app/` folder. Each Bounded Context has 3 strict layers: `Application`, `Domain`, and `Infrastructure`.
2. **Application Layer (Orchestration):** Contains `Actions` (use cases) and `DTOs`. It orchestrates the flow without containing pure business logic.
3. **Domain Layer (Business Heart):** Contains `Models` (pure business entities, **not** depending on Eloquent), `Repository` interfaces, `Events` (Domain Events), and specific `Exceptions`.
4. **Infrastructure Layer:** Contains the technical implementation specific to the context (e.g., Eloquent Models to interact with the DB, Repository implementations, a service calling an external API).
5. **Domain Events:** Crucial state changes trigger business events. These are captured by **Synchronous** Listeners (within a DB transaction) or **Asynchronous** Listeners (via Laravel Queues).

### 2.1. Typical Structure of a Bounded Context (e.g., Manga)

The standard Laravel framework is conceptually restructured to isolate contexts with their 3 internal layers:

```text
app/
├── Manga/                    # Bounded Context: Manga
│   ├── Application/          # Application Layer (Orchestration)
│   │   ├── Actions/          # Use Cases (e.g., AddScannedMangaAction)
│   │   └── DTOs/             # Strict objects carrying data (e.g., ScanMangaDTO)
│   ├── Domain/               # Domain Layer (Business Rules and Models)
│   │   ├── Models/           # Pure business models (Entities without Eloquent)
│   │   ├── Repositories/     # Repository Interfaces
│   │   ├── Events/           # Business Events (e.g., MangaScanned)
│   │   ├── Listeners/        # Domain Listeners (e.g., UpdateLibraryStatsListener)
│   │   └── Exceptions/       # Business Exceptions (e.g., MangaNotFoundException)
│   └── Infrastructure/       # Infrastructure Layer
│       ├── EloquentModels/   # Eloquent Models (Pure database models)
│       ├── Repositories/     # Concrete Repository implementations (e.g., EloquentMangaRepository)
│       └── Services/         # Classes calling external APIs (e.g., MangaLookupService)
├── Http/                     # Presentation / API Layer
│   ├── Api/
│   │   ├── Controllers/      # Intercept requests, build the DTO, and call the Action
│   │   ├── Requests/         # Laravel FormRequests for basic validation
│   │   └── Resources/        # API Resources for JSON formatting
└── Providers/                # Global Laravel registrations
```

### 2.2. DDD Implementation Examples (Expected Standard)

#### 1. The DTO (Typed Object for transporting data)
*File: `app/Manga/Application/DTOs/ScanMangaDTO.php`*
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

#### 2. The Action (Application Layer) + Orchestration of Events and Transactions
*File: `app/Manga/Application/Actions/AddScannedMangaAction.php`*
The Action orchestrates the flow without carrying entity logic. If a synchronous Event fails, the DB Rollbacks.
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
            
            // 1. Service Call (Infrastructure)
            $mangaData = $this->lookupService->findByIsbn($dto->isbn);
            if (!$mangaData) {
                throw new MangaNotFoundException("Manga not found for barcode: {$dto->isbn}");
            }

            // 2. Creation or retrieval via Repository (Domain does not know Eloquent)
            $manga = $this->mangaRepository->findByIsbnOrCreate(
                $dto->isbn, 
                $mangaData['title']
            );
            
            // 3. Link with the user via Repository
            $this->mangaRepository->attachToUser($manga->getId(), $dto->userId);

            // 4. Trigger Domain Event (Synchronous here)
            event(new MangaAddedToCollection($manga, $dto->userId));

            return $manga;
        });
    }
}
```

#### 3. Events and Listeners (Synchronous vs Asynchronous)
* Event: *File `app/Manga/Domain/Events/MangaAddedToCollection.php`*
* Synchronous Listener (Executes immediately / Blocks on error):
  *File `app/User/Domain/Listeners/IncrementUserMangaCountListener.php`*
* Asynchronous Listener:
  *File `app/Manga/Domain/Listeners/FetchDetailedCoversListener.php`* (Implements Laravel's `ShouldQueue` interface).

#### 4. The Controller (API / Presentation Layer)
*File: `app/Http/Api/Controllers/MangaCollectionController.php`*
It simply validates the request, builds the DTO, launches the Application layer action, and returns the Resource.
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
        // Build the DTO with strict data
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

## 3. Quality and Tests (PestPHP)

The application maintains strict standards for automated testing:

### 3.1. Backend (Laravel API / PestPHP)
*   **Framework:** All backend tests will be written with **PestPHP**.
*   **Mandatory Code Coverage:**
    *   **Domain:** 100% strict coverage on complex actions and critical code.
    *   **Infrastructure & Validation:** 95% minimum for the rest of the application.
*   **Data Sets and Seeders:**
    *   The testing infrastructure is based on realistic **Laravel Seeders**.
*   **Database Transactions:**
    *   To guarantee fast performance, the database is built at the start of the test suites. Each suite and each unit test uses PestPHP's `DatabaseTransactions` trait to automatically rollback changes made to the database state.
*   **Integration and Mocking:**
    *   Actions must be tested end-to-end with their synchronous Events and DB insertion.
    *   Only external APIs (like `MangaLookupService`) should be mocked during the main suites to avoid slow network calls in CI.


---

## 4. Git and Versioning

To guarantee a clean and easy-to-read history, the project applies strict rules on commit management:

*   **No "Conventional Commits" or descriptions:** Only the commit title will be used, accompanied by a Gitmoji.
*   **Light and atomic commits:** Do not make "large commits" that mix multiple features. Each commit must represent a single, clear, small action.
*   **Commit format:** `:[emoji]: [Short and precise message in English]` (e.g., `:sparkles: Add scan barcode to PWA`).

### List of Authorized Gitmojis (To be strictly followed):

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
* :triangular_flag_on_post: `Add, update, or remove feature flags