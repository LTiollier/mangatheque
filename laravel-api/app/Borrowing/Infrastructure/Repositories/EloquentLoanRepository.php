<?php

declare(strict_types=1);

namespace App\Borrowing\Infrastructure\Repositories;

use App\Borrowing\Domain\Models\Loan as DomainLoan;
use App\Borrowing\Domain\Models\LoanItem as DomainLoanItem;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use App\Borrowing\Infrastructure\EloquentModels\Loan as EloquentLoan;
use App\Borrowing\Infrastructure\EloquentModels\LoanItem as EloquentLoanItem;
use App\Manga\Infrastructure\EloquentModels\Box as EloquentBox;
use App\Manga\Infrastructure\EloquentModels\Volume as EloquentVolume;
use App\Manga\Infrastructure\Mappers\BoxMapper;
use App\Manga\Infrastructure\Mappers\VolumeMapper;
use Carbon\Carbon;
use DateTimeImmutable;

final class EloquentLoanRepository implements LoanRepositoryInterface
{
    public function save(DomainLoan $loan): DomainLoan
    {
        $eloquentLoan = null;
        if ($loan->getId() !== null) {
            $eloquentLoan = EloquentLoan::find($loan->getId());
        }

        if (! $eloquentLoan) {
            $eloquentLoan = new EloquentLoan;
        }

        $eloquentLoan->fill([
            'user_id' => $loan->getUserId(),
            'borrower_name' => $loan->getBorrowerName(),
            'loaned_at' => $loan->getLoanedAt()->format('Y-m-d H:i:s'),
            'returned_at' => $loan->getReturnedAt()?->format('Y-m-d H:i:s'),
        ]);

        $eloquentLoan->save();

        return $this->toDomain($eloquentLoan);
    }

    public function findById(int $id): ?DomainLoan
    {
        $eloquentLoan = EloquentLoan::find($id);

        return $eloquentLoan ? $this->toDomain($eloquentLoan) : null;
    }

    public function findActiveByLoanableItem(int $loanableId, string $loanableType, int $userId): ?DomainLoan
    {
        $eloquentLoan = EloquentLoan::query()
            ->where('user_id', $userId)
            ->whereNull('returned_at')
            ->whereHas('items', fn ($q) => $q
                ->where('loanable_type', $loanableType)
                ->where('loanable_id', $loanableId)
            )
            ->first();

        return $eloquentLoan ? $this->toDomain($eloquentLoan) : null;
    }

    public function findAllByUserId(int $userId): array
    {
        /** @var DomainLoan[] $loans */
        $loans = EloquentLoan::query()
            ->where('user_id', $userId)
            ->with(['items' => function ($itemQuery): void {
                $itemQuery->with(['loanable' => function ($morphTo): void {
                    $morphTo->morphWith([
                        EloquentVolume::class => ['edition.series'],
                        EloquentBox::class => ['boxSet.series'],
                    ]);
                }]);
            }])
            ->get()
            ->map(fn (EloquentLoan $loan): DomainLoan => $this->toDomain($loan))
            ->all();

        return $loans;
    }

    private function toDomain(EloquentLoan $eloquent): DomainLoan
    {
        $items = [];
        if ($eloquent->relationLoaded('items')) {
            $items = $eloquent->items
                ->map(fn (EloquentLoanItem $item): DomainLoanItem => $this->loanItemToDomain($item))
                ->all();
        }

        /** @var Carbon $loanedAt */
        $loanedAt = $eloquent->loaned_at;
        /** @var Carbon|null $returnedAt */
        $returnedAt = $eloquent->returned_at;

        return new DomainLoan(
            id: $eloquent->id,
            userId: $eloquent->user_id,
            borrowerName: $eloquent->borrower_name,
            loanedAt: new DateTimeImmutable($loanedAt->toIso8601String()),
            returnedAt: $returnedAt ? new DateTimeImmutable($returnedAt->toIso8601String()) : null,
            items: $items,
        );
    }

    private function loanItemToDomain(EloquentLoanItem $eloquent): DomainLoanItem
    {
        $loanable = null;
        if ($eloquent->relationLoaded('loanable') && $eloquent->loanable) {
            if ($eloquent->loanable instanceof EloquentVolume) {
                $loanable = VolumeMapper::toDomain($eloquent->loanable);
            } elseif ($eloquent->loanable instanceof EloquentBox) {
                $loanable = BoxMapper::toDomain($eloquent->loanable);
            }
        }

        return new DomainLoanItem(
            id: $eloquent->id,
            loanId: $eloquent->loan_id,
            loanableId: $eloquent->loanable_id,
            loanableType: $eloquent->loanable_type,
            loanable: $loanable,
        );
    }
}
