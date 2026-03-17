<?php

namespace App\Manga\Infrastructure\Repositories;

use App\Manga\Application\DTOs\CreateEditionDTO;
use App\Manga\Domain\Models\Edition;
use App\Manga\Domain\Repositories\EditionRepositoryInterface;
use App\Manga\Infrastructure\EloquentModels\Edition as EloquentEdition;
use App\Manga\Infrastructure\Mappers\EditionMapper;

class EloquentEditionRepository implements EditionRepositoryInterface
{
    public function findById(int $id, ?int $userId = null): ?Edition
    {
        $query = EloquentEdition::query();
        $query->with('series');

        if ($userId) {
            $query->withCount(['volumes as possessed_volumes_count' => function ($v) use ($userId) {
                $v->whereHas('users', fn ($u) => $u->where('users.id', $userId));
            }]);
            $query->with(['volumes' => function ($q) use ($userId) {
                $q->withExists(['users as is_owned' => function ($u) use ($userId) {
                    $u->where('users.id', $userId);
                }]);
                $q->orderByRaw('CAST(number AS DECIMAL) ASC');
            }]);
        } else {
            $query->with(['volumes' => function ($q) {
                $q->orderByRaw('CAST(number AS DECIMAL) ASC');
            }]);
        }

        $eloquent = $query->find($id);

        return $eloquent ? $this->toDomain($eloquent) : null;
    }

    public function findByNameAndSeries(string $name, int $seriesId): ?Edition
    {
        $eloquent = EloquentEdition::where('name', $name)->where('series_id', $seriesId)->first();

        return $eloquent ? $this->toDomain($eloquent) : null;
    }

    /**
     * @return Edition[]
     */
    public function findBySeriesId(int $seriesId): array
    {
        /** @var array<int, Edition> $editions */
        $editions = EloquentEdition::where('series_id', $seriesId)
            ->get()
            ->map(fn (EloquentEdition $e) => $this->toDomain($e))
            ->toArray();

        return $editions;
    }

    public function create(CreateEditionDTO $dto): Edition
    {
        $eloquent = EloquentEdition::create([
            'series_id' => $dto->seriesId,
            'name' => $dto->name,
            'language' => $dto->language,
            'publisher' => $dto->publisher,
            'total_volumes' => $dto->totalVolumes,
            'is_finished' => $dto->isFinished,
        ]);

        return $this->toDomain($eloquent);
    }

    private function toDomain(EloquentEdition $eloquent): Edition
    {
        return EditionMapper::toDomain($eloquent);
    }
}
