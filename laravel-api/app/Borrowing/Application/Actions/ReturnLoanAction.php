<?php

declare(strict_types=1);

namespace App\Borrowing\Application\Actions;

use App\Borrowing\Application\DTOs\ReturnLoanDTO;
use App\Borrowing\Domain\Exceptions\LoanNotFoundException;
use App\Borrowing\Domain\Models\Loan;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;

final class ReturnLoanAction
{
    public function __construct(
        private readonly LoanRepositoryInterface $loanRepository,
    ) {}

    public function execute(ReturnLoanDTO $dto): Loan
    {
        return DB::transaction(function () use ($dto): Loan {
            $loan = $this->loanRepository->findById($dto->loanId);

            if (! $loan || $loan->isReturned() || $loan->getUserId() !== $dto->userId) {
                throw new LoanNotFoundException("No active loan found with id {$dto->loanId}.");
            }

            return $this->loanRepository->save($loan->withReturnedAt(new DateTimeImmutable));
        });
    }
}
