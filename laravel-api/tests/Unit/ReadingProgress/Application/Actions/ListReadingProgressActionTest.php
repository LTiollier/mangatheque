<?php

use App\ReadingProgress\Application\Actions\ListReadingProgressAction;
use App\ReadingProgress\Domain\Models\ReadingProgress;
use App\ReadingProgress\Domain\Repositories\ReadingProgressRepositoryInterface;

test('returns all reading progress for user', function () {
    $progress = [
        new ReadingProgress(id: 1, userId: 5, volumeId: 10, readAt: new DateTimeImmutable),
        new ReadingProgress(id: 2, userId: 5, volumeId: 11, readAt: new DateTimeImmutable),
    ];

    $repository = Mockery::mock(ReadingProgressRepositoryInterface::class);
    $repository->shouldReceive('findAllByUserId')->with(5)->once()->andReturn($progress);

    $action = new ListReadingProgressAction($repository);
    $result = $action->execute(5);

    expect($result)->toBe($progress)->toHaveCount(2);
});

test('returns empty array when user has no reading progress', function () {
    $repository = Mockery::mock(ReadingProgressRepositoryInterface::class);
    $repository->shouldReceive('findAllByUserId')->with(99)->once()->andReturn([]);

    $action = new ListReadingProgressAction($repository);
    $result = $action->execute(99);

    expect($result)->toBeEmpty();
});
