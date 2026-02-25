<?php

namespace App\Manga\Infrastructure\Mappers;

use App\Manga\Domain\Models\Edition;
use App\Manga\Infrastructure\EloquentModels\Edition as EloquentEdition;

class EditionMapper
{
    public static function toDomain(EloquentEdition $eloquent): Edition
    {
        return new Edition(
            id: $eloquent->id,
            series_id: $eloquent->series_id,
            name: $eloquent->name,
            publisher: $eloquent->publisher,
            language: $eloquent->language,
            total_volumes: $eloquent->total_volumes,
        );
    }
}
