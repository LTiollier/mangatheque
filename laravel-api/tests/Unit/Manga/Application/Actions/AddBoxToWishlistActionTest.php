<?php

use App\Manga\Application\Actions\AddBoxToWishlistAction;
use App\Manga\Domain\Exceptions\MangaNotFoundException;
use App\Manga\Domain\Models\Box;
use App\Manga\Domain\Repositories\BoxRepositoryInterface;
use App\Manga\Domain\Repositories\WishlistRepositoryInterface;

test('adds box to user wishlist and returns it', function () {
    $box = new Box(
        id: 5,
        box_set_id: 1,
        title: 'Box 1',
        number: '1',
        isbn: null,
        api_id: null,
        release_date: null,
        cover_url: null,
        is_empty: false,
    );

    $boxRepo = Mockery::mock(BoxRepositoryInterface::class);
    $boxRepo->shouldReceive('findById')->with(5, 1)->once()->andReturn($box);

    $wishlistRepo = Mockery::mock(WishlistRepositoryInterface::class);
    $wishlistRepo->shouldReceive('addBoxWishlistToUser')->with(5, 1)->once();

    $action = new AddBoxToWishlistAction($boxRepo, $wishlistRepo);
    $result = $action->execute(5, 1);

    expect($result)->toBe($box);
});

test('throws MangaNotFoundException when box does not exist', function () {
    $boxRepo = Mockery::mock(BoxRepositoryInterface::class);
    $boxRepo->shouldReceive('findById')->with(99, 1)->once()->andReturn(null);

    $wishlistRepo = Mockery::mock(WishlistRepositoryInterface::class);
    $wishlistRepo->shouldNotReceive('addBoxWishlistToUser');

    $action = new AddBoxToWishlistAction($boxRepo, $wishlistRepo);

    expect(fn () => $action->execute(99, 1))->toThrow(MangaNotFoundException::class);
});
