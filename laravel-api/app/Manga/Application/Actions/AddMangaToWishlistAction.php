<?php

namespace App\Manga\Application\Actions;

use App\Manga\Application\DTOs\AddMangaDTO;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;

class AddMangaToWishlistAction
{
    public function __construct(
        private readonly VolumeRepositoryInterface $volumeRepository
    ) {}

    public function execute(AddMangaDTO $dto): Volume
    {
        $volume = $this->volumeRepository->findByApiId($dto->api_id);

        if (! $volume) {
            throw new \Exception('Manga not found in local database');
        }

        $this->volumeRepository->addWishlistToUser($volume->getId(), $dto->userId);

        return $volume;
    }
}
