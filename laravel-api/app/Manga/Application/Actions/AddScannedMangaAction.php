<?php

namespace App\Manga\Application\Actions;

use App\Manga\Application\DTOs\ScanMangaDTO;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\EditionRepositoryInterface;
use App\Manga\Domain\Repositories\SeriesRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use App\Manga\Infrastructure\Services\MangaLookupService;
use Illuminate\Support\Facades\DB;

class AddScannedMangaAction
{
    public function __construct(
        private readonly MangaLookupService $lookupService,
        private readonly VolumeRepositoryInterface $volumeRepository,
        private readonly SeriesRepositoryInterface $seriesRepository,
        private readonly EditionRepositoryInterface $editionRepository,
    ) {}

    public function execute(ScanMangaDTO $dto): Volume
    {
        return DB::transaction(function () use ($dto) {
            // 1. Check if Volume exists in DB by ISBN
            $volume = $this->volumeRepository->findByIsbn($dto->isbn);

            if (! $volume) {
                // 2. Fetch from external service
                $volumeData = $this->lookupService->findByIsbn($dto->isbn);

                if (! $volumeData) {
                    throw new \Exception('Manga not found for barcode: '.$dto->isbn);
                }

                // 3. Handle Series and Edition
                // Simplified logic for now: Use the title from external service as Series title
                $title = $volumeData['title'] ?? 'Unknown Series';
                // Try to extract series name (e.g., "Naruto, Vol. 1" -> "Naruto")
                $seriesTitle = preg_replace('/[,]?\s?vol[.\s]*\d+$/i', '', $title);
                $seriesTitle = trim($seriesTitle);

                $series = $this->seriesRepository->findByTitle($seriesTitle);
                if (! $series) {
                    $series = $this->seriesRepository->create([
                        'title' => $seriesTitle,
                        'authors' => $volumeData['authors'] ?? [],
                        'cover_url' => $volumeData['cover_url'] ?? null,
                    ]);
                }

                $edition = $this->editionRepository->findByNameAndSeries('Standard', $series->getId());
                if (! $edition) {
                    $edition = $this->editionRepository->create([
                        'series_id' => $series->getId(),
                        'name' => 'Standard',
                        'language' => 'fr',
                    ]);
                }

                // 4. Create Volume in DB
                $volumeData['edition_id'] = $edition->getId();
                // Try to extract volume number from title
                if (preg_match('/vol[.\s]*(\d+)$/i', $title, $matches)) {
                    $volumeData['number'] = $matches[1];
                }

                $volume = $this->volumeRepository->create($volumeData);
            }

            // 5. Attach to user
            $this->volumeRepository->attachToUser($volume->getId(), $dto->userId);

            // 6. Dispatch Event
            event(new \App\Manga\Domain\Events\VolumeAddedToCollection($volume, $dto->userId));

            return $volume;
        });
    }
}
