<?php

use App\Manga\Domain\Exceptions\EditionNotFoundException;

test('EditionNotFoundException is a DomainException', function (): void {
    $exception = new EditionNotFoundException('Edition not found with ID: 42');

    expect($exception)->toBeInstanceOf(\DomainException::class)
        ->and($exception->getMessage())->toBe('Edition not found with ID: 42');
});
