<?php

namespace App\Manga\Application\DTOs;

class ScanBulkMangaDTO
{
    /**
     * @param  string[]  $isbns
     */
    public function __construct(
        public readonly array $isbns,
        public readonly int $userId,
    ) {}
}
