<?php

namespace App\Manga\Domain\Events;

use App\Manga\Domain\Models\Volume;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VolumeAddedToCollection
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Volume $volume,
        public readonly int $userId
    ) {}
}
