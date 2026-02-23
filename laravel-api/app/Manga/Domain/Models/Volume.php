<?php

namespace App\Manga\Domain\Models;

class Volume
{
    /**
     * @param  string[]  $authors
     */
    public function __construct(
        private readonly int $id,
        private readonly int $edition_id,
        private readonly ?string $api_id,
        private readonly ?string $isbn,
        private readonly ?string $number, // Volume number (1, 2, 1-2, etc.)
        private readonly string $title,
        private readonly array $authors,
        private readonly ?string $description,
        private readonly ?string $published_date,
        private readonly ?int $page_count,
        private readonly ?string $cover_url,
        private readonly ?Edition $edition = null,
        private readonly ?Series $series = null,
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

    /**
     * @return string[]
     */
    public function getAuthors(): array
    {
        return $this->authors;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function getPublishedDate(): ?string
    {
        return $this->published_date;
    }

    public function getPageCount(): ?int
    {
        return $this->page_count;
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
}
