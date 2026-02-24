<?php

namespace App\Borrowing\Application\Actions;

use App\Borrowing\Application\DTOs\BulkReturnMangaDTO;
use App\Borrowing\Domain\Models\Loan;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class BulkReturnMangaAction
{
    public function __construct(
        private readonly LoanRepositoryInterface $loanRepository,
    ) {}

    /**
     * @return Loan[]
     */
    public function execute(BulkReturnMangaDTO $dto): array
    {
        return DB::transaction(function () use ($dto) {
            $loans = [];
            $now = new DateTimeImmutable;

            foreach ($dto->volumeIds as $volumeId) {
                // 1. Find the active loan
                $activeLoan = $this->loanRepository->findActiveByVolumeIdAndUserId($volumeId, $dto->userId);
                if (! $activeLoan) {
                    throw new BadRequestHttpException("Le manga ID {$volumeId} n'est pas marqué comme prêté.");
                }

                // 2. Mark as returned
                $returnedLoan = new Loan(
                    id: $activeLoan->getId(),
                    userId: $activeLoan->getUserId(),
                    volumeId: $activeLoan->getVolumeId(),
                    borrowerName: $activeLoan->getBorrowerName(),
                    loanedAt: $activeLoan->getLoanedAt(),
                    returnedAt: $now,
                    notes: $activeLoan->getNotes()
                );

                $loans[] = $this->loanRepository->save($returnedLoan);
            }

            return $loans;
        });
    }
}
