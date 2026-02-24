<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\RemoveVolumeFromWishlistAction;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;

test('it removes volume from user wishlist', function () {
    $volumeRepository = \Mockery::mock(VolumeRepositoryInterface::class);
    $volumeRepository->shouldReceive('removeWishlistFromUser')->with(1, 1)->once();

    $action = new RemoveVolumeFromWishlistAction($volumeRepository);
    $action->execute(1, 1);
});
