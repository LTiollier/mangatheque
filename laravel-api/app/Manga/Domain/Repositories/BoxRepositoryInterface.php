<?php

namespace App\Manga\Domain\Repositories;

use App\Manga\Application\DTOs\CreateBoxDTO;
use App\Manga\Domain\Models\Box;

interface BoxRepositoryInterface
{
    public function findByApiId(string $apiId): ?Box;

    public function findByIsbn(string $isbn): ?Box;

    public function create(CreateBoxDTO $dto): Box;

    public function attachVolumes(int $boxId, array $volumeIds): void;
}
