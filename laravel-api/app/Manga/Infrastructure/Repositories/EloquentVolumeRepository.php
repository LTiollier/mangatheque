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

    /**
     * @return Volume[]
     */
    public function findByUserId(int $userId): array
    {
        $user = EloquentUser::findOrFail($userId);

        /** @var array<int, Volume> $volumes */
        $volumes = $user->volumes()
            ->with(['edition.series'])
            ->get()
            ->map(fn (EloquentVolume $v) => $this->toDomain($v))
            ->toArray();

        return $volumes;
    }

    private function toDomain(EloquentVolume $eloquent): Volume
    {
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
        );
    }
}
