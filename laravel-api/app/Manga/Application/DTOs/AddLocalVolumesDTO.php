<?php

namespace App\Manga\Application\DTOs;

class AddLocalVolumesDTO
{
    /**
     * @param  int[]  $numbers
     */
    public function __construct(
        public readonly int $editionId,
        public readonly array $numbers,
        public readonly int $userId,
    ) {}
}
