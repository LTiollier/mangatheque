<?php

namespace App\Manga\Application\DTOs;

class CreateEditionDTO
{
    public function __construct(
        public readonly int $seriesId,
        public readonly string $name,
        public readonly string $language,
        public readonly ?string $publisher = null,
    ) {}
}
