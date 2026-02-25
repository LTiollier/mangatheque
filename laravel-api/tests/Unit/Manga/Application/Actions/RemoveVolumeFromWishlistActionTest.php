<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\RemoveVolumeFromWishlistAction;
use App\Manga\Domain\Repositories\WishlistRepositoryInterface;

test('it removes volume from wishlist', function () {
    $wishlistRepository = \Mockery::mock(WishlistRepositoryInterface::class);
    $wishlistRepository->shouldReceive('removeWishlistFromUser')->with(1, 1)->once();

    $action = new RemoveVolumeFromWishlistAction($wishlistRepository);

    $action->execute(1, 1);
});
