<?php

namespace App\Manga\Application\DTOs;

class CreateBoxSetDTO
{
    public function __construct(
        public readonly int $seriesId,
        public readonly string $title,
        public readonly ?string $publisher = null,
        public readonly ?string $apiId = null,
    ) {}
}
