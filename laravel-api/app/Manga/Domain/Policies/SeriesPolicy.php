<?php

namespace App\Manga\Domain\Policies;

use App\User\Infrastructure\EloquentModels\User;
use App\Manga\Infrastructure\EloquentModels\Series;

class SeriesPolicy
{
    /**
     * Determine if the user can remove the series from their collection.
     * They can do so if they have at least one volume of this series.
     */
    public function delete(User $user, Series $series): bool
    {
        return \App\Manga\Infrastructure\EloquentModels\Volume::query()
            ->whereHas('edition', function ($q) use ($series) {
                $q->where('series_id', $series->id);
            })
            ->whereHas('users', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->exists();
    }
}
