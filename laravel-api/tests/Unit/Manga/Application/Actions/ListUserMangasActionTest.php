<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\ListUserMangasAction;
use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Mockery;

test('lists user mangas', function () {
    $volumeRepo = Mockery::mock(VolumeRepositoryInterface::class);

    $volume = new Volume(1, 1, 'api1', 'isbn1', '1', 'Title', [], null, null, null, null);

    $volumeRepo->shouldReceive('findByUserId')->with(1)->andReturn([$volume]);

    $action = new ListUserMangasAction($volumeRepo);
    $result = $action->execute(1);

    expect($result)->toHaveCount(1);
    expect($result[0]->getId())->toBe(1);
});
