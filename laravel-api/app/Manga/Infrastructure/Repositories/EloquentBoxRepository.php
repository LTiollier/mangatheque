<?php

namespace App\Manga\Infrastructure\Repositories;

use App\Manga\Application\DTOs\CreateBoxDTO;
use App\Manga\Domain\Models\Box;
use App\Manga\Domain\Repositories\BoxRepositoryInterface;
use App\Manga\Infrastructure\EloquentModels\Box as EloquentBox;
use App\Manga\Infrastructure\Mappers\BoxMapper;
use App\User\Infrastructure\EloquentModels\User as EloquentUser;

class EloquentBoxRepository implements BoxRepositoryInterface
{
    public function findById(int $id, ?int $userId = null): ?Box
    {
        $query = EloquentBox::query();

        if ($userId) {
            $query->withExists(['users as is_owned' => function ($u) use ($userId) {
                $u->where('users.id', $userId);
            }]);
            $query->withExists(['wishlistedBy as is_wishlisted' => function ($u) use ($userId) {
                $u->where('users.id', $userId);
            }]);
            $query->with(['volumes' => function ($q) use ($userId) {
                $q->withExists(['users as is_owned' => function ($u) use ($userId) {
                    $u->where('users.id', $userId);
                }]);
                $q->withExists(['wishlistedBy as is_wishlisted' => function ($u) use ($userId) {
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

    public function findByApiId(string $apiId): ?Box
    {
        $eloquent = EloquentBox::where('api_id', $apiId)->first();

        return $eloquent ? $this->toDomain($eloquent) : null;
    }

    /** @return Box[] */
    public function findByBoxSetId(int $boxSetId): array
    {
        $eloquentBoxes = EloquentBox::where('box_set_id', $boxSetId)->get();

        return $eloquentBoxes->map(fn (EloquentBox $b) => $this->toDomain($b))->all();
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

    /** @param array<int> $volumeIds */
    public function attachVolumes(int $boxId, array $volumeIds): void
    {
        /** @var EloquentBox|null $box */
        $box = EloquentBox::find($boxId);
        if ($box) {
            $box->volumes()->syncWithoutDetaching($volumeIds);
        }
    }

    public function attachToUser(int $boxId, int $userId): void
    {
        $user = EloquentUser::findOrFail($userId);
        $user->boxes()->syncWithoutDetaching([$boxId]);
    }

    public function detachFromUser(int $boxId, int $userId): void
    {
        $user = EloquentUser::findOrFail($userId);
        $user->boxes()->detach($boxId);
    }

    public function isOwnedByUser(int $boxId, int $userId): bool
    {
        $user = EloquentUser::findOrFail($userId);

        return $user->boxes()->where('box_id', $boxId)->exists();
    }

    private function toDomain(EloquentBox $eloquent): Box
    {
        return BoxMapper::toDomain($eloquent);
    }
}
