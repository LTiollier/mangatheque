<?php

namespace App\Manga\Application\DTOs;

class AddWishlistItemDTO
{
    public function __construct(
        public readonly string $api_id,
        public readonly int $userId,
    ) {}
}
