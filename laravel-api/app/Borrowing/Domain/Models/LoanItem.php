<?php

declare(strict_types=1);

namespace App\Borrowing\Domain\Models;

use App\Manga\Domain\Models\Box;
use App\Manga\Domain\Models\Volume;

final readonly class LoanItem
{
    public function __construct(
        public readonly ?int $id,
        public readonly int $loanId,
        public readonly int $loanableId,
        public readonly string $loanableType,
        public readonly Volume|Box|null $loanable = null,
    ) {}
}
