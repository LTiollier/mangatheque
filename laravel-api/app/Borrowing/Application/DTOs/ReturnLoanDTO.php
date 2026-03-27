<?php

declare(strict_types=1);

namespace App\Borrowing\Application\DTOs;

final readonly class ReturnLoanDTO
{
    public function __construct(
        public readonly int $userId,
        public readonly int $loanId,
    ) {}
}
