<?php

namespace App\Manga\Infrastructure\Mappers;

use App\Manga\Domain\Models\Box;
use App\Manga\Domain\Models\Volume;
use App\Manga\Infrastructure\EloquentModels\Box as EloquentBox;
use App\Manga\Infrastructure\EloquentModels\Volume as EloquentVolume;

class BoxMapper
{
    public static function toDomain(EloquentBox $eloquent): Box
    {
        /** @var Volume[] $volumes */
        $volumes = $eloquent->relationLoaded('volumes')
            ? $eloquent->volumes->map(function ($v) {
                /** @var EloquentVolume $v */
                return VolumeMapper::toDomain(
                    $v,
                    isOwned: (bool) ($v->is_owned ?? false)
                );
            })->all()
            : [];

        return new Box(
            $eloquent->id,
            $eloquent->box_set_id,
            $eloquent->title,
            $eloquent->number,
            $eloquent->isbn,
            $eloquent->api_id,
            $eloquent->release_date,
            $eloquent->cover_url,
            (bool) $eloquent->is_empty,
            $volumes,
            isset($eloquent->is_owned) ? (bool) $eloquent->is_owned : null,
            (bool) ($eloquent->is_wishlisted ?? false),
            isset($eloquent->volumes_count) ? (int) $eloquent->volumes_count : null,
            isset($eloquent->possessed_volumes_count) ? (int) $eloquent->possessed_volumes_count : null,
        );
    }
}
