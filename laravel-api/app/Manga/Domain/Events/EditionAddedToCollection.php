<?php

namespace App\Manga\Domain\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class EditionAddedToCollection
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly int $editionId,
        public readonly int $userId
    ) {}
}
