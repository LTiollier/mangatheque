<?php

declare(strict_types=1);

namespace App\Borrowing\Domain\Models;

use DateTimeImmutable;

class Loan
{
    /**
     * @param  LoanItem[]  $items
     */
    public function __construct(
        private readonly ?int $id,
        private readonly int $userId,
        private readonly string $borrowerName,
        private readonly DateTimeImmutable $loanedAt,
        private readonly ?DateTimeImmutable $returnedAt = null,
        private readonly array $items = [],
    ) {}

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUserId(): int
    {
        return $this->userId;
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

    /**
     * @return LoanItem[]
     */
    public function getItems(): array
    {
        return $this->items;
    }

    public function withReturnedAt(DateTimeImmutable $returnedAt): self
    {
        return new self(
            id: $this->id,
            userId: $this->userId,
            borrowerName: $this->borrowerName,
            loanedAt: $this->loanedAt,
            returnedAt: $returnedAt,
            items: $this->items,
        );
    }
}
