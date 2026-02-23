<?php

namespace App\Manga\Application\Actions;

use App\Manga\Domain\Repositories\VolumeRepositoryInterface;

class RemoveVolumeFromCollectionAction
{
    public function __construct(
        private readonly VolumeRepositoryInterface $volumeRepository
    ) {}

    public function execute(int $volumeId, int $userId): void
    {
        $this->volumeRepository->detachFromUser($volumeId, $userId);
    }
}
