<?php

namespace App\Manga\Application\DTOs;

class CreateSeriesDTO
{
    /**
     * @param  string[]  $authors
     */
    public function __construct(
        public readonly string $title,
        public readonly array $authors = [],
        public readonly ?string $apiId = null,
    ) {}
}
