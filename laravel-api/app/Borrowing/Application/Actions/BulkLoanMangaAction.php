<?php

namespace App\Borrowing\Application\Actions;

use App\Borrowing\Application\DTOs\BulkLoanMangaDTO;
use App\Borrowing\Domain\Models\Loan;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class BulkLoanMangaAction
{
    public function __construct(
        private readonly LoanRepositoryInterface $loanRepository,
        private readonly VolumeRepositoryInterface $volumeRepository,
    ) {
    }

    /**
     * @return Loan[]
     */
    public function execute(BulkLoanMangaDTO $dto): array
    {
        return DB::transaction(function () use ($dto) {
            $loans = [];

            foreach ($dto->volumeIds as $volumeId) {
                // 1. Verify that the user owns the volume
                $isOwned = $this->volumeRepository->isOwnedByUser($volumeId, $dto->userId);
                if (!$isOwned) {
                    throw new NotFoundHttpException("Le manga ID {$volumeId} n'est pas dans votre collection.");
                }

                // 2. Check if the manga is already loaned
                $activeLoan = $this->loanRepository->findActiveByVolumeIdAndUserId($volumeId, $dto->userId);
                if ($activeLoan) {
                    throw new BadRequestHttpException("Le manga ID {$volumeId} est déjà marqué comme prêté à {$activeLoan->getBorrowerName()}.");
                }

                // 3. Create the loan
                $loan = new Loan(
                    id: null,
                    userId: $dto->userId,
                    volumeId: $volumeId,
                    borrowerName: $dto->borrowerName,
                    loanedAt: new DateTimeImmutable,
                    notes: $dto->notes
                );

                $loans[] = $this->loanRepository->save($loan);
            }

            return $loans;
        });
    }
}
