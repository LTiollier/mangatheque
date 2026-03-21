<?php

namespace Tests\Unit\Manga\Infrastructure\Repositories;

use App\Manga\Application\DTOs\PlanningFiltersDTO;
use App\Manga\Domain\Models\PlanningResult;
use App\Manga\Infrastructure\EloquentModels\Box as EloquentBox;
use App\Manga\Infrastructure\EloquentModels\BoxSet as EloquentBoxSet;
use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Series;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\Manga\Infrastructure\Repositories\EloquentPlanningRepository;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeDTO(int $userId, string $from = '2026-01-01', string $to = '2026-12-31', int $perPage = 24, ?string $cursor = null): PlanningFiltersDTO
{
    return new PlanningFiltersDTO(
        userId: $userId,
        from: $from,
        to: $to,
        perPage: $perPage,
        cursor: $cursor,
    );
}

test('it returns a planning result for user-owned series', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create(['title' => 'Naruto']);
    $edition = Edition::factory()->create(['series_id' => $series->id]);

    $ownedVolume = Volume::factory()->create(['edition_id' => $edition->id, 'published_date' => '2020-01-01']);
    $user->volumes()->attach($ownedVolume->id);

    Volume::factory()->create([
        'edition_id' => $edition->id,
        'title' => 'Naruto T1',
        'number' => '1',
        'published_date' => '2026-04-01',
    ]);

    $repository = new EloquentPlanningRepository;
    $result = $repository->findPlanning(makeDTO((int) $user->id));

    expect($result)->toBeInstanceOf(PlanningResult::class)
        ->and($result->getItems())->toHaveCount(1)
        ->and($result->getItems()[0]->getTitle())->toBe('Naruto T1')
        ->and($result->getTotal())->toBe(1)
        ->and($result->hasMore())->toBeFalse();
});

test('it excludes releases from series the user does not own', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id]);
    Volume::factory()->create(['edition_id' => $edition->id, 'published_date' => '2026-04-01']);

    // User owns nothing → no results
    $repository = new EloquentPlanningRepository;
    $result = $repository->findPlanning(makeDTO((int) $user->id));

    expect($result->getItems())->toHaveCount(0)
        ->and($result->getTotal())->toBe(0);
});

test('it includes series the user owns via box ownership', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $boxSet = EloquentBoxSet::create(['series_id' => $series->id, 'title' => 'Box Set']);
    $ownedBox = EloquentBox::create(['box_set_id' => $boxSet->id, 'title' => 'Box 1', 'release_date' => '2020-01-01']);
    $user->boxes()->attach($ownedBox->id);

    EloquentBox::create(['box_set_id' => $boxSet->id, 'title' => 'Box 2', 'release_date' => '2026-04-01']);

    $repository = new EloquentPlanningRepository;
    $result = $repository->findPlanning(makeDTO((int) $user->id));

    expect($result->getItems())->toHaveCount(1)
        ->and($result->getItems()[0]->getTitle())->toBe('Box 2');
});

test('it paginates results with cursor', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id]);

    $ownedVolume = Volume::factory()->create(['edition_id' => $edition->id, 'published_date' => '2020-01-01']);
    $user->volumes()->attach($ownedVolume->id);

    foreach (range(1, 4) as $i) {
        Volume::factory()->create([
            'edition_id' => $edition->id,
            'published_date' => "2026-0{$i}-01",
            'number' => (string) $i,
        ]);
    }

    $repository = new EloquentPlanningRepository;
    $firstPage = $repository->findPlanning(makeDTO((int) $user->id, perPage: 2));

    expect($firstPage->hasMore())->toBeTrue()
        ->and($firstPage->getNextCursor())->not->toBeNull()
        ->and($firstPage->getItems())->toHaveCount(2);

    $secondPage = $repository->findPlanning(makeDTO((int) $user->id, perPage: 2, cursor: $firstPage->getNextCursor()));

    expect($secondPage->getItems())->toHaveCount(2)
        ->and($secondPage->hasMore())->toBeFalse();
});
