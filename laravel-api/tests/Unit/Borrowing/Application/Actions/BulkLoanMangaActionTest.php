<?php

namespace Tests\Unit\Borrowing\Application\Actions;

use App\Borrowing\Application\Actions\BulkLoanMangaAction;
use App\Borrowing\Application\DTOs\BulkLoanMangaDTO;
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

    $loanRepo->shouldReceive('findActiveByVolumeIdAndUserId')
        ->twice()
        ->andReturn(null);

    $loanRepo->shouldReceive('save')
        ->twice()
        ->andReturn(Mockery::mock(Loan::class));

    $action = new BulkLoanMangaAction($loanRepo, $volumeRepo);
    $dto = new BulkLoanMangaDTO(
        userId: 1,
        volumeIds: [101, 102],
        borrowerName: 'Test Borrower',
        notes: 'Some notes'
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

    $loanRepo->shouldReceive('findActiveByVolumeIdAndUserId')
        ->once()
        ->andReturn(null);

    $loanRepo->shouldReceive('save')
        ->once()
        ->andReturn(Mockery::mock(Loan::class));

    $action = new BulkLoanMangaAction($loanRepo, $volumeRepo);
    $dto = new BulkLoanMangaDTO(
        userId: 1,
        volumeIds: [101, 102],
        borrowerName: 'Test Borrower',
        notes: null
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

    $loanRepo->shouldReceive('findActiveByVolumeIdAndUserId')
        ->once()
        ->andReturn($activeLoan);

    $action = new BulkLoanMangaAction($loanRepo, $volumeRepo);
    $dto = new BulkLoanMangaDTO(
        userId: 1,
        volumeIds: [101],
        borrowerName: 'Test Borrower',
        notes: null
    );

    $action->execute($dto);
})->throws(AlreadyLoanedException::class);
