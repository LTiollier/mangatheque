<?php

namespace App\Manga\Domain\Repositories;

interface MangaLookupServiceInterface
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function search(string $query): array;

    /**
     * @return array<string, mixed>|null
     */
    public function findByIsbn(string $isbn): ?array;

    /**
     * @return array<string, mixed>|null
     */
    public function findByApiId(string $apiId): ?array;
}
