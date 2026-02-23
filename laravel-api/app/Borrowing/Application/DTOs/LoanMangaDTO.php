<?php

namespace App\Borrowing\Application\DTOs;

class LoanMangaDTO
{
    public function __construct(
        public readonly int $userId,
        public readonly int $volumeId,
        public readonly string $borrowerName,
        public readonly ?string $notes = null,
    ) {}
}
