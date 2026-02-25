<?php

namespace App\Borrowing\Application\Actions;

use App\Borrowing\Domain\Models\Loan;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;

class ListLoansAction
{
    public function __construct(
        private readonly LoanRepositoryInterface $loanRepository
    ) {}

    /**
     * @return Loan[]
     */
    public function execute(int $userId): array
    {
        return $this->loanRepository->findAllByUserId($userId);
    }
}
