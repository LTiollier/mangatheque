<?php

declare(strict_types=1);

use App\Borrowing\Application\Actions\ListLoansAction;
use App\Borrowing\Domain\Models\Loan;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;

test('it lists user loans', function () {
    $userId = 1;

    $loans = [
        new Loan(id: 1, userId: $userId, borrowerName: 'Alice', loanedAt: new DateTimeImmutable),
        new Loan(id: 2, userId: $userId, borrowerName: 'Bob', loanedAt: new DateTimeImmutable),
    ];

    $loanRepository = Mockery::mock(LoanRepositoryInterface::class);
    $loanRepository->shouldReceive('findAllByUserId')
        ->with($userId)
        ->once()
        ->andReturn($loans);

    $action = new ListLoansAction($loanRepository);
    $result = $action->execute($userId);

    expect($result)->toBe($loans);
});
