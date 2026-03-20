<?php

namespace App\Manga\Domain\Models;

class BoxSet
{
    /**
     * @param  Box[]  $boxes
     */
    public function __construct(
        private readonly int $id,
        private readonly int $series_id,
        private readonly string $title,
        private readonly ?string $publisher,
        private readonly ?string $api_id,
        private readonly array $boxes = [],
        private readonly ?string $cover_url = null,
        private readonly bool $is_wishlisted = false,
    ) {}

    /** @return Box[] */
    public function getBoxes(): array
    {
        return $this->boxes;
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function getSeriesId(): int
    {
        return $this->series_id;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getPublisher(): ?string
    {
        return $this->publisher;
    }

    public function getApiId(): ?string
    {
        return $this->api_id;
    }

    public function getCoverUrl(): ?string
    {
        if (isset($this->cover_url)) {
            return $this->cover_url;
        }

        if (! empty($this->boxes)) {
            return $this->boxes[0]->getCoverUrl();
        }

        return null;
    }

    public function isWishlisted(): bool
    {
        return $this->is_wishlisted;
    }
}
