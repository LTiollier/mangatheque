<?php

namespace App\Manga\Domain\Models;

class Box
{
    /**
     * @param  Volume[]  $volumes
     */
    public function __construct(
        private readonly int $id,
        private readonly int $box_set_id,
        private readonly string $title,
        private readonly ?string $number,
        private readonly ?string $isbn,
        private readonly ?string $api_id,
        private readonly ?string $release_date,
        private readonly ?string $cover_url,
        private readonly bool $is_empty = false,
        private readonly array $volumes = [],
        private readonly ?bool $is_owned = null,
        private readonly bool $is_wishlisted = false,
        private readonly ?int $total_volumes = null,
        private readonly ?int $possessed_count = null,
    ) {}

    public function getId(): int
    {
        return $this->id;
    }

    public function getBoxSetId(): int
    {
        return $this->box_set_id;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getNumber(): ?string
    {
        return $this->number;
    }

    public function getIsbn(): ?string
    {
        return $this->isbn;
    }

    public function getApiId(): ?string
    {
        return $this->api_id;
    }

    public function getReleaseDate(): ?string
    {
        return $this->release_date;
    }

    /**
     * @return Volume[]
     */
    public function getVolumes(): array
    {
        return $this->volumes;
    }

    public function getCoverUrl(): ?string
    {
        return $this->cover_url;
    }

    public function isEmpty(): bool
    {
        return $this->is_empty;
    }

    public function isOwned(): ?bool
    {
        return $this->is_owned;
    }

    public function isWishlisted(): bool
    {
        return $this->is_wishlisted;
    }

    public function getTotalVolumes(): ?int
    {
        return $this->total_volumes;
    }

    public function getPossessedCount(): ?int
    {
        return $this->possessed_count;
    }
}
