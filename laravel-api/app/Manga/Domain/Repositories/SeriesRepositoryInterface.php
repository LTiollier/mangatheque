<?php

namespace App\Manga\Domain\Repositories;

use App\Manga\Domain\Models\Series;

interface SeriesRepositoryInterface
{
    public function findById(int $id): ?Series;

    public function findByTitle(string $title): ?Series;

    public function findByApiId(string $apiId): ?Series;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Series;
}
