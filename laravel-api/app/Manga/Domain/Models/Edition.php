<?php

declare(strict_types=1);

namespace App\Manga\Domain\Models;

final class Edition
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
        private readonly ?int $last_volume_number = null,
        private readonly ?int $released_volumes = null,
        private readonly bool $is_finished = false,
        private readonly ?int $possessed_count = null,
        private readonly array $possessed_numbers = [],
        private readonly array $volumes = [],
        private readonly ?string $cover_url = null,
        private readonly ?Series $series = null,
        private readonly bool $is_wishlisted = false,
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

    public function getLastVolumeNumber(): ?int
    {
        return $this->last_volume_number;
    }

    public function getReleasedVolumes(): ?int
    {
        return $this->released_volumes;
    }

    public function isFinished(): bool
    {
        return $this->is_finished;
    }

    public function getPossessedCount(): ?int
    {
        return $this->possessed_count;
    }

    public function isWishlisted(): bool
    {
        return $this->is_wishlisted;
    }

    public function getCoverUrl(): ?string
    {
        if (isset($this->cover_url)) {
            return $this->cover_url;
        }

        if (! empty($this->volumes)) {
            return $this->volumes[0]->getCoverUrl();
        }

        return null;
    }
}
