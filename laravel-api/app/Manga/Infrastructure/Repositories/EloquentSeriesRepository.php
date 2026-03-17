<?php

namespace App\Manga\Infrastructure\Repositories;

use App\Manga\Application\DTOs\CreateSeriesDTO;
use App\Manga\Domain\Models\Series;
use App\Manga\Domain\Repositories\SeriesRepositoryInterface;
use App\Manga\Infrastructure\EloquentModels\Series as EloquentSeries;
use App\Manga\Infrastructure\Mappers\SeriesMapper;

class EloquentSeriesRepository implements SeriesRepositoryInterface
{
    public function findById(int $id, ?int $userId = null): ?Series
    {
        $query = EloquentSeries::query();

        if ($userId) {
            $query->with([
                'editions' => function ($q) use ($userId) {
                    $q->withCount(['volumes as possessed_volumes_count' => function ($v) use ($userId) {
                        $v->whereHas('users', fn ($u) => $u->where('users.id', $userId));
                    }]);
                    $q->with(['volumes' => function ($v) use ($userId) {
                        $v->select('volumes.id', 'volumes.edition_id', 'volumes.number')
                            ->whereHas('users', fn ($u) => $u->where('users.id', $userId));
                    }]);
                },
                'boxSets.boxes' => function ($q) use ($userId) {
                    $q->withCount('volumes');
                    $q->withCount(['volumes as possessed_volumes_count' => function ($v) use ($userId) {
                        $v->whereHas('users', fn ($u) => $u->where('users.id', $userId));
                    }]);
                    $q->withExists(['users as is_owned' => function ($u) use ($userId) {
                        $u->where('users.id', $userId);
                    }]);
                },
            ]);
        } else {
            $query->with(['editions', 'boxSets.boxes']);
        }

        $eloquent = $query->find($id);

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
