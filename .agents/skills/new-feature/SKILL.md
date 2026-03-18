---
name: new-feature
description: >
  Orchestrates the implementation of a complete backend feature end-to-end in the
  Laravel DDD backend at /Users/leoelmy/Projects/mangastore/laravel-api: migration,
  Eloquent model, Domain model, repository interface + implementation, DTO, Action,
  FormRequest, JsonResource, Controller, route, Feature test, and quality validation
  — following the exact DDD architecture of the project.

  Trigger whenever the user says: "nouvelle feature", "implémente X de bout en bout",
  "feature complète", "crée la feature X", "ajoute le support de X", or describes
  a new business capability that spans multiple layers of the API.
---

# Skill: new-feature

## Purpose

Guide the implementation of a complete backend feature in the `laravel-api/` following the project's DDD architecture. This skill covers the full vertical slice: from route to database, including tests and quality validation.

## When to activate

Activate this skill when asked to add a new feature, endpoint, or business capability to the Laravel API.

## Architecture overview

The project uses Domain-Driven Design with **Bounded Contexts** under `app/`. Each context has three strict layers:

```
app/
├── {Context}/
│   ├── Application/
│   │   ├── Actions/       # Use cases (orchestrate the flow)
│   │   └── DTOs/          # Typed data carriers (readonly constructors)
│   ├── Domain/
│   │   ├── Models/        # Pure PHP business entities (no Eloquent)
│   │   ├── Repositories/  # Interfaces only
│   │   ├── Events/        # Domain events
│   │   ├── Listeners/     # Domain listeners
│   │   └── Exceptions/    # Business exceptions
│   └── Infrastructure/
│       ├── EloquentModels/ # Eloquent models (DB only)
│       ├── Repositories/   # Concrete implementations
│       └── Services/       # External API clients
├── Http/
│   └── Api/
│       ├── Controllers/    # Thin: validate → DTO → Action → Resource
│       ├── Requests/       # FormRequest validation classes
│       └── Resources/      # JsonResource response formatting
└── Providers/
```

## Step-by-step implementation

### 1. Identify the bounded context

Place code in the correct context (`Manga`, `User`, `Borrowing`, etc.). Create a new context directory only if no existing one fits.

### 2. Create the migration (if schema changes are needed)

```bash
docker-compose exec backend php artisan make:migration create_{table}_table --no-interaction
```

Run it:
```bash
docker-compose exec backend php artisan migrate --no-interaction
```

### 3. Create the Eloquent model (Infrastructure layer)

```bash
docker-compose exec backend php artisan make:model {Context}/Infrastructure/EloquentModels/{ModelName} --no-interaction
```

Add relationships, casts (via `casts()` method), and fillable/guarded as needed. Check sibling Eloquent models for conventions.

### 4. Create the Domain model (Domain layer)

Pure PHP class at `app/{Context}/Domain/Models/{ModelName}.php`. No Eloquent dependency. Exposes typed getters.

### 5. Create the Repository interface (Domain layer)

File: `app/{Context}/Domain/Repositories/{ModelName}RepositoryInterface.php`

Declare only the methods the application needs. Return Domain models, not Eloquent ones.

### 6. Create the Repository implementation (Infrastructure layer)

File: `app/{Context}/Infrastructure/Repositories/Eloquent{ModelName}Repository.php`

Implements the interface. Uses Eloquent internally; maps results to Domain models via a Mapper or inline.

Bind the interface to the implementation in `app/Providers/AppServiceProvider.php`:
```php
$this->app->bind(
    \App\{Context}\Domain\Repositories\{ModelName}RepositoryInterface::class,
    \App\{Context}\Infrastructure\Repositories\Eloquent{ModelName}Repository::class,
);
```

### 7. Create the DTO (Application layer)

File: `app/{Context}/Application/DTOs/{FeatureName}DTO.php`

```php
class {FeatureName}DTO
{
    public function __construct(
        public readonly string $field,
        public readonly int $userId,
    ) {}
}
```

### 8. Create the Action (Application layer)

File: `app/{Context}/Application/Actions/{FeatureName}Action.php`

- Inject repository interfaces and services via constructor.
- Wrap writes in `DB::transaction()`.
- Dispatch domain events with `event(new ...)`.
- No business logic here; delegate to Domain models or services.

### 9. Create the Domain event (if needed)

```bash
docker-compose exec backend php artisan make:event {Context}/Domain/Events/{EventName} --no-interaction
```

Register listeners in `AppServiceProvider` or `EventServiceProvider` (use `ShouldQueue` for async listeners).

### 10. Create the FormRequest (HTTP layer)

```bash
docker-compose exec backend php artisan make:request {FeatureName}Request --no-interaction
```

Place it in `app/Http/Api/Requests/`. Check sibling requests for validation rule style (array vs. string).

### 11. Create the API Resource (HTTP layer)

```bash
docker-compose exec backend php artisan make:resource {ModelName}Resource --no-interaction
```

Place it in `app/Http/Api/Resources/`. Return only the fields the client needs.

### 12. Create the Controller (HTTP layer)

```bash
docker-compose exec backend php artisan make:controller Api/Controllers/{FeatureName}Controller --no-interaction
```

Keep it thin:
```php
public function store({FeatureName}Request $request, {FeatureName}Action $action): JsonResponse
{
    /** @var \App\User\Infrastructure\EloquentModels\User $user */
    $user = $request->user();

    $dto = new {FeatureName}DTO(
        field: $request->validated('field'),
        userId: $user->id,
    );

    $result = $action->execute($dto);

    return new {ModelName}Resource($result);
}
```

Use PHPDoc `@var` assertions for `$request->user()` to satisfy PHPStan level 9. Never use `assert()`.

### 13. Register the route

Add to `laravel-api/routes/api.php` inside the appropriate middleware group (`auth:sanctum` for protected routes). Follow existing `Route::prefix()` grouping conventions.

### 14. Add the `.http` test file

Create a file in `laravel-api/http-tests/` for the new endpoint, following the existing `.http` file format.

### 15. Write tests (PestPHP)

```bash
docker-compose exec backend php artisan make:test Feature/{FeatureName}Test --pest --no-interaction
```

- Use `DatabaseTransactions` trait.
- Test the happy path and key error cases.
- Mock external API services (e.g., `MangaLookupService`); do not mock repositories.
- Verify DB state with assertions, not just response status.
- Coverage requirements: **100%** on Actions and critical Domain code; **95%** minimum elsewhere.

### 16. Validate quality

Run the full quality suite before committing:
```bash
make all
```

This runs Pint (formatting), PHPStan level 9 (static analysis), and PestPHP (tests). All must pass.

### 17. Commit

Follow the Gitmoji format with atomic commits:
```
:sparkles: Add {short description}
```

Only use gitmojis from the authorized list in `AGENTS.md`. Do not add `Co-Authored-By` trailers.

## Key rules

- All PHP commands run via Docker: `docker-compose exec backend`.
- PHPDoc `@var` is mandatory when type cannot be inferred (e.g., `$request->user()`). Never use `assert()`.
- Controllers must be thin: validate → DTO → Action → Resource.
- Writes must be wrapped in `DB::transaction()` inside Actions.
- Domain models must not depend on Eloquent.
- Repository interfaces live in Domain; implementations live in Infrastructure.
- Bind all interfaces in `AppServiceProvider`.
