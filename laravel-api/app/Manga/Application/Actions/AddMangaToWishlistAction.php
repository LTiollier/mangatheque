<?php

namespace App\Manga\Application\Actions;

use App\Manga\Application\DTOs\AddMangaDTO;
use App\Manga\Domain\Exceptions\MangaNotFoundException;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use App\Manga\Domain\Repositories\WishlistRepositoryInterface;

class AddMangaToWishlistAction
{
    public function __construct(
        private readonly VolumeRepositoryInterface $volumeRepository,
        private readonly WishlistRepositoryInterface $wishlistRepository
    ) {}

    public function execute(AddMangaDTO $dto): Volume
    {
        $volume = $this->volumeRepository->findByApiId($dto->api_id);

        if (! $volume) {
            throw new MangaNotFoundException('Manga not found in local database.');
        }

        $this->wishlistRepository->addWishlistToUser($volume->getId(), $dto->userId);

        return $volume;
    }
}
