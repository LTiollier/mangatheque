<?php

namespace App\Borrowing\Application\DTOs;

class ReturnMangaDTO
{
    public function __construct(
        public readonly int $userId,
        public readonly int $volumeId,
    ) {}
}
