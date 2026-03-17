<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\ListEditionsAction;
use App\Manga\Domain\Models\Edition;
use App\Manga\Domain\Repositories\EditionRepositoryInterface;
use Mockery;

test('it lists editions by series id', function () {
    $editions = [
        new Edition(id: 1, series_id: 1, name: 'Normal', language: 'fr', publisher: null, total_volumes: null),
        new Edition(id: 2, series_id: 1, name: 'Deluxe', language: 'fr', publisher: null, total_volumes: null),
    ];

    $repo = Mockery::mock(EditionRepositoryInterface::class);
    $repo->shouldReceive('findBySeriesId')->with(1)->once()->andReturn($editions);

    $action = new ListEditionsAction($repo);

    expect($action->execute(1))->toBe($editions);
});
