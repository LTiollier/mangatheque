<?php

namespace App\Manga\Application\Listeners;

use App\Manga\Domain\Events\BoxAddedToCollection;
use App\Manga\Domain\Repositories\WishlistRepositoryInterface;

class RemoveBoxFromWishlistOnCollection
{
    public function __construct(
        private readonly WishlistRepositoryInterface $wishlistRepository
    ) {}

    public function handle(BoxAddedToCollection $event): void
    {
        $this->wishlistRepository->removeWishlistItemFromUser($event->boxId, 'box', $event->userId);
    }
}
