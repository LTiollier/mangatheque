<?php

declare(strict_types=1);

namespace App\Manga\Domain\Listeners;

use App\Manga\Domain\Events\VolumeAddedToCollection;
use App\Manga\Domain\Repositories\WishlistRepositoryInterface;

final class RemoveEditionFromWishlistOnVolumeAdded
{
    public function __construct(
        private readonly WishlistRepositoryInterface $wishlistRepository
    ) {}

    public function handle(VolumeAddedToCollection $event): void
    {
        $this->wishlistRepository->removeWishlistItemFromUser($event->volume->getEditionId(), 'edition', $event->userId);
    }
}
