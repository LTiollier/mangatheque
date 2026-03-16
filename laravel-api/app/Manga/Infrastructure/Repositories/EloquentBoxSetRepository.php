<?php

namespace App\Manga\Infrastructure\Repositories;

use App\Manga\Application\DTOs\CreateBoxSetDTO;
use App\Manga\Domain\Models\BoxSet;
use App\Manga\Domain\Repositories\BoxSetRepositoryInterface;
use App\Manga\Infrastructure\EloquentModels\BoxSet as EloquentBoxSet;
use App\Manga\Infrastructure\Mappers\BoxSetMapper;

class EloquentBoxSetRepository implements BoxSetRepositoryInterface
{
    public function findByApiId(string $apiId): ?BoxSet
    {
        $eloquent = EloquentBoxSet::where('api_id', $apiId)->first();

        return $eloquent ? $this->toDomain($eloquent) : null;
    }

    public function create(CreateBoxSetDTO $dto): BoxSet
    {
        $eloquent = EloquentBoxSet::create([
            'series_id' => $dto->seriesId,
            'title' => $dto->title,
            'publisher' => $dto->publisher,
            'api_id' => $dto->apiId,
        ]);

        return $this->toDomain($eloquent);
    }

    private function toDomain(EloquentBoxSet $eloquent): BoxSet
    {
        return BoxSetMapper::toDomain($eloquent);
    }
}
