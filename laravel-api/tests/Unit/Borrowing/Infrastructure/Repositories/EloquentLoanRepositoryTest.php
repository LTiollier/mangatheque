<?php

declare(strict_types=1);

use App\Borrowing\Domain\Models\Loan as DomainLoan;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('it can save and retrieve a loan', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();

    $loanRepository = app(LoanRepositoryInterface::class);

    $loanedAt = new DateTimeImmutable('2023-01-01 10:00:00');
    $domainLoan = new DomainLoan(
        id: null,
        userId: $user->id,
        loanableId: $volume->id,
        loanableType: 'volume',
        borrowerName: 'Jean Dupont',
        loanedAt: $loanedAt,
    );

    $savedLoan = $loanRepository->save($domainLoan);

    expect($savedLoan->getId())->not->toBeNull()
        ->and($savedLoan->getBorrowerName())->toBe('Jean Dupont')
        ->and($savedLoan->getLoanableId())->toBe($volume->id)
        ->and($savedLoan->getLoanableType())->toBe('volume');

    $retrievedLoan = $loanRepository->findById($savedLoan->getId());
    expect($retrievedLoan)->not->toBeNull()
        ->and($retrievedLoan->getBorrowerName())->toBe('Jean Dupont');
});

test('it can find an active loan for a volume and user', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();

    $loanRepository = app(LoanRepositoryInterface::class);

    $domainLoan = new DomainLoan(
        id: null,
        userId: $user->id,
        loanableId: $volume->id,
        loanableType: 'volume',
        borrowerName: 'Active Borrower',
        loanedAt: new DateTimeImmutable
    );

    $loanRepository->save($domainLoan);

    $activeLoan = $loanRepository->findActiveByLoanableIdAndType($volume->id, 'volume', $user->id);

    expect($activeLoan)->not->toBeNull()
        ->and($activeLoan->getBorrowerName())->toBe('Active Borrower');
});
