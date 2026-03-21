<?php

namespace App\Manga\Application\DTOs;

class ImportMangaCollecDTO
{
    public function __construct(
        public readonly string $username,
        public readonly int $userId,
    ) {}
}
