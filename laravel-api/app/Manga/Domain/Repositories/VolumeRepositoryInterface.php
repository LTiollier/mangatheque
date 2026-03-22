<?php

namespace App\Manga\Domain\Repositories;

use App\Manga\Application\DTOs\CreateVolumeDTO;
use App\Manga\Domain\Models\Volume;

interface VolumeRepositoryInterface
{
    public function create(CreateVolumeDTO $dto): Volume;

    public function findByApiId(string $apiId): ?Volume;

    public function findByEditionAndNumber(int $editionId, string $number): ?Volume;

    public function findByEditionAndIsbn(int $editionId, string $isbn): ?Volume;

    /**
     * @return Volume[]
     */
    public function findByEditionId(int $editionId): array;

    public function findByIsbn(string $isbn): ?Volume;

    public function findByIsbnWithRelations(string $isbn): ?Volume;

    public function attachToUser(int $volumeId, int $userId): void;

    public function detachFromUser(int $volumeId, int $userId): void;

    /** @param int[] $volumeIds */
    public function detachManyFromUser(array $volumeIds, int $userId): void;

    public function detachSeriesFromUser(int $seriesId, int $userId): void;

    /**
     * @param  array<int, string>  $apiIds
     * @return array{attached: int, found: int}
     */
    public function attachByApiIdsToUser(array $apiIds, int $userId): array;

    public function isOwnedByUser(int $volumeId, int $userId): bool;

    /**
     * @return Volume[]
     */
    public function findByUserId(int $userId): array;
}
