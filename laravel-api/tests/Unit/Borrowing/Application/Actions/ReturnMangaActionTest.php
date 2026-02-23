<?php

namespace Tests\Unit\Borrowing\Application\Actions;

use App\Borrowing\Application\Actions\ReturnMangaAction;
use App\Borrowing\Application\DTOs\ReturnMangaDTO;
use App\Borrowing\Domain\Models\Loan;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use DateTimeImmutable;
use Mockery;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

test('it marks a manga as returned', function () {
    $loanRepository = Mockery::mock(LoanRepositoryInterface::class);

    $loanedAt = new DateTimeImmutable('2023-01-01 10:00:00');
    $activeLoan = new Loan(
        id: 123,
        userId: 1,
        volumeId: 10,
        borrowerName: 'Jean',
        loanedAt: $loanedAt
    );

    $loanRepository->shouldReceive('findActiveByVolumeIdAndUserId')
        ->once()
        ->with(10, 1)
        ->andReturn($activeLoan);

    $loanRepository->shouldReceive('save')
        ->once()
        ->with(Mockery::on(function (Loan $loan) use ($loanedAt) {
            return $loan->getId() === 123 &&
                $loan->getReturnedAt() instanceof DateTimeImmutable &&
                $loan->getLoanedAt() === $loanedAt;
        }))
        ->andReturnArg(0);

    $action = new ReturnMangaAction($loanRepository);
    $dto = new ReturnMangaDTO(userId: 1, volumeId: 10);

    $result = $action->execute($dto);

    expect($result->isReturned())->toBeTrue();
});

test('it throws an exception if no active loan is found', function () {
    $loanRepository = Mockery::mock(LoanRepositoryInterface::class);

    $loanRepository->shouldReceive('findActiveByVolumeIdAndUserId')
        ->once()
        ->andReturn(null);

    $action = new ReturnMangaAction($loanRepository);
    $dto = new ReturnMangaDTO(userId: 1, volumeId: 10);

    expect(fn () => $action->execute($dto))
        ->toThrow(BadRequestHttpException::class, "Ce manga n'est pas marqué comme prêté.");
});
