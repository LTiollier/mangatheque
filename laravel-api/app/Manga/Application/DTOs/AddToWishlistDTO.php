<?php

namespace App\Manga\Application\DTOs;

class AddToWishlistDTO
{
    public function __construct(
        public readonly int $userId,
        public readonly ?int $editionId = null,
        public readonly ?string $apiId = null,
    ) {}
}
