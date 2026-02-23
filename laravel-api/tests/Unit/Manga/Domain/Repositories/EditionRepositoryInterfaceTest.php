<?php

use App\Manga\Domain\Repositories\EditionRepositoryInterface;

test('EditionRepositoryInterface exists', function () {
    expect(interface_exists(EditionRepositoryInterface::class))->toBeTrue();
});
