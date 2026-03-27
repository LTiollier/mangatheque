<?php

declare(strict_types=1);

namespace App\Borrowing\Domain\Repositories;

use App\Borrowing\Domain\Models\Loan;

interface LoanRepositoryInterface
{
    public function save(Loan $loan): Loan;

    public function findById(int $id): ?Loan;

    public function findActiveByLoanableItem(int $loanableId, string $loanableType, int $userId): ?Loan;

    /** @return Loan[] */
    public function findAllByUserId(int $userId): array;
}
