<?php

namespace App\Manga\Application\Actions;

use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;

class ListVolumesByEditionAction
{
    public function __construct(
        private readonly VolumeRepositoryInterface $volumeRepository
    ) {}

    /**
     * @return Volume[]
     */
    public function execute(int $editionId): array
    {
        return $this->volumeRepository->findByEditionId($editionId);
    }
}
