<?php

declare(strict_types=1);

use App\Borrowing\Domain\Models\Loan;

test('loan model stores and returns values correctly', function () {
    $loanedAt = new DateTimeImmutable('2023-01-01 10:00:00');
    $returnedAt = new DateTimeImmutable('2023-01-02 10:00:00');

    $loan = new Loan(
        id: 1,
        userId: 2,
        loanableId: 3,
        loanableType: 'volume',
        borrowerName: 'Jean',
        loanedAt: $loanedAt,
        returnedAt: $returnedAt,
    );

    expect($loan->getId())->toBe(1);
    expect($loan->getUserId())->toBe(2);
    expect($loan->getLoanableId())->toBe(3);
    expect($loan->getLoanableType())->toBe('volume');
    expect($loan->getBorrowerName())->toBe('Jean');
    expect($loan->getLoanedAt())->toBe($loanedAt);
    expect($loan->getReturnedAt())->toBe($returnedAt);
    expect($loan->isReturned())->toBeTrue();
});

test('isReturned returns false if returnedAt is null', function () {
    $loan = new Loan(
        id: 1,
        userId: 2,
        loanableId: 3,
        loanableType: 'volume',
        borrowerName: 'Jean',
        loanedAt: new DateTimeImmutable,
        returnedAt: null
    );

    expect($loan->isReturned())->toBeFalse();
});
