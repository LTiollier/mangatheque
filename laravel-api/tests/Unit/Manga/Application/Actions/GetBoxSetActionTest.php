<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\GetBoxSetAction;
use App\Manga\Domain\Models\BoxSet;
use App\Manga\Domain\Repositories\BoxSetRepositoryInterface;
use Mockery;

test('gets box set by id', function () {
    $boxSetId = 1;
    $userId = 1;
    $boxSet = new BoxSet(1, 1, 'Test Box Set', 'Publisher', 'api-id');

    $boxSetRepo = Mockery::mock(BoxSetRepositoryInterface::class);
    $boxSetRepo->shouldReceive('findById')->with($boxSetId, $userId)->once()->andReturn($boxSet);

    $action = new GetBoxSetAction($boxSetRepo);

    $result = $action->execute($boxSetId, $userId);

    expect($result)->toBe($boxSet);
});
