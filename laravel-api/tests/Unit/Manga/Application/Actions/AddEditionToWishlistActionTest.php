<?php

use App\Manga\Application\Actions\AddEditionToWishlistAction;
use App\Manga\Domain\Exceptions\MangaNotFoundException;
use App\Manga\Domain\Models\Edition;
use App\Manga\Domain\Repositories\EditionRepositoryInterface;
use App\Manga\Domain\Repositories\WishlistRepositoryInterface;

test('adds edition to user wishlist and returns it', function () {
    $edition = new Edition(
        id: 5,
        series_id: 1,
        name: 'Edition Standard',
        publisher: null,
        language: 'fr',
        total_volumes: null,
    );

    $editionRepo = Mockery::mock(EditionRepositoryInterface::class);
    $editionRepo->shouldReceive('findById')->with(5, 1)->once()->andReturn($edition);

    $wishlistRepo = Mockery::mock(WishlistRepositoryInterface::class);
    $wishlistRepo->shouldReceive('addEditionWishlistToUser')->with(5, 1)->once();

    $action = new AddEditionToWishlistAction($editionRepo, $wishlistRepo);
    $result = $action->execute(5, 1);

    expect($result)->toBe($edition);
});

test('throws MangaNotFoundException when edition does not exist', function () {
    $editionRepo = Mockery::mock(EditionRepositoryInterface::class);
    $editionRepo->shouldReceive('findById')->with(99, 1)->once()->andReturn(null);

    $wishlistRepo = Mockery::mock(WishlistRepositoryInterface::class);
    $wishlistRepo->shouldNotReceive('addEditionWishlistToUser');

    $action = new AddEditionToWishlistAction($editionRepo, $wishlistRepo);

    expect(fn () => $action->execute(99, 1))->toThrow(MangaNotFoundException::class);
});
