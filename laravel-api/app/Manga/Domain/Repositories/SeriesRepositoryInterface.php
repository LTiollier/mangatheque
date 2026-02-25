<?php

namespace App\Manga\Domain\Repositories;

use App\Manga\Application\DTOs\CreateSeriesDTO;
use App\Manga\Domain\Models\Series;

interface SeriesRepositoryInterface
{
    public function findById(int $id): ?Series;

    public function findByTitle(string $title): ?Series;

    public function findByApiId(string $apiId): ?Series;

    public function create(CreateSeriesDTO $dto): Series;
}
