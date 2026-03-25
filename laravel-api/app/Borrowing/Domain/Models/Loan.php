<?php

declare(strict_types=1);

namespace App\Borrowing\Domain\Models;

use App\Manga\Domain\Models\Box;
use App\Manga\Domain\Models\Volume;
use DateTimeImmutable;

class Loan
{
    public function __construct(
        private readonly ?int $id,
        private readonly int $userId,
        private readonly int $loanableId,
        private readonly string $loanableType,
        private readonly string $borrowerName,
        private readonly DateTimeImmutable $loanedAt,
        private readonly ?DateTimeImmutable $returnedAt = null,
        private readonly Volume|Box|null $loanable = null,
    ) {}

    public function getLoanable(): Volume|Box|null
    {
        return $this->loanable;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUserId(): int
    {
        return $this->userId;
    }

    public function getLoanableId(): int
    {
        return $this->loanableId;
    }

    public function getLoanableType(): string
    {
        return $this->loanableType;
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

    public function isReturned(): bool
    {
        return $this->returnedAt !== null;
    }
}
