<?php

namespace Tests\Unit\Borrowing\Application\Actions;

use App\Borrowing\Application\Actions\BulkReturnMangaAction;
use App\Borrowing\Application\DTOs\BulkReturnMangaDTO;
use App\Borrowing\Domain\Exceptions\LoanNotFoundException;
use App\Borrowing\Domain\Models\Loan;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use DateTimeImmutable;
use Mockery;

test('it can return multiple mangas in bulk', function () {
    $loanRepo = Mockery::mock(LoanRepositoryInterface::class);

    $activeLoan = Mockery::mock(Loan::class);
    $activeLoan->shouldReceive('getId')->andReturn(1);
    $activeLoan->shouldReceive('getUserId')->andReturn(1);
    $activeLoan->shouldReceive('getVolumeId')->andReturn(101);
    $activeLoan->shouldReceive('getBorrowerName')->andReturn('Someone');
    $activeLoan->shouldReceive('getLoanedAt')->andReturn(new DateTimeImmutable);
    $activeLoan->shouldReceive('getNotes')->andReturn(null);

    $loanRepo->shouldReceive('findActiveByVolumeIdAndUserId')
        ->twice()
        ->andReturn($activeLoan);

    $loanRepo->shouldReceive('save')
        ->twice()
        ->andReturn(Mockery::mock(Loan::class));

    $action = new BulkReturnMangaAction($loanRepo);
    $dto = new BulkReturnMangaDTO(
        userId: 1,
        volumeIds: [101, 102]
    );

    $results = $action->execute($dto);

    expect($results)->toHaveCount(2);
});

test('it throws exception if a volume is not loaned', function () {
    $loanRepo = Mockery::mock(LoanRepositoryInterface::class);

    $loanRepo->shouldReceive('findActiveByVolumeIdAndUserId')
        ->once()
        ->andReturn(null);

    $action = new BulkReturnMangaAction($loanRepo);
    $dto = new BulkReturnMangaDTO(
        userId: 1,
        volumeIds: [101]
    );

    $action->execute($dto);
})->throws(LoanNotFoundException::class);
