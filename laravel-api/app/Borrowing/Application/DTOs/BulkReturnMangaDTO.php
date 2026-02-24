<?php

namespace App\Borrowing\Application\DTOs;

class BulkReturnMangaDTO
{
    /**
     * @param int[] $volumeIds
     */
    public function __construct(
        public readonly int $userId,
        public readonly array $volumeIds,
    ) {
    }
}
