<?php

namespace App\Manga\Domain\Repositories;

use App\Manga\Domain\Models\Volume;

interface WishlistRepositoryInterface
{
    public function addWishlistToUser(int $volumeId, int $userId): void;

    public function removeWishlistFromUser(int $volumeId, int $userId): void;

    public function isWishlistedByUser(int $volumeId, int $userId): bool;

    /**
     * @return Volume[]
     */
    public function findWishlistByUserId(int $userId): array;
}
