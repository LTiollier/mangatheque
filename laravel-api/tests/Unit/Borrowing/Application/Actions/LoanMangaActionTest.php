<?php

namespace Tests\Unit\Borrowing\Application\Actions;

use App\Borrowing\Application\Actions\LoanMangaAction;
use App\Borrowing\Application\DTOs\LoanMangaDTO;
use App\Borrowing\Domain\Models\Loan;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Mockery;

test('it loans a manga', function () {
    $loanRepo = Mockery::mock(LoanRepositoryInterface::class);
    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);

    $volumeRepo->shouldReceive('isOwnedByUser')
        ->once()
        ->with(10, 1)
        ->andReturn(true);

    $loanRepo->shouldReceive('findActiveByVolumeIdAndUserId')
        ->once()
        ->with(10, 1)
        ->andReturn(null);

    $loanRepo->shouldReceive('save')
        ->once()
        ->andReturn(Mockery::mock(Loan::class));

    $action = new LoanMangaAction($loanRepo, $volumeRepo);
    $dto = new LoanMangaDTO(userId: 1, volumeId: 10, borrowerName: 'Jean', notes: 'Notes');

    $result = $action->execute($dto);
    expect($result)->not->toBeNull();
});
