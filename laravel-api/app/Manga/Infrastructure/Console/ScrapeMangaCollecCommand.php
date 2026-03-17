<?php

namespace App\Manga\Infrastructure\Console;

use App\Manga\Application\DTOs\CreateBoxDTO;
use App\Manga\Application\DTOs\CreateBoxSetDTO;
use App\Manga\Application\DTOs\CreateEditionDTO;
use App\Manga\Application\DTOs\CreateSeriesDTO;
use App\Manga\Application\DTOs\CreateVolumeDTO;
use App\Manga\Domain\Repositories\BoxRepositoryInterface;
use App\Manga\Domain\Repositories\BoxSetRepositoryInterface;
use App\Manga\Domain\Repositories\EditionRepositoryInterface;
use App\Manga\Domain\Repositories\SeriesRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use App\Manga\Infrastructure\EloquentModels\Series;
use App\Manga\Infrastructure\Services\MangaCollecScraperService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ScrapeMangaCollecCommand extends Command
{
    protected $signature = 'app:scrape-mangacollec {--limit=2 : The number of series to scrape} {--rps=2 : Requests per second}';

    protected $description = 'Scrape manga data from MangaCollec API';

    private ?float $lastRequestTime = null;

    public function __construct(
        private readonly MangaCollecScraperService $scraperService,
        private readonly SeriesRepositoryInterface $seriesRepository,
        private readonly EditionRepositoryInterface $editionRepository,
        private readonly VolumeRepositoryInterface $volumeRepository,
        private readonly BoxSetRepositoryInterface $boxSetRepository,
        private readonly BoxRepositoryInterface $boxRepository
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('Starting MangaCollec Scraper...');

        $this->throttle();
        if (! $this->scraperService->login()) {
            $this->error('Failed to login to MangaCollec');

            return 1;
        }

        $this->throttle();
        /** @var array<int, array<string, mixed>> $seriesList */
        $seriesList = $this->scraperService->getSeriesList();
        $limit = (int) $this->option('limit');
        $count = 0;

        foreach ($seriesList as $seriesData) {
            /** @var array<string, mixed> $seriesData */
            if ($count >= $limit) {
                break;
            }

            /** @var string $seriesUuid */
            $seriesUuid = $seriesData['id'] ?? '';
            /** @var string $title */
            $title = $seriesData['title'] ?? '';
            $this->info("Scraping series: {$title} ({$seriesUuid})");

            $this->throttle();
            /** @var array<string, mixed>|null $detail */
            $detail = $this->scraperService->getSeriesDetail($seriesUuid);
            if (! $detail) {
                $this->warn("Could not get details for series {$seriesUuid}");

                continue;
            }

            DB::transaction(function () use ($detail, $seriesUuid) {
                // 1. Handle Series
                $series = $this->seriesRepository->findByApiId($seriesUuid);

                /** @var array<int, array<string, mixed>> $authorsRaw */
                $authorsRaw = is_array($detail['authors']) ? $detail['authors'] : [];
                $authorsArray = collect($authorsRaw)->map(function ($a) {
                    $fName = $a['first_name'] ?? '';
                    $lName = $a['name'] ?? '';

                    return trim((is_string($fName) ? $fName : '').' '.(is_string($lName) ? $lName : ''));
                })->filter()->values()->toArray();
                $authors = ! empty($authorsArray) ? implode(', ', $authorsArray) : null;
                /** @var array<int, array<string, mixed>> $seriesRaw */
                $seriesRaw = $detail['series'] ?? [];
                $seriesTitle = is_string($seriesRaw[0]['title'] ?? null) ? $seriesRaw[0]['title'] : (is_string($detail['title'] ?? null) ? $detail['title'] : 'Unknown');

                if (! $series) {
                    $series = $this->seriesRepository->create(new CreateSeriesDTO(
                        title: $seriesTitle,
                        authors: $authors,
                        apiId: $seriesUuid
                    ));
                }

                /** @var Series|null $seriesModel */
                $seriesModel = Series::find($series->getId());
                if ($seriesModel) {
                    $seriesModel->update([
                        'authors' => $authors,
                        'title' => $seriesTitle,
                    ]);
                }

                // 2. Handle Editions
                $editionsMap = [];
                /** @var array<int, array<string, mixed>> $editionsRaw */
                $editionsRaw = is_array($detail['editions']) ? $detail['editions'] : [];
                foreach ($editionsRaw as $editionData) {
                    $editionName = is_string($editionData['title'] ?? null) ? $editionData['title'] : 'Standard';
                    $editionId = is_string($editionData['id'] ?? null) ? $editionData['id'] : '';
                    $publisherId = is_string($editionData['publisher_id'] ?? null) ? $editionData['publisher_id'] : '';
                    $publisherName = null;

                    if ($publisherId) {
                        /** @var array<int, array<string, mixed>> $publishers */
                        $publishers = is_array($detail['publishers'] ?? null) ? $detail['publishers'] : [];
                        $publisher = null;
                        foreach ($publishers as $p) {
                            if (($p['id'] ?? null) === $publisherId) {
                                $publisher = $p;
                                break;
                            }
                        }
                        $publisherName = is_string($publisher['title'] ?? null) ? $publisher['title'] : null;
                    }

                    $edition = $this->editionRepository->findByNameAndSeries($editionName, $series->getId());
                    if (! $edition) {
                        $edition = $this->editionRepository->create(new CreateEditionDTO(
                            seriesId: $series->getId(),
                            name: $editionName,
                            language: 'fr',
                            publisher: $publisherName,
                            totalVolumes: isset($editionData['volumes_count']) && is_numeric($editionData['volumes_count']) ? (int) $editionData['volumes_count'] : null,
                            isFinished: ! ((bool) ($editionData['not_finished'] ?? true)),
                        ));
                    }
                    $editionsMap[$editionId] = $edition->getId();
                }

                // 3. Handle Volumes
                $firstVolumeCover = null;

                /** @var array<int, array<string, mixed>> $volumesRaw */
                $volumesRaw = $detail['volumes'] ?? [];
                foreach ($volumesRaw as $volumeData) {
                    $volumeUuid = is_string($volumeData['id'] ?? null) ? $volumeData['id'] : '';
                    $isbn = is_string($volumeData['isbn'] ?? null) ? $volumeData['isbn'] : null;
                    $coverUrl = is_string($volumeData['image_url'] ?? null) ? $volumeData['image_url'] : null;

                    if (! $firstVolumeCover && $coverUrl) {
                        $firstVolumeCover = $coverUrl;
                    }

                    if ($this->volumeRepository->findByApiId($volumeUuid)) {
                        continue;
                    }

                    if ($isbn && $this->volumeRepository->findByIsbn($isbn)) {
                        $this->warn("Skipping volume with existing ISBN: {$isbn}");

                        continue;
                    }

                    $editionIdRaw = is_string($volumeData['edition_id'] ?? null) ? $volumeData['edition_id'] : '';
                    $mappedEditionId = $editionsMap[$editionIdRaw] ?? null;
                    if (! $mappedEditionId) {
                        $mappedEditionId = reset($editionsMap) ?: null;
                    }

                    if (! $mappedEditionId) {
                        continue;
                    }

                    $volumeNumber = isset($volumeData['number']) && is_scalar($volumeData['number']) ? (string) $volumeData['number'] : '';
                    $volumeTitle = (is_string($volumeData['title'] ?? null) && ! empty($volumeData['title']))
                        ? $volumeData['title']
                        : $seriesTitle.' #'.($volumeNumber ?: '?');

                    $this->volumeRepository->create(new CreateVolumeDTO(
                        editionId: $mappedEditionId,
                        title: $volumeTitle,
                        number: $volumeNumber,
                        isbn: $isbn,
                        apiId: $volumeUuid,
                        publishedDate: is_string($volumeData['release_date'] ?? null) ? $volumeData['release_date'] : null,
                        coverUrl: $coverUrl
                    ));
                }

                // Update series cover if we found one
                if ($firstVolumeCover && $seriesModel && ! $seriesModel->cover_url) {
                    $seriesModel->update(['cover_url' => $firstVolumeCover]);
                }

                // 4. Handle Box Editions (Box Sets)
                $boxSetsMap = [];
                /** @var array<int, array<string, mixed>> $boxEditionsRaw */
                $boxEditionsRaw = is_array($detail['box_editions']) ? $detail['box_editions'] : [];
                foreach ($boxEditionsRaw as $boxEditionData) {
                    $beUuid = is_string($boxEditionData['id'] ?? null) ? $boxEditionData['id'] : '';
                    $beTitle = is_string($boxEditionData['title'] ?? null) ? $boxEditionData['title'] : 'Box Set';
                    $bePublisherId = is_string($boxEditionData['publisher_id'] ?? null) ? $boxEditionData['publisher_id'] : '';
                    $bePublisherName = null;

                    if ($bePublisherId) {
                        /** @var array<int, array<string, mixed>> $bePublishers */
                        $bePublishers = is_array($detail['publishers'] ?? null) ? $detail['publishers'] : [];
                        $publisher = null;
                        foreach ($bePublishers as $p) {
                            if (($p['id'] ?? null) === $bePublisherId) {
                                $publisher = $p;
                                break;
                            }
                        }
                        $bePublisherName = is_string($publisher['title'] ?? null) ? $publisher['title'] : null;
                    }

                    $boxSet = $this->boxSetRepository->findByApiId($beUuid);
                    if (! $boxSet) {
                        $boxSet = $this->boxSetRepository->create(new CreateBoxSetDTO(
                            seriesId: $series->getId(),
                            title: $beTitle,
                            publisher: $bePublisherName,
                            apiId: $beUuid
                        ));
                    }
                    $boxSetsMap[$beUuid] = $boxSet->getId();
                }

                // 5. Handle Boxes
                $boxesMap = [];
                /** @var array<int, array<string, mixed>> $boxesRaw */
                $boxesRaw = is_array($detail['boxes']) ? $detail['boxes'] : [];
                foreach ($boxesRaw as $boxData) {
                    $boxUuid = is_string($boxData['id'] ?? null) ? $boxData['id'] : '';
                    $boxIsbn = is_string($boxData['isbn'] ?? null) ? $boxData['isbn'] : null;

                    if ($this->boxRepository->findByApiId($boxUuid)) {
                        $boxesMap[$boxUuid] = $this->boxRepository->findByApiId($boxUuid)->getId();

                        continue;
                    }

                    if ($boxIsbn && $this->boxRepository->findByIsbn($boxIsbn)) {
                        $this->warn("Skipping box with existing ISBN: {$boxIsbn}");
                        $existingBox = $this->boxRepository->findByIsbn($boxIsbn);
                        if ($existingBox) {
                            $boxesMap[$boxUuid] = $existingBox->getId();
                        }

                        continue;
                    }

                    $boxEditionId = is_string($boxData['box_edition_id'] ?? null) ? $boxData['box_edition_id'] : '';
                    $mappedBoxSetId = $boxSetsMap[$boxEditionId] ?? null;
                    if (! $mappedBoxSetId) {
                        continue;
                    }

                    $box = $this->boxRepository->create(new CreateBoxDTO(
                        boxSetId: $mappedBoxSetId,
                        title: is_string($boxData['title'] ?? null) ? $boxData['title'] : 'Box',
                        number: isset($boxData['number']) && is_scalar($boxData['number']) ? (string) $boxData['number'] : '',
                        isbn: $boxIsbn,
                        apiId: $boxUuid,
                        releaseDate: is_string($boxData['release_date'] ?? null) ? $boxData['release_date'] : null,
                        coverUrl: is_string($boxData['image_url'] ?? null) ? $boxData['image_url'] : null,
                        isEmpty: str_contains(strtolower(is_string($boxData['title'] ?? null) ? $boxData['title'] : ''), 'vide')
                    ));
                    $boxesMap[$boxUuid] = $box->getId();
                }

                // 6. Handle Box Volumes link
                $boxVolumesToAttach = [];
                /** @var array<int, array<string, mixed>> $boxVolumesRaw */
                $boxVolumesRaw = is_array($detail['box_volumes']) ? $detail['box_volumes'] : [];
                foreach ($boxVolumesRaw as $bvData) {
                    if (! ($bvData['included'] ?? true)) {
                        continue; // Only link if theoretically included or to signify relation? Depending on your requirement. Let's assume we link everything that is logically in the box. But actually "included: false" might mean it's an empty box.
                    }

                    $boxUuid = is_string($bvData['box_id'] ?? null) ? $bvData['box_id'] : '';
                    $volumeUuid = is_string($bvData['volume_id'] ?? null) ? $bvData['volume_id'] : '';

                    $boxId = $boxesMap[$boxUuid] ?? null;
                    if (! $boxId) {
                        continue;
                    }

                    // Ideally we fetch the local volume id. Since we already synced volumes:
                    $volume = $this->volumeRepository->findByApiId($volumeUuid);

                    if ($volume) {
                        $boxVolumesToAttach[$boxId][] = $volume->getId();
                    }
                }

                foreach ($boxVolumesToAttach as $boxId => $volumeIds) {
                    $this->boxRepository->attachVolumes($boxId, $volumeIds);
                }
            });

            /** @var string $finishTitle */
            $finishTitle = $seriesData['title'] ?? '';
            $this->info("Finished series: {$finishTitle}");
            $count++;
        }

        $this->info('Scraping completed!');

        return 0;
    }

    private function throttle(): void
    {
        $rpsOption = $this->option('rps');
        /** @var float $rps */
        $rps = is_numeric($rpsOption) ? (float) $rpsOption : 2.0;

        if ($rps <= 0) {
            return;
        }

        $intervalSeconds = 1.0 / $rps;

        if ($this->lastRequestTime !== null) {
            $elapsed = microtime(true) - $this->lastRequestTime;
            if ($elapsed < $intervalSeconds) {
                // Sleep using microseconds
                $sleepTime = (int) (($intervalSeconds - $elapsed) * 1000000);
                usleep($sleepTime);
            }
        }

        $this->lastRequestTime = microtime(true);
    }
}
