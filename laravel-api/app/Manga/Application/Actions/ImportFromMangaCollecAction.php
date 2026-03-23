<?php

declare(strict_types=1);

namespace App\Manga\Application\Actions;

use App\Manga\Application\DTOs\ImportMangaCollecDTO;
use App\Manga\Application\Jobs\MangaCollecImportJob;

final class ImportFromMangaCollecAction
{
    public function execute(ImportMangaCollecDTO $dto): void
    {
        MangaCollecImportJob::dispatch($this->dto_helper($dto));
    }

    /**
     * This is a helper to allow passing DTO to Job which will be serialized.
     * The DTO itself should be serializable.
     */
    private function dto_helper(ImportMangaCollecDTO $dto): ImportMangaCollecDTO
    {
        return $dto;
    }
}
