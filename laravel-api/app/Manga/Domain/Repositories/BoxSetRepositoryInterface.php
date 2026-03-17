<?php

namespace App\Manga\Domain\Repositories;

use App\Manga\Application\DTOs\CreateBoxSetDTO;
use App\Manga\Domain\Models\BoxSet;

interface BoxSetRepositoryInterface
{
    public function findByApiId(string $apiId): ?BoxSet;

    public function findById(int $id, ?int $userId = null): ?BoxSet;

    public function create(CreateBoxSetDTO $dto): BoxSet;
}
