<?php

declare(strict_types=1);

namespace Tests\Unit\Manga\Domain\Listeners;

use App\Manga\Domain\Events\VolumeAddedToCollection;
use App\Manga\Domain\Listeners\RemoveEditionFromWishlistOnVolumeAdded;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\WishlistRepositoryInterface;
use Mockery;

it('removes the edition from wishlist when a volume is added to collection', function () {
    // Arrange
    $wishlistRepository = Mockery::mock(WishlistRepositoryInterface::class);
    $volume = Mockery::mock(Volume::class);
    $volume->shouldReceive('getEditionId')->andReturn(123);

    $event = new VolumeAddedToCollection($volume, 456);
    $listener = new RemoveEditionFromWishlistOnVolumeAdded($wishlistRepository);

    // Expect
    $wishlistRepository->shouldReceive('removeWishlistItemFromUser')
        ->once()
        ->with(123, 'edition', 456);

    // Act
    $listener->handle($event);
});
