<?php

namespace App\Manga\Application\Services;

use App\Manga\Domain\Exceptions\MangaNotFoundException;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\EditionRepositoryInterface;
use App\Manga\Domain\Repositories\MangaLookupServiceInterface;
use App\Manga\Domain\Repositories\SeriesRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;

class VolumeResolverService
{
    public function __construct(
        private readonly MangaLookupServiceInterface $lookupService,
        private readonly VolumeRepositoryInterface $volumeRepository,
        private readonly SeriesRepositoryInterface $seriesRepository,
        private readonly EditionRepositoryInterface $editionRepository,
    ) {}

    /**
     * Resolve a Volume by ISBN. If it does not exist locally, fetch it from the
     * external service and persist the full Series → Edition → Volume hierarchy.
     *
     * @throws MangaNotFoundException
     */
    public function resolveByIsbn(string $isbn): Volume
    {
        $volume = $this->volumeRepository->findByIsbn($isbn);

        if ($volume) {
            return $volume;
        }

        $volumeData = $this->lookupService->findByIsbn($isbn);

        if (! $volumeData) {
            throw new MangaNotFoundException('Manga not found for barcode: '.$isbn);
        }

        return $this->persistHierarchy($volumeData);
    }

    /**
     * Resolve a Volume by external API ID. If it does not exist locally, fetch
     * it from the external service and persist the full hierarchy.
     *
     * @throws MangaNotFoundException
     */
    public function resolveByApiId(string $apiId): Volume
    {
        $volume = $this->volumeRepository->findByApiId($apiId);

        if ($volume) {
            return $volume;
        }

        $volumeData = $this->lookupService->findByApiId($apiId);

        if (! $volumeData) {
            throw new MangaNotFoundException('Manga not found in external API with ID: '.$apiId);
        }

        return $this->persistHierarchy($volumeData);
    }

    /**
     * Extract the series title from a full volume title.
     * e.g. "Naruto, Vol. 1" → "Naruto"
     */
    public static function extractSeriesTitle(string $volumeTitle): string
    {
        $seriesTitle = preg_replace('/[,]?\s?[-]?\s?(vol|volume|tome|t|#)[.\s]*\d+$/i', '', $volumeTitle) ?? $volumeTitle;

        return trim($seriesTitle);
    }

    /**
     * Persist the Series → Edition → Volume hierarchy from raw external data and
     * return the created Volume domain model.
     *
     * @param  array<string, mixed>  $volumeData
     */
    private function persistHierarchy(array $volumeData): Volume
    {
        /** @var string $title */
        $title = $volumeData['title'] ?? 'Unknown Series';

        $seriesTitle = self::extractSeriesTitle($title);

        // Resolve or create Series
        $series = $this->seriesRepository->findByTitle($seriesTitle);
        if (! $series) {
            $series = $this->seriesRepository->create([
                'title' => $seriesTitle,
                'authors' => $volumeData['authors'] ?? [],
                'cover_url' => $volumeData['cover_url'] ?? null,
            ]);
        }

        // Resolve or create Edition
        $edition = $this->editionRepository->findByNameAndSeries('Standard', $series->getId());
        if (! $edition) {
            $edition = $this->editionRepository->create([
                'series_id' => $series->getId(),
                'name' => 'Standard',
                'language' => 'fr',
            ]);
        }

        // Enrich data with resolved Edition and volume number
        $volumeData['edition_id'] = $edition->getId();
        if (preg_match('/(?:vol|volume|tome|t|#)[.\s]*(\d+)$/i', $title, $matches)) {
            $volumeData['number'] = $matches[1];
        }

        return $this->volumeRepository->create($volumeData);
    }
}
