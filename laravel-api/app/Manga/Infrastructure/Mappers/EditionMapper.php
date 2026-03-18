<?php

namespace App\Manga\Infrastructure\Mappers;

use App\Manga\Domain\Models\Edition;
use App\Manga\Domain\Models\Volume;
use App\Manga\Infrastructure\EloquentModels\Edition as EloquentEdition;
use App\Manga\Infrastructure\EloquentModels\Volume as EloquentVolume;

class EditionMapper
{
    public static function toDomain(EloquentEdition $eloquent): Edition
    {
        /** @var int[] $possessed_numbers */
        $possessed_numbers = $eloquent->relationLoaded('volumes')
            ? $eloquent->volumes
                ->filter(fn ($v) => (bool) ($v->is_owned ?? false))
                ->map(fn ($v) => (int) $v->number)
                ->filter(fn ($n) => $n > 0)
                ->values()
                ->all()
            : [];

        /** @var Volume[] $volumes */
        $volumes = $eloquent->relationLoaded('volumes') && $eloquent->volumes->first()?->title
            ? $eloquent->volumes->map(function ($v) {
                /** @var EloquentVolume $v */
                return VolumeMapper::toDomain(
                    $v,
                    isOwned: (bool) ($v->is_owned ?? false)
                );
            })->all()
            : [];

        // An edition is wishlisted if all missing volumes are wishlisted
        $is_wishlisted = false;
        if ($eloquent->relationLoaded('volumes')) {
            $missingVolumes = $eloquent->volumes->filter(fn ($v) => ! ($v->is_owned ?? false));
            $is_wishlisted = $missingVolumes->isNotEmpty() && $missingVolumes->every(fn ($v) => (bool) ($v->is_wishlisted ?? false));
        }

        return new Edition(
            id: $eloquent->id,
            series_id: $eloquent->series_id,
            name: $eloquent->name,
            publisher: $eloquent->publisher,
            language: $eloquent->language,
            total_volumes: $eloquent->total_volumes,
            is_finished: (bool) $eloquent->is_finished,
            possessed_count: isset($eloquent->possessed_volumes_count) ? (int) $eloquent->possessed_volumes_count : null,
            possessed_numbers: $possessed_numbers,
            volumes: $volumes,
            cover_url: $eloquent->relationLoaded('firstVolume') && $eloquent->firstVolume ? $eloquent->firstVolume->cover_url : null,
            series: $eloquent->relationLoaded('series') && $eloquent->series
                ? SeriesMapper::toDomain($eloquent->series)
                : null,
            is_wishlisted: $is_wishlisted,
        );
    }
}
