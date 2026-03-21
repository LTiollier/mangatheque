<?php

namespace App\Manga\Infrastructure\Services;

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
use App\Manga\Infrastructure\EloquentModels\Box as EloquentBox;
use App\Manga\Infrastructure\EloquentModels\BoxSet as EloquentBoxSet;
use App\Manga\Infrastructure\EloquentModels\Edition as EloquentEdition;
use App\Manga\Infrastructure\EloquentModels\Series as EloquentSeries;
use App\Manga\Infrastructure\EloquentModels\Volume as EloquentVolume;
use Illuminate\Support\Facades\DB;

class MangaCollecSeriesImportService
{
    public function __construct(
        private readonly SeriesRepositoryInterface $seriesRepository,
        private readonly EditionRepositoryInterface $editionRepository,
        private readonly VolumeRepositoryInterface $volumeRepository,
        private readonly BoxSetRepositoryInterface $boxSetRepository,
        private readonly BoxRepositoryInterface $boxRepository,
    ) {}

    /**
     * Import (create or update) a full series and all its related data.
     *
     * @param  array<string, mixed>  $detail
     * @param  \Closure(string): void|null  $log  Optional debug logger (receives a message string)
     */
    public function import(string $seriesUuid, array $detail, ?\Closure $log = null): void
    {
        $debug = fn (string $msg) => $log ? ($log)($msg) : null;

        DB::transaction(function () use ($seriesUuid, $detail, $debug): void {
            // 1. Handle Series
            $series = $this->seriesRepository->findByApiId($seriesUuid);

            /** @var array<int, array<string, mixed>> $authorsRaw */
            $authorsRaw = is_array($detail['authors']) ? $detail['authors'] : [];
            $authorsArray = collect($authorsRaw)->map(function (mixed $a): string {
                /** @var array<string, mixed> $a */
                $fName = $a['first_name'] ?? '';
                $lName = $a['name'] ?? '';

                return trim((is_string($fName) ? $fName : '').' '.(is_string($lName) ? $lName : ''));
            })->filter()->values()->toArray();
            $authors = ! empty($authorsArray) ? implode(', ', $authorsArray) : null;

            /** @var array<int, array<string, mixed>> $seriesRaw */
            $seriesRaw = $detail['series'] ?? [];
            $seriesTitle = is_string($seriesRaw[0]['title'] ?? null)
                ? $seriesRaw[0]['title']
                : (is_string($detail['title'] ?? null) ? $detail['title'] : 'Unknown');

            if (! $series) {
                $series = $this->seriesRepository->create(new CreateSeriesDTO(
                    title: $seriesTitle,
                    authors: $authors,
                    apiId: $seriesUuid
                ));
            }

            $seriesModel = EloquentSeries::find($series->getId());
            if ($seriesModel) {
                $seriesModel->update([
                    'authors' => $authors,
                    'title' => $seriesTitle,
                ]);
            }

            // 2. Handle Editions
            /** @var array<string, int> $editionsMap uuid → local id */
            $editionsMap = [];
            /** @var array<int, array<string, mixed>> $editionsRaw */
            $editionsRaw = is_array($detail['editions']) ? $detail['editions'] : [];
            $debug(sprintf('[editions] %d edition(s) in API response', count($editionsRaw)));
            foreach ($editionsRaw as $editionData) {
                $editionName = is_string($editionData['title'] ?? null) ? $editionData['title'] : 'Standard';
                $editionId = is_string($editionData['id'] ?? null) ? $editionData['id'] : '';
                $publisherId = is_string($editionData['publisher_id'] ?? null) ? $editionData['publisher_id'] : '';
                $publisherName = $this->resolvePublisherName($publisherId, $detail);

                $totalVolumes = isset($editionData['volumes_count']) && is_numeric($editionData['volumes_count'])
                    ? (int) $editionData['volumes_count']
                    : null;
                $isFinished = ! ((bool) ($editionData['not_finished'] ?? true));

                $edition = $this->editionRepository->findByNameAndSeries($editionName, $series->getId());
                if (! $edition) {
                    $edition = $this->editionRepository->create(new CreateEditionDTO(
                        seriesId: $series->getId(),
                        name: $editionName,
                        language: 'fr',
                        publisher: $publisherName,
                        totalVolumes: $totalVolumes,
                        isFinished: $isFinished,
                    ));
                    $debug(sprintf('[editions] CREATED "%s" (api_id: %s) → local id %d', $editionName, $editionId, $edition->getId()));
                } else {
                    EloquentEdition::find($edition->getId())?->update([
                        'publisher' => $publisherName,
                        'total_volumes' => $totalVolumes,
                        'is_finished' => $isFinished,
                    ]);
                    $debug(sprintf('[editions] EXISTS  "%s" (api_id: %s) → local id %d', $editionName, $editionId, $edition->getId()));
                }
                $editionsMap[$editionId] = $edition->getId();
            }
            $debug('[editions] map keys: '.implode(', ', array_keys($editionsMap)));

            // 3. Handle Volumes
            $firstVolumeCover = null;

            /** @var array<int, array<string, mixed>> $volumesRaw */
            $volumesRaw = is_array($detail['volumes']) ? $detail['volumes'] : [];
            $debug(sprintf('[volumes] %d volume(s) in API response', count($volumesRaw)));
            foreach ($volumesRaw as $volumeData) {
                $volumeUuid = is_string($volumeData['id'] ?? null) ? $volumeData['id'] : '';
                $isbn = is_string($volumeData['isbn'] ?? null) ? $volumeData['isbn'] : null;
                $coverUrl = is_string($volumeData['image_url'] ?? null) ? $volumeData['image_url'] : null;
                $publishedDate = is_string($volumeData['release_date'] ?? null) ? $volumeData['release_date'] : null;
                $volumeNumber = isset($volumeData['number']) && is_scalar($volumeData['number']) ? (string) $volumeData['number'] : '';
                $editionIdRaw = is_string($volumeData['edition_id'] ?? null) ? $volumeData['edition_id'] : '';
                $volumeTitle = (is_string($volumeData['title'] ?? null) && ! empty($volumeData['title']))
                    ? $volumeData['title']
                    : $seriesTitle.' #'.($volumeNumber ?: '?');

                if (! $firstVolumeCover && $coverUrl) {
                    $firstVolumeCover = $coverUrl;
                }

                $existingVolume = $this->volumeRepository->findByApiId($volumeUuid);
                if ($existingVolume) {
                    EloquentVolume::find($existingVolume->getId())?->update([
                        'title' => $volumeTitle,
                        'isbn' => $isbn,
                        'published_date' => $publishedDate,
                        'cover_url' => $coverUrl,
                    ]);
                    $debug(sprintf('[volumes] UPDATED #%s "%s" (api_id: %s)', $volumeNumber, $volumeTitle, $volumeUuid));

                    continue;
                }

                $mappedEditionId = $editionsMap[$editionIdRaw] ?? null;
                if (! $mappedEditionId) {
                    $debug(sprintf('[volumes] FALLBACK #%s – edition_id "%s" not in map, using first edition', $volumeNumber, $editionIdRaw));
                    $mappedEditionId = reset($editionsMap) ?: null;
                }

                if (! $mappedEditionId) {
                    $debug(sprintf('[volumes] SKIP    #%s – no edition found (editions map is empty)', $volumeNumber));

                    continue;
                }

                $this->volumeRepository->create(new CreateVolumeDTO(
                    editionId: $mappedEditionId,
                    title: $volumeTitle,
                    number: $volumeNumber,
                    isbn: $isbn,
                    apiId: $volumeUuid,
                    publishedDate: $publishedDate,
                    coverUrl: $coverUrl
                ));
                $debug(sprintf('[volumes] CREATED #%s "%s" → edition local id %d', $volumeNumber, $volumeTitle, $mappedEditionId));
            }

            // Update series cover if we found one and it is not yet set
            if ($firstVolumeCover && $seriesModel && ! $seriesModel->cover_url) {
                $seriesModel->update(['cover_url' => $firstVolumeCover]);
            }

            // 4. Handle Box Sets
            /** @var array<string, int> $boxSetsMap uuid → local id */
            $boxSetsMap = [];
            /** @var array<int, array<string, mixed>> $boxEditionsRaw */
            $boxEditionsRaw = is_array($detail['box_editions']) ? $detail['box_editions'] : [];
            foreach ($boxEditionsRaw as $boxEditionData) {
                $beUuid = is_string($boxEditionData['id'] ?? null) ? $boxEditionData['id'] : '';
                $beTitle = is_string($boxEditionData['title'] ?? null) ? $boxEditionData['title'] : 'Box Set';
                $bePublisherId = is_string($boxEditionData['publisher_id'] ?? null) ? $boxEditionData['publisher_id'] : '';
                $bePublisherName = $this->resolvePublisherName($bePublisherId, $detail);

                $boxSet = $this->boxSetRepository->findByApiId($beUuid);
                if (! $boxSet) {
                    $boxSet = $this->boxSetRepository->create(new CreateBoxSetDTO(
                        seriesId: $series->getId(),
                        title: $beTitle,
                        publisher: $bePublisherName,
                        apiId: $beUuid
                    ));
                } else {
                    EloquentBoxSet::find($boxSet->getId())?->update([
                        'title' => $beTitle,
                        'publisher' => $bePublisherName,
                    ]);
                }
                $boxSetsMap[$beUuid] = $boxSet->getId();
            }

            // 5. Handle Boxes
            /** @var array<string, int> $boxesMap uuid → local id */
            $boxesMap = [];
            /** @var array<int, array<string, mixed>> $boxesRaw */
            $boxesRaw = is_array($detail['boxes']) ? $detail['boxes'] : [];
            foreach ($boxesRaw as $boxData) {
                $boxUuid = is_string($boxData['id'] ?? null) ? $boxData['id'] : '';
                $boxIsbn = is_string($boxData['isbn'] ?? null) ? $boxData['isbn'] : null;
                $boxTitle = is_string($boxData['title'] ?? null) ? $boxData['title'] : 'Box';
                $boxNumber = isset($boxData['number']) && is_scalar($boxData['number']) ? (string) $boxData['number'] : '';
                $boxReleaseDate = is_string($boxData['release_date'] ?? null) ? $boxData['release_date'] : null;
                $boxCoverUrl = is_string($boxData['image_url'] ?? null) ? $boxData['image_url'] : null;
                $boxIsEmpty = str_contains(strtolower($boxTitle), 'vide');

                $existingBox = $this->boxRepository->findByApiId($boxUuid);
                if ($existingBox) {
                    EloquentBox::find($existingBox->getId())?->update([
                        'title' => $boxTitle,
                        'isbn' => $boxIsbn,
                        'release_date' => $boxReleaseDate,
                        'cover_url' => $boxCoverUrl,
                        'is_empty' => $boxIsEmpty,
                    ]);
                    $boxesMap[$boxUuid] = $existingBox->getId();

                    continue;
                }

                $boxEditionId = is_string($boxData['box_edition_id'] ?? null) ? $boxData['box_edition_id'] : '';
                $mappedBoxSetId = $boxSetsMap[$boxEditionId] ?? null;
                if (! $mappedBoxSetId) {
                    continue;
                }

                $box = $this->boxRepository->create(new CreateBoxDTO(
                    boxSetId: $mappedBoxSetId,
                    title: $boxTitle,
                    number: $boxNumber,
                    isbn: $boxIsbn,
                    apiId: $boxUuid,
                    releaseDate: $boxReleaseDate,
                    coverUrl: $boxCoverUrl,
                    isEmpty: $boxIsEmpty,
                ));
                $boxesMap[$boxUuid] = $box->getId();
            }

            // 6. Handle Box-Volume links
            /** @var array<int, array<int>> $boxVolumesToAttach */
            $boxVolumesToAttach = [];
            /** @var array<int, array<string, mixed>> $boxVolumesRaw */
            $boxVolumesRaw = is_array($detail['box_volumes']) ? $detail['box_volumes'] : [];
            foreach ($boxVolumesRaw as $bvData) {
                if (! ($bvData['included'] ?? true)) {
                    continue;
                }

                $bvBoxUuid = is_string($bvData['box_id'] ?? null) ? $bvData['box_id'] : '';
                $bvVolumeUuid = is_string($bvData['volume_id'] ?? null) ? $bvData['volume_id'] : '';

                $boxId = $boxesMap[$bvBoxUuid] ?? null;
                if (! $boxId) {
                    continue;
                }

                $volume = $this->volumeRepository->findByApiId($bvVolumeUuid);
                if ($volume) {
                    $boxVolumesToAttach[$boxId][] = $volume->getId();
                }
            }

            foreach ($boxVolumesToAttach as $boxId => $volumeIds) {
                $this->boxRepository->attachVolumes($boxId, $volumeIds);
            }
        });
    }

    /**
     * Resolve a publisher name from the detail's publishers array.
     *
     * @param  array<string, mixed>  $detail
     */
    private function resolvePublisherName(string $publisherId, array $detail): ?string
    {
        if ($publisherId === '') {
            return null;
        }

        /** @var array<int, array<string, mixed>> $publishers */
        $publishers = is_array($detail['publishers'] ?? null) ? $detail['publishers'] : [];
        foreach ($publishers as $publisher) {
            if (($publisher['id'] ?? null) === $publisherId) {
                return is_string($publisher['title'] ?? null) ? $publisher['title'] : null;
            }
        }

        return null;
    }
}
