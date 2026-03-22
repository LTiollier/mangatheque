<?php

namespace App\Manga\Application\DTOs;

class BulkRemoveVolumesDTO
{
    /**
     * @param  int[]  $volumeIds
     */
    public function __construct(
        public readonly array $volumeIds,
        public readonly int $userId,
    ) {}
}
