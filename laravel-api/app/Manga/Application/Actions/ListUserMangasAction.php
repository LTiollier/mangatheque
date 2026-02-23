<?php

namespace App\Manga\Application\Actions;

use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;

class ListUserMangasAction
{
    public function __construct(
        private readonly VolumeRepositoryInterface $volumeRepository
    ) {}

    /**
     * @return Volume[]
     */
    public function execute(int $userId): array
    {
        return $this->volumeRepository->findByUserId($userId);
    }
}
