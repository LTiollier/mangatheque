<?php

namespace App\ReadingProgress\Domain\Models;

use DateTimeImmutable;

class ReadingProgress
{
    public function __construct(
        private readonly ?int $id,
        private readonly int $userId,
        private readonly int $volumeId,
        private readonly DateTimeImmutable $readAt,
    ) {}

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUserId(): int
    {
        return $this->userId;
    }

    public function getVolumeId(): int
    {
        return $this->volumeId;
    }

    public function getReadAt(): DateTimeImmutable
    {
        return $this->readAt;
    }
}
