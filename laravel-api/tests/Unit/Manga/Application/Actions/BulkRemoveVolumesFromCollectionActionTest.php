<?php

declare(strict_types=1);

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\BulkRemoveVolumesFromCollectionAction;
use App\Manga\Application\DTOs\BulkRemoveVolumesDTO;
use App\Manga\Domain\Exceptions\UnauthorizedVolumeAccessException;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Mockery;

test('bulk removes volumes from collection when owned by user', function () {
    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $volumeIds = [1, 2, 3];
    $userId = 42;

    $volumeRepo->shouldReceive('areAllOwnedByUser')
        ->with($volumeIds, $userId)
        ->once()
        ->andReturn(true);

    $volumeRepo->shouldReceive('detachManyFromUser')
        ->with($volumeIds, $userId)
        ->once();

    $dto = new BulkRemoveVolumesDTO($volumeIds, $userId);
    $action = new BulkRemoveVolumesFromCollectionAction($volumeRepo);
    $action->execute($dto);
});

test('it throws an exception when user does not own all volumes', function () {
    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $volumeIds = [1, 2, 3];
    $userId = 42;

    $volumeRepo->shouldReceive('areAllOwnedByUser')
        ->with($volumeIds, $userId)
        ->once()
        ->andReturn(false);

    $volumeRepo->shouldReceive('detachManyFromUser')
        ->never();

    $dto = new BulkRemoveVolumesDTO($volumeIds, $userId);
    $action = new BulkRemoveVolumesFromCollectionAction($volumeRepo);

    $this->expectException(UnauthorizedVolumeAccessException::class);

    $action->execute($dto);
});
