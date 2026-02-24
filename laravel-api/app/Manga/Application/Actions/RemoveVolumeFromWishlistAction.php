<?php

namespace App\Manga\Application\Actions;

use App\Manga\Domain\Repositories\VolumeRepositoryInterface;

class RemoveVolumeFromWishlistAction
{
    public function __construct(
        private readonly VolumeRepositoryInterface $volumeRepository
    ) {}

    public function execute(int $volumeId, int $userId): void
    {
        $this->volumeRepository->removeWishlistFromUser($volumeId, $userId);
    }
}
