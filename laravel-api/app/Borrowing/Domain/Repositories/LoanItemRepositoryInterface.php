<?php

declare(strict_types=1);

namespace App\Borrowing\Domain\Repositories;

use App\Borrowing\Domain\Models\LoanItem;

interface LoanItemRepositoryInterface
{
    public function save(LoanItem $item): LoanItem;

    public function findActiveByLoanableIdAndType(int $loanableId, string $loanableType): ?LoanItem;

    /** @return LoanItem[] */
    public function findByLoanId(int $loanId): array;
}
