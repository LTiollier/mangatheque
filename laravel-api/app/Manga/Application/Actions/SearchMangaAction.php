<?php

namespace App\Manga\Application\Actions;

use App\Manga\Application\DTOs\SearchMangaDTO;
use App\Manga\Infrastructure\Services\MangaLookupService;

class SearchMangaAction
{
    public function __construct(
        private readonly MangaLookupService $lookupService
    ) {}

    public function execute(SearchMangaDTO $dto): array
    {
        return $this->lookupService->search($dto->query);
    }
}
