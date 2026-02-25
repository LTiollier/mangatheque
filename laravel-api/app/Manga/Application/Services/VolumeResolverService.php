<?php

namespace App\Manga\Application\Services;

use App\Manga\Application\DTOs\CreateEditionDTO;
use App\Manga\Application\DTOs\CreateSeriesDTO;
use App\Manga\Application\DTOs\CreateVolumeDTO;
use App\Manga\Domain\Exceptions\MangaNotFoundException;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\EditionRepositoryInterface;
use App\Manga\Domain\Repositories\SeriesRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use App\Manga\Domain\Services\MangaLookupServiceInterface;

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
            /** @var array<string> $authors */
            $authors = $volumeData['authors'] ?? [];
            $series = $this->seriesRepository->create(new CreateSeriesDTO(
                title: $seriesTitle,
                authors: $authors,
            ));
        }

        // Resolve or create Edition
        $edition = $this->editionRepository->findByNameAndSeries('Standard', $series->getId());
        if (! $edition) {
            $edition = $this->editionRepository->create(new CreateEditionDTO(
                seriesId: $series->getId(),
                name: 'Standard',
                language: 'fr',
            ));
        }

        // Enrich data with resolved Edition and volume number
        $number = null;
        if (preg_match('/(?:vol|volume|tome|t|#)[.\s]*(\d+)$/i', $title, $matches)) {
            $number = $matches[1];
        }

        /** @var string|null $isbn */
        $isbn = $volumeData['isbn'] ?? null;
        /** @var string|null $apiId */
        $apiId = $volumeData['api_id'] ?? null;
        /** @var array<string> $authors */
        $authors = $volumeData['authors'] ?? [];
        /** @var string|null $publishedDate */
        $publishedDate = $volumeData['published_date'] ?? null;
        /** @var string|null $coverUrl */
        $coverUrl = $volumeData['cover_url'] ?? null;

        return $this->volumeRepository->create(new CreateVolumeDTO(
            editionId: $edition->getId(),
            title: $title,
            number: $number,
            isbn: $isbn,
            apiId: $apiId,
            authors: $authors,
            publishedDate: $publishedDate,
            coverUrl: $coverUrl,
        ));
    }
}
