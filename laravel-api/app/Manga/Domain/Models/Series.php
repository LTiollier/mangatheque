<?php

namespace App\Manga\Domain\Models;

class Series
{
    public function __construct(
        private readonly int $id,
        private readonly ?string $api_id,
        private readonly string $title,
        private readonly ?string $authors,
        private readonly ?string $cover_url,
    ) {}

    public function getId(): int
    {
        return $this->id;
    }

    public function getApiId(): ?string
    {
        return $this->api_id;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getAuthors(): ?string
    {
        return $this->authors;
    }

    public function getCoverUrl(): ?string
    {
        return $this->cover_url;
    }
}
