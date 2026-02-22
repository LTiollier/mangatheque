<?php

namespace App\Manga\Infrastructure\Repositories;

use App\Manga\Domain\Models\Manga;
use App\Manga\Domain\Repositories\MangaRepositoryInterface;
use App\Manga\Infrastructure\EloquentModels\Manga as EloquentManga;
use App\User\Infrastructure\EloquentModels\User as EloquentUser;

class EloquentMangaRepository implements MangaRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Manga
    {
        $eloquent = EloquentManga::create($data);

        return $this->toDomain($eloquent);
    }

    public function findByApiId(string $apiId): ?Manga
    {
        $eloquent = EloquentManga::where('api_id', $apiId)->first();

        return $eloquent ? $this->toDomain($eloquent) : null;
    }

    public function findByIsbn(string $isbn): ?Manga
    {
        $eloquent = EloquentManga::where('isbn', $isbn)->first();

        return $eloquent ? $this->toDomain($eloquent) : null;
    }

    public function attachToUser(int $mangaId, int $userId): void
    {
        $user = EloquentUser::findOrFail($userId);
        $user->mangas()->syncWithoutDetaching([$mangaId]);
    }

    /**
     * @return Manga[]
     */
    public function findByUserId(int $userId): array
    {
        $user = EloquentUser::findOrFail($userId);

        /** @var array<int, Manga> $mangas */
        $mangas = $user->mangas->map(fn (EloquentManga $m) => $this->toDomain($m))->toArray();

        return $mangas;
    }

    private function toDomain(EloquentManga $eloquent): Manga
    {
        /** @var array<int, string> $authors */
        $authors = $eloquent->authors ?? [];

        return new Manga(
            id: $eloquent->id,
            api_id: $eloquent->api_id,
            isbn: $eloquent->isbn,
            title: $eloquent->title,
            authors: $authors,
            description: $eloquent->description,
            published_date: $eloquent->published_date,
            page_count: $eloquent->page_count,
            cover_url: $eloquent->cover_url,
        );
    }
}
