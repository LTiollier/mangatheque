<?php

declare(strict_types=1);

namespace App\Borrowing\Application\Actions;

use App\Borrowing\Application\DTOs\ReturnItemDTO;
use App\Borrowing\Domain\Exceptions\LoanNotFoundException;
use App\Borrowing\Domain\Models\Loan;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;

final class ReturnItemAction
{
    public function __construct(
        private readonly LoanRepositoryInterface $loanRepository,
    ) {}

    public function execute(ReturnItemDTO $dto): Loan
    {
        return DB::transaction(function () use ($dto) {
            // 1. Find the active loan
            $activeLoan = $this->loanRepository->findActiveByLoanableIdAndType($dto->loanableId, $dto->loanableType, $dto->userId);
            if (! $activeLoan) {
                throw new LoanNotFoundException("No active loan found for {$dto->loanableType} {$dto->loanableId}.");
            }

            // 2. Mark as returned
            $returnedLoan = new Loan(
                id: $activeLoan->getId(),
                userId: $activeLoan->getUserId(),
                loanableId: $activeLoan->getLoanableId(),
                loanableType: $activeLoan->getLoanableType(),
                borrowerName: $activeLoan->getBorrowerName(),
                loanedAt: $activeLoan->getLoanedAt(),
                returnedAt: new DateTimeImmutable,
            );

            return $this->loanRepository->save($returnedLoan);
        });
    }
}
