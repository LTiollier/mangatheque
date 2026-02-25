<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\GetSeriesAction;
use App\Manga\Domain\Models\Series;
use App\Manga\Domain\Repositories\SeriesRepositoryInterface;
use Mockery;

test('it gets a series by id', function () {
    $series = new Series(
        id: 1,
        api_id: 'api_id',
        title: 'Title',
        authors: ['Author'],
        description: null,
        status: null,
        total_volumes: null,
        cover_url: null,
    );

    $repo = Mockery::mock(SeriesRepositoryInterface::class);
    $repo->shouldReceive('findById')->with(1)->once()->andReturn($series);

    $action = new GetSeriesAction($repo);

    expect($action->execute(1))->toBe($series);
});

test('it returns null if series not found', function () {
    $repo = Mockery::mock(SeriesRepositoryInterface::class);
    $repo->shouldReceive('findById')->with(1)->once()->andReturn(null);

    $action = new GetSeriesAction($repo);

    expect($action->execute(1))->toBeNull();
});
