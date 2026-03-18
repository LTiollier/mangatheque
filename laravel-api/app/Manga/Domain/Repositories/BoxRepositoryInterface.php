<?php

namespace App\Manga\Domain\Repositories;

use App\Manga\Application\DTOs\CreateBoxDTO;
use App\Manga\Domain\Models\Box;

interface BoxRepositoryInterface
{
    public function findById(int $id, ?int $userId = null): ?Box;

    public function findByApiId(string $apiId): ?Box;

    /** @return Box[] */
    public function findByBoxSetId(int $boxSetId): array;

    public function findByIsbn(string $isbn): ?Box;

    public function create(CreateBoxDTO $dto): Box;

    /** @param array<int> $volumeIds */
    public function attachVolumes(int $boxId, array $volumeIds): void;

    public function attachToUser(int $boxId, int $userId): void;

    public function detachFromUser(int $boxId, int $userId): void;

    public function isOwnedByUser(int $boxId, int $userId): bool;
}
