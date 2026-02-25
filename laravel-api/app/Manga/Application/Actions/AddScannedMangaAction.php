<?php

namespace App\Manga\Application\Actions;

use App\Manga\Application\DTOs\ScanMangaDTO;
use App\Manga\Application\Services\VolumeResolverService;
use App\Manga\Domain\Events\VolumeAddedToCollection;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Illuminate\Support\Facades\DB;

class AddScannedMangaAction
{
    public function __construct(
        private readonly VolumeResolverService $volumeResolver,
        private readonly VolumeRepositoryInterface $volumeRepository,
    ) {}

    public function execute(ScanMangaDTO $dto): Volume
    {
        return DB::transaction(function () use ($dto) {
            $volume = $this->volumeResolver->resolveByIsbn($dto->isbn);

            $this->volumeRepository->attachToUser($volume->getId(), $dto->userId);

            event(new VolumeAddedToCollection($volume, $dto->userId));

            return $volume;
        });
    }
}
