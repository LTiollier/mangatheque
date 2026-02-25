<?php

namespace App\Manga\Domain\Repositories;

use App\Manga\Application\DTOs\CreateEditionDTO;
use App\Manga\Domain\Models\Edition;

interface EditionRepositoryInterface
{
    public function findById(int $id): ?Edition;

    public function findByNameAndSeries(string $name, int $seriesId): ?Edition;

    /**
     * @return Edition[]
     */
    public function findBySeriesId(int $seriesId): array;

    public function create(CreateEditionDTO $dto): Edition;
}
