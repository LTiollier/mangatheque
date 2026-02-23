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

    /**
     * @return Volume[]
     */
    public function findByUserId(int $userId): array;
}
