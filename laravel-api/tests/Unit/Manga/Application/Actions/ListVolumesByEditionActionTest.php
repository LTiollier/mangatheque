<?php

declare(strict_types=1);

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\ListVolumesByEditionAction;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Mockery;

test('it lists volumes by edition id', function () {
    $volumes = [
        new Volume(id: 1, editionId: 1, apiId: 'a', isbn: '1', number: '1', title: 'a', publishedDate: null, coverUrl: null),
        new Volume(id: 2, editionId: 1, apiId: 'b', isbn: '2', number: '2', title: 'b', publishedDate: null, coverUrl: null),
    ];

    $repo = Mockery::mock(VolumeRepositoryInterface::class);
    $repo->shouldReceive('findByEditionId')->with(1, null)->once()->andReturn($volumes);

    $action = new ListVolumesByEditionAction($repo);

    expect($action->execute(1, null))->toBe($volumes);
});
