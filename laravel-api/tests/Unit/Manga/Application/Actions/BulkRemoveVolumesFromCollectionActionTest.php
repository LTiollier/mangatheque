<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\BulkRemoveVolumesFromCollectionAction;
use App\Manga\Application\DTOs\BulkRemoveVolumesDTO;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Mockery;

test('bulk removes volumes from collection', function () {
    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $volumeIds = [1, 2, 3];
    $userId = 42;

    $volumeRepo->shouldReceive('detachManyFromUser')->with($volumeIds, $userId)->once();

    $dto = new BulkRemoveVolumesDTO($volumeIds, $userId);
    $action = new BulkRemoveVolumesFromCollectionAction($volumeRepo);
    $action->execute($dto);
});
