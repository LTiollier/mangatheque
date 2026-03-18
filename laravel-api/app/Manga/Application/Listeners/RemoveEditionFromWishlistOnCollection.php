<?php

namespace App\Manga\Application\Listeners;

use App\Manga\Domain\Events\EditionAddedToCollection;
use App\Manga\Domain\Repositories\WishlistRepositoryInterface;

class RemoveEditionFromWishlistOnCollection
{
    public function __construct(
        private readonly WishlistRepositoryInterface $wishlistRepository
    ) {}

    public function handle(EditionAddedToCollection $event): void
    {
        $this->wishlistRepository->removeWishlistItemFromUser($event->editionId, 'edition', $event->userId);
    }
}
