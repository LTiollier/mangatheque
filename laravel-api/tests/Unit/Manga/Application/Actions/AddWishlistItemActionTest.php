<?php

use App\Manga\Application\Actions\AddWishlistItemAction;
use App\Manga\Application\DTOs\AddWishlistItemDTO;
use App\Manga\Domain\Exceptions\MangaNotFoundException;
use App\Manga\Domain\Models\Box;
use App\Manga\Domain\Models\BoxSet;
use App\Manga\Domain\Models\Edition;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\BoxRepositoryInterface;
use App\Manga\Domain\Repositories\BoxSetRepositoryInterface;
use App\Manga\Domain\Repositories\EditionRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use App\Manga\Domain\Repositories\WishlistRepositoryInterface;
use Mockery;

function makeWishlistItemAction(
    ?VolumeRepositoryInterface $volumeRepo = null,
    ?BoxRepositoryInterface $boxRepo = null,
    ?BoxSetRepositoryInterface $boxSetRepo = null,
    ?EditionRepositoryInterface $editionRepo = null,
    ?WishlistRepositoryInterface $wishlistRepo = null,
): AddWishlistItemAction {
    return new AddWishlistItemAction(
        $volumeRepo ?? Mockery::mock(VolumeRepositoryInterface::class),
        $boxRepo ?? Mockery::mock(BoxRepositoryInterface::class),
        $boxSetRepo ?? Mockery::mock(BoxSetRepositoryInterface::class),
        $editionRepo ?? Mockery::mock(EditionRepositoryInterface::class),
        $wishlistRepo ?? Mockery::mock(WishlistRepositoryInterface::class),
    );
}

test('wishlists edition when api_id matches a volume', function () {
    $volume = new Volume(id: 10, edition_id: 5, api_id: 'vol-api', isbn: null, number: '1', title: 'Vol 1', published_date: null, cover_url: null);
    $edition = new Edition(id: 5, series_id: 1, name: 'Standard', publisher: null, language: 'fr', total_volumes: null);

    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $volumeRepo->shouldReceive('findByApiId')->with('vol-api')->andReturn($volume);

    $wishlistRepo = Mockery::mock(WishlistRepositoryInterface::class);
    $wishlistRepo->shouldReceive('addEditionWishlistToUser')->with(5, 1)->once();

    $editionRepo = Mockery::mock(EditionRepositoryInterface::class);
    $editionRepo->shouldReceive('findById')->with(5, 1)->andReturn($edition);

    $boxRepo = Mockery::mock(BoxRepositoryInterface::class);
    $boxSetRepo = Mockery::mock(BoxSetRepositoryInterface::class);

    $action = new AddWishlistItemAction($volumeRepo, $boxRepo, $boxSetRepo, $editionRepo, $wishlistRepo);
    $result = $action->execute(new AddWishlistItemDTO(api_id: 'vol-api', userId: 1));

    expect($result)->toBe($edition);
});

test('wishlists all boxes when api_id matches a box set', function () {
    $boxSet = new BoxSet(id: 3, series_id: 1, title: 'Box Set', publisher: null, api_id: 'bs-api');
    $box1 = new Box(id: 10, box_set_id: 3, title: 'Box 1', number: '1', isbn: null, api_id: null, release_date: null, cover_url: null, is_empty: false);
    $box2 = new Box(id: 11, box_set_id: 3, title: 'Box 2', number: '2', isbn: null, api_id: null, release_date: null, cover_url: null, is_empty: false);

    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $volumeRepo->shouldReceive('findByApiId')->with('bs-api')->andReturn(null);

    $boxSetRepo = Mockery::mock(BoxSetRepositoryInterface::class);
    $boxSetRepo->shouldReceive('findByApiId')->with('bs-api')->andReturn($boxSet);

    $boxRepo = Mockery::mock(BoxRepositoryInterface::class);
    $boxRepo->shouldReceive('findByBoxSetId')->with(3)->andReturn([$box1, $box2]);
    $boxRepo->shouldNotReceive('findByApiId');

    $wishlistRepo = Mockery::mock(WishlistRepositoryInterface::class);
    $wishlistRepo->shouldReceive('addBoxWishlistToUser')->with(10, 1)->once();
    $wishlistRepo->shouldReceive('addBoxWishlistToUser')->with(11, 1)->once();

    $editionRepo = Mockery::mock(EditionRepositoryInterface::class);

    $action = new AddWishlistItemAction($volumeRepo, $boxRepo, $boxSetRepo, $editionRepo, $wishlistRepo);
    $result = $action->execute(new AddWishlistItemDTO(api_id: 'bs-api', userId: 1));

    expect($result)->toBe($box1);
});

test('wishlists box when api_id matches a single box', function () {
    $box = new Box(id: 20, box_set_id: 1, title: 'Box', number: '1', isbn: null, api_id: 'box-api', release_date: null, cover_url: null, is_empty: false);

    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $volumeRepo->shouldReceive('findByApiId')->with('box-api')->andReturn(null);

    $boxSetRepo = Mockery::mock(BoxSetRepositoryInterface::class);
    $boxSetRepo->shouldReceive('findByApiId')->with('box-api')->andReturn(null);

    $boxRepo = Mockery::mock(BoxRepositoryInterface::class);
    $boxRepo->shouldReceive('findByApiId')->with('box-api')->andReturn($box);

    $wishlistRepo = Mockery::mock(WishlistRepositoryInterface::class);
    $wishlistRepo->shouldReceive('addBoxWishlistToUser')->with(20, 1)->once();

    $editionRepo = Mockery::mock(EditionRepositoryInterface::class);

    $action = new AddWishlistItemAction($volumeRepo, $boxRepo, $boxSetRepo, $editionRepo, $wishlistRepo);
    $result = $action->execute(new AddWishlistItemDTO(api_id: 'box-api', userId: 1));

    expect($result)->toBe($box);
});

test('throws MangaNotFoundException when api_id matches nothing', function () {
    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);
    $volumeRepo->shouldReceive('findByApiId')->andReturn(null);

    $boxSetRepo = Mockery::mock(BoxSetRepositoryInterface::class);
    $boxSetRepo->shouldReceive('findByApiId')->andReturn(null);

    $boxRepo = Mockery::mock(BoxRepositoryInterface::class);
    $boxRepo->shouldReceive('findByApiId')->andReturn(null);

    $editionRepo = Mockery::mock(EditionRepositoryInterface::class);
    $wishlistRepo = Mockery::mock(WishlistRepositoryInterface::class);

    $action = new AddWishlistItemAction($volumeRepo, $boxRepo, $boxSetRepo, $editionRepo, $wishlistRepo);

    expect(fn () => $action->execute(new AddWishlistItemDTO(api_id: 'unknown', userId: 1)))
        ->toThrow(MangaNotFoundException::class);
});
