<?php

namespace App\Manga\Application\Actions;

use App\Manga\Domain\Repositories\WishlistRepositoryInterface;

class RemoveVolumeFromWishlistAction
{
    public function __construct(
        private readonly WishlistRepositoryInterface $wishlistRepository
    ) {}

    public function execute(int $volumeId, int $userId): void
    {
        $this->wishlistRepository->removeWishlistFromUser($volumeId, $userId);
    }
}
