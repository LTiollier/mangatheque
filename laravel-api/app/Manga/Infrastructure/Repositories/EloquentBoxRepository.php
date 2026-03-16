<?php

namespace App\Manga\Infrastructure\Repositories;

use App\Manga\Application\DTOs\CreateBoxDTO;
use App\Manga\Domain\Models\Box;
use App\Manga\Domain\Repositories\BoxRepositoryInterface;
use App\Manga\Infrastructure\EloquentModels\Box as EloquentBox;
use App\Manga\Infrastructure\Mappers\BoxMapper;

class EloquentBoxRepository implements BoxRepositoryInterface
{
    public function findByApiId(string $apiId): ?Box
    {
        $eloquent = EloquentBox::where('api_id', $apiId)->first();

        return $eloquent ? $this->toDomain($eloquent) : null;
    }

    public function findByIsbn(string $isbn): ?Box
    {
        $eloquent = EloquentBox::where('isbn', $isbn)->first();

        return $eloquent ? $this->toDomain($eloquent) : null;
    }

    public function create(CreateBoxDTO $dto): Box
    {
        $eloquent = EloquentBox::create([
            'box_set_id' => $dto->boxSetId,
            'title' => $dto->title,
            'number' => $dto->number,
            'isbn' => $dto->isbn,
            'api_id' => $dto->apiId,
            'release_date' => $dto->releaseDate,
            'cover_url' => $dto->coverUrl,
            'is_empty' => $dto->isEmpty,
        ]);

        return $this->toDomain($eloquent);
    }

    public function attachVolumes(int $boxId, array $volumeIds): void
    {
        /** @var EloquentBox|null $box */
        $box = EloquentBox::find($boxId);
        if ($box) {
            $box->volumes()->syncWithoutDetaching($volumeIds);
        }
    }

    private function toDomain(EloquentBox $eloquent): Box
    {
        return BoxMapper::toDomain($eloquent);
    }
}
