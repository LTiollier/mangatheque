<?php

namespace App\Manga\Infrastructure\Mappers;

use App\Manga\Domain\Models\Volume;
use App\Manga\Infrastructure\EloquentModels\Volume as EloquentVolume;

class VolumeMapper
{
    public static function toDomain(
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
            $edition = EditionMapper::toDomain($eloquent->edition);

            if ($eloquent->edition->relationLoaded('series') && $eloquent->edition->series) {
                $series = SeriesMapper::toDomain($eloquent->edition->series);
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
