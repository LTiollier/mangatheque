<?php

declare(strict_types=1);

namespace Tests\Unit\Manga\Domain\Listeners;

use App\Manga\Domain\Events\EditionAddedToCollection;
use App\Manga\Domain\Listeners\RemoveEditionFromWishlistOnCollection;
use App\Manga\Domain\Repositories\WishlistRepositoryInterface;
use Mockery;
use Mockery\MockInterface;

test('it removes edition from wishlist when edition is added to collection', function () {
    /** @var WishlistRepositoryInterface&MockInterface $repository */
    $repository = Mockery::mock(WishlistRepositoryInterface::class);

    $listener = new RemoveEditionFromWishlistOnCollection($repository);

    $event = new EditionAddedToCollection(
        editionId: 789,
        userId: 101112
    );

    $repository->shouldReceive('removeWishlistItemFromUser')
        ->once()
        ->with(789, 'edition', 101112);

    $listener->handle($event);
});
