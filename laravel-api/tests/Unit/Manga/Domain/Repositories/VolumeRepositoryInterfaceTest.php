<?php

use App\Manga\Domain\Repositories\VolumeRepositoryInterface;

test('VolumeRepositoryInterface exists', function () {
    expect(interface_exists(VolumeRepositoryInterface::class))->toBeTrue();
});
