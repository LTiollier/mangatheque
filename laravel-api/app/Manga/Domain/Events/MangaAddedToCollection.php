<?php

namespace App\Manga\Domain\Events;

use App\Manga\Domain\Models\Manga;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MangaAddedToCollection
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Manga $manga,
        public readonly int $userId
    ) {}
}
