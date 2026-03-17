<?php

namespace App\Manga\Domain\Models;

class Edition
{
    /**
     * @param  Volume[]  $volumes
     * @param  int[]  $possessed_numbers
     */
    public function __construct(
        private readonly int $id,
        private readonly int $series_id,
        private readonly string $name, // Standard, Perfect, Double, etc.
        private readonly ?string $publisher,
        private readonly ?string $language,
        private readonly ?int $total_volumes,
        private readonly bool $is_finished = false,
        private readonly ?int $possessed_count = null,
        private readonly array $possessed_numbers = [],
        private readonly array $volumes = [],
        private readonly ?Series $series = null,
    ) {}

    public function getSeries(): ?Series
    {
        return $this->series;
    }

    /**
     * @return int[]
     */
    public function getPossessedNumbers(): array
    {
        return $this->possessed_numbers;
    }

    /**
     * @return Volume[]
     */
    public function getVolumes(): array
    {
        return $this->volumes;
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

    public function isFinished(): bool
    {
        return $this->is_finished;
    }

    public function getPossessedCount(): ?int
    {
        return $this->possessed_count;
    }
}
