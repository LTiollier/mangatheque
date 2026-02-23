<?php

namespace App\Manga\Infrastructure\Repositories;

use App\Manga\Domain\Models\Series;
use App\Manga\Domain\Repositories\SeriesRepositoryInterface;
use App\Manga\Infrastructure\EloquentModels\Series as EloquentSeries;

class EloquentSeriesRepository implements SeriesRepositoryInterface
{
    public function findById(int $id): ?Series
    {
        $eloquent = EloquentSeries::find($id);

        return $eloquent ? $this->toDomain($eloquent) : null;
    }

    public function findByTitle(string $title): ?Series
    {
        $eloquent = EloquentSeries::where('title', $title)->first();

        return $eloquent ? $this->toDomain($eloquent) : null;
    }

    public function findByApiId(string $apiId): ?Series
    {
        $eloquent = EloquentSeries::where('api_id', $apiId)->first();

        return $eloquent ? $this->toDomain($eloquent) : null;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Series
    {
        $eloquent = EloquentSeries::create($data);

        return $this->toDomain($eloquent);
    }

    private function toDomain(EloquentSeries $eloquent): Series
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
