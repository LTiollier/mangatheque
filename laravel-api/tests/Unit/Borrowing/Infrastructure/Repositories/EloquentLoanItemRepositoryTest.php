<?php

declare(strict_types=1);

use App\Borrowing\Domain\Models\LoanItem as DomainLoanItem;
use App\Borrowing\Domain\Repositories\LoanItemRepositoryInterface;
use App\Borrowing\Infrastructure\EloquentModels\Loan;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('it can save and retrieve a loan item', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();

    $loan = Loan::create([
        'user_id' => $user->id,
        'borrower_name' => 'Jean Dupont',
        'loaned_at' => now(),
        'returned_at' => null,
    ]);

    $loanItemRepository = app(LoanItemRepositoryInterface::class);

    $domainItem = new DomainLoanItem(
        id: null,
        loanId: $loan->id,
        loanableId: $volume->id,
        loanableType: 'volume',
    );

    $saved = $loanItemRepository->save($domainItem);

    expect($saved->id)->not->toBeNull()
        ->and($saved->loanId)->toBe($loan->id)
        ->and($saved->loanableId)->toBe($volume->id)
        ->and($saved->loanableType)->toBe('volume');
});

test('it can find an active loan item by loanable id and type', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();

    $loan = Loan::create([
        'user_id' => $user->id,
        'borrower_name' => 'Active Borrower',
        'loaned_at' => now(),
        'returned_at' => null,
    ]);

    $loanItemRepository = app(LoanItemRepositoryInterface::class);

    $loanItemRepository->save(new DomainLoanItem(
        id: null,
        loanId: $loan->id,
        loanableId: $volume->id,
        loanableType: 'volume',
    ));

    $found = $loanItemRepository->findActiveByLoanableIdAndType($volume->id, 'volume');

    expect($found)->not->toBeNull()
        ->and($found->loanableId)->toBe($volume->id);
});

test('it returns null when no active loan item exists', function () {
    $volume = Volume::factory()->create();

    $loanItemRepository = app(LoanItemRepositoryInterface::class);

    $found = $loanItemRepository->findActiveByLoanableIdAndType($volume->id, 'volume');

    expect($found)->toBeNull();
});
