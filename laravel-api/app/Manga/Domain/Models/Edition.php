<?php

namespace App\Manga\Domain\Models;

class Edition
{
    public function __construct(
        private readonly int $id,
        private readonly int $series_id,
        private readonly string $name, // Standard, Perfect, Double, etc.
        private readonly ?string $publisher,
        private readonly ?string $language,
        private readonly ?int $total_volumes,
    ) {
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function getSeriesId(): int
    {
        return $this->series_id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getPublisher(): ?string
    {
        return $this->publisher;
    }

    public function getLanguage(): ?string
    {
        return $this->language;
    }

    public function getTotalVolumes(): ?int
    {
        return $this->total_volumes;
    }
}
