<?php

declare(strict_types=1);

namespace App\Borrowing\Application\DTOs;

final readonly class CreateLoanDTO
{
    /**
     * @param  array<array{type: string, id: int}>  $items
     */
    public function __construct(
        public readonly int $userId,
        public readonly string $borrowerName,
        public readonly array $items,
    ) {}
}
