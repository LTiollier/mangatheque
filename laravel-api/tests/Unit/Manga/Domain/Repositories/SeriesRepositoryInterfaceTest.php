<?php

use App\Manga\Domain\Repositories\SeriesRepositoryInterface;

test('SeriesRepositoryInterface exists', function () {
    expect(interface_exists(SeriesRepositoryInterface::class))->toBeTrue();
});
