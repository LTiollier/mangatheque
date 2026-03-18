<?php

use App\Borrowing\Application\Actions\ReturnItemAction;
use App\Borrowing\Application\DTOs\ReturnItemDTO;
use App\Borrowing\Domain\Exceptions\LoanNotFoundException;
use App\Borrowing\Domain\Models\Loan;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;

beforeEach(function () {
    $this->loanRepository = Mockery::mock(LoanRepositoryInterface::class);
    $this->action = new ReturnItemAction($this->loanRepository);
});

it('returns an item successfully', function () {
    $dto = new ReturnItemDTO(
        userId: 1,
        loanableId: 1,
        loanableType: 'volume'
    );

    $loan = Mockery::mock(Loan::class);
    $loan->shouldReceive('getId')->andReturn(1);
    $loan->shouldReceive('getUserId')->andReturn(1);
    $loan->shouldReceive('getLoanableId')->andReturn(1);
    $loan->shouldReceive('getLoanableType')->andReturn('volume');
    $loan->shouldReceive('getBorrowerName')->andReturn('John Doe');
    $loan->shouldReceive('getLoanedAt')->andReturn(new DateTimeImmutable);
    $loan->shouldReceive('getNotes')->andReturn(null);

    $this->loanRepository->shouldReceive('findActiveByLoanableIdAndType')
        ->with(1, 'volume', 1)
        ->once()
        ->andReturn($loan);

    $this->loanRepository->shouldReceive('save')
        ->once()
        ->andReturn(Mockery::mock(Loan::class));

    $result = $this->action->execute($dto);

    expect($result)->toBeInstanceOf(Loan::class);
});

it('throws exception if active loan not found', function () {
    $dto = new ReturnItemDTO(1, 1, 'volume');

    $this->loanRepository->shouldReceive('findActiveByLoanableIdAndType')->andReturn(null);

    $this->action->execute($dto);
})->throws(LoanNotFoundException::class);
