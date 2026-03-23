<?php

declare(strict_types=1);

namespace Tests\Unit\Manga\Domain\Exceptions;

use App\Manga\Domain\Exceptions\UnauthorizedVolumeAccessException;

test('it can be created for a user', function () {
    $exception = UnauthorizedVolumeAccessException::forUser(123);

    expect($exception->getMessage())->toBe('User 123 does not own all the volumes requested for removal.');
});
