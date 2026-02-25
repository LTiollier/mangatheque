<?php

namespace App\Manga\Infrastructure\Repositories;

use App\Manga\Domain\Models\Edition;
use App\Manga\Domain\Repositories\EditionRepositoryInterface;
use App\Manga\Infrastructure\EloquentModels\Edition as EloquentEdition;

class EloquentEditionRepository implements EditionRepositoryInterface
{
    public function findById(int $id): ?Edition
    {
        $eloquent = EloquentEdition::find($id);

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

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Edition
    {
        $eloquent = EloquentEdition::create($data);

        return $this->toDomain($eloquent);
    }

    private function toDomain(EloquentEdition $eloquent): Edition
    {
        return \App\Manga\Infrastructure\Mappers\EditionMapper::toDomain($eloquent);
    }
}
