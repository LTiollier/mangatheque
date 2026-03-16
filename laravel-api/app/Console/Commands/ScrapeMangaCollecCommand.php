<?php

namespace App\Console\Commands;

use App\Manga\Application\DTOs\CreateEditionDTO;
use App\Manga\Application\DTOs\CreateSeriesDTO;
use App\Manga\Application\DTOs\CreateVolumeDTO;
use App\Manga\Domain\Repositories\EditionRepositoryInterface;
use App\Manga\Domain\Repositories\SeriesRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use App\Manga\Infrastructure\Services\MangaCollecScraperService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ScrapeMangaCollecCommand extends Command
{
    protected $signature = 'app:scrape-mangacollec {--limit=2 : The number of series to scrape}';
    protected $description = 'Scrape manga data from MangaCollec API';

    public function __construct(
        private readonly MangaCollecScraperService $scraperService,
        private readonly SeriesRepositoryInterface $seriesRepository,
        private readonly EditionRepositoryInterface $editionRepository,
        private readonly VolumeRepositoryInterface $volumeRepository
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('Starting MangaCollec Scraper...');

        if (!$this->scraperService->login()) {
            $this->error('Failed to login to MangaCollec');
            return 1;
        }

        $seriesList = $this->scraperService->getSeriesList();
        $limit = (int) $this->option('limit');
        $count = 0;

        foreach ($seriesList as $seriesData) {
            if ($count >= $limit) {
                break;
            }

            $seriesUuid = $seriesData['id'];
            $this->info("Scraping series: {$seriesData['title']} ({$seriesUuid})");

            $detail = $this->scraperService->getSeriesDetail($seriesUuid);
            if (!$detail) {
                $this->warn("Could not get details for series {$seriesUuid}");
                continue;
            }

            DB::transaction(function () use ($detail, $seriesUuid) {
                // 1. Handle Series
                $series = $this->seriesRepository->findByApiId($seriesUuid);
                
                $authors = collect($detail['authors'] ?? [])->map(fn($a) => trim(($a['first_name'] ?? '') . ' ' . ($a['name'] ?? '')))->filter()->values()->toArray();
                $seriesTitle = $detail['series'][0]['title'] ?? $detail['title'] ?? 'Unknown';

                if (!$series) {
                    $series = $this->seriesRepository->create(new CreateSeriesDTO(
                        title: $seriesTitle,
                        authors: $authors,
                        apiId: $seriesUuid
                    ));
                }

                /** @var \App\Manga\Infrastructure\EloquentModels\Series|null $seriesModel */
                $seriesModel = \App\Manga\Infrastructure\EloquentModels\Series::find($series->getId());
                if ($seriesModel) {
                    $seriesModel->update([
                        'authors' => $authors,
                        'title' => $seriesTitle,
                    ]);
                }

                // 2. Handle Editions
                $editionsMap = [];
                foreach ($detail['editions'] ?? [] as $editionData) {
                    $editionName = $editionData['title'] ?? 'Standard';
                    $editionId = $editionData['id'];
                    $publisherId = $editionData['publisher_id'] ?? null;
                    $publisherName = null;

                    if ($publisherId) {
                        $publisher = collect($detail['publishers'] ?? [])->firstWhere('id', $publisherId);
                        $publisherName = $publisher['title'] ?? null;
                    }

                    $edition = $this->editionRepository->findByNameAndSeries($editionName, $series->getId());
                    if (!$edition) {
                        $edition = $this->editionRepository->create(new CreateEditionDTO(
                            seriesId: $series->getId(),
                            name: $editionName,
                            language: 'fr',
                            publisher: $publisherName
                        ));
                    }
                    $editionsMap[$editionId] = $edition->getId();
                }

                // 3. Handle Volumes
                $firstVolumeCover = null;

                foreach ($detail['volumes'] ?? [] as $volumeData) {
                    $volumeUuid = $volumeData['id'];
                    $isbn = $volumeData['isbn'] ?? null;
                    $coverUrl = $volumeData['image_url'] ?? null;

                    if (!$firstVolumeCover && $coverUrl) {
                        $firstVolumeCover = $coverUrl;
                    }
                    
                    if ($this->volumeRepository->findByApiId($volumeUuid)) {
                        continue;
                    }

                    if ($isbn && $this->volumeRepository->findByIsbn($isbn)) {
                        $this->warn("Skipping volume with existing ISBN: {$isbn}");
                        continue;
                    }

                    $mappedEditionId = $editionsMap[$volumeData['edition_id']] ?? null;
                    if (!$mappedEditionId) {
                        $mappedEditionId = reset($editionsMap) ?: null;
                    }

                    if (!$mappedEditionId) continue;

                    $this->volumeRepository->create(new CreateVolumeDTO(
                        editionId: $mappedEditionId,
                        title: ($seriesTitle) . ' #' . ($volumeData['number'] ?? '?'),
                        number: (string) ($volumeData['number'] ?? ''),
                        isbn: $isbn,
                        apiId: $volumeUuid,
                        authors: $authors, // Volumes usually share authors
                        publishedDate: $volumeData['release_date'] ?? null,
                        coverUrl: $coverUrl
                    ));
                }

                // Update series cover if we found one
                if ($firstVolumeCover && $seriesModel && !$seriesModel->cover_url) {
                    $seriesModel->update(['cover_url' => $firstVolumeCover]);
                }
            });

            $this->info("Finished series: {$seriesData['title']}");
            $count++;
        }

        $this->info('Scraping completed!');
        return 0;
    }
}
