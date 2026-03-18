---
name: new-action
description: >
  Generates the complete use case stack for a new action in the Laravel DDD
  backend at /Users/leoelmy/Projects/mangastore/laravel-api: DTO, Action,
  FormRequest, JsonResource, Controller method, route line, and Pest unit test —
  all created in parallel following the exact patterns of the project.

  Trigger whenever the user says: "crée une action", "nouveau use case",
  "génère l'action X", "ajoute la fonctionnalité X", "implémente X", or
  describes a new operation that needs to be wired into the API.
---

# New Action — Use Case Stack Generator

## Context

- **Project**: `/Users/leoelmy/Projects/mangastore/laravel-api`
- **Bounded contexts**: `Manga`, `Borrowing`, `User`
- **Architecture**: DDD — Domain / Application / Infrastructure layers
- **All PHP commands**: via `docker-compose exec backend`

## Step 1 — Gather information

Ask for any missing information:

1. **Action name** — PascalCase verb + noun, ex: `AddToWishlist`, `RemoveFromCollection`
2. **Bounded context** — `Manga`, `Borrowing`, or `User`
3. **Operation type** — read (no transaction) or write (`DB::transaction()`)
4. **Return type** — domain model returned, ex: `Wishlist`, or `void`
5. **DTO fields** — list with PHP types, ex: `int $userId`, `int $editionId`
6. **Repository dependencies** — which interfaces are injected, ex: `WishlistRepositoryInterface`

## Step 2 — Generate all files in parallel

### DTO — `app/{Context}/Application/DTOs/{Name}DTO.php`

```php
<?php

namespace App\{Context}\Application\DTOs;

class {Name}DTO
{
    public function __construct(
        public readonly int $userId,
        // ... other readonly fields
    ) {}
}
```

### Action — `app/{Context}/Application/Actions/{Name}Action.php`

```php
<?php

namespace App\{Context}\Application\Actions;

use App\{Context}\Application\DTOs\{Name}DTO;
use App\{Context}\Domain\Repositories\{Repo}Interface;
use Illuminate\Support\Facades\DB;

class {Name}Action
{
    public function __construct(
        private readonly {Repo}Interface ${repo},
    ) {}

    public function execute({Name}DTO $dto): {ReturnType}
    {
        return DB::transaction(function () use ($dto) {
            // business logic here
        });
    }
}
```

- Use `DB::transaction()` for all write operations
- Throw domain exceptions (from `Domain/Exceptions/`) when business rules are violated
- Never catch exceptions here — let them bubble up

### FormRequest — `app/Http/Api/Requests/{Name}Request.php`

```php
<?php

namespace App\Http\Api\Requests;

use App\{Context}\Application\DTOs\{Name}DTO;
use Illuminate\Foundation\Http\FormRequest;

class {Name}Request extends FormRequest
{
    public function authorize(): bool
    {
        return true; // or add policy check if needed
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'field' => ['required', 'integer'],
        ];
    }

    public function toDTO(): {Name}DTO
    {
        return new {Name}DTO(
            userId: (int) $this->user()?->getAuthIdentifier(),
            // ... other fields
        );
    }
}
```

### JsonResource — `app/Http/Api/Resources/{Name}Resource.php`

```php
<?php

namespace App\Http\Api\Resources;

use App\{Context}\Domain\Models\{DomainModel};
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @property-read {DomainModel} $resource */
class {Name}Resource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->getId(),
            // ... use $this->resource->getX() — never access properties directly
        ];
    }
}
```

### Controller method — `app/Http/Api/Controllers/{Name}Controller.php`

```php
public function store({Name}Request $request, {Name}Action $action): JsonResponse
{
    $dto = $request->toDTO();
    $result = $action->execute($dto);
    return (new {Name}Resource($result))->response()->setStatusCode(201);
}
```

For read operations use `JsonResponse` with 200, for deletes use `response()->noContent()`.

### Route — `routes/api.php`

Propose the line to add in the appropriate group (authenticated or public):

```php
Route::post('/resource', [{Name}Controller::class, 'store']);
```

### Unit test — `tests/Unit/{Context}/Application/Actions/{Name}ActionTest.php`

```php
<?php

use App\{Context}\Application\Actions\{Name}Action;
use App\{Context}\Application\DTOs\{Name}DTO;
use App\{Context}\Domain\Repositories\{Repo}Interface;

beforeEach(function () {
    $this->{repo} = Mockery::mock({Repo}Interface::class);
    $this->action = new {Name}Action($this->{repo});
});

it('{does the thing}', function () {
    $dto = new {Name}DTO(userId: 1, /* ... */);

    $this->{repo}->shouldReceive('methodName')
        ->once()
        ->andReturn(/* mock result */);

    $result = $this->action->execute($dto);

    expect($result)->toBeInstanceOf({DomainModel}::class);
});

it('throws {Exception} when {condition}', function () {
    // setup mocks for the failing condition
    $this->action->execute(new {Name}DTO(/* ... */));
})->throws({DomainException}::class);
```

- No `namespace` declaration (Pest convention in this project)
- Use `beforeEach` when multiple tests share the same mocks
- Test at minimum: happy path + each domain exception

## Step 3 — Validate

After generating, offer to run `/qa` to confirm PHPStan and tests pass.
