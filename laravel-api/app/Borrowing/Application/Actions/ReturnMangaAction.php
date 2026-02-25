<?php

namespace App\Borrowing\Application\Actions;

use App\Borrowing\Application\DTOs\ReturnMangaDTO;
use App\Borrowing\Domain\Exceptions\LoanNotFoundException;
use App\Borrowing\Domain\Models\Loan;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;

class ReturnMangaAction
{
    public function __construct(
        private readonly LoanRepositoryInterface $loanRepository,
    ) {}

    public function execute(ReturnMangaDTO $dto): Loan
    {
        return DB::transaction(function () use ($dto) {
            // 1. Find the active loan
            $activeLoan = $this->loanRepository->findActiveByVolumeIdAndUserId($dto->volumeId, $dto->userId);
            if (! $activeLoan) {
                throw new LoanNotFoundException("No active loan found for volume {$dto->volumeId}.");
            }

            // 2. Mark as returned
            $returnedLoan = new Loan(
                id: $activeLoan->getId(),
                userId: $activeLoan->getUserId(),
                volumeId: $activeLoan->getVolumeId(),
                borrowerName: $activeLoan->getBorrowerName(),
                loanedAt: $activeLoan->getLoanedAt(),
                returnedAt: new DateTimeImmutable,
                notes: $activeLoan->getNotes()
            );

            return $this->loanRepository->save($returnedLoan);
        });
    }
}
