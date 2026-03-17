<?php

namespace App\Manga\Infrastructure\Mappers;

use App\Manga\Domain\Models\BoxSet;
use App\Manga\Domain\Models\Edition;
use App\Manga\Domain\Models\Series;
use App\Manga\Infrastructure\EloquentModels\Series as EloquentSeries;

class SeriesMapper
{
    public static function toDomain(EloquentSeries $eloquent): Series
    {
        $authors = $eloquent->authors;

        /** @var string|null $description */
        $description = $eloquent->getAttribute('description');
        /** @var string|null $status */
        $status = $eloquent->getAttribute('status');
        /** @var int|null $totalVolumes */
        $totalVolumes = $eloquent->getAttribute('total_volumes');

        /** @var array<Edition> $editions */
        $editions = $eloquent->relationLoaded('editions')
            ? $eloquent->editions->map(fn ($e) => EditionMapper::toDomain($e))->toArray()
            : [];

        /** @var array<BoxSet> $boxSets */
        $boxSets = $eloquent->relationLoaded('boxSets')
            ? $eloquent->boxSets->map(fn ($bs) => BoxSetMapper::toDomain($bs))->toArray()
            : [];

        return new Series(
            id: $eloquent->id,
            api_id: $eloquent->api_id,
            title: $eloquent->title,
            authors: $authors,
            cover_url: $eloquent->cover_url,
            description: $description,
            status: $status,
            totalVolumes: $totalVolumes,
            editions: $editions,
            boxSets: $boxSets,
        );
    }
}
