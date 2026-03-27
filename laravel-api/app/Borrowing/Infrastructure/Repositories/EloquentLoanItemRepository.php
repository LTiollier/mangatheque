<?php

declare(strict_types=1);

namespace App\Borrowing\Infrastructure\Repositories;

use App\Borrowing\Domain\Models\LoanItem as DomainLoanItem;
use App\Borrowing\Domain\Repositories\LoanItemRepositoryInterface;
use App\Borrowing\Infrastructure\EloquentModels\LoanItem as EloquentLoanItem;
use App\Manga\Infrastructure\EloquentModels\Box as EloquentBox;
use App\Manga\Infrastructure\EloquentModels\Volume as EloquentVolume;
use App\Manga\Infrastructure\Mappers\BoxMapper;
use App\Manga\Infrastructure\Mappers\VolumeMapper;

final class EloquentLoanItemRepository implements LoanItemRepositoryInterface
{
    public function save(DomainLoanItem $item): DomainLoanItem
    {
        $eloquent = null;
        if ($item->id !== null) {
            $eloquent = EloquentLoanItem::find($item->id);
        }

        if (! $eloquent) {
            $eloquent = new EloquentLoanItem;
        }

        $eloquent->fill([
            'loan_id' => $item->loanId,
            'loanable_type' => $item->loanableType,
            'loanable_id' => $item->loanableId,
        ]);

        $eloquent->save();

        return $this->toDomain($eloquent);
    }

    public function findActiveByLoanableIdAndType(int $loanableId, string $loanableType): ?DomainLoanItem
    {
        $eloquent = EloquentLoanItem::query()
            ->where('loanable_type', $loanableType)
            ->where('loanable_id', $loanableId)
            ->whereHas('loan', fn ($q) => $q->whereNull('returned_at'))
            ->first();

        return $eloquent ? $this->toDomain($eloquent) : null;
    }

    public function findByLoanId(int $loanId): array
    {
        /** @var DomainLoanItem[] $items */
        $items = EloquentLoanItem::query()
            ->where('loan_id', $loanId)
            ->get()
            ->map(fn (EloquentLoanItem $item): DomainLoanItem => $this->toDomain($item))
            ->all();

        return $items;
    }

    private function toDomain(EloquentLoanItem $eloquent): DomainLoanItem
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
