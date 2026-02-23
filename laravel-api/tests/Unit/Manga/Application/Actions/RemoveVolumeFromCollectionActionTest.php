<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\RemoveVolumeFromCollectionAction;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Mockery;

test('removes volume from collection', function () {
    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);

    $volumeRepo->shouldReceive('detachFromUser')->with(1, 1)->once();

    $action = new RemoveVolumeFromCollectionAction($volumeRepo);
    $action->execute(1, 1);
});
