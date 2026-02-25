<?php

namespace App\Manga\Infrastructure\Repositories;

use App\Manga\Domain\Models\Edition;
use App\Manga\Domain\Models\Series;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use App\Manga\Infrastructure\EloquentModels\Volume as EloquentVolume;
use App\User\Infrastructure\EloquentModels\User as EloquentUser;

class EloquentVolumeRepository implements VolumeRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Volume
    {
        $eloquent = EloquentVolume::create($data);

        return $this->toDomain($eloquent);
    }

    public function findByApiId(string $apiId): ?Volume
    {
        $eloquent = EloquentVolume::where('api_id', $apiId)->first();

        return $eloquent ? $this->toDomain($eloquent) : null;
    }

    public function findByEditionAndNumber(int $editionId, string $number): ?Volume
    {
        $eloquent = EloquentVolume::where('edition_id', $editionId)->where('number', $number)->first();

        return $eloquent ? $this->toDomain($eloquent) : null;
    }

    /**
     * @return Volume[]
     */
    public function findByEditionId(int $editionId): array
    {
        /** @var array<int, Volume> $volumes */
        $volumes = EloquentVolume::where('edition_id', $editionId)
            ->with(['edition.series'])
            ->get()
            ->map(fn (EloquentVolume $v) => $this->toDomain($v))
            ->toArray();

        return $volumes;
    }

    public function findByIsbn(string $isbn): ?Volume
    {
        $eloquent = EloquentVolume::where('isbn', $isbn)->first();

        return $eloquent ? $this->toDomain($eloquent) : null;
    }

    public function attachToUser(int $volumeId, int $userId): void
    {
        $user = EloquentUser::findOrFail($userId);
        $user->volumes()->syncWithoutDetaching([$volumeId]);
    }

    public function detachFromUser(int $volumeId, int $userId): void
    {
        $user = EloquentUser::findOrFail($userId);
        $user->volumes()->detach($volumeId);
    }

    public function detachSeriesFromUser(int $seriesId, int $userId): void
    {
        $user = EloquentUser::findOrFail($userId);

        // Subquery to find all volume IDs belonging to the given series
        $volumeIds = EloquentVolume::whereHas('edition', function ($query) use ($seriesId) {
            $query->where('series_id', $seriesId);
        })->pluck('id')->toArray();

        if (count($volumeIds) > 0) {
            $user->volumes()->detach($volumeIds);
        }
    }

    public function isOwnedByUser(int $volumeId, int $userId): bool
    {
        $user = EloquentUser::findOrFail($userId);

        return $user->volumes()->where('volume_id', $volumeId)->exists();
    }

    /**
     * @return Volume[]
     */
    public function findByUserId(int $userId): array
    {
        $user = EloquentUser::findOrFail($userId);

        // Eager-load edition.series and filter active loans (returned_at IS NULL)
        // in a single additional query, avoiding N+1 on is_owned / is_loaned / loaned_to.
        $eloquentVolumes = $user->volumes()
            ->with([
                'edition.series',
                'loans' => fn ($q) => $q->where('user_id', $userId)->whereNull('returned_at'),
            ])
            ->get();

        /** @var array<int, Volume> $volumes */
        $volumes = $eloquentVolumes
            ->map(function (EloquentVolume $v): Volume {
                /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Borrowing\Infrastructure\EloquentModels\Loan> $activeLoans */
                $activeLoans = $v->loans;
                $activeLoan = $activeLoans->first();

                return $this->toDomain(
                    $v,
                    isOwned: true,
                    isLoaned: $activeLoan !== null,
                    loanedTo: $activeLoan?->borrower_name,
                );
            })
            ->toArray();

        return $volumes;
    }

    private function toDomain(
        EloquentVolume $eloquent,
        bool $isOwned = false,
        bool $isLoaned = false,
        ?string $loanedTo = null,
    ): Volume {
        return \App\Manga\Infrastructure\Mappers\VolumeMapper::toDomain(
            $eloquent,
            isOwned: $isOwned,
            isLoaned: $isLoaned,
            loanedTo: $loanedTo,
        );
    }
}
