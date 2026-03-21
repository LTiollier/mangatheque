<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\ListPlanningAction;
use App\Manga\Application\DTOs\PlanningFiltersDTO;
use App\Manga\Domain\Models\PlanningResult;
use App\Manga\Domain\Repositories\PlanningRepositoryInterface;
use Mockery;

test('it delegates to the planning repository', function () {
    $dto = new PlanningFiltersDTO(
        userId: 1,
        from: '2026-02-21',
        to: '2027-03-21',
        perPage: 24,
        cursor: null,
    );

    $result = new PlanningResult([], 0, 24, null, false);

    $repository = Mockery::mock(PlanningRepositoryInterface::class);
    $repository->shouldReceive('findPlanning')->once()->with($dto)->andReturn($result);

    $action = new ListPlanningAction($repository);

    expect($action->execute($dto))->toBe($result);
});
