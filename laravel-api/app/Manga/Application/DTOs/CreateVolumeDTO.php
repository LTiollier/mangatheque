<?php

namespace App\Manga\Application\DTOs;

class CreateVolumeDTO
{
    public function __construct(
        public readonly int $editionId,
        public readonly string $title,
        public readonly ?string $number = null,
        public readonly ?string $isbn = null,
        public readonly ?string $apiId = null,
        public readonly ?string $authors = null,
        public readonly ?string $publishedDate = null,
        public readonly ?string $coverUrl = null,
    ) {}
}
