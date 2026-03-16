<?php

namespace App\Manga\Application\DTOs;

class CreateSeriesDTO
{
    public function __construct(
        public readonly string $title,
        public readonly ?string $authors = null,
        public readonly ?string $apiId = null,
    ) {}
}
