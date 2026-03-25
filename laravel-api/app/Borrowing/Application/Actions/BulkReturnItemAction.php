<?php

declare(strict_types=1);

namespace App\Borrowing\Application\Actions;

use App\Borrowing\Application\DTOs\BulkReturnItemDTO;
use App\Borrowing\Domain\Exceptions\LoanNotFoundException;
use App\Borrowing\Domain\Models\Loan;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;

final class BulkReturnItemAction
{
    public function __construct(
        private readonly LoanRepositoryInterface $loanRepository,
    ) {}

    /**
     * @return Loan[]
     */
    public function execute(BulkReturnItemDTO $dto): array
    {
        return DB::transaction(function () use ($dto) {
            $loans = [];
            $now = new DateTimeImmutable;

            foreach ($dto->items as $item) {
                $id = $item['id'];
                $type = $item['type'];

                // 1. Find the active loan
                $activeLoan = $this->loanRepository->findActiveByLoanableIdAndType($id, $type, $dto->userId);
                if (! $activeLoan) {
                    throw new LoanNotFoundException("No active loan found for {$type} {$id}.");
                }

                // 2. Mark as returned
                $returnedLoan = new Loan(
                    id: $activeLoan->getId(),
                    userId: $activeLoan->getUserId(),
                    loanableId: $activeLoan->getLoanableId(),
                    loanableType: $activeLoan->getLoanableType(),
                    borrowerName: $activeLoan->getBorrowerName(),
                    loanedAt: $activeLoan->getLoanedAt(),
                    returnedAt: $now,
                );

                $loans[] = $this->loanRepository->save($returnedLoan);
            }

            return $loans;
        });
    }
}
