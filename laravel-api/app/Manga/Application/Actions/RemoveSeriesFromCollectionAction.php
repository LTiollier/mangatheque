<?php

namespace App\Manga\Application\Actions;

use App\Manga\Domain\Repositories\VolumeRepositoryInterface;

class RemoveSeriesFromCollectionAction
{
    public function __construct(
        private readonly VolumeRepositoryInterface $volumeRepository
    ) {}

    public function execute(int $seriesId, int $userId): void
    {
        $this->volumeRepository->detachSeriesFromUser($seriesId, $userId);
    }
}
