<?php

namespace App\Manga\Application\Actions;

use App\Manga\Application\DTOs\AddLocalVolumesDTO;
use App\Manga\Domain\Exceptions\EditionNotFoundException;
use App\Manga\Domain\Exceptions\SeriesNotFoundException;
use App\Manga\Domain\Repositories\EditionRepositoryInterface;
use App\Manga\Domain\Repositories\SeriesRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Illuminate\Support\Facades\DB;

class AddLocalVolumesToEditionAction
{
    public function __construct(
        private readonly VolumeRepositoryInterface $volumeRepository,
        private readonly SeriesRepositoryInterface $seriesRepository,
        private readonly EditionRepositoryInterface $editionRepository,
    ) {}

    /**
     * @return \App\Manga\Domain\Models\Volume[]
     */
    public function execute(AddLocalVolumesDTO $dto): array
    {
        return DB::transaction(function () use ($dto) {
            $edition = $this->editionRepository->findById($dto->editionId);

            if (! $edition) {
                throw new EditionNotFoundException('Edition not found with ID: '.$dto->editionId);
            }

            $series = $this->seriesRepository->findById($edition->getSeriesId());

            if (! $series) {
                throw new SeriesNotFoundException('Series not found with ID: '.$edition->getSeriesId());
            }

            $volumes = [];

            foreach ($dto->numbers as $number) {
                $numberStr = (string) $number;
                $volume = $this->volumeRepository->findByEditionAndNumber($edition->getId(), $numberStr);

                if (! $volume) {
                    $volumeTitle = trim($series->getTitle().' Vol. '.$numberStr);

                    $volume = $this->volumeRepository->create([
                        'edition_id' => $edition->getId(),
                        'api_id' => null,
                        'isbn' => null,
                        'number' => $numberStr,
                        'title' => $volumeTitle,
                        'authors' => $series->getAuthors(),
                        'description' => null,
                        'published_date' => null,
                        'page_count' => null,
                        'cover_url' => $series->getCoverUrl(),
                    ]);
                }

                $this->volumeRepository->attachToUser($volume->getId(), $dto->userId);

                event(new \App\Manga\Domain\Events\VolumeAddedToCollection($volume, $dto->userId));

                $volumes[] = $volume;
            }

            return $volumes;
        });
    }
}
