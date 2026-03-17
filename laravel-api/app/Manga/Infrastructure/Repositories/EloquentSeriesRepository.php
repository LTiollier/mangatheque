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
        $eloquent = EloquentSeries::with(['editions', 'boxSets.boxes'])->find($id);

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

    /**
     * @return Series[]
     */
    public function search(string $query): array
    {
        $eloquentSeries = EloquentSeries::whereRaw('LOWER(title) LIKE ?', ['%'.strtolower($query).'%'])
            ->orWhereRaw('LOWER(authors) LIKE ?', ['%'.strtolower($query).'%'])
            ->get();

        /** @var array<int, Series> $series */
        $series = $eloquentSeries->map(fn (EloquentSeries $s) => $this->toDomain($s))->toArray();

        return $series;
    }

    private function toDomain(EloquentSeries $eloquent): Series
    {
        return SeriesMapper::toDomain($eloquent);
    }
}
