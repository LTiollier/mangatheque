<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\AddScannedMangaAction;
use App\Manga\Application\DTOs\ScanMangaDTO;
use App\Manga\Application\Services\VolumeResolverService;
use App\Manga\Domain\Events\VolumeAddedToCollection;
use App\Manga\Domain\Exceptions\MangaNotFoundException;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Illuminate\Support\Facades\Event;
use Mockery;

test('adds scanned manga to collection and dispatches event', function () {
    Event::fake();

    $volume = new Volume(33, 1, 'api123', '9781234567890', '1', 'Naruto 1', [], null, null, null, null);

    $resolver = Mockery::mock(VolumeResolverService::class);
    $resolver->shouldReceive('resolveByIsbn')->with('9781234567890')->once()->andReturn($volume);

    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $volumeRepo->shouldReceive('attachToUser')->with(33, 1)->once();

    $action = new AddScannedMangaAction($resolver, $volumeRepo);
    $dto = new ScanMangaDTO('9781234567890', 1);

    $result = $action->execute($dto);

    expect($result->getId())->toBe(33);
    Event::assertDispatched(VolumeAddedToCollection::class);
});

test('propagates MangaNotFoundException when volume cannot be resolved', function () {
    $resolver = Mockery::mock(VolumeResolverService::class);
    $resolver->shouldReceive('resolveByIsbn')->with('invalid')->andThrow(MangaNotFoundException::class);

    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);

    $action = new AddScannedMangaAction($resolver, $volumeRepo);
    $dto = new ScanMangaDTO('invalid', 1);

    expect(fn () => $action->execute($dto))->toThrow(MangaNotFoundException::class);
});
