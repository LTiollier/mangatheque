<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\RemoveSeriesFromCollectionAction;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Mockery;

test('removes series from collection', function () {
    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);

    $volumeRepo->shouldReceive('detachSeriesFromUser')->with(1, 1)->once();

    $action = new RemoveSeriesFromCollectionAction($volumeRepo);
    $action->execute(1, 1);
});
