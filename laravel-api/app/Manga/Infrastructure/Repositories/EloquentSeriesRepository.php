<?php

namespace App\Manga\Infrastructure\Repositories;

use App\Manga\Application\DTOs\CreateSeriesDTO;
use App\Manga\Domain\Models\Series;
use App\Manga\Domain\Repositories\SeriesRepositoryInterface;
use App\Manga\Infrastructure\EloquentModels\Series as EloquentSeries;
use App\Manga\Infrastructure\Mappers\SeriesMapper;
use Illuminate\Pagination\LengthAwarePaginator;

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
                    $q->withExists(['wishlistedBy as is_wishlisted' => function ($u) use ($userId) {
                        $u->where('users.id', $userId);
                    }]);
                    $q->with('firstVolume');
                    $q->with(['volumes' => function ($v) use ($userId) {
                        $v->withExists(['users as is_owned' => function ($u) use ($userId) {
                            $u->where('users.id', $userId);
                        }]);
                        $v->orderByRaw('CAST(number AS DECIMAL) ASC');
                    }]);
                },
                'boxSets' => function ($q) use ($userId) {
                    $q->with('firstBox');
                    $q->with(['boxes' => function ($q) use ($userId) {
                        $q->withCount('volumes');
                        $q->withCount(['volumes as possessed_volumes_count' => function ($v) use ($userId) {
                            $v->whereHas('users', fn ($u) => $u->where('users.id', $userId));
                        }]);
                        $q->withExists(['users as is_owned' => function ($u) use ($userId) {
                            $u->where('users.id', $userId);
                        }]);
                        $q->withExists(['wishlistedBy as is_wishlisted' => function ($u) use ($userId) {
                            $u->where('users.id', $userId);
                        }]);
                    }]);
                },
            ]);
        } else {
            $query->with(['editions', 'boxSets.boxes']);
        }

        $eloquent = $query->find($id);

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
     * @return LengthAwarePaginator<int, Series>
     */
    public function search(string $query, int $page = 1, int $perPage = 15, ?int $userId = null): LengthAwarePaginator
    {
        $baseQuery = EloquentSeries::whereRaw('LOWER(title) LIKE ?', ['%'.strtolower($query).'%'])
            ->orWhereRaw('LOWER(authors) LIKE ?', ['%'.strtolower($query).'%']);

        if ($userId !== null) {
            $baseQuery->with([
                'editions' => function ($q) use ($userId) {
                    $q->withCount(['volumes as possessed_volumes_count' => fn ($v) => $v->whereHas('users', fn ($u) => $u->where('users.id', $userId))]);
                    $q->withExists(['wishlistedBy as is_wishlisted' => fn ($u) => $u->where('users.id', $userId)]);
                    $q->with('firstVolume');
                },
                'boxSets' => function ($q) use ($userId) {
                    $q->withExists(['wishlistedBy as is_wishlisted' => fn ($u) => $u->where('users.id', $userId)]);
                    $q->with('firstBox');
                    $q->with(['boxes' => fn ($q) => $q->withExists(['users as is_owned' => fn ($u) => $u->where('users.id', $userId)])]);
                },
            ]);
        } else {
            $baseQuery->with([
                'editions' => fn ($q) => $q->with('firstVolume'),
                'boxSets' => fn ($q) => $q->with('firstBox'),
            ]);
        }

        return $baseQuery
            ->paginate($perPage, ['*'], 'page', $page)
            ->through(fn (EloquentSeries $s) => $this->toDomain($s));
    }

    private function toDomain(EloquentSeries $eloquent): Series
    {
        return SeriesMapper::toDomain($eloquent);
    }
}
