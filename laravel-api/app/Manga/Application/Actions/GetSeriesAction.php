<?php

namespace App\Manga\Application\Actions;

use App\Manga\Domain\Models\Series;
use App\Manga\Domain\Repositories\SeriesRepositoryInterface;

class GetSeriesAction
{
    public function __construct(
        private readonly SeriesRepositoryInterface $seriesRepository
    ) {
    }

    public function execute(int $id): ?Series
    {
        return $this->seriesRepository->findById($id);
    }
}
