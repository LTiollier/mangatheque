<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\AddScannedMangaToWishlistAction;
use App\Manga\Application\DTOs\ScanMangaDTO;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\EditionRepositoryInterface;
use App\Manga\Domain\Repositories\MangaLookupServiceInterface;
use App\Manga\Domain\Repositories\SeriesRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Illuminate\Support\Facades\DB;

test('it adds existing scanned manga to user wishlist', function () {
    DB::shouldReceive('transaction')->andReturnUsing(fn ($callback) => $callback());

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

    $lookupService = \Mockery::mock(MangaLookupServiceInterface::class);
    $seriesRepository = \Mockery::mock(SeriesRepositoryInterface::class);
    $editionRepository = \Mockery::mock(EditionRepositoryInterface::class);

    $volumeRepository = \Mockery::mock(VolumeRepositoryInterface::class);
    $volumeRepository->shouldReceive('findByIsbn')->with('1234567890123')->andReturn($volume);
    $volumeRepository->shouldReceive('addWishlistToUser')->with(1, 1)->once();

    $action = new AddScannedMangaToWishlistAction($lookupService, $volumeRepository, $seriesRepository, $editionRepository);
    $dto = new ScanMangaDTO(isbn: '1234567890123', userId: 1);

    $result = $action->execute($dto);

    expect($result)->toBe($volume);
});
