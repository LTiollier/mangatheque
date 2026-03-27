<?php

declare(strict_types=1);

use App\Borrowing\Application\Actions\ReturnLoanAction;
use App\Borrowing\Application\DTOs\ReturnLoanDTO;
use App\Borrowing\Domain\Exceptions\LoanNotFoundException;
use App\Borrowing\Domain\Models\Loan;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;

beforeEach(function () {
    $this->loanRepository = Mockery::mock(LoanRepositoryInterface::class);
    $this->action = new ReturnLoanAction($this->loanRepository);
});

it('returns a loan successfully', function () {
    $dto = new ReturnLoanDTO(userId: 1, loanId: 10);

    $loan = Mockery::mock(Loan::class);
    $loan->shouldReceive('isReturned')->andReturn(false);
    $loan->shouldReceive('getUserId')->andReturn(1);

    $returnedLoan = Mockery::mock(Loan::class);
    $loan->shouldReceive('withReturnedAt')->once()->andReturn($returnedLoan);

    $this->loanRepository->shouldReceive('findById')->with(10)->once()->andReturn($loan);
    $this->loanRepository->shouldReceive('save')->with($returnedLoan)->once()->andReturn($returnedLoan);

    $result = $this->action->execute($dto);

    expect($result)->toBeInstanceOf(Loan::class);
});

it('throws exception if loan not found', function () {
    $dto = new ReturnLoanDTO(userId: 1, loanId: 99);

    $this->loanRepository->shouldReceive('findById')->with(99)->once()->andReturn(null);

    $this->action->execute($dto);
})->throws(LoanNotFoundException::class);

it('throws exception if loan already returned', function () {
    $dto = new ReturnLoanDTO(userId: 1, loanId: 10);

    $loan = Mockery::mock(Loan::class);
    $loan->shouldReceive('isReturned')->andReturn(true);
    $loan->shouldReceive('getUserId')->andReturn(1);

    $this->loanRepository->shouldReceive('findById')->with(10)->once()->andReturn($loan);

    $this->action->execute($dto);
})->throws(LoanNotFoundException::class);

it('throws exception if loan belongs to different user', function () {
    $dto = new ReturnLoanDTO(userId: 1, loanId: 10);

    $loan = Mockery::mock(Loan::class);
    $loan->shouldReceive('isReturned')->andReturn(false);
    $loan->shouldReceive('getUserId')->andReturn(2);

    $this->loanRepository->shouldReceive('findById')->with(10)->once()->andReturn($loan);

    $this->action->execute($dto);
})->throws(LoanNotFoundException::class);
