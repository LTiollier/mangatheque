<?php

namespace App\Manga\Application\Actions;

use App\Manga\Application\DTOs\ImportMangaCollecDTO;
use App\Manga\Domain\Exceptions\MangaCollecProfilePrivateException;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use App\Manga\Infrastructure\Services\MangaCollecScraperService;
use App\Manga\Infrastructure\Services\MangaCollecSeriesImportService;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ImportFromMangaCollecAction
{
    public function __construct(
        private readonly MangaCollecScraperService $scraperService,
        private readonly MangaCollecSeriesImportService $importService,
        private readonly VolumeRepositoryInterface $volumeRepository,
    ) {}

    /**
     * @return array<string, int>
     */
    public function execute(ImportMangaCollecDTO $dto): array
    {
        $collection = $this->scraperService->getUserCollection($dto->username);

        if ($collection === null) {
            throw new MangaCollecProfilePrivateException('Unable to fetch collection. The profile might be private or invalid.');
        }

        /** @var array<int, array<string, mixed>> $volumes */
        $volumes = is_array($collection['volumes'] ?? null) ? $collection['volumes'] : [];
        /** @var array<int, array<string, mixed>> $editions */
        $editions = is_array($collection['editions'] ?? null) ? $collection['editions'] : [];

        // Build dictionaries to map edition -> series
        /** @var array<string, string> $editionToSeries */
        $editionToSeries = [];
        foreach ($editions as $edition) {
            /** @var string|null $editionId */
            $editionId = $edition['id'] ?? null;
            /** @var string|null $seriesBaseId */
            $seriesBaseId = $edition['series_id'] ?? null;
            if (is_string($editionId) && is_string($seriesBaseId)) {
                $editionToSeries[$editionId] = $seriesBaseId;
            }
        }

        $importedSeriesIds = []; // Keep track of series we already requested to import in this run
        $importedCount = 0;
        $failedCount = 0;

        foreach ($volumes as $volData) {
            /** @var string|null $isbn */
            $isbn = $volData['isbn'] ?? null;
            /** @var string|null $apiId */
            $apiId = $volData['id'] ?? null;
            /** @var string|null $editionId */
            $editionId = $volData['edition_id'] ?? null;

            if (! is_string($isbn) && ! is_string($apiId)) {
                $failedCount++;

                continue;
            }

            $volume = null;
            if (is_string($isbn) && $isbn !== '') {
                $volume = $this->volumeRepository->findByIsbn($isbn);
            }
            if (! $volume && is_string($apiId) && $apiId !== '') {
                $volume = $this->volumeRepository->findByApiId($apiId);
            }

            // If the volume is missing in our local DB, let's try to fetch its series and import it
            if (! $volume && is_string($editionId) && isset($editionToSeries[$editionId])) {
                $seriesId = $editionToSeries[$editionId];

                if (! in_array($seriesId, $importedSeriesIds, true)) {
                    $importedSeriesIds[] = $seriesId;
                    try {
                        $detail = $this->scraperService->getSeriesDetail($seriesId);
                        if ($detail) {
                            $this->importService->import($seriesId, $detail);
                        }
                    } catch (Exception $e) {
                        Log::error("Failed to import missing series {$seriesId}", ['error' => $e->getMessage()]);
                    }
                }

                // Try finding the volume again after importing the series
                if (is_string($isbn) && $isbn !== '') {
                    $volume = $this->volumeRepository->findByIsbn($isbn);
                }
                if (! $volume && is_string($apiId) && $apiId !== '') {
                    $volume = $this->volumeRepository->findByApiId($apiId);
                }
            }

            if ($volume) {
                DB::transaction(function () use ($volume, $dto) {
                    if (! $this->volumeRepository->isOwnedByUser($volume->getId(), $dto->userId)) {
                        $this->volumeRepository->attachToUser($volume->getId(), $dto->userId);
                    }
                });
                $importedCount++;
            } else {
                $failedCount++;
            }
        }

        return [
            'imported' => $importedCount,
            'failed' => $failedCount,
        ];
    }
}
