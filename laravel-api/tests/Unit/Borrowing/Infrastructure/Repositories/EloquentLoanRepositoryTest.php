<?php

declare(strict_types=1);

use App\Borrowing\Domain\Models\Loan as DomainLoan;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use App\Borrowing\Infrastructure\EloquentModels\LoanItem;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('it can save and retrieve a loan', function () {
    $user = User::factory()->create();

    $loanRepository = app(LoanRepositoryInterface::class);

    $loanedAt = new DateTimeImmutable('2023-01-01 10:00:00');
    $domainLoan = new DomainLoan(
        id: null,
        userId: $user->id,
        borrowerName: 'Jean Dupont',
        loanedAt: $loanedAt,
    );

    $savedLoan = $loanRepository->save($domainLoan);

    expect($savedLoan->getId())->not->toBeNull()
        ->and($savedLoan->getBorrowerName())->toBe('Jean Dupont');

    $retrievedLoan = $loanRepository->findById($savedLoan->getId());
    expect($retrievedLoan)->not->toBeNull()
        ->and($retrievedLoan->getBorrowerName())->toBe('Jean Dupont');
});

test('it can find an active loan for a loanable item and user', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();

    $loanRepository = app(LoanRepositoryInterface::class);

    $domainLoan = new DomainLoan(
        id: null,
        userId: $user->id,
        borrowerName: 'Active Borrower',
        loanedAt: new DateTimeImmutable,
    );

    $savedLoan = $loanRepository->save($domainLoan);

    // Create the loan item linking the loan to the volume
    LoanItem::create([
        'loan_id' => $savedLoan->getId(),
        'loanable_type' => 'volume',
        'loanable_id' => $volume->id,
    ]);

    $activeLoan = $loanRepository->findActiveByLoanableItem($volume->id, 'volume', $user->id);

    expect($activeLoan)->not->toBeNull()
        ->and($activeLoan->getBorrowerName())->toBe('Active Borrower');
});

test('it returns null when no active loan exists for a loanable item', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();

    $loanRepository = app(LoanRepositoryInterface::class);

    $activeLoan = $loanRepository->findActiveByLoanableItem($volume->id, 'volume', $user->id);

    expect($activeLoan)->toBeNull();
});
