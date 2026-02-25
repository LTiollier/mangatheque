<?php

namespace Tests\Unit\Manga\Application\Services;

use App\Manga\Application\Services\VolumeResolverService;
use App\Manga\Domain\Exceptions\MangaNotFoundException;
use App\Manga\Domain\Models\Edition;
use App\Manga\Domain\Models\Series;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\EditionRepositoryInterface;
use App\Manga\Domain\Repositories\MangaLookupServiceInterface;
use App\Manga\Domain\Repositories\SeriesRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Mockery;

// --- extractSeriesTitle ---

test('extractSeriesTitle removes volume suffix from title', function () {
    expect(VolumeResolverService::extractSeriesTitle('Naruto, Vol. 1'))->toBe('Naruto');
    expect(VolumeResolverService::extractSeriesTitle('One Piece Tome 5'))->toBe('One Piece');
    expect(VolumeResolverService::extractSeriesTitle('Dragon Ball T.3'))->toBe('Dragon Ball');
    expect(VolumeResolverService::extractSeriesTitle('My Hero Academia #10'))->toBe('My Hero Academia');
});

test('extractSeriesTitle leaves title untouched when no volume suffix', function () {
    expect(VolumeResolverService::extractSeriesTitle('Naruto'))->toBe('Naruto');
});

// --- resolveByIsbn ---

test('resolveByIsbn returns existing volume from repository', function () {
    $volume = new Volume(1, 1, null, '9781234567890', '1', 'Naruto 1', [], null, null, null, null);

    $lookupService = Mockery::mock(MangaLookupServiceInterface::class);
    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $seriesRepo = Mockery::mock(SeriesRepositoryInterface::class);
    $editionRepo = Mockery::mock(EditionRepositoryInterface::class);

    $volumeRepo->shouldReceive('findByIsbn')->with('9781234567890')->andReturn($volume);

    $service = new VolumeResolverService($lookupService, $volumeRepo, $seriesRepo, $editionRepo);

    expect($service->resolveByIsbn('9781234567890'))->toBe($volume);
});

test('resolveByIsbn fetches from API and creates hierarchy when not in DB', function () {
    $lookupService = Mockery::mock(MangaLookupServiceInterface::class);
    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $seriesRepo = Mockery::mock(SeriesRepositoryInterface::class);
    $editionRepo = Mockery::mock(EditionRepositoryInterface::class);

    $volumeData = ['title' => 'Naruto Vol. 1', 'authors' => ['Kishimoto'], 'isbn' => '9781234567890'];
    $series = new Series(88, 'api', 'Naruto', ['Kishimoto'], null, null, null, null);
    $edition = new Edition(99, 88, 'Standard', 'fr', 'fr', null);
    $expectedVolume = new Volume(33, 99, null, '9781234567890', '1', 'Naruto Vol. 1', ['Kishimoto'], null, null, null, null);

    $volumeRepo->shouldReceive('findByIsbn')->with('9781234567890')->andReturn(null);
    $lookupService->shouldReceive('findByIsbn')->with('9781234567890')->andReturn($volumeData);

    $seriesRepo->shouldReceive('findByTitle')->with('Naruto')->andReturn($series);
    $editionRepo->shouldReceive('findByNameAndSeries')->with('Standard', 88)->andReturn($edition);

    $expectedData = $volumeData;
    $expectedData['edition_id'] = 99;
    $expectedData['number'] = '1';
    $volumeRepo->shouldReceive('create')->with($expectedData)->andReturn($expectedVolume);

    $service = new VolumeResolverService($lookupService, $volumeRepo, $seriesRepo, $editionRepo);

    expect($service->resolveByIsbn('9781234567890'))->toBe($expectedVolume);
});

test('resolveByIsbn creates series and edition when they do not exist', function () {
    $lookupService = Mockery::mock(MangaLookupServiceInterface::class);
    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $seriesRepo = Mockery::mock(SeriesRepositoryInterface::class);
    $editionRepo = Mockery::mock(EditionRepositoryInterface::class);

    $volumeData = ['title' => 'Bleach Tome 2', 'authors' => ['Kubo'], 'isbn' => '9780000000002'];
    $newSeries = new Series(10, null, 'Bleach', ['Kubo'], null, null, null, null);
    $newEdition = new Edition(20, 10, 'Standard', 'fr', 'fr', null);
    $newVolume = new Volume(30, 20, null, '9780000000002', '2', 'Bleach Tome 2', ['Kubo'], null, null, null, null);

    $volumeRepo->shouldReceive('findByIsbn')->andReturn(null);
    $lookupService->shouldReceive('findByIsbn')->andReturn($volumeData);

    $seriesRepo->shouldReceive('findByTitle')->with('Bleach')->andReturn(null);
    $seriesRepo->shouldReceive('create')->with([
        'title' => 'Bleach',
        'authors' => ['Kubo'],
        'cover_url' => null,
    ])->andReturn($newSeries);

    $editionRepo->shouldReceive('findByNameAndSeries')->with('Standard', 10)->andReturn(null);
    $editionRepo->shouldReceive('create')->with([
        'series_id' => 10,
        'name' => 'Standard',
        'language' => 'fr',
    ])->andReturn($newEdition);

    $expectedData = $volumeData;
    $expectedData['edition_id'] = 20;
    $expectedData['number'] = '2';
    $volumeRepo->shouldReceive('create')->with($expectedData)->andReturn($newVolume);

    $service = new VolumeResolverService($lookupService, $volumeRepo, $seriesRepo, $editionRepo);

    expect($service->resolveByIsbn('9780000000002'))->toBe($newVolume);
});

test('resolveByIsbn throws MangaNotFoundException when not found in API', function () {
    $lookupService = Mockery::mock(MangaLookupServiceInterface::class);
    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $seriesRepo = Mockery::mock(SeriesRepositoryInterface::class);
    $editionRepo = Mockery::mock(EditionRepositoryInterface::class);

    $volumeRepo->shouldReceive('findByIsbn')->andReturn(null);
    $lookupService->shouldReceive('findByIsbn')->andReturn(null);

    $service = new VolumeResolverService($lookupService, $volumeRepo, $seriesRepo, $editionRepo);

    expect(fn () => $service->resolveByIsbn('invalid'))->toThrow(MangaNotFoundException::class);
});

// --- resolveByApiId ---

test('resolveByApiId returns existing volume from repository', function () {
    $volume = new Volume(1, 1, 'api123', null, '1', 'Naruto 1', [], null, null, null, null);

    $lookupService = Mockery::mock(MangaLookupServiceInterface::class);
    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $seriesRepo = Mockery::mock(SeriesRepositoryInterface::class);
    $editionRepo = Mockery::mock(EditionRepositoryInterface::class);

    $volumeRepo->shouldReceive('findByApiId')->with('api123')->andReturn($volume);

    $service = new VolumeResolverService($lookupService, $volumeRepo, $seriesRepo, $editionRepo);

    expect($service->resolveByApiId('api123'))->toBe($volume);
});

test('resolveByApiId fetches from API and creates hierarchy when not in DB', function () {
    $lookupService = Mockery::mock(MangaLookupServiceInterface::class);
    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $seriesRepo = Mockery::mock(SeriesRepositoryInterface::class);
    $editionRepo = Mockery::mock(EditionRepositoryInterface::class);

    $volumeData = ['title' => 'Naruto Vol. 1', 'authors' => ['Kishimoto'], 'api_id' => 'api123'];
    $series = new Series(88, 'api', 'Naruto', ['Kishimoto'], null, null, null, null);
    $edition = new Edition(99, 88, 'Standard', 'fr', 'fr', null);
    $expectedVolume = new Volume(33, 99, 'api123', null, '1', 'Naruto Vol. 1', ['Kishimoto'], null, null, null, null);

    $volumeRepo->shouldReceive('findByApiId')->with('api123')->andReturn(null);
    $lookupService->shouldReceive('findByApiId')->with('api123')->andReturn($volumeData);

    $seriesRepo->shouldReceive('findByTitle')->with('Naruto')->andReturn($series);
    $editionRepo->shouldReceive('findByNameAndSeries')->with('Standard', 88)->andReturn($edition);

    $expectedData = $volumeData;
    $expectedData['edition_id'] = 99;
    $expectedData['number'] = '1';
    $volumeRepo->shouldReceive('create')->with($expectedData)->andReturn($expectedVolume);

    $service = new VolumeResolverService($lookupService, $volumeRepo, $seriesRepo, $editionRepo);

    expect($service->resolveByApiId('api123'))->toBe($expectedVolume);
});

test('resolveByApiId throws MangaNotFoundException when not found in API', function () {
    $lookupService = Mockery::mock(MangaLookupServiceInterface::class);
    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $seriesRepo = Mockery::mock(SeriesRepositoryInterface::class);
    $editionRepo = Mockery::mock(EditionRepositoryInterface::class);

    $volumeRepo->shouldReceive('findByApiId')->andReturn(null);
    $lookupService->shouldReceive('findByApiId')->andReturn(null);

    $service = new VolumeResolverService($lookupService, $volumeRepo, $seriesRepo, $editionRepo);

    expect(fn () => $service->resolveByApiId('invalid'))->toThrow(MangaNotFoundException::class);
});
