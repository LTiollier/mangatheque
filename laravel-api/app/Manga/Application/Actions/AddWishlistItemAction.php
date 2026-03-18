<?php

namespace App\Manga\Application\Actions;

use App\Manga\Application\DTOs\AddWishlistItemDTO;
use App\Manga\Domain\Exceptions\MangaNotFoundException;
use App\Manga\Domain\Models\Box;
use App\Manga\Domain\Models\Edition;
use App\Manga\Domain\Repositories\BoxRepositoryInterface;
use App\Manga\Domain\Repositories\BoxSetRepositoryInterface;
use App\Manga\Domain\Repositories\EditionRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use App\Manga\Domain\Repositories\WishlistRepositoryInterface;
use Illuminate\Support\Facades\DB;

class AddWishlistItemAction
{
    public function __construct(
        private readonly VolumeRepositoryInterface $volumeRepository,
        private readonly BoxRepositoryInterface $boxRepository,
        private readonly BoxSetRepositoryInterface $boxSetRepository,
        private readonly EditionRepositoryInterface $editionRepository,
        private readonly WishlistRepositoryInterface $wishlistRepository
    ) {}

    public function execute(AddWishlistItemDTO $dto): Edition|Box
    {
        return DB::transaction(function () use ($dto) {
            // 1. Try to find as a Volume → wishlist its Edition
            $volume = $this->volumeRepository->findByApiId($dto->api_id);
            if ($volume) {
                $this->wishlistRepository->addEditionWishlistToUser($volume->getEditionId(), $dto->userId);
                $edition = $this->editionRepository->findById($volume->getEditionId(), $dto->userId);
                if (! $edition) {
                    throw new MangaNotFoundException('Edition not found for volume with api_id: '.$dto->api_id);
                }

                return $edition;
            }

            // 2. Try to find as a BoxSet → wishlist all its boxes
            $boxSet = $this->boxSetRepository->findByApiId($dto->api_id);
            if ($boxSet) {
                $boxes = $this->boxRepository->findByBoxSetId($boxSet->getId());
                foreach ($boxes as $box) {
                    $this->wishlistRepository->addBoxWishlistToUser($box->getId(), $dto->userId);
                }
                if (count($boxes) > 0) {
                    return $boxes[0];
                }
            }

            // 3. Try to find as a Box
            $box = $this->boxRepository->findByApiId($dto->api_id);
            if ($box) {
                $this->wishlistRepository->addBoxWishlistToUser($box->getId(), $dto->userId);

                return $box;
            }

            throw new MangaNotFoundException('Item not found in local database with ID: '.$dto->api_id);
        });
    }
}
