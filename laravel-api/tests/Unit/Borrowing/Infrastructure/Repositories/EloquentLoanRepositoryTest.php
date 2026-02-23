<?php

namespace Tests\Unit\Borrowing\Infrastructure\Repositories;

use App\Borrowing\Domain\Models\Loan as DomainLoan;
use App\Borrowing\Infrastructure\EloquentModels\Loan as EloquentLoan;
use App\Borrowing\Infrastructure\Repositories\EloquentLoanRepository;
use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Series;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\User\Infrastructure\EloquentModels\User;
use DateTimeImmutable;

test('it can save and retrieve a loan', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id]);
    $volume = Volume::factory()->create(['edition_id' => $edition->id]);

    $loanedAt = new DateTimeImmutable('2023-01-01 10:00:00');
    $domainLoan = new DomainLoan(
        id: null,
        userId: $user->id,
        volumeId: $volume->id,
        borrowerName: 'Jean Dupont',
        loanedAt: $loanedAt,
        notes: 'Test notes'
    );

    $repository = new EloquentLoanRepository;

    // Test Save
    $savedLoan = $repository->save($domainLoan);

    expect($savedLoan->getId())->not->toBeNull()
        ->and($savedLoan->getBorrowerName())->toBe('Jean Dupont')
        ->and($savedLoan->getNotes())->toBe('Test notes');

    // Test FindById
    $foundLoan = $repository->findById($savedLoan->getId());

    expect($foundLoan)->not->toBeNull()
        ->and($foundLoan->getId())->toBe($savedLoan->getId())
        ->and($foundLoan->getBorrowerName())->toBe($savedLoan->getBorrowerName());
});

test('it can find an active loan for a volume and user', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();

    // Create an active loan
    EloquentLoan::create([
        'user_id' => $user->id,
        'volume_id' => $volume->id,
        'borrower_name' => 'Active Borrower',
        'loaned_at' => now(),
        'returned_at' => null,
    ]);

    $repository = new EloquentLoanRepository;
    $activeLoan = $repository->findActiveByVolumeIdAndUserId($volume->id, $user->id);

    expect($activeLoan)->not->toBeNull()
        ->and($activeLoan->getBorrowerName())->toBe('Active Borrower')
        ->and($activeLoan->isReturned())->toBeFalse();
});
