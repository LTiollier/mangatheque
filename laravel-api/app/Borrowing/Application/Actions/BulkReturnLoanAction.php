<?php

declare(strict_types=1);

namespace App\Borrowing\Application\Actions;

use App\Borrowing\Application\DTOs\BulkReturnLoanDTO;
use App\Borrowing\Domain\Exceptions\LoanNotFoundException;
use App\Borrowing\Domain\Models\Loan;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;

final class BulkReturnLoanAction
{
    public function __construct(
        private readonly LoanRepositoryInterface $loanRepository,
    ) {}

    /**
     * @return Loan[]
     */
    public function execute(BulkReturnLoanDTO $dto): array
    {
        return DB::transaction(function () use ($dto): array {
            $loans = [];
            $now = new DateTimeImmutable;

            foreach ($dto->loanIds as $loanId) {
                $loan = $this->loanRepository->findById($loanId);

                if (! $loan || $loan->isReturned() || $loan->getUserId() !== $dto->userId) {
                    throw new LoanNotFoundException("No active loan found with id {$loanId}.");
                }

                $loans[] = $this->loanRepository->save($loan->withReturnedAt($now));
            }

            return $loans;
        });
    }
}
