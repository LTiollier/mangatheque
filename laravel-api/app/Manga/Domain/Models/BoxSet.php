<?php

namespace App\Manga\Domain\Models;

class BoxSet
{
    public function __construct(
        private readonly int $id,
        private readonly int $series_id,
        private readonly string $title,
        private readonly ?string $publisher,
        private readonly ?string $api_id,
    ) {}

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
}
