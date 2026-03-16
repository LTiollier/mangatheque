<?php

namespace App\Manga\Application\DTOs;

class CreateBoxDTO
{
    public function __construct(
        public readonly int $boxSetId,
        public readonly string $title,
        public readonly ?string $number = null,
        public readonly ?string $isbn = null,
        public readonly ?string $apiId = null,
        public readonly ?string $releaseDate = null,
        public readonly ?string $coverUrl = null,
        public readonly bool $isEmpty = false,
    ) {}
}
