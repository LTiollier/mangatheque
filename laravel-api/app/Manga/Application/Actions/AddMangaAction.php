<?php

namespace App\Manga\Application\Actions;

use App\Manga\Application\DTOs\AddMangaDTO;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\EditionRepositoryInterface;
use App\Manga\Domain\Repositories\MangaLookupServiceInterface;
use App\Manga\Domain\Repositories\SeriesRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Illuminate\Support\Facades\DB;

class AddMangaAction
{
    public function __construct(
        private readonly MangaLookupServiceInterface $lookupService,
        private readonly VolumeRepositoryInterface $volumeRepository,
        private readonly SeriesRepositoryInterface $seriesRepository,
        private readonly EditionRepositoryInterface $editionRepository,
    ) {}

    public function execute(AddMangaDTO $dto): Volume
    {
        return DB::transaction(function () use ($dto) {
            // 1. Check if exists in DB
            $volume = $this->volumeRepository->findByApiId($dto->api_id);

            if (! $volume) {
                // 2. Fetch from external service
                $volumeData = $this->lookupService->findByApiId($dto->api_id);

                if (! $volumeData) {
                    throw new \Exception('Manga not found in external API with ID: '.$dto->api_id);
                }

                // 3. Handle Series and Edition
                /** @var string $title */
                $title = $volumeData['title'] ?? 'Unknown Series';
                $seriesTitle = preg_replace('/[,]?\s?[-]?\s?(vol|volume|tome|t|#)[.\s]*\d+$/i', '', $title) ?? $title;
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

                $volumeData['edition_id'] = $edition->getId();
                if (preg_match('/(?:vol|volume|tome|t|#)[.\s]*(\d+)$/i', $title, $matches)) {
                    $volumeData['number'] = $matches[1];
                }

                // 4. Create in DB
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
