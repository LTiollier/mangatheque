<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\GetEditionAction;
use App\Manga\Domain\Models\Edition;
use App\Manga\Domain\Repositories\EditionRepositoryInterface;
use Mockery;

test('it gets an edition by id', function () {
    $edition = new Edition(
        id: 1,
        series_id: 1,
        name: 'Standard',
        publisher: 'Glénat',
        language: 'fr',
        total_volumes: 10,
    );

    $repo = Mockery::mock(EditionRepositoryInterface::class);
    $repo->shouldReceive('findById')->with(1, null)->once()->andReturn($edition);

    $action = new GetEditionAction($repo);

    expect($action->execute(1))->toBe($edition);
});

test('it returns null if edition not found', function () {
    $repo = Mockery::mock(EditionRepositoryInterface::class);
    $repo->shouldReceive('findById')->with(1, null)->once()->andReturn(null);

    $action = new GetEditionAction($repo);

    expect($action->execute(1))->toBeNull();
});
