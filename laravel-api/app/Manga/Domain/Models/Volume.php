<?php

declare(strict_types=1);

namespace App\Manga\Domain\Models;

class Volume
{
    public function __construct(
        private readonly int $id,
        private readonly int $editionId,
        private readonly ?string $apiId,
        private readonly ?string $isbn,
        private readonly ?string $number, // Volume number (1, 2, 1-2, etc.)
        private readonly string $title,
        private readonly ?string $publishedDate,
        private readonly ?string $coverUrl,
        private readonly ?Edition $edition = null,
        private readonly ?Series $series = null,
        private readonly bool $isOwned = false,
        private readonly bool $isLoaned = false,
        private readonly ?string $loanedTo = null,
        private readonly bool $isWishlisted = false,
        private readonly ?string $boxTitle = null,
        private readonly bool $isLastVolume = false,
    ) {}

    public function getId(): int
    {
        return $this->id;
    }

    public function getEditionId(): int
    {
        return $this->editionId;
    }

    public function getApiId(): ?string
    {
        return $this->apiId;
    }

    public function getIsbn(): ?string
    {
        return $this->isbn;
    }

    public function getNumber(): ?string
    {
        return $this->number;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getPublishedDate(): ?string
    {
        return $this->publishedDate;
    }

    public function getCoverUrl(): ?string
    {
        return $this->coverUrl;
    }

    public function getEdition(): ?Edition
    {
        return $this->edition;
    }

    public function getSeries(): ?Series
    {
        return $this->series;
    }

    public function isOwned(): bool
    {
        return $this->isOwned;
    }

    public function isLoaned(): bool
    {
        return $this->isLoaned;
    }

    public function getLoanedTo(): ?string
    {
        return $this->loanedTo;
    }

    public function isWishlisted(): bool
    {
        return $this->isWishlisted;
    }

    public function getBoxTitle(): ?string
    {
        return $this->boxTitle;
    }

    public function isLastVolume(): bool
    {
        return $this->isLastVolume;
    }
}
