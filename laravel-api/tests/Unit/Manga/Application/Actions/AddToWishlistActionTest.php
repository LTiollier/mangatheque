<?php

use App\Manga\Application\Actions\AddEditionToWishlistAction;
use App\Manga\Application\Actions\AddToWishlistAction;
use App\Manga\Application\Actions\AddWishlistItemAction;
use App\Manga\Application\DTOs\AddToWishlistDTO;
use App\Manga\Application\DTOs\AddWishlistItemDTO;
use App\Manga\Domain\Models\Box;
use App\Manga\Domain\Models\Edition;
use Mockery;

test('delegates to AddEditionToWishlistAction when editionId is provided', function () {
    $edition = new Edition(id: 5, series_id: 1, name: 'Standard', publisher: null, language: 'fr', total_volumes: null);

    $addEditionAction = Mockery::mock(AddEditionToWishlistAction::class);
    $addEditionAction->shouldReceive('execute')->with(5, 1)->once()->andReturn($edition);

    $addWishlistItemAction = Mockery::mock(AddWishlistItemAction::class);
    $addWishlistItemAction->shouldNotReceive('execute');

    $action = new AddToWishlistAction($addEditionAction, $addWishlistItemAction);
    $result = $action->execute(new AddToWishlistDTO(userId: 1, editionId: 5));

    expect($result)->toBe($edition);
});

test('delegates to AddWishlistItemAction when apiId is provided', function () {
    $box = new Box(id: 2, box_set_id: 1, title: 'Box 1', number: '1', isbn: null, api_id: 'api-123', release_date: null, cover_url: null, is_empty: false);

    $addEditionAction = Mockery::mock(AddEditionToWishlistAction::class);
    $addEditionAction->shouldNotReceive('execute');

    $addWishlistItemAction = Mockery::mock(AddWishlistItemAction::class);
    $addWishlistItemAction->shouldReceive('execute')
        ->with(Mockery::on(fn (AddWishlistItemDTO $dto) => $dto->api_id === 'api-123' && $dto->userId === 1))
        ->once()
        ->andReturn($box);

    $action = new AddToWishlistAction($addEditionAction, $addWishlistItemAction);
    $result = $action->execute(new AddToWishlistDTO(userId: 1, apiId: 'api-123'));

    expect($result)->toBe($box);
});

test('throws InvalidArgumentException when neither editionId nor apiId is provided', function () {
    $addEditionAction = Mockery::mock(AddEditionToWishlistAction::class);
    $addWishlistItemAction = Mockery::mock(AddWishlistItemAction::class);

    $action = new AddToWishlistAction($addEditionAction, $addWishlistItemAction);

    expect(fn () => $action->execute(new AddToWishlistDTO(userId: 1)))
        ->toThrow(InvalidArgumentException::class);
});
