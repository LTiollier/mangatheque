<?php

namespace App\Manga\Domain\Repositories;

use App\Manga\Domain\Models\Edition;

interface EditionRepositoryInterface
{
    public function findById(int $id): ?Edition;

    public function findByNameAndSeries(string $name, int $seriesId): ?Edition;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Edition;
}
