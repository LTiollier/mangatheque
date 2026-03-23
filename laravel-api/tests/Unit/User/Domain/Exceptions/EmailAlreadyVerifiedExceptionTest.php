<?php

declare(strict_types=1);

namespace Tests\Unit\User\Domain\Exceptions;

use App\User\Domain\Exceptions\EmailAlreadyVerifiedException;

test('email already verified exception has correct message', function () {
    $exception = new EmailAlreadyVerifiedException;
    expect($exception->getMessage())->toBe('Email already verified.');
});
