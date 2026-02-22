<?php

namespace App\Manga\Application\DTOs;

class SearchMangaDTO
{
    public function __construct(
        public readonly string $query
    ) {}
}
