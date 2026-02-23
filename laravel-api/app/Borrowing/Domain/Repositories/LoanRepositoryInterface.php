<?php

namespace App\Borrowing\Domain\Repositories;

use App\Borrowing\Domain\Models\Loan;

interface LoanRepositoryInterface
{
    public function save(Loan $loan): Loan;

    public function findById(int $id): ?Loan;

    public function findActiveByVolumeIdAndUserId(int $volumeId, int $userId): ?Loan;

    /** @return Loan[] */
    public function findAllByUserId(int $userId): array;
}
