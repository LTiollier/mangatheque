<?php

use App\Manga\Application\Actions\AddBoxToWishlistAction;
use App\Manga\Application\Actions\AddEditionToWishlistAction;
use App\Manga\Application\Actions\AddToWishlistAction;
use App\Manga\Application\DTOs\AddToWishlistDTO;
use App\Manga\Domain\Models\Box;
use App\Manga\Domain\Models\Edition;

test('delegates to AddEditionToWishlistAction when type is edition', function () {
    $edition = new Edition(id: 5, series_id: 1, name: 'Standard', publisher: null, language: 'fr', total_volumes: null);

    $addEditionAction = Mockery::mock(AddEditionToWishlistAction::class);
    $addEditionAction->shouldReceive('execute')->with(5, 1)->once()->andReturn($edition);

    $addBoxAction = Mockery::mock(AddBoxToWishlistAction::class);
    $addBoxAction->shouldNotReceive('execute');

    $action = new AddToWishlistAction($addEditionAction, $addBoxAction);
    $result = $action->execute(new AddToWishlistDTO(userId: 1, wishlistableId: 5, wishlistableType: 'edition'));

    expect($result)->toBe($edition);
});

test('delegates to AddBoxToWishlistAction when type is box', function () {
    $box = new Box(id: 2, box_set_id: 1, title: 'Box 1', number: '1', isbn: null, api_id: null, release_date: null, cover_url: null, is_empty: false);

    $addEditionAction = Mockery::mock(AddEditionToWishlistAction::class);
    $addEditionAction->shouldNotReceive('execute');

    $addBoxAction = Mockery::mock(AddBoxToWishlistAction::class);
    $addBoxAction->shouldReceive('execute')->with(2, 1)->once()->andReturn($box);

    $action = new AddToWishlistAction($addEditionAction, $addBoxAction);
    $result = $action->execute(new AddToWishlistDTO(userId: 1, wishlistableId: 2, wishlistableType: 'box'));

    expect($result)->toBe($box);
});

test('throws InvalidArgumentException when type is invalid', function () {
    $addEditionAction = Mockery::mock(AddEditionToWishlistAction::class);
    $addBoxAction = Mockery::mock(AddBoxToWishlistAction::class);

    $action = new AddToWishlistAction($addEditionAction, $addBoxAction);

    expect(fn () => $action->execute(new AddToWishlistDTO(userId: 1, wishlistableId: 1, wishlistableType: 'invalid')))
        ->toThrow(InvalidArgumentException::class);
});
