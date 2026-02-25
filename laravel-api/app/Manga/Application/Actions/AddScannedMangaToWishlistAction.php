<?php

namespace App\Manga\Application\Actions;

use App\Manga\Application\DTOs\ScanMangaDTO;
use App\Manga\Application\Services\VolumeResolverService;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Illuminate\Support\Facades\DB;

class AddScannedMangaToWishlistAction
{
    public function __construct(
        private readonly VolumeResolverService $volumeResolver,
        private readonly VolumeRepositoryInterface $volumeRepository,
    ) {}

    public function execute(ScanMangaDTO $dto): Volume
    {
        return DB::transaction(function () use ($dto) {
            $volume = $this->volumeResolver->resolveByIsbn($dto->isbn);

            $this->volumeRepository->addWishlistToUser($volume->getId(), $dto->userId);

            return $volume;
        });
    }
}
