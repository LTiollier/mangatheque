<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\ListWishlistAction;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\WishlistRepositoryInterface;
use Mockery;

test('it lists user wishlist', function () {
    $volumes = [
        new Volume(
            id: 1,
            edition_id: 1,
            api_id: 'test-api-id-1',
            isbn: '1234567890123',
            number: '1',
            title: 'Test Manga 1',

            published_date: null,

            cover_url: null,
        ),
        new Volume(
            id: 2,
            edition_id: 1,
            api_id: 'test-api-id-2',
            isbn: '1234567890124',
            number: '2',
            title: 'Test Manga 2',

            published_date: null,

            cover_url: null,
        ),
    ];

    $wishlistRepository = Mockery::mock(WishlistRepositoryInterface::class);
    $wishlistRepository->shouldReceive('findWishlistByUserId')->with(1)->andReturn($volumes);

    $action = new ListWishlistAction($wishlistRepository);

    $result = $action->execute(1);

    expect($result)->toBe($volumes);
});
