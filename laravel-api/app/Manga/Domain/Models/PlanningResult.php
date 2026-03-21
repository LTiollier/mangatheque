<?php

namespace App\Manga\Domain\Models;

class PlanningResult
{
    /**
     * @param  PlanningItem[]  $items
     */
    public function __construct(
        private readonly array $items,
        private readonly int $total,
        private readonly int $perPage,
        private readonly ?string $nextCursor,
        private readonly bool $hasMore,
    ) {}

    /**
     * @return PlanningItem[]
     */
    public function getItems(): array
    {
        return $this->items;
    }

    public function getTotal(): int
    {
        return $this->total;
    }

    public function getPerPage(): int
    {
        return $this->perPage;
    }

    public function getNextCursor(): ?string
    {
        return $this->nextCursor;
    }

    public function hasMore(): bool
    {
        return $this->hasMore;
    }
}
