<?php

namespace App\Manga\Infrastructure\Mappers;

use App\Manga\Domain\Models\BoxSet;
use App\Manga\Infrastructure\EloquentModels\BoxSet as EloquentBoxSet;

class BoxSetMapper
{
    public static function toDomain(EloquentBoxSet $eloquent): BoxSet
    {
        return new BoxSet(
            id: $eloquent->id,
            series_id: $eloquent->series_id,
            title: $eloquent->title,
            publisher: $eloquent->publisher,
            api_id: $eloquent->api_id,
        );
    }
}
