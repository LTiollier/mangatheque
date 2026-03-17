<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\GetBoxAction;
use App\Manga\Domain\Models\Box;
use App\Manga\Domain\Repositories\BoxRepositoryInterface;
use Mockery;

test('it gets a box by id', function () {
    $box = new Box(
        id: 1,
        box_set_id: 1,
        title: 'Box 1',
        number: '1',
        isbn: '1234567890',
        api_id: 'api_id',
        release_date: '2023-01-01',
        cover_url: null,
        is_empty: false,
    );

    $repo = Mockery::mock(BoxRepositoryInterface::class);
    $repo->shouldReceive('findById')->with(1, null)->once()->andReturn($box);

    $action = new GetBoxAction($repo);

    expect($action->execute(1))->toBe($box);
});

test('it returns null if box not found', function () {
    $repo = Mockery::mock(BoxRepositoryInterface::class);
    $repo->shouldReceive('findById')->with(1, null)->once()->andReturn(null);

    $action = new GetBoxAction($repo);

    expect($action->execute(1))->toBeNull();
});
