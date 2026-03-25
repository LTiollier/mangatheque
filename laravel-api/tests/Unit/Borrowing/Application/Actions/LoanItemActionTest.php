<?php

declare(strict_types=1);

use App\Borrowing\Application\Actions\LoanItemAction;
use App\Borrowing\Application\DTOs\LoanItemDTO;
use App\Borrowing\Domain\Exceptions\AlreadyLoanedException;
use App\Borrowing\Domain\Exceptions\VolumeNotInCollectionException;
use App\Borrowing\Domain\Models\Loan;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use App\Manga\Domain\Repositories\BoxRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;

beforeEach(function () {
    $this->loanRepository = Mockery::mock(LoanRepositoryInterface::class);
    $this->volumeRepository = Mockery::mock(VolumeRepositoryInterface::class);
    $this->boxRepository = Mockery::mock(BoxRepositoryInterface::class);
    $this->action = new LoanItemAction($this->loanRepository, $this->volumeRepository, $this->boxRepository);
});

it('loans a volume successfully', function () {
    $dto = new LoanItemDTO(
        userId: 1,
        loanableId: 1,
        loanableType: 'volume',
        borrowerName: 'John Doe',
    );

    $this->volumeRepository->shouldReceive('isOwnedByUser')
        ->with(1, 1)
        ->once()
        ->andReturn(true);

    $this->loanRepository->shouldReceive('findActiveByLoanableIdAndType')
        ->with(1, 'volume', 1)
        ->once()
        ->andReturn(null);

    $this->loanRepository->shouldReceive('save')
        ->once()
        ->andReturn(Mockery::mock(Loan::class));

    $result = $this->action->execute($dto);

    expect($result)->toBeInstanceOf(Loan::class);
});

it('throws exception if volume not in collection', function () {
    $dto = new LoanItemDTO(1, 1, 'volume', 'John Doe');

    $this->volumeRepository->shouldReceive('isOwnedByUser')->andReturn(false);

    $this->action->execute($dto);
})->throws(VolumeNotInCollectionException::class);

it('throws exception if volume already loaned', function () {
    $dto = new LoanItemDTO(1, 1, 'volume', 'John Doe');

    $this->volumeRepository->shouldReceive('isOwnedByUser')->andReturn(true);
    $activeLoan = Mockery::mock(Loan::class);
    $activeLoan->shouldReceive('getBorrowerName')->andReturn('Alice');
    $this->loanRepository->shouldReceive('findActiveByLoanableIdAndType')->andReturn($activeLoan);

    $this->action->execute($dto);
})->throws(AlreadyLoanedException::class);

it('loans a box successfully', function () {
    $dto = new LoanItemDTO(
        userId: 1,
        loanableId: 1,
        loanableType: 'box',
        borrowerName: 'John Doe'
    );

    $this->boxRepository->shouldReceive('isOwnedByUser')
        ->with(1, 1)
        ->once()
        ->andReturn(true);

    $this->loanRepository->shouldReceive('findActiveByLoanableIdAndType')
        ->with(1, 'box', 1)
        ->once()
        ->andReturn(null);

    $this->loanRepository->shouldReceive('save')
        ->once()
        ->andReturn(Mockery::mock(Loan::class));

    $result = $this->action->execute($dto);

    expect($result)->toBeInstanceOf(Loan::class);
});
