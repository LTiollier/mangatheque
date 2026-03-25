<?php

declare(strict_types=1);

namespace App\Borrowing\Application\Actions;

use App\Borrowing\Application\DTOs\LoanItemDTO;
use App\Borrowing\Domain\Exceptions\AlreadyLoanedException;
use App\Borrowing\Domain\Exceptions\VolumeNotInCollectionException;
use App\Borrowing\Domain\Models\Loan;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use App\Manga\Domain\Repositories\BoxRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;

final class LoanItemAction
{
    public function __construct(
        private readonly LoanRepositoryInterface $loanRepository,
        private readonly VolumeRepositoryInterface $volumeRepository,
        private readonly BoxRepositoryInterface $boxRepository,
    ) {}

    public function execute(LoanItemDTO $dto): Loan
    {
        return DB::transaction(function () use ($dto) {
            // 1. Verify that the user owns the item
            $isOwned = false;
            if ($dto->loanableType === 'volume') {
                $isOwned = $this->volumeRepository->isOwnedByUser($dto->loanableId, $dto->userId);
            } elseif ($dto->loanableType === 'box') {
                $isOwned = $this->boxRepository->isOwnedByUser($dto->loanableId, $dto->userId);
            }

            if (! $isOwned) {
                throw new VolumeNotInCollectionException("Item {$dto->loanableId} of type {$dto->loanableType} is not in the user's collection.");
            }

            // 2. Check if the item is already loaned
            $activeLoan = $this->loanRepository->findActiveByLoanableIdAndType($dto->loanableId, $dto->loanableType, $dto->userId);
            if ($activeLoan) {
                throw new AlreadyLoanedException("Item {$dto->loanableId} is already loaned to {$activeLoan->getBorrowerName()}.");
            }

            // 3. Create the loan
            $loan = new Loan(
                id: null,
                userId: $dto->userId,
                loanableId: $dto->loanableId,
                loanableType: $dto->loanableType,
                borrowerName: $dto->borrowerName,
                loanedAt: new DateTimeImmutable,
            );

            return $this->loanRepository->save($loan);
        });
    }
}
