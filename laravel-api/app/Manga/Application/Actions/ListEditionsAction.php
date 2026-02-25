<?php

namespace App\Manga\Application\Actions;

use App\Manga\Domain\Models\Edition;
use App\Manga\Domain\Repositories\EditionRepositoryInterface;

class ListEditionsAction
{
    public function __construct(
        private readonly EditionRepositoryInterface $editionRepository
    ) {
    }

    /**
     * @return Edition[]
     */
    public function execute(int $seriesId): array
    {
        return $this->editionRepository->findBySeriesId($seriesId);
    }
}
