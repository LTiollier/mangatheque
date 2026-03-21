<?php

namespace App\Manga\Application\DTOs;

class PlanningFiltersDTO
{
    public function __construct(
        public readonly int $userId,
        public readonly string $from,
        public readonly string $to,
        public readonly int $perPage,
        public readonly ?string $cursor,
    ) {}
}
