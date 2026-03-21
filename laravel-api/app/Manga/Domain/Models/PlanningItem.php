<?php

namespace App\Manga\Domain\Models;

class PlanningItem
{
    public function __construct(
        private readonly int $id,
        private readonly string $type,
        private readonly string $title,
        private readonly ?string $number,
        private readonly ?string $coverUrl,
        private readonly string $releaseDate,
        private readonly int $seriesId,
        private readonly string $seriesTitle,
        private readonly ?int $editionId,
        private readonly ?string $editionTitle,
        private readonly bool $isOwned,
        private readonly bool $isWishlisted,
    ) {}

    public function getId(): int
    {
        return $this->id;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getNumber(): ?string
    {
        return $this->number;
    }

    public function getCoverUrl(): ?string
    {
        return $this->coverUrl;
    }

    public function getReleaseDate(): string
    {
        return $this->releaseDate;
    }

    public function getSeriesId(): int
    {
        return $this->seriesId;
    }

    public function getSeriesTitle(): string
    {
        return $this->seriesTitle;
    }

    public function getEditionId(): ?int
    {
        return $this->editionId;
    }

    public function getEditionTitle(): ?string
    {
        return $this->editionTitle;
    }

    public function isOwned(): bool
    {
        return $this->isOwned;
    }

    public function isWishlisted(): bool
    {
        return $this->isWishlisted;
    }
}
