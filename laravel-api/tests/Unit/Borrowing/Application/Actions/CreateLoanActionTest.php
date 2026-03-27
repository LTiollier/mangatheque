<?php

declare(strict_types=1);

use App\Borrowing\Application\Actions\CreateLoanAction;
use App\Borrowing\Application\DTOs\CreateLoanDTO;
use App\Borrowing\Domain\Exceptions\AlreadyLoanedException;
use App\Borrowing\Domain\Exceptions\VolumeNotInCollectionException;
use App\Borrowing\Domain\Models\Loan;
use App\Borrowing\Domain\Models\LoanItem;
use App\Borrowing\Domain\Repositories\LoanItemRepositoryInterface;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use App\Manga\Domain\Repositories\BoxRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;

beforeEach(function () {
    $this->loanRepository = Mockery::mock(LoanRepositoryInterface::class);
    $this->loanItemRepository = Mockery::mock(LoanItemRepositoryInterface::class);
    $this->volumeRepository = Mockery::mock(VolumeRepositoryInterface::class);
    $this->boxRepository = Mockery::mock(BoxRepositoryInterface::class);
    $this->action = new CreateLoanAction(
        $this->loanRepository,
        $this->loanItemRepository,
        $this->volumeRepository,
        $this->boxRepository
    );
});

it('creates a loan with a single volume successfully', function () {
    $dto = new CreateLoanDTO(
        userId: 1,
        borrowerName: 'John Doe',
        items: [['type' => 'volume', 'id' => 1]],
    );

    $this->volumeRepository->shouldReceive('isOwnedByUser')->with(1, 1)->once()->andReturn(true);
    $this->loanRepository->shouldReceive('findActiveByLoanableItem')->with(1, 'volume', 1)->once()->andReturn(null);

    $savedLoan = Mockery::mock(Loan::class);
    $savedLoan->shouldReceive('getId')->andReturn(42);
    $this->loanRepository->shouldReceive('save')->once()->andReturn($savedLoan);
    $this->loanItemRepository->shouldReceive('save')->once()->andReturn(new LoanItem(id: 1, loanId: 42, loanableId: 1, loanableType: 'volume'));

    $result = $this->action->execute($dto);

    expect($result)->toBeInstanceOf(Loan::class);
});

it('creates a loan with multiple items successfully', function () {
    $dto = new CreateLoanDTO(
        userId: 1,
        borrowerName: 'John Doe',
        items: [
            ['type' => 'volume', 'id' => 1],
            ['type' => 'volume', 'id' => 2],
            ['type' => 'box', 'id' => 3],
        ],
    );

    $this->volumeRepository->shouldReceive('isOwnedByUser')->with(1, 1)->once()->andReturn(true);
    $this->volumeRepository->shouldReceive('isOwnedByUser')->with(2, 1)->once()->andReturn(true);
    $this->boxRepository->shouldReceive('isOwnedByUser')->with(3, 1)->once()->andReturn(true);
    $this->loanRepository->shouldReceive('findActiveByLoanableItem')->times(3)->andReturn(null);

    $savedLoan = Mockery::mock(Loan::class);
    $savedLoan->shouldReceive('getId')->andReturn(42);
    $this->loanRepository->shouldReceive('save')->once()->andReturn($savedLoan);
    $this->loanItemRepository->shouldReceive('save')->times(3)->andReturn(new LoanItem(id: 1, loanId: 42, loanableId: 1, loanableType: 'volume'));

    $result = $this->action->execute($dto);

    expect($result)->toBeInstanceOf(Loan::class);
});

it('throws exception if volume not in collection', function () {
    $dto = new CreateLoanDTO(userId: 1, borrowerName: 'John Doe', items: [['type' => 'volume', 'id' => 1]]);

    $this->volumeRepository->shouldReceive('isOwnedByUser')->andReturn(false);

    $this->action->execute($dto);
})->throws(VolumeNotInCollectionException::class);

it('throws exception if volume already loaned', function () {
    $dto = new CreateLoanDTO(userId: 1, borrowerName: 'John Doe', items: [['type' => 'volume', 'id' => 1]]);

    $this->volumeRepository->shouldReceive('isOwnedByUser')->andReturn(true);

    $activeLoan = Mockery::mock(Loan::class);
    $activeLoan->shouldReceive('getBorrowerName')->andReturn('Alice');
    $this->loanRepository->shouldReceive('findActiveByLoanableItem')->andReturn($activeLoan);

    $this->action->execute($dto);
})->throws(AlreadyLoanedException::class);

it('creates a loan with a box successfully', function () {
    $dto = new CreateLoanDTO(
        userId: 1,
        borrowerName: 'John Doe',
        items: [['type' => 'box', 'id' => 5]],
    );

    $this->boxRepository->shouldReceive('isOwnedByUser')->with(5, 1)->once()->andReturn(true);
    $this->loanRepository->shouldReceive('findActiveByLoanableItem')->with(5, 'box', 1)->once()->andReturn(null);

    $savedLoan = Mockery::mock(Loan::class);
    $savedLoan->shouldReceive('getId')->andReturn(42);
    $this->loanRepository->shouldReceive('save')->once()->andReturn($savedLoan);
    $this->loanItemRepository->shouldReceive('save')->once()->andReturn(new LoanItem(id: 1, loanId: 42, loanableId: 1, loanableType: 'volume'));

    $result = $this->action->execute($dto);

    expect($result)->toBeInstanceOf(Loan::class);
});
