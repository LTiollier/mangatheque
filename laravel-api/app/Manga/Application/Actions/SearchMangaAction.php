<?php

namespace App\Manga\Application\Actions;

use App\Manga\Application\DTOs\SearchMangaDTO;
use App\Manga\Domain\Repositories\MangaLookupServiceInterface;

class SearchMangaAction
{
    public function __construct(
        private readonly MangaLookupServiceInterface $lookupService
    ) {
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function execute(SearchMangaDTO $dto): array
    {
        return $this->lookupService->search($dto->query);
    }
}
