<?php

namespace App\Manga\Domain\Models;

class Series
{
    /**
     * @param  Edition[]  $editions
     * @param  array<int, mixed>  $boxSets
     */
    public function __construct(
        private readonly int $id,
        private readonly ?string $api_id,
        private readonly string $title,
        private readonly ?string $authors,
        private readonly ?string $cover_url,
        private readonly ?string $description = null,
        private readonly ?string $status = null,
        private readonly ?int $totalVolumes = null,
        private readonly array $editions = [],
        private readonly array $boxSets = [],
    ) {}

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function getTotalVolumes(): ?int
    {
        return $this->totalVolumes;
    }

    /**
     * @return Edition[]
     */
    public function getEditions(): array
    {
        return $this->editions;
    }

    /**
     * @return array<int, mixed>
     */
    public function getBoxSets(): array
    {
        return $this->boxSets;
    }

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
