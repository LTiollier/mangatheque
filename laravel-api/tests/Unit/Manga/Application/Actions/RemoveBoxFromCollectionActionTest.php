<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\RemoveBoxFromCollectionAction;
use App\Manga\Domain\Models\Box;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\BoxRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Mockery;

test('removes box and its volumes from user collection', function () {
    $boxId = 1;
    $userId = 1;

    $volume1 = new Volume(10, 1, 'v1', 'isbn1', '1', 'Vol 1', null, null);
    $volume2 = new Volume(11, 1, 'v2', 'isbn2', '2', 'Vol 2', null, null);

    $box = new Box(
        id: $boxId,
        box_set_id: 1,
        title: 'Test Box',
        number: '1',
        isbn: 'isbn-box',
        api_id: 'api-box',
        release_date: null,
        cover_url: null,
        is_empty: false,
        volumes: [$volume1, $volume2]
    );

    $boxRepo = Mockery::mock(BoxRepositoryInterface::class);
    $boxRepo->shouldReceive('findById')->with($boxId, $userId)->once()->andReturn($box);
    $boxRepo->shouldReceive('detachFromUser')->with($boxId, $userId)->once();

    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $volumeRepo->shouldReceive('detachFromUser')->with(10, $userId)->once();
    $volumeRepo->shouldReceive('detachFromUser')->with(11, $userId)->once();

    $action = new RemoveBoxFromCollectionAction($boxRepo, $volumeRepo);

    $action->execute($boxId, $userId);

    expect(true)->toBeTrue();
});
