<?php

namespace App\Manga\Application\DTOs;

class CreateVolumeDTO
{
    /**
     * @param  string[]  $authors
     */
    public function __construct(
        public readonly int $editionId,
        public readonly string $title,
        public readonly ?string $number = null,
        public readonly ?string $isbn = null,
        public readonly ?string $apiId = null,
        public readonly array $authors = [],
        public readonly ?string $publishedDate = null,
        public readonly ?string $coverUrl = null,
    ) {}
}
