<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\ListVolumesByEditionAction;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Mockery;

test('it lists volumes by edition id', function () {
    $volumes = [
        new Volume(id: 1, edition_id: 1, api_id: 'a', isbn: '1', number: '1', title: 'a', authors: [], description: null, published_date: null, page_count: null, cover_url: null),
        new Volume(id: 2, edition_id: 1, api_id: 'b', isbn: '2', number: '2', title: 'b', authors: [], description: null, published_date: null, page_count: null, cover_url: null),
    ];

    $repo = Mockery::mock(VolumeRepositoryInterface::class);
    $repo->shouldReceive('findByEditionId')->with(1)->once()->andReturn($volumes);

    $action = new ListVolumesByEditionAction($repo);

    expect($action->execute(1))->toBe($volumes);
});
