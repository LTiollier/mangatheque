<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\AddMangaAction;
use App\Manga\Application\DTOs\AddMangaDTO;
use App\Manga\Application\Services\VolumeResolverService;
use App\Manga\Domain\Events\VolumeAddedToCollection;
use App\Manga\Domain\Exceptions\MangaNotFoundException;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Illuminate\Support\Facades\Event;
use Mockery;

test('adds manga to collection and dispatches event', function () {
    Event::fake();

    $volume = new Volume(33, 1, 'api123', 'isbn123', '1', 'Naruto 1', [], null, null, null, null);

    $resolver = Mockery::mock(VolumeResolverService::class);
    $resolver->shouldReceive('resolveByApiId')->with('api123')->once()->andReturn($volume);

    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $volumeRepo->shouldReceive('attachToUser')->with(33, 1)->once();

    $action = new AddMangaAction($resolver, $volumeRepo);
    $dto = new AddMangaDTO('api123', 1);

    $result = $action->execute($dto);

    expect($result->getId())->toBe(33);
    Event::assertDispatched(VolumeAddedToCollection::class);
});

test('propagates MangaNotFoundException when api id not found', function () {
    $resolver = Mockery::mock(VolumeResolverService::class);
    $resolver->shouldReceive('resolveByApiId')->with('invalid')->andThrow(MangaNotFoundException::class);

    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);

    $action = new AddMangaAction($resolver, $volumeRepo);
    $dto = new AddMangaDTO('invalid', 1);

    expect(fn () => $action->execute($dto))->toThrow(MangaNotFoundException::class);
});
