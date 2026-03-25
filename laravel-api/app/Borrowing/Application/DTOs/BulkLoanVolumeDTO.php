<?php

declare(strict_types=1);

namespace App\Borrowing\Application\DTOs;

final readonly class BulkLoanVolumeDTO
{
    /**
     * @param  int[]  $volumeIds
     */
    public function __construct(
        public int $userId,
        public array $volumeIds,
        public string $borrowerName,
    ) {}
}
