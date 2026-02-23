<?php

namespace App\Borrowing\Application\Actions;

use App\Borrowing\Application\DTOs\LoanMangaDTO;
use App\Borrowing\Domain\Models\Loan;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class LoanMangaAction
{
    public function __construct(
        private readonly LoanRepositoryInterface $loanRepository,
        private readonly VolumeRepositoryInterface $volumeRepository,
    ) {}

    public function execute(LoanMangaDTO $dto): Loan
    {
        return DB::transaction(function () use ($dto) {
            // 1. Verify that the user owns the volume
            $isOwned = $this->volumeRepository->isOwnedByUser($dto->volumeId, $dto->userId);
            if (! $isOwned) {
                throw new NotFoundHttpException("Ce manga n'est pas dans votre collection.");
            }

            // 2. Check if the manga is already loaned
            $activeLoan = $this->loanRepository->findActiveByVolumeIdAndUserId($dto->volumeId, $dto->userId);
            if ($activeLoan) {
                throw new BadRequestHttpException("Ce manga est déjà marqué comme prêté à {$activeLoan->getBorrowerName()}.");
            }

            // 3. Create the loan
            $loan = new Loan(
                id: null,
                userId: $dto->userId,
                volumeId: $dto->volumeId,
                borrowerName: $dto->borrowerName,
                loanedAt: new DateTimeImmutable,
                notes: $dto->notes
            );

            return $this->loanRepository->save($loan);
        });
    }
}
