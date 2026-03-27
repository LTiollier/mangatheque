<?php

declare(strict_types=1);

namespace App\Borrowing\Application\DTOs;

final readonly class BulkReturnLoanDTO
{
    /**
     * @param  int[]  $loanIds
     */
    public function __construct(
        public readonly int $userId,
        public readonly array $loanIds,
    ) {}
}
