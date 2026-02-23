<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\AddMangaAction;
use App\Manga\Application\DTOs\AddMangaDTO;
use App\Manga\Domain\Events\VolumeAddedToCollection;
use App\Manga\Domain\Models\Edition;
use App\Manga\Domain\Models\Series;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\EditionRepositoryInterface;
use App\Manga\Domain\Repositories\SeriesRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use App\Manga\Infrastructure\Services\MangaLookupService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Event;
use Mockery;

uses(DatabaseTransactions::class);

test('adds existing manga from DB to collection', function () {
    Event::fake();

    $lookupService = Mockery::mock(MangaLookupService::class);
    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $seriesRepo = Mockery::mock(SeriesRepositoryInterface::class);
    $editionRepo = Mockery::mock(EditionRepositoryInterface::class);

    $volume = new Volume(33, 1, 'api123', 'isbn123', '1', 'Naruto 1', [], null, null, null, null);

    $volumeRepo->shouldReceive('findByApiId')->with('api123')->andReturn($volume);
    $volumeRepo->shouldReceive('attachToUser')->with(33, 1)->once();

    $action = new AddMangaAction($lookupService, $volumeRepo, $seriesRepo, $editionRepo);
    $dto = new AddMangaDTO('api123', 1);

    $result = $action->execute($dto);

    expect($result->getId())->toBe(33);
    Event::assertDispatched(VolumeAddedToCollection::class);
});

test('fetches new manga from API and creates it', function () {
    Event::fake();

    $lookupService = Mockery::mock(MangaLookupService::class);
    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $seriesRepo = Mockery::mock(SeriesRepositoryInterface::class);
    $editionRepo = Mockery::mock(EditionRepositoryInterface::class);

    $volumeData = ['title' => 'Naruto Vol. 1', 'authors' => ['Kishimoto'], 'api_id' => 'api123'];
    $series = new Series(88, 'api', 'Naruto', ['Kishimoto'], null, null, null, null);
    $edition = new Edition(99, 88, 'Standard', 'fr', 'fr', null);
    $volume = new Volume(33, 99, 'api123', null, '1', 'Naruto Vol. 1', [], null, null, null, null);

    $volumeRepo->shouldReceive('findByApiId')->with('api123')->andReturn(null);
    $lookupService->shouldReceive('findByApiId')->with('api123')->andReturn($volumeData);

    $seriesRepo->shouldReceive('findByTitle')->with('Naruto')->andReturn($series);
    $editionRepo->shouldReceive('findByNameAndSeries')->with('Standard', 88)->andReturn($edition);

    $volumeData['edition_id'] = 99;
    $volumeData['number'] = '1';

    $volumeRepo->shouldReceive('create')->with($volumeData)->once()->andReturn($volume);
    $volumeRepo->shouldReceive('attachToUser')->with(33, 1)->once();

    $action = new AddMangaAction($lookupService, $volumeRepo, $seriesRepo, $editionRepo);
    $dto = new AddMangaDTO('api123', 1);

    $result = $action->execute($dto);

    expect($result->getId())->toBe(33);
    Event::assertDispatched(VolumeAddedToCollection::class);
});

test('throws if not found in API', function () {
    $lookupService = Mockery::mock(MangaLookupService::class);
    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $seriesRepo = Mockery::mock(SeriesRepositoryInterface::class);
    $editionRepo = Mockery::mock(EditionRepositoryInterface::class);

    $volumeRepo->shouldReceive('findByApiId')->with('invalid')->andReturn(null);
    $lookupService->shouldReceive('findByApiId')->with('invalid')->andReturn(null);

    $action = new AddMangaAction($lookupService, $volumeRepo, $seriesRepo, $editionRepo);
    $dto = new AddMangaDTO('invalid', 1);

    expect(fn () => $action->execute($dto))->toThrow(\Exception::class);
});
