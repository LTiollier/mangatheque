<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\AddScannedMangaAction;
use App\Manga\Application\DTOs\ScanMangaDTO;
use App\Manga\Domain\Events\VolumeAddedToCollection;
use App\Manga\Domain\Models\Edition;
use App\Manga\Domain\Models\Series;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\EditionRepositoryInterface;
use App\Manga\Domain\Repositories\SeriesRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use App\Manga\Infrastructure\Services\MangaLookupService;
use Illuminate\Support\Facades\Event;
use Mockery;

test('adds existing scanned manga from DB to collection', function () {
    Event::fake();

    $lookupService = Mockery::mock(MangaLookupService::class);
    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $seriesRepo = Mockery::mock(SeriesRepositoryInterface::class);
    $editionRepo = Mockery::mock(EditionRepositoryInterface::class);

    $volume = new Volume(33, 1, 'api123', '9781234567890', '1', 'Naruto 1', [], null, null, null, null);

    $volumeRepo->shouldReceive('findByIsbn')->with('9781234567890')->andReturn($volume);
    $volumeRepo->shouldReceive('attachToUser')->with(33, 1)->once();

    $action = new AddScannedMangaAction($lookupService, $volumeRepo, $seriesRepo, $editionRepo);
    $dto = new ScanMangaDTO('9781234567890', 1);

    $result = $action->execute($dto);

    expect($result->getId())->toBe(33);
    Event::assertDispatched(VolumeAddedToCollection::class);
});

test('fetches new scanned manga from API and creates it', function () {
    Event::fake();

    $lookupService = Mockery::mock(MangaLookupService::class);
    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $seriesRepo = Mockery::mock(SeriesRepositoryInterface::class);
    $editionRepo = Mockery::mock(EditionRepositoryInterface::class);

    $volumeData = ['title' => 'Naruto Vol. 1', 'authors' => ['Kishimoto'], 'isbn' => '9781234567890'];
    $series = new Series(88, 'api', 'Naruto', ['Kishimoto'], null, null, null, null);
    $edition = new Edition(99, 88, 'Standard', 'fr', 'fr', null);
    $volume = new Volume(33, 99, null, '9781234567890', '1', 'Naruto Vol. 1', [], null, null, null, null);

    $volumeRepo->shouldReceive('findByIsbn')->with('9781234567890')->andReturn(null);
    $lookupService->shouldReceive('findByIsbn')->with('9781234567890')->andReturn($volumeData);

    $seriesRepo->shouldReceive('findByTitle')->with('Naruto')->andReturn($series);
    $editionRepo->shouldReceive('findByNameAndSeries')->with('Standard', 88)->andReturn($edition);

    $volumeData['edition_id'] = 99;
    $volumeData['number'] = '1';

    $volumeRepo->shouldReceive('create')->with($volumeData)->once()->andReturn($volume);
    $volumeRepo->shouldReceive('attachToUser')->with(33, 1)->once();

    $action = new AddScannedMangaAction($lookupService, $volumeRepo, $seriesRepo, $editionRepo);
    $dto = new ScanMangaDTO('9781234567890', 1);

    $result = $action->execute($dto);

    expect($result->getId())->toBe(33);
    Event::assertDispatched(VolumeAddedToCollection::class);
});

test('throws if not found in API', function () {
    $lookupService = Mockery::mock(MangaLookupService::class);
    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $seriesRepo = Mockery::mock(SeriesRepositoryInterface::class);
    $editionRepo = Mockery::mock(EditionRepositoryInterface::class);

    $volumeRepo->shouldReceive('findByIsbn')->with('invalid')->andReturn(null);
    $lookupService->shouldReceive('findByIsbn')->with('invalid')->andReturn(null);

    $action = new AddScannedMangaAction($lookupService, $volumeRepo, $seriesRepo, $editionRepo);
    $dto = new ScanMangaDTO('invalid', 1);

    expect(fn () => $action->execute($dto))->toThrow(\Exception::class);
});
