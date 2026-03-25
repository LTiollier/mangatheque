<?php

declare(strict_types=1);

namespace App\Borrowing\Application\Actions;

use App\Borrowing\Application\DTOs\BulkLoanVolumeDTO;
use App\Borrowing\Domain\Exceptions\AlreadyLoanedException;
use App\Borrowing\Domain\Exceptions\VolumeNotInCollectionException;
use App\Borrowing\Domain\Models\Loan;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;

final class BulkLoanVolumeAction
{
    public function __construct(
        private readonly LoanRepositoryInterface $loanRepository,
        private readonly VolumeRepositoryInterface $volumeRepository,
    ) {}

    /**
     * @return Loan[]
     */
    public function execute(BulkLoanVolumeDTO $dto): array
    {
        return DB::transaction(function () use ($dto) {
            $loans = [];

            foreach ($dto->volumeIds as $volumeId) {
                // 1. Verify that the user owns the volume
                $isOwned = $this->volumeRepository->isOwnedByUser($volumeId, $dto->userId);
                if (! $isOwned) {
                    throw new VolumeNotInCollectionException("Volume {$volumeId} is not in the user's collection.");
                }

                // 2. Check if the manga is already loaned
                $activeLoan = $this->loanRepository->findActiveByLoanableIdAndType($volumeId, 'volume', $dto->userId);
                if ($activeLoan) {
                    throw new AlreadyLoanedException("Volume {$volumeId} is already loaned to {$activeLoan->getBorrowerName()}.");
                }

                // 3. Create the loan
                $loan = new Loan(
                    id: null,
                    userId: $dto->userId,
                    loanableId: $volumeId,
                    loanableType: 'volume',
                    borrowerName: $dto->borrowerName,
                    loanedAt: new DateTimeImmutable,
                );

                $loans[] = $this->loanRepository->save($loan);
            }

            return $loans;
        });
    }
}
