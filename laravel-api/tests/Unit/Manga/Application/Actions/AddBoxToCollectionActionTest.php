<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\AddBoxToCollectionAction;
use App\Manga\Domain\Models\Box;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\BoxRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Mockery;

test('adds box and its volumes to user collection', function () {
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
    $boxRepo->shouldReceive('findById')->with($boxId)->once()->andReturn($box);
    $boxRepo->shouldReceive('attachToUser')->with($boxId, $userId)->once();

    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $volumeRepo->shouldReceive('attachToUser')->with(10, $userId)->once();
    $volumeRepo->shouldReceive('attachToUser')->with(11, $userId)->once();

    $action = new AddBoxToCollectionAction($boxRepo, $volumeRepo);

    $action->execute($boxId, $userId);

    expect(true)->toBeTrue();
});

test('adds only empty box to user collection', function () {
    $boxId = 1;
    $userId = 1;

    $box = new Box(
        id: $boxId,
        box_set_id: 1,
        title: 'Empty Box',
        number: '1',
        isbn: 'isbn-box',
        api_id: 'api-box',
        release_date: null,
        cover_url: null,
        is_empty: true,
        volumes: []
    );

    $boxRepo = Mockery::mock(BoxRepositoryInterface::class);
    $boxRepo->shouldReceive('findById')->with($boxId)->once()->andReturn($box);
    $boxRepo->shouldReceive('attachToUser')->with($boxId, $userId)->once();

    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $volumeRepo->shouldNotReceive('attachToUser');

    $action = new AddBoxToCollectionAction($boxRepo, $volumeRepo);

    $action->execute($boxId, $userId);

    expect(true)->toBeTrue();
});
