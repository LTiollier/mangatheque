<?php

namespace App\Manga\Application\Actions;

use App\Manga\Application\DTOs\AddMangaDTO;
use App\Manga\Application\Services\VolumeResolverService;
use App\Manga\Domain\Events\VolumeAddedToCollection;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Illuminate\Support\Facades\DB;

class AddMangaAction
{
    public function __construct(
        private readonly VolumeResolverService $volumeResolver,
        private readonly VolumeRepositoryInterface $volumeRepository,
    ) {}

    public function execute(AddMangaDTO $dto): Volume
    {
        return DB::transaction(function () use ($dto) {
            $volume = $this->volumeResolver->resolveByApiId($dto->api_id);

            $this->volumeRepository->attachToUser($volume->getId(), $dto->userId);

            event(new VolumeAddedToCollection($volume, $dto->userId));

            return $volume;
        });
    }
}
