<?php

namespace App\Manga\Infrastructure\Repositories;

use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\WishlistRepositoryInterface;
use App\Manga\Infrastructure\EloquentModels\Volume as EloquentVolume;
use App\User\Infrastructure\EloquentModels\User as EloquentUser;

class EloquentWishlistRepository implements WishlistRepositoryInterface
{
    public function addWishlistToUser(int $volumeId, int $userId): void
    {
        $user = EloquentUser::findOrFail($userId);
        $user->wishlistVolumes()->syncWithoutDetaching([$volumeId]);
    }

    public function removeWishlistFromUser(int $volumeId, int $userId): void
    {
        $user = EloquentUser::findOrFail($userId);
        $user->wishlistVolumes()->detach($volumeId);
    }

    public function isWishlistedByUser(int $volumeId, int $userId): bool
    {
        $user = EloquentUser::findOrFail($userId);

        return $user->wishlistVolumes()->where('volume_id', $volumeId)->exists();
    }

    /**
     * @return Volume[]
     */
    public function findWishlistByUserId(int $userId): array
    {
        $user = EloquentUser::findOrFail($userId);

        /** @var array<int, Volume> $volumes */
        $volumes = $user->wishlistVolumes()
            ->with(['edition.series'])
            ->get()
            ->map(fn (EloquentVolume $v) => $this->toDomain($v))
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
