<?php

namespace App\ReadingProgress\Application\DTOs;

class BulkToggleReadingProgressDTO
{
    /**
     * @param  int[]  $volumeIds
     */
    public function __construct(
        public readonly int $userId,
        public readonly array $volumeIds,
    ) {}
}
