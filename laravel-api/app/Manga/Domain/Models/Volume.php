<?php

namespace App\Manga\Domain\Models;

class Volume
{
    public function __construct(
        private readonly int $id,
        private readonly int $edition_id,
        private readonly ?string $api_id,
        private readonly ?string $isbn,
        private readonly ?string $number, // Volume number (1, 2, 1-2, etc.)
        private readonly string $title,
        private readonly ?string $authors,
        private readonly ?string $published_date,
        private readonly ?string $cover_url,
        private readonly ?Edition $edition = null,
        private readonly ?Series $series = null,
        private readonly bool $isOwned = false,
        private readonly bool $isLoaned = false,
        private readonly ?string $loanedTo = null,
    ) {}

    public function getId(): int
    {
        return $this->id;
    }

    public function getEditionId(): int
    {
        return $this->edition_id;
    }

    public function getApiId(): ?string
    {
        return $this->api_id;
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

    public function getAuthors(): ?string
    {
        return $this->authors;
    }

    public function getPublishedDate(): ?string
    {
        return $this->published_date;
    }

    public function getCoverUrl(): ?string
    {
        return $this->cover_url;
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
}
