<?php

namespace App\Manga\Domain\Repositories;

use App\Manga\Domain\Models\Edition;

interface EditionRepositoryInterface
{
    public function findByNameAndSeries(string $name, int $seriesId): ?Edition;

    public function create(array $data): Edition;
}
