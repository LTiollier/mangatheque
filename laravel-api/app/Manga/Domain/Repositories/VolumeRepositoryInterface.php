<?php

namespace App\Manga\Domain\Repositories;

use App\Manga\Domain\Models\Volume;

interface VolumeRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Volume;

    public function findByApiId(string $apiId): ?Volume;

    public function findByEditionAndNumber(int $editionId, string $number): ?Volume;

    /**
     * @return Volume[]
     */
    public function findByEditionId(int $editionId): array;

    public function findByIsbn(string $isbn): ?Volume;

    public function attachToUser(int $volumeId, int $userId): void;

    public function detachFromUser(int $volumeId, int $userId): void;

    public function detachSeriesFromUser(int $seriesId, int $userId): void;

    public function isOwnedByUser(int $volumeId, int $userId): bool;

    /**
     * @return Volume[]
     */
    public function findByUserId(int $userId): array;

    public function addWishlistToUser(int $volumeId, int $userId): void;

    public function removeWishlistFromUser(int $volumeId, int $userId): void;

    public function isWishlistedByUser(int $volumeId, int $userId): bool;

    /**
     * @return Volume[]
     */
    public function findWishlistByUserId(int $userId): array;
}
