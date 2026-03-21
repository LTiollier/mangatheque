<?php

use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use App\ReadingProgress\Application\Actions\BulkToggleReadingProgressAction;
use App\ReadingProgress\Application\DTOs\BulkToggleReadingProgressDTO;
use App\ReadingProgress\Domain\Models\ReadingProgress;
use App\ReadingProgress\Domain\Repositories\ReadingProgressRepositoryInterface;
use Illuminate\Support\Facades\DB;

test('adds reading progress when volume is owned and not yet read', function () {
    $progress = new ReadingProgress(id: 1, userId: 1, volumeId: 10, readAt: new DateTimeImmutable);

    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $volumeRepo->shouldReceive('isOwnedByUser')->with(10, 1)->once()->andReturn(true);

    $progressRepo = Mockery::mock(ReadingProgressRepositoryInterface::class);
    $progressRepo->shouldReceive('findByUserIdAndVolumeId')->with(1, 10)->once()->andReturn(null);
    $progressRepo->shouldReceive('save')->once()->andReturn($progress);

    DB::shouldReceive('transaction')->andReturnUsing(fn ($cb) => $cb());

    $action = new BulkToggleReadingProgressAction($progressRepo, $volumeRepo);
    $result = $action->execute(new BulkToggleReadingProgressDTO(userId: 1, volumeIds: [10]));

    expect($result['toggled'])->toHaveCount(1)
        ->and($result['removed'])->toBeEmpty();
});

test('removes reading progress when volume is already read', function () {
    $existing = new ReadingProgress(id: 1, userId: 1, volumeId: 10, readAt: new DateTimeImmutable);

    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $volumeRepo->shouldReceive('isOwnedByUser')->with(10, 1)->once()->andReturn(true);

    $progressRepo = Mockery::mock(ReadingProgressRepositoryInterface::class);
    $progressRepo->shouldReceive('findByUserIdAndVolumeId')->with(1, 10)->once()->andReturn($existing);
    $progressRepo->shouldReceive('deleteByUserIdAndVolumeId')->with(1, 10)->once();

    DB::shouldReceive('transaction')->andReturnUsing(fn ($cb) => $cb());

    $action = new BulkToggleReadingProgressAction($progressRepo, $volumeRepo);
    $result = $action->execute(new BulkToggleReadingProgressDTO(userId: 1, volumeIds: [10]));

    expect($result['removed'])->toContain(10)
        ->and($result['toggled'])->toBeEmpty();
});

test('skips volume not owned by user', function () {
    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $volumeRepo->shouldReceive('isOwnedByUser')->with(10, 1)->once()->andReturn(false);

    $progressRepo = Mockery::mock(ReadingProgressRepositoryInterface::class);
    $progressRepo->shouldNotReceive('findByUserIdAndVolumeId');

    DB::shouldReceive('transaction')->andReturnUsing(fn ($cb) => $cb());

    $action = new BulkToggleReadingProgressAction($progressRepo, $volumeRepo);
    $result = $action->execute(new BulkToggleReadingProgressDTO(userId: 1, volumeIds: [10]));

    expect($result['toggled'])->toBeEmpty()
        ->and($result['removed'])->toBeEmpty();
});
