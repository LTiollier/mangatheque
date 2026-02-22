<?php

namespace App\Manga\Application\Actions;

use App\Manga\Application\DTOs\ScanMangaDTO;
use App\Manga\Domain\Models\Manga;
use App\Manga\Domain\Repositories\MangaRepositoryInterface;
use App\Manga\Infrastructure\Services\MangaLookupService;
use Illuminate\Support\Facades\DB;

class AddScannedMangaAction
{
    public function __construct(
        private readonly MangaLookupService $lookupService,
        private readonly MangaRepositoryInterface $mangaRepository
    ) {}

    public function execute(ScanMangaDTO $dto): Manga
    {
        return DB::transaction(function () use ($dto) {
            // 1. Check if exists in DB by ISBN
            $manga = $this->mangaRepository->findByIsbn($dto->isbn);

            if (! $manga) {
                // 2. Fetch from external service
                $mangaData = $this->lookupService->findByIsbn($dto->isbn);

                if (! $mangaData) {
                    throw new \Exception('Manga not found for barcode: '.$dto->isbn);
                }

                // 3. Create in DB (using the data from the external service which should include api_id)
                $manga = $this->mangaRepository->create($mangaData);
            }

            // 4. Attach to user
            $this->mangaRepository->attachToUser($manga->getId(), $dto->userId);

            // 5. Dispatch Event
            event(new \App\Manga\Domain\Events\MangaAddedToCollection($manga, $dto->userId));

            return $manga;
        });
    }
}
