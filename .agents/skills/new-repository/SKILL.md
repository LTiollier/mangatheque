---
name: new-repository
description: >
  Generates the complete DDD repository stack for a new domain entity in the
  Laravel backend at /Users/leoelmy/Projects/mangastore/laravel-api: Domain
  model, repository interface, Eloquent model, EloquentRepository, Mapper,
  service provider binding, and unit test — all following the exact patterns
  of the project.

  Trigger whenever the user says: "crée un repository", "nouveau modèle domaine",
  "ajoute l'entité X", "nouvelle entité", "j'ai besoin d'un repository pour X",
  or describes a new domain concept that needs persistence.
---

# New Repository — DDD Repository Stack Generator

## Context

- **Project**: `/Users/leoelmy/Projects/mangastore/laravel-api`
- **Bounded contexts**: `Manga`, `Borrowing`, `User`
- **All PHP commands**: via `docker-compose exec backend`

## Step 1 — Gather information

Ask for any missing information:

1. **Entity name** — PascalCase noun, ex: `Rating`, `Favourite`
2. **Bounded context** — `Manga`, `Borrowing`, or `User`
3. **Fields** — list with PHP types and nullable status, ex: `int $userId`, `int $seriesId`, `?string $notes`
4. **Database table** — snake_case plural, ex: `ratings`
5. **Repository methods needed** — ex: `findById`, `findByUserId`, `save`, `delete`
6. **Relations** — any Eloquent relations to other models (belongsTo, hasMany…)

## Step 2 — Generate all files in parallel

### Domain Model — `app/{Context}/Domain/Models/{Entity}.php`

```php
<?php

namespace App\{Context}\Domain\Models;

class {Entity}
{
    public function __construct(
        private readonly ?int $id,
        private readonly int $userId,
        // ... other readonly fields
    ) {}

    public function getId(): ?int { return $this->id; }
    public function getUserId(): int { return $this->userId; }
    // ... one getter per field, no setters
}
```

- Fully immutable — no setters, no state mutation
- `id` is nullable for new (unsaved) instances
- No Eloquent imports — pure PHP

### Repository Interface — `app/{Context}/Domain/Repositories/{Entity}RepositoryInterface.php`

```php
<?php

namespace App\{Context}\Domain\Repositories;

use App\{Context}\Domain\Models\{Entity};

interface {Entity}RepositoryInterface
{
    public function findById(int $id): ?{Entity};
    public function save({Entity} $entity): {Entity};
    // ... other methods as needed

    /**
     * @return {Entity}[]
     */
    public function findByUserId(int $userId): array;
}
```

### Eloquent Model — `app/{Context}/Infrastructure/EloquentModels/{Entity}.php`

```php
<?php

namespace App\{Context}\Infrastructure\EloquentModels;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class {Entity} extends Model
{
    protected $table = '{table}';

    /** @var list<string> */
    protected $fillable = ['user_id', /* ... */];

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\User\Infrastructure\EloquentModels\User::class);
    }
}
```

### Mapper — `app/{Context}/Infrastructure/Mappers/{Entity}Mapper.php`

```php
<?php

namespace App\{Context}\Infrastructure\Mappers;

use App\{Context}\Domain\Models\{Entity} as Domain{Entity};
use App\{Context}\Infrastructure\EloquentModels\{Entity} as Eloquent{Entity};

class {Entity}Mapper
{
    public static function toDomain(Eloquent{Entity} $eloquent): Domain{Entity}
    {
        // Load relations only if already eager-loaded (never trigger N+1)
        $relatedData = $eloquent->relationLoaded('related')
            ? RelatedMapper::toDomain($eloquent->related)
            : null;

        return new Domain{Entity}(
            id: $eloquent->id,
            userId: $eloquent->user_id,
            // ... map each field
        );
    }
}
```

- Always check `relationLoaded()` before accessing relations — never trigger lazy loading
- Use other Mappers for nested domain models

### EloquentRepository — `app/{Context}/Infrastructure/Repositories/Eloquent{Entity}Repository.php`

```php
<?php

namespace App\{Context}\Infrastructure\Repositories;

use App\{Context}\Domain\Models\{Entity} as Domain{Entity};
use App\{Context}\Domain\Repositories\{Entity}RepositoryInterface;
use App\{Context}\Infrastructure\EloquentModels\{Entity} as Eloquent{Entity};
use App\{Context}\Infrastructure\Mappers\{Entity}Mapper;

class Eloquent{Entity}Repository implements {Entity}RepositoryInterface
{
    public function findById(int $id): ?Domain{Entity}
    {
        $eloquent = Eloquent{Entity}::find($id);
        return $eloquent ? $this->toDomain($eloquent) : null;
    }

    public function save(Domain{Entity} $entity): Domain{Entity}
    {
        $eloquent = $entity->getId() !== null
            ? Eloquent{Entity}::findOrNew($entity->getId())
            : new Eloquent{Entity};

        $eloquent->fill([
            'user_id' => $entity->getUserId(),
            // ... other fields
        ]);
        $eloquent->save();

        return $this->toDomain($eloquent);
    }

    private function toDomain(Eloquent{Entity} $eloquent): Domain{Entity}
    {
        return {Entity}Mapper::toDomain($eloquent);
    }
}
```

### Service Provider binding — `app/Providers/AppServiceProvider.php`

Add in the `register()` method:

```php
$this->app->bind(
    \App\{Context}\Domain\Repositories\{Entity}RepositoryInterface::class,
    \App\{Context}\Infrastructure\Repositories\Eloquent{Entity}Repository::class,
);
```

### Unit test — `tests/Unit/{Context}/Infrastructure/Repositories/Eloquent{Entity}RepositoryTest.php`

```php
<?php

namespace Tests\Unit\{Context}\Infrastructure\Repositories;

use App\{Context}\Domain\Models\{Entity};
use App\{Context}\Infrastructure\EloquentModels\{Entity} as Eloquent{Entity};
use App\{Context}\Infrastructure\Repositories\Eloquent{Entity}Repository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Eloquent{Entity}RepositoryTest extends TestCase
{
    use RefreshDatabase;

    private Eloquent{Entity}Repository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new Eloquent{Entity}Repository();
    }

    public function test_can_save_and_retrieve(): void
    {
        $entity = new {Entity}(null, userId: 1, /* ... */);
        $saved = $this->repository->save($entity);

        expect($saved->getId())->not->toBeNull()
            ->and($saved->getUserId())->toBe(1);
    }
}
```

## Step 3 — Migration

Remind the user to create a migration:

```bash
docker-compose exec backend php artisan make:migration create_{table}_table
```

## Step 4 — Validate

After generating, offer to run `/qa` to confirm PHPStan and tests pass.
