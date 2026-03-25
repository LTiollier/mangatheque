<?php

declare(strict_types=1);

namespace App\Manga\Application\DTOs;

final readonly class CreateEditionDTO
{
    public function __construct(
        public int $seriesId,
        public string $name,
        public string $language,
        public ?string $publisher = null,
        public ?int $totalVolumes = null,
        public ?int $lastVolumeNumber = null,
        public bool $isFinished = false,
    ) {}
}
