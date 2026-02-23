<?php

use App\Borrowing\Domain\Models\Loan;
use App\Manga\Domain\Models\Volume;
use Mockery as m;

test('loan model stores and returns values correctly', function () {
    $loanedAt = new DateTimeImmutable('2023-01-01 10:00:00');
    $returnedAt = new DateTimeImmutable('2023-01-02 10:00:00');
    $volume = m::mock(Volume::class);

    $loan = new Loan(
        id: 1,
        userId: 2,
        volumeId: 3,
        borrowerName: 'Jean',
        loanedAt: $loanedAt,
        returnedAt: $returnedAt,
        notes: 'Notes',
        volume: $volume
    );

    expect($loan->getId())->toBe(1)
        ->and($loan->getUserId())->toBe(2)
        ->and($loan->getVolumeId())->toBe(3)
        ->and($loan->getBorrowerName())->toBe('Jean')
        ->and($loan->getLoanedAt())->toBe($loanedAt)
        ->and($loan->getReturnedAt())->toBe($returnedAt)
        ->and($loan->getNotes())->toBe('Notes')
        ->and($loan->getVolume())->toBe($volume)
        ->and($loan->isReturned())->toBeTrue();
});

test('isReturned returns false if returnedAt is null', function () {
    $loan = new Loan(
        id: 1,
        userId: 2,
        volumeId: 3,
        borrowerName: 'Jean',
        loanedAt: new DateTimeImmutable,
        returnedAt: null
    );

    expect($loan->isReturned())->toBeFalse();
});
