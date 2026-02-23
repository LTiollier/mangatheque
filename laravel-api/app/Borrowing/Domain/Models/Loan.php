<?php

namespace App\Borrowing\Domain\Models;

use DateTimeImmutable;

class Loan
{
    public function __construct(
        private readonly ?int $id,
        private readonly int $userId,
        private readonly int $volumeId,
        private readonly string $borrowerName,
        private readonly DateTimeImmutable $loanedAt,
        private readonly ?DateTimeImmutable $returnedAt = null,
        private readonly ?string $notes = null,
        private readonly ?\App\Manga\Domain\Models\Volume $volume = null,
    ) {}

    public function getVolume(): ?\App\Manga\Domain\Models\Volume
    {
        return $this->volume;
    }

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

    public function getBorrowerName(): string
    {
        return $this->borrowerName;
    }

    public function getLoanedAt(): DateTimeImmutable
    {
        return $this->loanedAt;
    }

    public function getReturnedAt(): ?DateTimeImmutable
    {
        return $this->returnedAt;
    }

    public function getNotes(): ?string
    {
        return $this->notes;
    }

    public function isReturned(): bool
    {
        return $this->returnedAt !== null;
    }
}
