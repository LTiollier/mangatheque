<?php

namespace App\Manga\Infrastructure\Repositories;

use App\Manga\Domain\Models\Edition;
use App\Manga\Domain\Models\Series;
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
        /** @var array<int, string> $authors */
        $authors = $eloquent->authors ?? [];

        $edition = null;
        $series = null;

        if ($eloquent->relationLoaded('edition') && $eloquent->edition) {
            $edition = new Edition(
                id: $eloquent->edition->id,
                series_id: $eloquent->edition->series_id,
                name: $eloquent->edition->name,
                publisher: $eloquent->edition->publisher,
                language: $eloquent->edition->language,
                total_volumes: $eloquent->edition->total_volumes,
            );

            if ($eloquent->edition->relationLoaded('series') && $eloquent->edition->series) {
                /** @var array<int, string> $seriesAuthors */
                $seriesAuthors = $eloquent->edition->series->authors ?? [];

                $series = new Series(
                    id: $eloquent->edition->series->id,
                    api_id: $eloquent->edition->series->api_id,
                    title: $eloquent->edition->series->title,
                    authors: $seriesAuthors,
                    description: $eloquent->edition->series->description,
                    status: $eloquent->edition->series->status,
                    total_volumes: $eloquent->edition->series->total_volumes,
                    cover_url: $eloquent->edition->series->cover_url,
                );
            }
        }

        return new Volume(
            id: $eloquent->id,
            edition_id: $eloquent->edition_id ?? 0,
            api_id: $eloquent->api_id,
            isbn: $eloquent->isbn,
            number: $eloquent->number,
            title: $eloquent->title,
            authors: $authors,
            description: $eloquent->description,
            published_date: $eloquent->published_date,
            page_count: $eloquent->page_count,
            cover_url: $eloquent->cover_url,
            edition: $edition,
            series: $series,
            isOwned: $isOwned,
            isLoaned: $isLoaned,
            loanedTo: $loanedTo,
        );
    }
}
