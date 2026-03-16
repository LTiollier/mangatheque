<?php

namespace App\Manga\Infrastructure\Mappers;

use App\Manga\Domain\Models\Box;
use App\Manga\Infrastructure\EloquentModels\Box as EloquentBox;

class BoxMapper
{
    public static function toDomain(EloquentBox $eloquent): Box
    {
        return new Box(
            id: $eloquent->id,
            box_set_id: $eloquent->box_set_id,
            title: $eloquent->title,
            number: $eloquent->number,
            isbn: $eloquent->isbn,
            api_id: $eloquent->api_id,
            release_date: $eloquent->release_date,
            cover_url: $eloquent->cover_url,
            is_empty: $eloquent->is_empty,
        );
    }
}
