<?php

namespace App\Manga\Infrastructure\Mappers;

use App\Manga\Domain\Models\Volume;
use App\Manga\Infrastructure\EloquentModels\Volume as EloquentVolume;

class VolumeMapper
{
    public static function toDomain(
        EloquentVolume $eloquent,
        ?bool $isOwned = null,
        ?bool $isLoaned = null,
        ?string $loanedTo = null,
    ): Volume {
        $edition = null;
        $series = null;

        if ($eloquent->relationLoaded('edition') && $eloquent->edition) {
            $edition = EditionMapper::toDomain($eloquent->edition);

            if ($eloquent->edition->relationLoaded('series') && $eloquent->edition->series) {
                $series = SeriesMapper::toDomain($eloquent->edition->series);
            }
        }

        $boxTitle = null;
        if ($eloquent->relationLoaded('boxes') && $eloquent->boxes->isNotEmpty()) {
            $boxTitle = $eloquent->boxes->first()->title;
        }

        return new Volume(
            $eloquent->id,
            $eloquent->edition_id ?? 0,
            $eloquent->api_id,
            $eloquent->isbn,
            $eloquent->number,
            $eloquent->title,
            $eloquent->published_date,
            $eloquent->cover_url,
            $edition,
            $series,
            $isOwned ?? (bool) ($eloquent->is_owned ?? false),
            $isLoaned ?? (bool) ($eloquent->is_loaned ?? false),
            $loanedTo ?? ($eloquent->loaned_to ?? null),
            (bool) ($eloquent->is_wishlisted ?? false),
            $boxTitle,
        );
    }
}
