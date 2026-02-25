<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\AddScannedMangaToWishlistAction;
use App\Manga\Application\DTOs\ScanMangaDTO;
use App\Manga\Application\Services\VolumeResolverService;
use App\Manga\Domain\Exceptions\MangaNotFoundException;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Mockery;

test('adds existing scanned manga to user wishlist', function () {
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

    $resolver = Mockery::mock(VolumeResolverService::class);
    $resolver->shouldReceive('resolveByIsbn')->with('1234567890123')->once()->andReturn($volume);

    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $volumeRepo->shouldReceive('addWishlistToUser')->with(1, 1)->once();

    $action = new AddScannedMangaToWishlistAction($resolver, $volumeRepo);
    $dto = new ScanMangaDTO(isbn: '1234567890123', userId: 1);

    $result = $action->execute($dto);

    expect($result)->toBe($volume);
});

test('propagates MangaNotFoundException when volume cannot be resolved for wishlist', function () {
    $resolver = Mockery::mock(VolumeResolverService::class);
    $resolver->shouldReceive('resolveByIsbn')->with('invalid')->andThrow(MangaNotFoundException::class);

    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);

    $action = new AddScannedMangaToWishlistAction($resolver, $volumeRepo);
    $dto = new ScanMangaDTO(isbn: 'invalid', userId: 1);

    expect(fn () => $action->execute($dto))->toThrow(MangaNotFoundException::class);
});
