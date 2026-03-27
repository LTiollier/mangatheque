<?php

declare(strict_types=1);

use App\Borrowing\Domain\Models\LoanItem;

test('loan item stores and returns values correctly', function () {
    $item = new LoanItem(
        id: 1,
        loanId: 10,
        loanableId: 5,
        loanableType: 'volume',
    );

    expect($item->id)->toBe(1);
    expect($item->loanId)->toBe(10);
    expect($item->loanableId)->toBe(5);
    expect($item->loanableType)->toBe('volume');
    expect($item->loanable)->toBeNull();
});

test('loan item can be created with null id', function () {
    $item = new LoanItem(
        id: null,
        loanId: 10,
        loanableId: 5,
        loanableType: 'box',
    );

    expect($item->id)->toBeNull();
});
