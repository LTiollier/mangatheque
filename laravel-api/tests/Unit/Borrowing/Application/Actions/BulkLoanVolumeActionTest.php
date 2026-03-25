<?php

declare(strict_types=1);

namespace Tests\Unit\Borrowing\Application\Actions;

use App\Borrowing\Application\Actions\BulkLoanVolumeAction;
use App\Borrowing\Application\DTOs\BulkLoanVolumeDTO;
use App\Borrowing\Domain\Exceptions\AlreadyLoanedException;
use App\Borrowing\Domain\Exceptions\VolumeNotInCollectionException;
use App\Borrowing\Domain\Models\Loan;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Mockery;

test('it can loan multiple mangas in bulk', function () {
    $loanRepo = Mockery::mock(LoanRepositoryInterface::class);
    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);

    $volumeRepo->shouldReceive('isOwnedByUser')
        ->twice()
        ->andReturn(true);

    $loanRepo->shouldReceive('findActiveByLoanableIdAndType')
        ->twice()
        ->with(Mockery::any(), 'volume', 1)
        ->andReturn(null);

    $loanRepo->shouldReceive('save')
        ->twice()
        ->andReturn(Mockery::mock(Loan::class));

    $action = new BulkLoanVolumeAction($loanRepo, $volumeRepo);
    $dto = new BulkLoanVolumeDTO(
        userId: 1,
        volumeIds: [101, 102],
        borrowerName: 'Test Borrower',
    );

    $results = $action->execute($dto);

    expect($results)->toHaveCount(2);
});

test('it throws exception if one volume is not owned', function () {
    $loanRepo = Mockery::mock(LoanRepositoryInterface::class);
    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);

    $volumeRepo->shouldReceive('isOwnedByUser')
        ->once()
        ->with(101, 1)
        ->andReturn(true);

    $volumeRepo->shouldReceive('isOwnedByUser')
        ->once()
        ->with(102, 1)
        ->andReturn(false);

    $loanRepo->shouldReceive('findActiveByLoanableIdAndType')
        ->once()
        ->with(101, 'volume', 1)
        ->andReturn(null);

    $loanRepo->shouldReceive('save')
        ->once()
        ->andReturn(Mockery::mock(Loan::class));

    $action = new BulkLoanVolumeAction($loanRepo, $volumeRepo);
    $dto = new BulkLoanVolumeDTO(
        userId: 1,
        volumeIds: [101, 102],
        borrowerName: 'Test Borrower',
    );

    $action->execute($dto);
})->throws(VolumeNotInCollectionException::class);

test('it throws exception if one volume is already loaned', function () {
    $loanRepo = Mockery::mock(LoanRepositoryInterface::class);
    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);

    $volumeRepo->shouldReceive('isOwnedByUser')
        ->once()
        ->andReturn(true);

    $activeLoan = Mockery::mock(Loan::class);
    $activeLoan->shouldReceive('getBorrowerName')->andReturn('Someone');

    $loanRepo->shouldReceive('findActiveByLoanableIdAndType')
        ->once()
        ->with(101, 'volume', 1)
        ->andReturn($activeLoan);

    $action = new BulkLoanVolumeAction($loanRepo, $volumeRepo);
    $dto = new BulkLoanVolumeDTO(
        userId: 1,
        volumeIds: [101],
        borrowerName: 'Test Borrower',
    );

    $action->execute($dto);
})->throws(AlreadyLoanedException::class);
