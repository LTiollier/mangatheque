<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\AddLocalVolumesToEditionAction;
use App\Manga\Application\DTOs\AddLocalVolumesDTO;
use App\Manga\Domain\Events\VolumeAddedToCollection;
use App\Manga\Domain\Models\Edition;
use App\Manga\Domain\Models\Series;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\EditionRepositoryInterface;
use App\Manga\Domain\Repositories\SeriesRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Illuminate\Support\Facades\Event;

test('it throws exception if edition not found', function () {
    $volumeRepo = \Mockery::mock(VolumeRepositoryInterface::class);
    $seriesRepo = \Mockery::mock(SeriesRepositoryInterface::class);
    $editionRepo = \Mockery::mock(EditionRepositoryInterface::class);

    $editionRepo->shouldReceive('findById')->with(99)->andReturn(null);

    $action = new AddLocalVolumesToEditionAction($volumeRepo, $seriesRepo, $editionRepo);
    $dto = new AddLocalVolumesDTO(99, [1], 1);

    expect(fn () => $action->execute($dto))->toThrow(\Exception::class, 'Edition not found with ID: 99');
});

test('it throws exception if series not found', function () {
    $volumeRepo = \Mockery::mock(VolumeRepositoryInterface::class);
    $seriesRepo = \Mockery::mock(SeriesRepositoryInterface::class);
    $editionRepo = \Mockery::mock(EditionRepositoryInterface::class);
    $edition = new Edition(99, 88, 'Ed', 'Pub', 'fr', 10);

    $editionRepo->shouldReceive('findById')->with(99)->andReturn($edition);
    $seriesRepo->shouldReceive('findById')->with(88)->andReturn(null);

    $action = new AddLocalVolumesToEditionAction($volumeRepo, $seriesRepo, $editionRepo);
    $dto = new AddLocalVolumesDTO(99, [1], 1);

    expect(fn () => $action->execute($dto))->toThrow(\Exception::class, 'Series not found with ID: 88');
});

test('it adds local volumes and triggers event', function () {
    Event::fake();

    $volumeRepo = \Mockery::mock(VolumeRepositoryInterface::class);
    $seriesRepo = \Mockery::mock(SeriesRepositoryInterface::class);
    $editionRepo = \Mockery::mock(EditionRepositoryInterface::class);

    $edition = new Edition(99, 88, 'Ed', 'Pub', 'fr', 10);
    $series = new Series(88, 'api', 'Title', ['Auth'], 'Desc', 'On', 10, 'http');
    $volume = new Volume(77, 99, null, null, '1', 'Title Vol. 1', [], null, null, null, null);

    $editionRepo->shouldReceive('findById')->with(99)->andReturn($edition);
    $seriesRepo->shouldReceive('findById')->with(88)->andReturn($series);

    $volumeRepo->shouldReceive('findByEditionAndNumber')->with(99, '1')->andReturn(null);
    $volumeRepo->shouldReceive('create')->once()->andReturn($volume);
    $volumeRepo->shouldReceive('attachToUser')->with(77, 1)->once();

    $action = new AddLocalVolumesToEditionAction($volumeRepo, $seriesRepo, $editionRepo);
    $dto = new AddLocalVolumesDTO(99, [1], 1);

    $result = $action->execute($dto);

    expect($result)->toHaveCount(1);
    expect($result[0]->getId())->toBe(77);

    Event::assertDispatched(VolumeAddedToCollection::class);
});
