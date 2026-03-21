<?php

use App\Manga\Application\Actions\AddBoxToWishlistAction;
use App\Manga\Domain\Exceptions\MangaNotFoundException;
use App\Manga\Domain\Models\Box;
use App\Manga\Domain\Repositories\BoxRepositoryInterface;
use App\Manga\Domain\Repositories\WishlistRepositoryInterface;

test('does not add to wishlist when box is not found', function () {
    $boxRepo = Mockery::mock(BoxRepositoryInterface::class);
    $boxRepo->shouldReceive('findById')->with(999, 5)->once()->andReturn(null);

    $wishlistRepo = Mockery::mock(WishlistRepositoryInterface::class);
    $wishlistRepo->shouldNotReceive('addBoxWishlistToUser');

    $action = new AddBoxToWishlistAction($boxRepo, $wishlistRepo);

    expect(fn () => $action->execute(999, 5))->toThrow(MangaNotFoundException::class);
});

test('calls addBoxWishlistToUser with correct ids', function () {
    $box = new Box(id: 10, box_set_id: 3, title: 'Box 1', number: '1', isbn: null, api_id: null, release_date: null, cover_url: null, is_empty: false);

    $boxRepo = Mockery::mock(BoxRepositoryInterface::class);
    $boxRepo->shouldReceive('findById')->with(10, 7)->once()->andReturn($box);

    $wishlistRepo = Mockery::mock(WishlistRepositoryInterface::class);
    $wishlistRepo->shouldReceive('addBoxWishlistToUser')->with(10, 7)->once();

    $action = new AddBoxToWishlistAction($boxRepo, $wishlistRepo);
    $result = $action->execute(10, 7);

    expect($result)->toBe($box);
});
