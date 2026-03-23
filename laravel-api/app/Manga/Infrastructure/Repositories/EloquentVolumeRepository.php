<?php

declare(strict_types=1);

namespace App\Manga\Infrastructure\Repositories;

use App\Borrowing\Infrastructure\EloquentModels\Loan;
use App\Manga\Application\DTOs\CreateVolumeDTO;
use App\Manga\Domain\Models\Edition;
use App\Manga\Domain\Models\Series;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use App\Manga\Infrastructure\EloquentModels\Volume as EloquentVolume;
use App\Manga\Infrastructure\Mappers\VolumeMapper;
use App\User\Infrastructure\EloquentModels\User as EloquentUser;
use Illuminate\Database\Eloquent\Collection;

final class EloquentVolumeRepository implements VolumeRepositoryInterface
{
    public function create(CreateVolumeDTO $dto): Volume
    {
        $eloquent = EloquentVolume::create([
            'edition_id' => $dto->editionId,
            'title' => $dto->title,
            'number' => $dto->number,
            'isbn' => $dto->isbn,
            'api_id' => $dto->apiId,
            'published_date' => $dto->publishedDate,
            'cover_url' => $dto->coverUrl,
        ]);

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

    public function findByEditionAndIsbn(int $editionId, string $isbn): ?Volume
    {
        $eloquent = EloquentVolume::where('edition_id', $editionId)->where('isbn', $isbn)->first();

        return $eloquent ? $this->toDomain($eloquent) : null;
    }

    /**
     * @return Volume[]
     */
    public function findByEditionId(int $editionId): array
    {
        /** @var int|null $userId */
        $userId = auth()->id();

        $eloquentVolumes = EloquentVolume::where('edition_id', $editionId)
            ->with(['edition.series'])
            ->when($userId, function ($query) use ($userId) {
                $query->with(['users' => function ($q) use ($userId) {
                    $q->where('users.id', $userId);
                }]);
            })
            ->orderByRaw('CAST(number AS DECIMAL) ASC')
            ->get();

        /** @var array<int, Volume> $volumes */
        $volumes = $eloquentVolumes->map(function (EloquentVolume $v) use ($userId) {
            $isOwned = $userId ? $v->users->isNotEmpty() : false;

            return $this->toDomain($v, isOwned: $isOwned);
        })->toArray();

        return $volumes;
    }

    public function findByIsbn(string $isbn): ?Volume
    {
        $eloquent = EloquentVolume::where('isbn', $isbn)->first();

        return $eloquent ? $this->toDomain($eloquent) : null;
    }

    public function findByIsbnWithRelations(string $isbn): ?Volume
    {
        $eloquent = EloquentVolume::where('isbn', $isbn)
            ->with(['edition.series'])
            ->first();

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

    /** @param int[] $volumeIds */
    public function detachManyFromUser(array $volumeIds, int $userId): void
    {
        $user = EloquentUser::findOrFail($userId);
        $user->volumes()->detach($volumeIds);
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

    /**
     * @param  array<int, string>  $apiIds
     * @return array{attached: int, found: int}
     */
    public function attachByApiIdsToUser(array $apiIds, int $userId): array
    {
        $localIds = EloquentVolume::whereIn('api_id', $apiIds)->pluck('id')->toArray();
        $user = EloquentUser::findOrFail($userId);

        $sync = $user->volumes()->syncWithoutDetaching($localIds);

        return [
            'attached' => count($sync['attached']),
            'found' => count($localIds),
        ];
    }

    public function isOwnedByUser(int $volumeId, int $userId): bool
    {
        $user = EloquentUser::findOrFail($userId);

        return $user->volumes()->where('volume_id', $volumeId)->exists();
    }

    /** @param int[] $volumeIds */
    public function areAllOwnedByUser(array $volumeIds, int $userId): bool
    {
        if (empty($volumeIds)) {
            return true;
        }

        $user = EloquentUser::findOrFail($userId);

        $ownedCount = $user->volumes()
            ->whereIn('volume_id', $volumeIds)
            ->count();

        return $ownedCount === count(array_unique($volumeIds));
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
            ->orderByRaw('CAST(number AS DECIMAL) ASC')
            ->get();

        /** @var array<int, Volume> $volumes */
        $volumes = $eloquentVolumes
            ->map(function (EloquentVolume $v): Volume {
                /** @var Collection<int, Loan> $activeLoans */
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

    /** @param array<string, mixed> $data */
    public function update(int $id, array $data): void
    {
        EloquentVolume::query()->where('id', $id)->update($data);
    }

    private function toDomain(
        EloquentVolume $eloquent,
        bool $isOwned = false,
        bool $isLoaned = false,
        ?string $loanedTo = null,
    ): Volume {
        return VolumeMapper::toDomain(
            $eloquent,
            isOwned: $isOwned,
            isLoaned: $isLoaned,
            loanedTo: $loanedTo,
        );
    }
}
