<?php

declare(strict_types=1);

namespace App\Manga\Infrastructure\Policies;

use App\Borrowing\Infrastructure\EloquentModels\LoanItem;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\User\Infrastructure\EloquentModels\User;

class VolumePolicy
{
    /**
     * Determine if the user can loan the volume.
     */
    public function loan(User $user, Volume $volume): bool
    {
        return $volume->users()->where('user_id', $user->id)->exists();
    }

    /**
     * Determine if the user can return the volume.
     */
    public function return(User $user, Volume $volume): bool
    {
        return $volume->users()->where('user_id', $user->id)->exists()
            && LoanItem::query()
                ->where('loanable_type', 'volume')
                ->where('loanable_id', $volume->id)
                ->whereHas('loan', fn ($q) => $q
                    ->where('user_id', $user->id)
                    ->whereNull('returned_at')
                )
                ->exists();
    }

    /**
     * Determine if the user can remove the volume from their collection.
     */
    public function delete(User $user, Volume $volume): bool
    {
        return $volume->users()->where('user_id', $user->id)->exists();
    }

    /**
     * Determine if the user can remove multiple volumes from their collection.
     *
     * @param  int[]  $volumeIds
     */
    public function deleteMany(User $user, array $volumeIds): bool
    {
        if (empty($volumeIds)) {
            return true;
        }

        $ownedCount = $user->volumes()
            ->whereIn('volume_id', $volumeIds)
            ->count();

        return $ownedCount === count(array_unique($volumeIds));
    }
}
