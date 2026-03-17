<?php

namespace App\Manga\Infrastructure\Policies;

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
            && $volume->loans()->where('user_id', $user->id)->whereNull('returned_at')->exists();
    }

    /**
     * Determine if the user can remove the volume from their collection.
     */
    public function delete(User $user, Volume $volume): bool
    {
        return $volume->users()->where('user_id', $user->id)->exists();
    }
}
