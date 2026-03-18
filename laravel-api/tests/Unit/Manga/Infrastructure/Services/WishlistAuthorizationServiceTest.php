<?php

use App\Manga\Infrastructure\EloquentModels\Box as EloquentBox;
use App\Manga\Infrastructure\EloquentModels\BoxSet as EloquentBoxSet;
use App\Manga\Infrastructure\EloquentModels\Edition as EloquentEdition;
use App\Manga\Infrastructure\EloquentModels\Series as EloquentSeries;
use App\Manga\Infrastructure\EloquentModels\Volume as EloquentVolume;
use App\Manga\Infrastructure\Services\WishlistAuthorizationService;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;

use function Pest\Laravel\actingAs;

uses(RefreshDatabase::class);

test('authorizeAddEdition passes when gate allows', function () {
    $user = User::factory()->create();
    actingAs($user);

    $edition = EloquentEdition::factory()->create();

    Gate::shouldReceive('authorize')->with('addEdition', Mockery::type(EloquentEdition::class))->once();

    $service = new WishlistAuthorizationService;
    $service->authorizeAddEdition($edition->id);
});

test('authorizeAddEdition throws when edition does not exist', function () {
    $user = User::factory()->create();
    actingAs($user);

    $service = new WishlistAuthorizationService;

    expect(fn () => $service->authorizeAddEdition(99999))
        ->toThrow(ModelNotFoundException::class);
});

test('authorizeAddByApiId authorizes edition when api_id matches a volume', function () {
    $user = User::factory()->create();
    actingAs($user);

    $edition = EloquentEdition::factory()->create();
    EloquentVolume::factory()->create([
        'edition_id' => $edition->id,
        'api_id' => 'vol-api-123',
    ]);

    Gate::shouldReceive('authorize')->with('addEdition', Mockery::type(EloquentEdition::class))->once();

    $service = new WishlistAuthorizationService;
    $service->authorizeAddByApiId('vol-api-123');
});

test('authorizeAddByApiId authorizes box when api_id matches a box', function () {
    $user = User::factory()->create();
    actingAs($user);

    $series = EloquentSeries::create(['title' => 'Test', 'authors' => 'Author']);
    $boxSet = EloquentBoxSet::create(['series_id' => $series->id, 'title' => 'Box Set']);
    $box = EloquentBox::create(['box_set_id' => $boxSet->id, 'title' => 'Box 1', 'api_id' => 'box-api-456']);

    Gate::shouldReceive('authorize')->with('addBox', Mockery::type(EloquentBox::class))->once();

    $service = new WishlistAuthorizationService;
    $service->authorizeAddByApiId('box-api-456');
});
