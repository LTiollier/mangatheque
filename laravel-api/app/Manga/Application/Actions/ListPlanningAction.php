<?php

namespace App\Manga\Application\Actions;

use App\Manga\Application\DTOs\PlanningFiltersDTO;
use App\Manga\Domain\Models\PlanningResult;
use App\Manga\Domain\Repositories\PlanningRepositoryInterface;

class ListPlanningAction
{
    public function __construct(
        private readonly PlanningRepositoryInterface $planningRepository,
    ) {}

    public function execute(PlanningFiltersDTO $dto): PlanningResult
    {
        return $this->planningRepository->findPlanning($dto);
    }
}
