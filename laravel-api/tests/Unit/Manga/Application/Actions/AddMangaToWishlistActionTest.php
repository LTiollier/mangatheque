<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\AddMangaToWishlistAction;
use App\Manga\Application\DTOs\AddMangaDTO;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;

test('it throws an exception if volume is not found in database', function () {
    $volumeRepository = \Mockery::mock(VolumeRepositoryInterface::class);
    $volumeRepository->shouldReceive('findByApiId')->with('missing-api-id')->andReturn(null);

    $action = new AddMangaToWishlistAction($volumeRepository);
    $dto = new AddMangaDTO(api_id: 'missing-api-id', userId: 1);

    expect(fn () => $action->execute($dto))->toThrow(\Exception::class, 'Manga not found in local database');
});

test('it adds volume to user wishlist', function () {
    $volume = new Volume(
        id: 1,
        edition_id: 1,
        api_id: 'test-api-id',
        isbn: '1234567890123',
        number: '1',
        title: 'Test Manga',
        authors: ['Author'],
        description: null,
        published_date: null,
        page_count: null,
        cover_url: null,
    );

    $volumeRepository = \Mockery::mock(VolumeRepositoryInterface::class);
    $volumeRepository->shouldReceive('findByApiId')->with('test-api-id')->andReturn($volume);
    $volumeRepository->shouldReceive('addWishlistToUser')->with(1, 1)->once();

    $action = new AddMangaToWishlistAction($volumeRepository);
    $dto = new AddMangaDTO(api_id: 'test-api-id', userId: 1);

    $result = $action->execute($dto);

    expect($result)->toBe($volume);
});
