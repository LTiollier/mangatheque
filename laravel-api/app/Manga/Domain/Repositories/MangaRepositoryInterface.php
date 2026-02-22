<?php

namespace App\Manga\Domain\Repositories;

use App\Manga\Domain\Models\Manga;

interface MangaRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Manga;

    public function findByApiId(string $apiId): ?Manga;

    public function findByIsbn(string $isbn): ?Manga;

    public function attachToUser(int $mangaId, int $userId): void;

    /**
     * @return Manga[]
     */
    public function findByUserId(int $userId): array;
}
