<?php

namespace App\Manga\Infrastructure\Mappers;

use App\Manga\Domain\Models\Box;
use App\Manga\Domain\Models\BoxSet;
use App\Manga\Infrastructure\EloquentModels\BoxSet as EloquentBoxSet;

class BoxSetMapper
{
    public static function toDomain(EloquentBoxSet $eloquent): BoxSet
    {
        /** @var array<Box> $boxes */
        $boxes = $eloquent->relationLoaded('boxes')
            ? $eloquent->boxes->map(fn ($b) => BoxMapper::toDomain($b))->toArray()
            : [];

        return new BoxSet(
            id: $eloquent->id,
            series_id: $eloquent->series_id,
            title: $eloquent->title,
            publisher: $eloquent->publisher,
            api_id: $eloquent->api_id,
            boxes: $boxes,
            cover_url: $eloquent->relationLoaded('firstBox') && $eloquent->firstBox ? $eloquent->firstBox->cover_url : null,
            is_wishlisted: (bool) ($eloquent->is_wishlisted ?? false),
        );
    }
}
