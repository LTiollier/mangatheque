<?php

namespace Tests\Unit\Manga\Infrastructure\Repositories;

use App\Manga\Application\DTOs\PlanningFiltersDTO;
use App\Manga\Domain\Models\PlanningResult;
use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Series;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\Manga\Infrastructure\Repositories\EloquentPlanningRepository;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('it returns a planning result', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create(['title' => 'Naruto']);
    $edition = Edition::factory()->create(['series_id' => $series->id]);
    Volume::factory()->create([
        'edition_id' => $edition->id,
        'title' => 'Naruto T1',
        'number' => '1',
        'published_date' => '2026-04-01',
    ]);

    $dto = new PlanningFiltersDTO(
        userId: (int) $user->id,
        from: '2026-01-01',
        to: '2026-12-31',
        type: 'all',
        mySeries: false,
        perPage: 24,
        cursor: null,
    );

    $repository = new EloquentPlanningRepository;
    $result = $repository->findPlanning($dto);

    expect($result)->toBeInstanceOf(PlanningResult::class)
        ->and($result->getItems())->toHaveCount(1)
        ->and($result->getItems()[0]->getTitle())->toBe('Naruto T1')
        ->and($result->getTotal())->toBe(1)
        ->and($result->hasMore())->toBeFalse();
});

test('it paginates results with cursor', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id]);

    foreach (range(1, 4) as $i) {
        Volume::factory()->create([
            'edition_id' => $edition->id,
            'published_date' => "2026-0{$i}-01",
            'number' => (string) $i,
        ]);
    }

    $dto = new PlanningFiltersDTO(
        userId: (int) $user->id,
        from: '2026-01-01',
        to: '2026-12-31',
        type: 'volume',
        mySeries: false,
        perPage: 2,
        cursor: null,
    );

    $repository = new EloquentPlanningRepository;
    $firstPage = $repository->findPlanning($dto);

    expect($firstPage->hasMore())->toBeTrue()
        ->and($firstPage->getNextCursor())->not->toBeNull()
        ->and($firstPage->getItems())->toHaveCount(2);

    $dto2 = new PlanningFiltersDTO(
        userId: (int) $user->id,
        from: '2026-01-01',
        to: '2026-12-31',
        type: 'volume',
        mySeries: false,
        perPage: 2,
        cursor: $firstPage->getNextCursor(),
    );

    $secondPage = $repository->findPlanning($dto2);

    expect($secondPage->getItems())->toHaveCount(2)
        ->and($secondPage->hasMore())->toBeFalse();
});
