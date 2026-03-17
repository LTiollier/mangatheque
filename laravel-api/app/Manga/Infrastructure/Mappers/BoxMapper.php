<?php

namespace App\Manga\Infrastructure\Mappers;

use App\Manga\Domain\Models\Box;
use App\Manga\Infrastructure\EloquentModels\Box as EloquentBox;

class BoxMapper
{
    public static function toDomain(EloquentBox $eloquent): Box
    {
        /** @var \App\Manga\Domain\Models\Volume[] $volumes */
        $volumes = $eloquent->relationLoaded('volumes')
            ? $eloquent->volumes->map(function ($v) {
                /** @var \App\Manga\Infrastructure\EloquentModels\Volume $v */
                return VolumeMapper::toDomain(
                    $v,
                    isOwned: (bool) ($v->is_owned ?? false)
                );
            })->all()
            : [];

        return new Box(
            id: $eloquent->id,
            box_set_id: $eloquent->box_set_id,
            title: $eloquent->title,
            number: $eloquent->number,
            isbn: $eloquent->isbn,
            api_id: $eloquent->api_id,
            release_date: $eloquent->release_date,
            cover_url: $eloquent->cover_url,
            is_empty: (bool) $eloquent->is_empty,
            is_owned: isset($eloquent->is_owned) ? (bool) $eloquent->is_owned : null,
            volumes: $volumes,
        );
    }
}
