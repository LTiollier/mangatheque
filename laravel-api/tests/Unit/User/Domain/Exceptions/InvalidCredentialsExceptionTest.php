<?php

use App\User\Domain\Exceptions\InvalidCredentialsException;

test('it sets the correct default message', function () {
    $exception = new InvalidCredentialsException();

    expect($exception->getMessage())->toBe('Invalid credentials provided.');
});
