<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\ListWishlistAction;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;

test('it lists user wishlist volumes', function () {
    $volumes = [
        new Volume(
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
        ),
    ];

    $volumeRepository = \Mockery::mock(VolumeRepositoryInterface::class);
    $volumeRepository->shouldReceive('findWishlistByUserId')->with(1)->andReturn($volumes);

    $action = new ListWishlistAction($volumeRepository);
    $result = $action->execute(1);

    expect($result)->toBe($volumes);
});
