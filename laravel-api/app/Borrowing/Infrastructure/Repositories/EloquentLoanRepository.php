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
            $eloquentVolume = $eloquent->volume;

            $edition = null;
            $series = null;

            if ($eloquentVolume->relationLoaded('edition') && $eloquentVolume->edition) {
                $edition = new \App\Manga\Domain\Models\Edition(
                    id: $eloquentVolume->edition->id,
                    series_id: $eloquentVolume->edition->series_id,
                    name: $eloquentVolume->edition->name,
                    publisher: $eloquentVolume->edition->publisher,
                    language: $eloquentVolume->edition->language,
                    total_volumes: $eloquentVolume->edition->total_volumes,
                );

                if ($eloquentVolume->edition->relationLoaded('series') && $eloquentVolume->edition->series) {
                    $series = new \App\Manga\Domain\Models\Series(
                        id: $eloquentVolume->edition->series->id,
                        api_id: $eloquentVolume->edition->series->api_id,
                        title: $eloquentVolume->edition->series->title,
                        authors: (array) ($eloquentVolume->edition->series->authors ?? []),
                        description: $eloquentVolume->edition->series->description,
                        status: $eloquentVolume->edition->series->status,
                        total_volumes: $eloquentVolume->edition->series->total_volumes,
                        cover_url: $eloquentVolume->edition->series->cover_url,
                    );
                }
            }

            $volume = new \App\Manga\Domain\Models\Volume(
                id: $eloquentVolume->id,
                edition_id: $eloquentVolume->edition_id ?? 0,
                api_id: $eloquentVolume->api_id,
                isbn: $eloquentVolume->isbn,
                number: $eloquentVolume->number,
                title: $eloquentVolume->title,
                authors: (array) ($eloquentVolume->authors ?? []),
                description: $eloquentVolume->description,
                published_date: $eloquentVolume->published_date,
                page_count: $eloquentVolume->page_count,
                cover_url: $eloquentVolume->cover_url,
                edition: $edition,
                series: $series
            );
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
