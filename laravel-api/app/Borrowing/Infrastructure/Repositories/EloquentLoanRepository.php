<?php

namespace App\Borrowing\Infrastructure\Repositories;

use App\Borrowing\Domain\Models\Loan as DomainLoan;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use App\Borrowing\Infrastructure\EloquentModels\Loan as EloquentLoan;
use DateTimeImmutable;

class EloquentLoanRepository implements LoanRepositoryInterface
{
    public function save(DomainLoan $loan): DomainLoan
    {
        $eloquentLoan = EloquentLoan::updateOrCreate(
            ['id' => $loan->getId()],
            [
                'user_id' => $loan->getUserId(),
                'volume_id' => $loan->getVolumeId(),
                'borrower_name' => $loan->getBorrowerName(),
                'loaned_at' => $loan->getLoanedAt()->format('Y-m-d H:i:s'),
                'returned_at' => $loan->getReturnedAt()?->format('Y-m-d H:i:s'),
                'notes' => $loan->getNotes(),
            ]
        );

        return $this->toDomain($eloquentLoan);
    }

    public function findById(int $id): ?DomainLoan
    {
        $eloquentLoan = EloquentLoan::find($id);

        return $eloquentLoan ? $this->toDomain($eloquentLoan) : null;
    }

    public function findActiveByVolumeIdAndUserId(int $volumeId, int $userId): ?DomainLoan
    {
        $eloquentLoan = EloquentLoan::where('volume_id', $volumeId)
            ->where('user_id', $userId)
            ->whereNull('returned_at')
            ->first();

        return $eloquentLoan ? $this->toDomain($eloquentLoan) : null;
    }

    public function findAllByUserId(int $userId): array
    {
        /** @var DomainLoan[] $loans */
        $loans = EloquentLoan::where('user_id', $userId)
            ->with(['volume.edition.series'])
            ->get()
            ->map(fn (EloquentLoan $loan): DomainLoan => $this->toDomain($loan))
            ->all();

        return $loans;
    }

    private function toDomain(EloquentLoan $eloquent): DomainLoan
    {
        $volume = null;
        if ($eloquent->relationLoaded('volume') && $eloquent->volume) {
            $volume = \App\Manga\Infrastructure\Mappers\VolumeMapper::toDomain($eloquent->volume);
        }

        /** @var \Carbon\Carbon $loanedAt */
        $loanedAt = $eloquent->loaned_at;
        /** @var \Carbon\Carbon|null $returnedAt */
        $returnedAt = $eloquent->returned_at;

        return new DomainLoan(
            id: $eloquent->id,
            userId: $eloquent->user_id,
            volumeId: $eloquent->volume_id,
            borrowerName: $eloquent->borrower_name,
            loanedAt: new DateTimeImmutable($loanedAt->toIso8601String()),
            returnedAt: $returnedAt ? new DateTimeImmutable($returnedAt->toIso8601String()) : null,
            notes: $eloquent->notes,
            volume: $volume
        );
    }
}
