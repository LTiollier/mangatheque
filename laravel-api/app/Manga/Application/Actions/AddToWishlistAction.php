<?php

namespace App\Manga\Application\Actions;

use App\Manga\Application\DTOs\AddToWishlistDTO;
use App\Manga\Application\DTOs\AddWishlistItemDTO;
use App\Manga\Domain\Models\Box;
use App\Manga\Domain\Models\Edition;
use InvalidArgumentException;

class AddToWishlistAction
{
    public function __construct(
        private readonly AddEditionToWishlistAction $addEditionAction,
        private readonly AddWishlistItemAction $addWishlistItemAction,
    ) {}

    public function execute(AddToWishlistDTO $dto): Edition|Box
    {
        if ($dto->editionId !== null) {
            return $this->addEditionAction->execute($dto->editionId, $dto->userId);
        }

        if ($dto->apiId !== null) {
            return $this->addWishlistItemAction->execute(
                new AddWishlistItemDTO(api_id: $dto->apiId, userId: $dto->userId)
            );
        }

        throw new InvalidArgumentException('Either editionId or apiId must be provided.');
    }
}
