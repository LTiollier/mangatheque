<?php

use App\Manga\Application\Actions\AddBoxToCollectionAction;
use App\Manga\Domain\Events\BoxAddedToCollection;
use App\Manga\Domain\Models\Box;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\BoxRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Illuminate\Support\Facades\Event;

test('adds box and its volumes to user collection', function () {
    Event::fake([BoxAddedToCollection::class]);

    $boxRepository = Mockery::mock(BoxRepositoryInterface::class);
    $volumeRepository = Mockery::mock(VolumeRepositoryInterface::class);

    $volume1 = Mockery::mock(Volume::class);
    $volume1->shouldReceive('getId')->andReturn(101);
    $volume2 = Mockery::mock(Volume::class);
    $volume2->shouldReceive('getId')->andReturn(102);

    $box = new Box(
        1,
        1,
        'Test Box',
        '1',
        'isbn-box',
        'api-box',
        null,
        null,
        false,
        [$volume1, $volume2]
    );

    $boxRepository->shouldReceive('findById')->with(1)->andReturn($box);
    $boxRepository->shouldReceive('attachToUser')->with(1, 1)->once();
    $volumeRepository->shouldReceive('attachToUser')->with(101, 1)->once();
    $volumeRepository->shouldReceive('attachToUser')->with(102, 1)->once();

    $action = new AddBoxToCollectionAction($boxRepository, $volumeRepository);

    $action->execute(1, 1, true);

    Event::assertDispatched(BoxAddedToCollection::class, fn ($e) => $e->boxId === 1 && $e->userId === 1);
});

test('adds only empty box to user collection', function () {
    Event::fake([BoxAddedToCollection::class]);

    $boxRepository = Mockery::mock(BoxRepositoryInterface::class);
    $volumeRepository = Mockery::mock(VolumeRepositoryInterface::class);

    $box = new Box(
        1,
        1,
        'Empty Box',
        '1',
        'isbn-box',
        'api-box',
        null,
        null,
        true,
        []
    );

    $boxRepository->shouldReceive('findById')->with(1)->andReturn($box);
    $boxRepository->shouldReceive('attachToUser')->with(1, 1)->once();
    $volumeRepository->shouldNotReceive('attachToUser');

    $action = new AddBoxToCollectionAction($boxRepository, $volumeRepository);

    $action->execute(1, 1, true);

    Event::assertDispatched(BoxAddedToCollection::class, fn ($e) => $e->boxId === 1 && $e->userId === 1);
});
