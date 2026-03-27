<?php

declare(strict_types=1);

namespace App\Borrowing\Application\Actions;

use App\Borrowing\Application\DTOs\CreateLoanDTO;
use App\Borrowing\Domain\Exceptions\AlreadyLoanedException;
use App\Borrowing\Domain\Exceptions\VolumeNotInCollectionException;
use App\Borrowing\Domain\Models\Loan;
use App\Borrowing\Domain\Models\LoanItem;
use App\Borrowing\Domain\Repositories\LoanItemRepositoryInterface;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use App\Manga\Domain\Repositories\BoxRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;

final class CreateLoanAction
{
    public function __construct(
        private readonly LoanRepositoryInterface $loanRepository,
        private readonly LoanItemRepositoryInterface $loanItemRepository,
        private readonly VolumeRepositoryInterface $volumeRepository,
        private readonly BoxRepositoryInterface $boxRepository,
    ) {}

    public function execute(CreateLoanDTO $dto): Loan
    {
        return DB::transaction(function () use ($dto): Loan {
            foreach ($dto->items as $item) {
                $isOwned = match ($item['type']) {
                    'volume' => $this->volumeRepository->isOwnedByUser($item['id'], $dto->userId),
                    'box' => $this->boxRepository->isOwnedByUser($item['id'], $dto->userId),
                    default => false,
                };

                if (! $isOwned) {
                    throw new VolumeNotInCollectionException("Item {$item['id']} of type {$item['type']} is not in the user's collection.");
                }

                $activeLoan = $this->loanRepository->findActiveByLoanableItem($item['id'], $item['type'], $dto->userId);
                if ($activeLoan) {
                    throw new AlreadyLoanedException("Item {$item['id']} of type {$item['type']} is already loaned to {$activeLoan->getBorrowerName()}.");
                }
            }

            $loan = $this->loanRepository->save(new Loan(
                id: null,
                userId: $dto->userId,
                borrowerName: $dto->borrowerName,
                loanedAt: new DateTimeImmutable,
            ));

            foreach ($dto->items as $item) {
                $this->loanItemRepository->save(new LoanItem(
                    id: null,
                    loanId: (int) $loan->getId(),
                    loanableId: $item['id'],
                    loanableType: $item['type'],
                ));
            }

            return $loan;
        });
    }
}
