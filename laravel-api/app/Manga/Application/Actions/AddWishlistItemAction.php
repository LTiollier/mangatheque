<?php

namespace App\Manga\Application\Actions;

use App\Manga\Application\DTOs\AddWishlistItemDTO;
use App\Manga\Domain\Exceptions\MangaNotFoundException;
use App\Manga\Domain\Models\Box;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\BoxRepositoryInterface;
use App\Manga\Domain\Repositories\BoxSetRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use App\Manga\Domain\Repositories\WishlistRepositoryInterface;
use Illuminate\Support\Facades\DB;

class AddWishlistItemAction
{
    public function __construct(
        private readonly VolumeRepositoryInterface $volumeRepository,
        private readonly BoxRepositoryInterface $boxRepository,
        private readonly BoxSetRepositoryInterface $boxSetRepository,
        private readonly WishlistRepositoryInterface $wishlistRepository
    ) {}

    /**
     * @return Volume|Box
     */
    public function execute(AddWishlistItemDTO $dto): Volume|Box
    {
        return DB::transaction(function () use ($dto) {
            // 1. Try to find as a Volume
            $volume = $this->volumeRepository->findByApiId($dto->api_id);
            if ($volume) {
                $this->wishlistRepository->addWishlistToUser($volume->getId(), $dto->userId);
                return $volume;
            }

            // 2. Try to find as a BoxSet
            $boxSet = $this->boxSetRepository->findByApiId($dto->api_id);
            if ($boxSet) {
                $boxes = $this->boxRepository->findByBoxSetId($boxSet->getId());
                foreach ($boxes as $box) {
                    $this->wishlistRepository->addBoxWishlistToUser($box->getId(), $dto->userId);
                }
                // Return the first box or throw if empty? Let's return a dummy or something.
                // For simplicity, return the first box if it exists.
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

            throw new MangaNotFoundException('Item not found in local database with ID: ' . $dto->api_id);
        });
    }
}
