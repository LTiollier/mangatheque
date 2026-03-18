<?php

use App\Borrowing\Application\Actions\BulkReturnItemAction;
use App\Borrowing\Application\DTOs\BulkReturnItemDTO;
use App\Borrowing\Domain\Exceptions\LoanNotFoundException;
use App\Borrowing\Domain\Models\Loan;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;

beforeEach(function () {
    $this->loanRepository = Mockery::mock(LoanRepositoryInterface::class);
    $this->action = new BulkReturnItemAction($this->loanRepository);
});

it('returns multiple items successfully', function () {
    $dto = new BulkReturnItemDTO(
        userId: 1,
        items: [
            ['id' => 1, 'type' => 'volume'],
            ['id' => 2, 'type' => 'box'],
        ]
    );

    $loan1 = Mockery::mock(Loan::class);
    $loan1->shouldReceive('getId')->andReturn(1);
    $loan1->shouldReceive('getUserId')->andReturn(1);
    $loan1->shouldReceive('getLoanableId')->andReturn(1);
    $loan1->shouldReceive('getLoanableType')->andReturn('volume');
    $loan1->shouldReceive('getBorrowerName')->andReturn('John Doe');
    $loan1->shouldReceive('getLoanedAt')->andReturn(new DateTimeImmutable);
    $loan1->shouldReceive('getNotes')->andReturn(null);

    $loan2 = Mockery::mock(Loan::class);
    $loan2->shouldReceive('getId')->andReturn(2);
    $loan2->shouldReceive('getUserId')->andReturn(1);
    $loan2->shouldReceive('getLoanableId')->andReturn(2);
    $loan2->shouldReceive('getLoanableType')->andReturn('box');
    $loan2->shouldReceive('getBorrowerName')->andReturn('Jane Doe');
    $loan2->shouldReceive('getLoanedAt')->andReturn(new DateTimeImmutable);
    $loan2->shouldReceive('getNotes')->andReturn(null);

    $this->loanRepository->shouldReceive('findActiveByLoanableIdAndType')
        ->with(1, 'volume', 1)
        ->once()
        ->andReturn($loan1);

    $this->loanRepository->shouldReceive('findActiveByLoanableIdAndType')
        ->with(2, 'box', 1)
        ->once()
        ->andReturn($loan2);

    $this->loanRepository->shouldReceive('save')
        ->twice()
        ->andReturn(Mockery::mock(Loan::class));

    $result = $this->action->execute($dto);

    expect($result)->toBeArray()->toHaveCount(2);
});

it('throws exception if one active loan not found', function () {
    $dto = new BulkReturnItemDTO(
        userId: 1,
        items: [
            ['id' => 1, 'type' => 'volume'],
        ]
    );

    $this->loanRepository->shouldReceive('findActiveByLoanableIdAndType')->andReturn(null);

    $this->action->execute($dto);
})->throws(LoanNotFoundException::class);
