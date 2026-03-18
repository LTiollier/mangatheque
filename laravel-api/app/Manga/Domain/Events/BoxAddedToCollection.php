<?php

namespace App\Manga\Domain\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BoxAddedToCollection
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly int $boxId,
        public readonly int $userId
    ) {}
}
