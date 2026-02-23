<?php

namespace App\Manga\Application\Actions;

use App\Manga\Application\DTOs\ScanBulkMangaDTO;
use App\Manga\Application\DTOs\ScanMangaDTO;
use App\Manga\Domain\Models\Volume;
use Illuminate\Support\Facades\DB;

class AddBulkScannedMangasAction
{
    public function __construct(
        private readonly AddScannedMangaAction $addScannedMangaAction
    ) {}

    /**
     * @return Volume[]
     */
    public function execute(ScanBulkMangaDTO $dto): array
    {
        return DB::transaction(function () use ($dto) {
            $volumes = [];
            foreach ($dto->isbns as $isbn) {
                try {
                    $singleDto = new ScanMangaDTO(isbn: $isbn, userId: $dto->userId);
                    $volumes[] = $this->addScannedMangaAction->execute($singleDto);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning("Failed to scan ISBN {$isbn}: ".$e->getMessage());
                }
            }

            return $volumes;
        });
    }
}
