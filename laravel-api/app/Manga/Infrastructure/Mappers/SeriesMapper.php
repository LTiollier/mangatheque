<?php

namespace App\Manga\Infrastructure\Mappers;

use App\Manga\Domain\Models\Series;
use App\Manga\Infrastructure\EloquentModels\Series as EloquentSeries;

class SeriesMapper
{
    public static function toDomain(EloquentSeries $eloquent): Series
    {
        /** @var array<int, string> $authors */
        $authors = $eloquent->authors ?? [];

        return new Series(
            id: $eloquent->id,
            api_id: $eloquent->api_id,
            title: $eloquent->title,
            authors: $authors,
            description: $eloquent->description,
            status: $eloquent->status,
            total_volumes: $eloquent->total_volumes,
            cover_url: $eloquent->cover_url,
        );
    }
}
