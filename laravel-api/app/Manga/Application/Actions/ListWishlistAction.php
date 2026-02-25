<?php

namespace App\Manga\Application\Actions;

use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\WishlistRepositoryInterface;

class ListWishlistAction
{
    public function __construct(
        private readonly WishlistRepositoryInterface $wishlistRepository
    ) {}

    /**
     * @return Volume[]
     */
    public function execute(int $userId): array
    {
        return $this->wishlistRepository->findWishlistByUserId($userId);
    }
}
