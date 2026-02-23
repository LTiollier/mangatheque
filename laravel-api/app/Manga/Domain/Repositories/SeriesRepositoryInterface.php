<?php

namespace App\Manga\Domain\Repositories;

use App\Manga\Domain\Models\Series;

interface SeriesRepositoryInterface
{
    public function findByTitle(string $title): ?Series;

    public function findByApiId(string $apiId): ?Series;

    public function create(array $data): Series;
}
