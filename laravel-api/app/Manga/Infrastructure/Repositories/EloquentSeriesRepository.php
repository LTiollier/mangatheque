<?php

namespace App\Manga\Infrastructure\Repositories;

use App\Manga\Application\DTOs\CreateSeriesDTO;
use App\Manga\Domain\Models\Series;
use App\Manga\Domain\Repositories\SeriesRepositoryInterface;
use App\Manga\Infrastructure\EloquentModels\Series as EloquentSeries;
use App\Manga\Infrastructure\Mappers\SeriesMapper;

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

    public function create(CreateSeriesDTO $dto): Series
    {
        $eloquent = EloquentSeries::create([
            'title' => $dto->title,
            'authors' => $dto->authors,
            'api_id' => $dto->apiId,
        ]);

        return $this->toDomain($eloquent);
    }

    private function toDomain(EloquentSeries $eloquent): Series
    {
        return SeriesMapper::toDomain($eloquent);
    }
}
