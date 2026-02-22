<?php

namespace App\Manga\Application\Actions;

use App\Manga\Domain\Models\Manga;
use App\Manga\Domain\Repositories\MangaRepositoryInterface;

class ListUserMangasAction
{
    public function __construct(
        private readonly MangaRepositoryInterface $mangaRepository
    ) {}

    /**
     * @return Manga[]
     */
    public function execute(int $userId): array
    {
        return $this->mangaRepository->findByUserId($userId);
    }
}
