<?php

declare(strict_types=1);

use App\Borrowing\Application\Actions\BulkReturnLoanAction;
use App\Borrowing\Application\DTOs\BulkReturnLoanDTO;
use App\Borrowing\Domain\Exceptions\LoanNotFoundException;
use App\Borrowing\Domain\Models\Loan;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;

beforeEach(function () {
    $this->loanRepository = Mockery::mock(LoanRepositoryInterface::class);
    $this->action = new BulkReturnLoanAction($this->loanRepository);
});

it('returns multiple loans successfully', function () {
    $dto = new BulkReturnLoanDTO(userId: 1, loanIds: [10, 11]);

    $loan1 = Mockery::mock(Loan::class);
    $loan1->shouldReceive('isReturned')->andReturn(false);
    $loan1->shouldReceive('getUserId')->andReturn(1);
    $returned1 = Mockery::mock(Loan::class);
    $loan1->shouldReceive('withReturnedAt')->once()->andReturn($returned1);

    $loan2 = Mockery::mock(Loan::class);
    $loan2->shouldReceive('isReturned')->andReturn(false);
    $loan2->shouldReceive('getUserId')->andReturn(1);
    $returned2 = Mockery::mock(Loan::class);
    $loan2->shouldReceive('withReturnedAt')->once()->andReturn($returned2);

    $this->loanRepository->shouldReceive('findById')->with(10)->andReturn($loan1);
    $this->loanRepository->shouldReceive('findById')->with(11)->andReturn($loan2);
    $this->loanRepository->shouldReceive('save')->twice()->andReturn($returned1, $returned2);

    $result = $this->action->execute($dto);

    expect($result)->toBeArray()->toHaveCount(2);
});

it('throws exception if a loan is not found', function () {
    $dto = new BulkReturnLoanDTO(userId: 1, loanIds: [99]);

    $this->loanRepository->shouldReceive('findById')->with(99)->andReturn(null);

    $this->action->execute($dto);
})->throws(LoanNotFoundException::class);
